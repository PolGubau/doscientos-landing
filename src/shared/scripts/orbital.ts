import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Orbital hero animation.
 * Phase 0 (first visit): thumbnails stagger-appear in a grid.
 * Phase 1 (first visit): thumbnails fly to circular positions around hero,
 *   each rotated so it points toward the center (static radial layout).
 * Returning visits: thumbs snap to their circle position + rotation and fade in.
 * Scroll: the whole ring scales up, drifts down and rotates so the lower arc
 *   fills the space below the hero (scrubbed to scroll progress).
 * Pointer: moving the cursor left/right tilts the whole ring (#orbital-inner),
 *   composed independently of the scroll rotation on #orbital-ring.
 * Mobile (< 768px): ring is hidden.
 */

const SESSION_KEY = "orbital-shown";

const ORBIT = {
	/**
	 * Thumb width as a fraction of the ring radius.
	 * With ~24 items the arc gap per item ≈ 2π/24 ≈ 0.262·r,
	 * so thumbRatio must be < 0.262 to avoid overlap.
	 */
	thumbRatio: 0.21,
	/** Thumb aspect ratio (height / width). > 1 = portrait card. */
	aspect: 114 / 84, // ≈ 1.357
	/** Vertical breathing room on each side, as a fraction of viewport height */
	vPad: 0.08,
	/** Usable fraction of the viewport width */
	hUsable: 0.92,
	/** Clamp radius for very large / very small screens */
	maxRadius: 460,
	minRadius: 160,
};

type Layout = { radius: number; thumbW: number; thumbH: number };

/**
 * Derives ring radius and thumb dimensions from the viewport.
 * Cards are portrait and rotated radially, so the controlling span dimension
 * is always thumbH (height becomes width when a side card rotates 90°).
 * Leaves vPad breathing room top & bottom. Returns null on mobile.
 */
const getLayout = (): Layout | null => {
	const vw = window.innerWidth;
	if (vw < 768) return null;

	const { thumbRatio: k, aspect } = ORBIT;
	const availH = window.innerHeight * (1 - 2 * ORBIT.vPad);
	const availW = vw * ORBIT.hUsable;

	// Bounding span = 2·r + thumbH  (thumbH = r·k·aspect)
	// → r = avail / (2 + k·aspect)
	const rH = availH / (2 + k * aspect);
	const rW = availW / (2 + k * aspect);

	const radius = Math.max(ORBIT.minRadius, Math.min(rH, rW, ORBIT.maxRadius));
	const thumbW = Math.round(radius * k);
	const thumbH = Math.round(thumbW * aspect);
	return { radius, thumbW, thumbH };
};

const circlePositions = (n: number, r: number) =>
	Array.from({ length: n }, (_, i) => {
		const a = (i / n) * Math.PI * 2 - Math.PI / 2; // start at 12 o'clock
		return {
			x: Math.cos(a) * r,
			y: Math.sin(a) * r,
			// Rotate each card so it faces the center (radial fan layout).
			// At 12 o'clock (a = -90°) rotation is 0 → upright.
			rotation: (a * 180) / Math.PI + 90,
		};
	});

const gridPositions = (n: number, thumbW: number, thumbH: number) => {
	const cols = Math.ceil(Math.sqrt(n));
	const gx = thumbW * 1.1;
	const gy = thumbH * 1.1;
	return Array.from({ length: n }, (_, i) => ({
		x: ((i % cols) - (cols - 1) / 2) * gx,
		y: (Math.floor(i / cols) - (Math.ceil(n / cols) - 1) / 2) * gy,
	}));
};

// Module-level refs , destroyed on each navigation via killOrbital
let mainTl: gsap.core.Timeline | undefined;
let hoverCleanup: (() => void) | undefined;
let labelCleanup: (() => void) | undefined;
let inertiaCleanup: (() => void) | undefined;
let pointerRotateCleanup: (() => void) | undefined;
let scrollTl: gsap.core.Timeline | undefined;
/** Mutable state shared between addScrollExpand and addHoverLabels. */
const ringState = { scrollProgress: 0 };

export const killOrbital = () => {
	mainTl?.kill();
	mainTl = undefined;
	hoverCleanup?.();
	hoverCleanup = undefined;
	labelCleanup?.();
	labelCleanup = undefined;
	inertiaCleanup?.();
	inertiaCleanup = undefined;
	pointerRotateCleanup?.();
	pointerRotateCleanup = undefined;
	scrollTl?.scrollTrigger?.kill();
	scrollTl?.kill();
	scrollTl = undefined;
	ringState.scrollProgress = 0;
};

/**
 * Scroll-driven choreography, scrubbed to scroll progress through a long pin:
 *   1. The hero text fades out early.
 *   2. The whole ring grows, drifts down into the lower area and rotates so
 *      its thumbnails sweep past the viewer.
 *   3. Near the tail the ring fades out, leaving the next section to take over
 *      once the pin releases.
 * Timeline length is normalized to 1; the ScrollTrigger maps the long scroll
 * distance onto it.
 */
const addScrollExpand = (ring: HTMLElement): gsap.core.Timeline => {
	const content = document.getElementById("hero-content");
	const scrollReveal = document.getElementById("hero-scroll-reveal");

	// Responsive: compute pixel offset so the top of the scaled ring arc lands
	// at ~65% of the viewport height on any screen.  Uses the same radius the
	// entrance animation computed for this viewport.
	const layout = getLayout();
	const SCALE = 3;
	const vh = window.innerHeight;
	// Scaled radius, falling back to 75 % of vh when layout is unavailable.
	const scaledRadius = layout ? layout.radius * SCALE : vh * 0.75;
	// Desired vertical position of the topmost point of the arc (65 % down).
	const targetArcTop = vh * 0.65;
	// Ring natural center is at 50 % of its own height (absolute inset-0 = vh).
	const yOffset = targetArcTop + scaledRadius - vh * 0.5;

	// Measure how far the hero sits below the viewport top at load time
	// (caused by the fixed-navbar spacer). Using that offset as the start
	// point makes the pin activate immediately on the first scroll pixel.
	const heroEl = document.getElementById("hero");
	const heroOffset = Math.round(heroEl?.getBoundingClientRect().top ?? 0);
	const startOffset = heroOffset > 0 ? `${heroOffset}px` : "top";

	const tl = gsap.timeline({
		scrollTrigger: {
			trigger: "#hero",
			start: `top ${startOffset}`,
			pin: true,
			end: "+=200%",
			scrub: 1,
			onUpdate: (self) => {
				ringState.scrollProgress = self.progress;
			},
		},
	});

	// 1) The centered title fades out as soon as the scroll begins , it lives in
	//    the middle of the ring and clears the stage as the wheel takes over.
	//    Explicit fromTo (not .to) with immediateRender:false so the reverse
	//    target (autoAlpha:1, y:0) is fixed: scrubbing back to the top always
	//    restores the title. A plain .to() lets ScrollTrigger.refresh() re-record
	//    a faded autoAlpha:0 as the start, which made the title sometimes never
	//    reappear when scrolling up.
	if (content) {
		// Title exits with a cinematic "dissolve into the distance" effect:
		// scale down, drift up, and blur out — more dramatic than a plain fade.
		tl.fromTo(
			content,
			{ autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)" },
			{
				autoAlpha: 0,
				y: -60,
				scale: 0.82,
				filter: "blur(10px)",
				ease: "power3.in",
				duration: 0.2,
				immediateRender: false,
			},
			0,
		);
	}

	// 2) Subtitle + CTAs slide in at the top, replacing the title while the
	//    ring grows , the message completes itself as the wheel expands.
	if (scrollReveal) {
		tl.fromTo(
			scrollReveal,
			{ autoAlpha: 0, y: 40 },
			{ autoAlpha: 1, y: 0, ease: "power2.out", duration: 0.22 },
			0.45,
		);
	}

	// 3) Ring scales up and descends so only the top arc of thumbnails is
	//    visible in the lower portion of the viewport.  The y offset is
	//    computed above to be consistent across all desktop screen sizes.
	// Scale + descent: "expo.inOut" eases in and out for a more cinematic
	// reveal — independent of the rotation which stays linear.
	// Small dead zone (first 5 % of scroll progress) where nothing moves,
	// so a light first touch doesn't immediately animate the ring.
	tl.fromTo(
		ring,
		{ scale: 1, y: 0, transformOrigin: "center center" },
		{ scale: SCALE, y: yOffset, ease: "expo.inOut", duration: 0.95 },
		0.05,
	);
	// Match the same easing as scale so both properties move in lockstep
	// and the rotation is imperceptible at the very start of the scroll.
	tl.fromTo(
		ring,
		{ rotation: 0 },
		{ rotation: 90, ease: "expo.inOut", duration: 0.95 },
		0.05,
	);

	// 4) At the tail the message and the ring fade out, so the next section is
	//    revealed only after the full spin. Explicit fromTo with
	//    immediateRender:false (same fix as the title) so a ScrollTrigger.refresh()
	//    that fires while they're faded can't re-record autoAlpha:0 as the start
	//    and freeze the reverse — scrubbing back up always restores them.
	if (scrollReveal) {
		tl.fromTo(
			scrollReveal,
			{ autoAlpha: 1, y: 0 },
			{
				autoAlpha: 0,
				y: -40,
				ease: "none",
				duration: 0.12,
				immediateRender: false,
			},
			0.85,
		);
	}
	tl.fromTo(
		ring,
		{ autoAlpha: 1 },
		{ autoAlpha: 0, ease: "none", duration: 0.15, immediateRender: false },
		0.85,
	);

	return tl;
};

/**
 * Velocity-based scroll inertia: each card tilts (rotationX) and shears
 * (skewX) proportionally to scroll velocity, propagated as a staggered wave.
 * Both effects spring back to 0 when scrolling stops.
 * Returns a cleanup function.
 */
const addScrollInertia = (thumbs: HTMLElement[]): (() => void) => {
	/** Max tilt angle (rotationX) in degrees at peak scroll velocity. */
	const MAX_TILT = 40;
	/** Max skew angle (skewX) in degrees at peak scroll velocity. */
	const MAX_SKEW = 12;
	/** Velocity scale: px-per-frame → 0-1 influence. */
	const VEL_SCALE = 0.003;
	/** Per-card stagger offset in seconds (wave lag). */
	const STAGGER = 0.06;

	let lastScrollY = window.scrollY;
	let idleTimer: ReturnType<typeof setTimeout> | undefined;
	let rafId: number | undefined;
	let pendingTilt = 0;
	let pendingSkew = 0;

	// Spring-back: both rotationX and skewX return to 0 with an elastic bounce.
	// Kill ONLY the inertia properties (rotationX/skewX) so the proximity
	// effect's tweens (rotationY/scaleX/scaleY/z) keep running.
	const springBack = () => {
		gsap.killTweensOf(thumbs, "rotationX,skewX");
		gsap.to(thumbs, {
			rotationX: 0,
			skewX: 0,
			duration: 0.8,
			stagger: 0.02,
			ease: "elastic.out(1, 0.55)",
		});
	};

	// Apply the latest velocity-derived tilt/skew as a single staggered tween,
	// coalesced to one per animation frame (replaces the old per-card
	// setTimeout, which drifted and could not be overwritten cleanly).
	const apply = () => {
		rafId = undefined;
		gsap.to(thumbs, {
			rotationX: pendingTilt,
			skewX: pendingSkew,
			duration: 0.3,
			stagger: STAGGER,
			ease: "power2.out",
			overwrite: "auto",
		});
	};

	const onScroll = () => {
		const now = window.scrollY;
		const velocity = now - lastScrollY; // px scrolled this frame
		lastScrollY = now;

		// Clamp influence to [-1, 1] then scale to each property's max.
		const influence = Math.max(-1, Math.min(1, velocity * VEL_SCALE));
		pendingTilt = influence * MAX_TILT;
		pendingSkew = influence * MAX_SKEW;

		if (rafId === undefined) rafId = requestAnimationFrame(apply);

		// Reset idle timer — spring back ~120 ms after scrolling stops.
		clearTimeout(idleTimer);
		idleTimer = setTimeout(springBack, 120);
	};

	window.addEventListener("scroll", onScroll, { passive: true });

	return () => {
		window.removeEventListener("scroll", onScroll);
		clearTimeout(idleTimer);
		if (rafId !== undefined) cancelAnimationFrame(rafId);
		gsap.killTweensOf(thumbs, "rotationX,skewX");
		// Ensure cards are upright when the scene is killed.
		gsap.set(thumbs, { rotationX: 0, skewX: 0 });
	};
};

/**
 * Floating hover label. On hover over a card a small pill with the project's
 * title (and client) eases in above the card in screen space, staying upright
 * regardless of the card's radial rotation. Returns a cleanup function.
 */
const addHoverLabels = (
	thumbs: HTMLElement[],
	label: HTMLElement,
): (() => void) => {
	const titleEl = label.querySelector<HTMLElement>(".orbital-label-title");
	const clientEl = label.querySelector<HTMLElement>(".orbital-label-client");

	type Handler = { el: HTMLElement; enter: () => void; leave: () => void };
	const handlers: Handler[] = [];

	const place = (thumb: HTMLElement) => {
		const r = thumb.getBoundingClientRect();
		// Anchor at the card's top-center; CSS offsets it above via yPercent.
		gsap.set(label, {
			left: r.left + r.width / 2,
			top: r.top,
			xPercent: -50,
			yPercent: -100,
		});
	};

	for (const thumb of thumbs) {
		const enter = () => {
			// Only show the label while the ring is expanded AND still on-screen:
			// below 0.2 it hasn't grown yet; above 0.8 it's fading out at the tail,
			// so a label would float over a vanishing ring.
			const p = ringState.scrollProgress;
			if (p < 0.2 || p > 0.8) return;
			if (titleEl) titleEl.textContent = thumb.dataset.title ?? "";
			if (clientEl) clientEl.textContent = thumb.dataset.client ?? "";
			place(thumb);
			gsap.to(label, {
				opacity: 1,
				y: -10,
				duration: 0.3,
				ease: "power3.out",
				overwrite: "auto",
			});
		};
		const leave = () => {
			gsap.to(label, {
				opacity: 0,
				y: 0,
				duration: 0.22,
				ease: "power2.out",
				overwrite: "auto",
			});
		};
		thumb.addEventListener("mouseenter", enter);
		thumb.addEventListener("mouseleave", leave);
		handlers.push({ el: thumb, enter, leave });
	}

	return () => {
		for (const { el, enter, leave } of handlers) {
			el.removeEventListener("mouseenter", enter);
			el.removeEventListener("mouseleave", leave);
		}
		gsap.set(label, { opacity: 0 });
	};
};

/**
 * Proximity-driven effect: direction-aware tilt + magnetic pull + lift.
 * All transforms are 2D only — no rotationY / translateZ. Any 3D transform
 * promotes the card to a composited GPU layer rasterized once at base size;
 * when the ring scales ×3 on scroll that cached texture stretches and looks
 * pixelated. 2D transforms are re-rasterized every frame at screen resolution.
 *
 * Property ownership (avoids fighting scroll-inertia which owns rotationX/skewX):
 *   scaleX / scaleY  — lift (card grows toward cursor)
 *   skewY            — direction-aware tilt: cursor right → negative skewY,
 *                      mimics a horizontal rotateY without 3D compositing
 *   x / y            — magnetic pull: card drifts a few px toward the cursor
 *   --shadow-t       — shadow depth grows with proximity
 *
 * rotationX is intentionally NOT driven here: scroll inertia is its sole owner.
 */
const addProximityEffects = (
	thumbs: HTMLElement[],
	rotations: number[],
): (() => void) => {
	const PERSPECTIVE = 900;
	/** px — radius at which a card starts reacting to the cursor */
	const PROXIMITY = 220;

	// One quickTo setter per property per card — zero allocation per frame.
	const setSclX = thumbs.map((t) =>
		gsap.quickTo(t, "scaleX", { duration: 0.55, ease: "power3.out" }),
	);
	const setSclY = thumbs.map((t) =>
		gsap.quickTo(t, "scaleY", { duration: 0.55, ease: "power3.out" }),
	);
	// skewY driven by the cursor's horizontal offset from the card center:
	// simulates a 3D horizontal tilt (like rotateY) without a 3D transform.
	const setSkewY = thumbs.map((t) =>
		gsap.quickTo(t, "skewY", { duration: 0.55, ease: "power3.out" }),
	);
	// NOTE: x/y drift is intentionally omitted — those properties are owned by
	// the circle-positioning animation. Setting them here would override the
	// card's orbital position and send it flying to the origin.
	// Shadow driven by the proximity factor — animates the --shadow-t CSS
	// variable that the card's box-shadow is built from.
	const setShadow = thumbs.map((t) =>
		gsap.quickTo(t, "--shadow-t", { duration: 0.6, ease: "power3.out" }),
	);

	// Previous raw influence per card so onMove can skip out-of-range cards
	// that are already at rest — eliminates most per-frame quickTo calls.
	const prevT = thumbs.map(() => 0);

	// Bake perspective into every card once — consumed by the scroll inertia
	// effect's rotationX tilt (proximity itself is 2D-only).
	gsap.set(thumbs, { transformPerspective: PERSPECTIVE });

	const onMove = (e: MouseEvent) => {
		const mx = e.clientX;
		const my = e.clientY;

		// 1. Batch all reads first to avoid layout thrashing within the loop.
		const rects = thumbs.map((t) => t.getBoundingClientRect());

		for (let i = 0; i < thumbs.length; i++) {
			const r = rects[i];
			const cx = r.left + r.width / 2;
			const cy = r.top + r.height / 2;
			const dist = Math.hypot(mx - cx, my - cy);
			const raw = Math.max(0, 1 - dist / PROXIMITY);
			// Skip cards out of range AND already at rest (single frame that
			// brings t → 0 still runs so the card animates home before skipping).
			if (raw === 0 && prevT[i] === 0) continue;
			prevT[i] = raw;
			// Steeper curve: full effect at ~40 % of PROXIMITY radius (~88 px).
			const t = Math.min(raw * 2.5, 1);

			// Cursor position relative to the card center, normalised to ±1
			// (clamped so values beyond the card edge don't over-drive the effect).
			const relX = Math.max(-1, Math.min(1, (mx - cx) / (r.width * 0.6)));

			setSclX[i](1 + t * 0.1);
			setSclY[i](1 + t * 0.1);
			// Negative correlation: cursor right → left-leaning skewY → the card
			// appears to rotate its right side toward the viewer, like rotateY.
			setSkewY[i](relX * t * -10);
			setShadow[i](t);
		}
	};

	// Cursor left the browser viewport — restore everything.
	const onDocLeave = () => {
		for (let i = 0; i < thumbs.length; i++) {
			setSclX[i](1);
			setSclY[i](1);
			setSkewY[i](0);
			setShadow[i](0);
			prevT[i] = 0;
			// Restore the radial rotation set by the entrance animation.
			// Kill ONLY prior `rotation` tweens (not the inertia/proximity ones)
			// so overwrite:"auto" doesn't try to reset rotationX/skewX and emit
			// the "not eligible for reset" warning.
			gsap.killTweensOf(thumbs[i], "rotation");
			gsap.to(thumbs[i], {
				rotation: rotations[i],
				duration: 0.7,
				ease: "power3.out",
			});
		}
	};

	document.addEventListener("mousemove", onMove);
	document.addEventListener("mouseleave", onDocLeave);

	return () => {
		document.removeEventListener("mousemove", onMove);
		document.removeEventListener("mouseleave", onDocLeave);
	};
};

/**
 * Pointer-driven ring rotation. Moving the cursor toward the right edge of the
 * viewport tilts the whole ring clockwise; toward the left, counter-clockwise.
 * Applied to #orbital-inner so it composes with — and never fights , the scroll
 * timeline, which rotates the outer #orbital-ring. Returns a cleanup function.
 */
const addPointerRotation = (inner: HTMLElement): (() => void) => {
	/** Max ring tilt in degrees at the far left/right edge of the viewport. */
	const MAX = 6;

	const setRot = gsap.quickTo(inner, "rotation", {
		duration: 1.1,
		ease: "power3.out",
	});

	const onMove = (e: MouseEvent) => {
		// Normalize cursor X to [-1, 1]: -1 = left edge, +1 = right edge.
		const nx = (e.clientX / window.innerWidth) * 2 - 1;
		setRot(nx * MAX);
	};
	const onLeave = () => setRot(0);

	document.addEventListener("mousemove", onMove);
	document.addEventListener("mouseleave", onLeave);

	return () => {
		document.removeEventListener("mousemove", onMove);
		document.removeEventListener("mouseleave", onLeave);
		gsap.set(inner, { rotation: 0 });
	};
};

export const setupOrbital = (onCircleReady?: () => void) => {
	killOrbital();

	const ring = document.getElementById("orbital-ring");
	if (!ring) return;

	const thumbs = Array.from(
		ring.querySelectorAll<HTMLElement>(".orbital-thumb"),
	);
	if (!thumbs.length) return;

	const layout = getLayout();
	if (!layout) {
		// Mobile — no scroll choreography. Show the thumbnails as a static
		// horizontal strip (laid out via CSS in HeroOrbital.astro): clear any
		// transform and reveal them. Subtitle + CTAs are revealed statically and
		// the hero title animates in on its own.
		gsap.set(thumbs, { clearProps: "transform", opacity: 1 });
		const scrollReveal = document.getElementById("hero-scroll-reveal");
		if (scrollReveal) gsap.set(scrollReveal, { autoAlpha: 1 });
		onCircleReady?.();
		return;
	}

	const { radius, thumbW, thumbH } = layout;
	// Push the responsive thumb size to the DOM (consumed via CSS vars)
	ring.style.setProperty("--thumb-w", `${thumbW}px`);
	ring.style.setProperty("--thumb-h", `${thumbH}px`);

	// Create the pinned scroll scene synchronously (before the entrance promise)
	// so initAnimations' ScrollTrigger.refresh() measures the pin-spacer with the
	// correct end distance. Creating it late skews pin spacing.
	scrollTl = addScrollExpand(ring);

	const n = thumbs.length;
	const circle = circlePositions(n, radius);
	const grid = gridPositions(n, thumbW, thumbH);
	const isFirstVisit = !sessionStorage.getItem(SESSION_KEY);

	// All thumbs start centered, invisible, at grid offsets
	for (const [i, t] of thumbs.entries()) {
		gsap.set(t, {
			xPercent: -50,
			yPercent: -50,
			x: grid[i].x,
			y: grid[i].y,
			opacity: 0,
			scale: 0.85,
		});
	}

	// Wait for images + optional minimum display time
	const images = Array.from(ring.querySelectorAll<HTMLImageElement>("img"));
	const allDecoded = Promise.all(
		images.map((img) =>
			img.complete
				? Promise.resolve()
				: new Promise<void>((res) => {
						img.onload = () => res();
						img.onerror = () => res();
					}),
		),
	);
	const minWait = new Promise<void>((res) =>
		setTimeout(res, isFirstVisit ? 350 : 0),
	);

	Promise.all([allDecoded, minWait]).then(() => {
		mainTl = gsap.timeline({
			onComplete: () => {
				sessionStorage.setItem(SESSION_KEY, "1");
				hoverCleanup = addProximityEffects(
					thumbs,
					circle.map((c) => c.rotation),
				);
				const label = document.getElementById("orbital-label");
				if (label) labelCleanup = addHoverLabels(thumbs, label);
				inertiaCleanup = addScrollInertia(thumbs);
				const inner = ring.querySelector<HTMLElement>("#orbital-inner");
				if (inner) pointerRotateCleanup = addPointerRotation(inner);
				onCircleReady?.();
			},
		});

		if (isFirstVisit) {
			// Phase 1 — grid stagger appear (fast)
			mainTl.to(thumbs, {
				opacity: 1,
				scale: 1,
				duration: 0.28,
				stagger: 0.04,
				ease: "power2.out",
			});

			// Phase 2 — fly to circle positions with radial rotation
			mainTl.to(
				thumbs,
				{
					x: (i: number) => circle[i].x,
					y: (i: number) => circle[i].y,
					rotation: (i: number) => circle[i].rotation,
					duration: 0.75,
					stagger: 0.04,
					ease: "power4.inOut",
				},
				"+=0.1",
			);
		} else {
			// Returning visit — snap to circle, brief fade-in
			for (const [i, t] of thumbs.entries()) {
				gsap.set(t, {
					x: circle[i].x,
					y: circle[i].y,
					rotation: circle[i].rotation,
				});
			}
			mainTl.to(thumbs, {
				opacity: 1,
				scale: 1,
				duration: 0.35,
				stagger: 0.035,
				ease: "power2.out",
			});
		}
	});
};
