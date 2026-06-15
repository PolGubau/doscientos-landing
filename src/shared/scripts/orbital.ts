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

// Module-level refs — destroyed on each navigation via killOrbital
let mainTl: gsap.core.Timeline | undefined;
let hoverCleanup: (() => void) | undefined;
let labelCleanup: (() => void) | undefined;
let inertiaCleanup: (() => void) | undefined;
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

	const tl = gsap.timeline({
		scrollTrigger: {
			trigger: "#hero",
			start: "top top",
			pin: true,
			end: "+=400%",
			scrub: 1,
			onUpdate: (self) => {
				ringState.scrollProgress = self.progress;
			},
		},
	});

	// 1) The centered title fades out as soon as the scroll begins — it lives in
	//    the middle of the ring and clears the stage as the wheel takes over.
	if (content) {
		tl.to(
			content,
			{ autoAlpha: 0, y: -30, ease: "power2.in", duration: 0.15 },
			0,
		);
	}

	// 2) Subtitle + CTAs slide in at the top, replacing the title while the
	//    ring grows — the message completes itself as the wheel expands.
	if (scrollReveal) {
		tl.fromTo(
			scrollReveal,
			{ autoAlpha: 0, y: 40 },
			{ autoAlpha: 1, y: 0, ease: "power2.out", duration: 0.22 },
			0.15,
		);
	}

	// 3) Ring scales up and descends so only the top arc of thumbnails is
	//    visible in the lower portion of the viewport.  The y offset is
	//    computed above to be consistent across all desktop screen sizes.
	// Scale + descent: "power2.out" makes it rush down quickly at first and
	// settle — independent of the rotation which stays linear.
	tl.fromTo(
		ring,
		{ scale: 1, y: 0, transformOrigin: "center center" },
		{ scale: SCALE, y: yOffset, ease: "power2.out", duration: 1 },
		0,
	);
	// Rotation stays linear (ease: none) over the same duration.
	tl.fromTo(
		ring,
		{ rotation: 0 },
		{ rotation: 180, ease: "none", duration: 1 },
		0,
	);

	// 4) At the tail the message and the ring fade out, so the next section is
	//    revealed only after the full spin.
	if (scrollReveal) {
		tl.to(
			scrollReveal,
			{ autoAlpha: 0, y: -40, ease: "none", duration: 0.12 },
			0.85,
		);
	}
	tl.to(ring, { autoAlpha: 0, ease: "none", duration: 0.15 }, 0.85);

	return tl;
};

/**
 * Velocity-based scroll inertia: each card tilts (rotationX) and shears
 * (skewX) proportionally to scroll velocity with a per-card stagger offset.
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

	// quickTo setters — one per card per property.
	const setRX = thumbs.map((t) =>
		gsap.quickTo(t, "rotationX", { duration: 0.25, ease: "power2.out" }),
	);
	const setSkew = thumbs.map((t) =>
		gsap.quickTo(t, "skewX", { duration: 0.2, ease: "power2.out" }),
	);

	let lastScrollY = window.scrollY;
	let velocity = 0;
	let springRaf: number | undefined;

	// Spring-back: both rotationX and skewX return to 0 with an elastic bounce.
	// Kill ONLY the inertia quickTos (rotationX/skewX) first — using a property
	// filter — so the proximity effect's tweens (rotationY/scaleX/scaleY/z) keep
	// running. A blanket `overwrite: true` here would kill those too, which is
	// why the cards stopped reacting to the cursor.
	const springBack = () => {
		thumbs.forEach((t, i) => {
			gsap.killTweensOf(t, "rotationX,skewX");
			gsap.to(t, {
				rotationX: 0,
				skewX: 0,
				duration: 0.8 + i * 0.02,
				ease: "elastic.out(1, 0.55)",
			});
		});
	};

	let idleTimer: ReturnType<typeof setTimeout> | undefined;

	const onScroll = () => {
		const now = window.scrollY;
		velocity = now - lastScrollY; // px scrolled this frame
		lastScrollY = now;

		// Clamp influence to [-1, 1] then scale to each property's max.
		const influence = Math.max(-1, Math.min(1, velocity * VEL_SCALE));
		const tilt = influence * MAX_TILT;
		const skew = influence * MAX_SKEW;

		thumbs.forEach((_, i) => {
			// Stagger each card so the effect propagates as a wave.
			setTimeout(
				() => {
					setRX[i](tilt);
					setSkew[i](skew);
				},
				i * STAGGER * 1000,
			);
		});

		// Reset idle timer — spring back ~120 ms after scrolling stops.
		clearTimeout(idleTimer);
		idleTimer = setTimeout(() => {
			springBack();
		}, 120);
	};

	window.addEventListener("scroll", onScroll, { passive: true });

	return () => {
		window.removeEventListener("scroll", onScroll);
		clearTimeout(idleTimer);
		if (springRaf !== undefined) cancelAnimationFrame(springRaf);
		// Ensure cards are upright when the scene is killed.
		for (const t of thumbs) gsap.set(t, { rotationX: 0, skewX: 0 });
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
			// Only show the label once the ring has started expanding on scroll.
			if (ringState.scrollProgress < 0.2) return;
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
 * Proximity-driven 3D effect.
 * A single mousemove listener on the document computes the distance from the
 * cursor to every card center. Influence falls off smoothly from 1 (cursor on
 * the card) to 0 (cursor ≥ PROXIMITY px away). Each property is driven by a
 * gsap.quickTo setter so the response is always interpolated, never jumpy.
 */
const addProximityEffects = (
	thumbs: HTMLElement[],
	rotations: number[],
): (() => void) => {
	const PERSPECTIVE = 900;
	/** px — radius at which a card starts reacting to the cursor */
	const PROXIMITY = 220;

	// One quickTo setter per property per card — zero allocation per frame.
	const setRotY = thumbs.map((t) =>
		gsap.quickTo(t, "rotationY", { duration: 0.6, ease: "power3.out" }),
	);
	const setSclX = thumbs.map((t) =>
		gsap.quickTo(t, "scaleX", { duration: 0.6, ease: "power3.out" }),
	);
	const setSclY = thumbs.map((t) =>
		gsap.quickTo(t, "scaleY", { duration: 0.6, ease: "power3.out" }),
	);
	const setZ = thumbs.map((t) =>
		gsap.quickTo(t, "z", { duration: 0.6, ease: "power3.out" }),
	);

	// Bake perspective into every card once.
	gsap.set(thumbs, { transformPerspective: PERSPECTIVE });

	const onMove = (e: MouseEvent) => {
		const mx = e.clientX;
		const my = e.clientY;

		for (let i = 0; i < thumbs.length; i++) {
			const r = thumbs[i].getBoundingClientRect();
			const cx = r.left + r.width / 2;
			const cy = r.top + r.height / 2;
			const dist = Math.hypot(mx - cx, my - cy);
			const raw = Math.max(0, 1 - dist / PROXIMITY);
			// Steeper curve: full flip is reached when cursor is within ~40% of
			// PROXIMITY radius (~88 px), so the card visibly flips rather than
			// just leaning. quickTo interpolates smoothly between frames.
			const t = Math.min(raw * 2.5, 1);

			setRotY[i](t * 180); // rotationY (GSAP name) — avoids "not eligible for reset" warning
			setSclX[i](1 + t * 0.06); // subtle lift — split into scaleX/scaleY to avoid "not eligible for reset" warning
			setSclY[i](1 + t * 0.06);
			setZ[i](t * 50);
		}
	};

	// Cursor left the browser viewport — restore everything.
	const onDocLeave = () => {
		for (let i = 0; i < thumbs.length; i++) {
			setRotY[i](0); // reset rotationY
			setSclX[i](1);
			setSclY[i](1);
			setZ[i](0);
			// Restore the radial rotation that the entrance animation set.
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
		// Mobile — hide the ring (no scroll choreography runs here). Reveal the
		// subtitle + CTAs statically and let the hero title animate in on its own.
		gsap.set(ring, { display: "none" });
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
