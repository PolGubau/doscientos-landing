import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { killOrbital, setupOrbital } from "./orbital";

gsap.registerPlugin(ScrollTrigger);

/**
 * GSAP Animation Engine — hero word-mask + orbital + counters ONLY.
 *
 * Section/title scroll reveals are handled by @polgubau/astro-reveal
 * (pure CSS + IntersectionObserver). GSAP must NOT animate [data-reveal]
 * elements outside #hero, or both systems fight over the same nodes and
 * the sections stop appearing on scroll.
 */

const CONFIG = {
	defaults: {
		duration: 0.8,
		ease: "power3.out",
		distance: 30,
	},
	speeds: {
		fast: 0.5,
		normal: 0.8,
		slow: 1.2,
	},
	easings: {
		smooth: "power2.inOut",
		soft: "power3.out",
		bounce: "back.out(1.7)",
		elastic: "elastic.out(1, 0.3)",
	},
};

// Returns explicit from→to pairs so gsap.fromTo() always reaches opacity:1
// regardless of any CSS rule that might set opacity:0 on [data-reveal].
const getReveal = (
	type: string,
	distance: number = CONFIG.defaults.distance,
): { from: gsap.TweenVars; to: gsap.TweenVars } => {
	switch (type) {
		case "bottom":
			return { from: { y: distance, opacity: 0 }, to: { y: 0, opacity: 1 } };
		case "top":
			return { from: { y: -distance, opacity: 0 }, to: { y: 0, opacity: 1 } };
		case "left":
			return { from: { x: -distance, opacity: 0 }, to: { x: 0, opacity: 1 } };
		case "right":
			return { from: { x: distance, opacity: 0 }, to: { x: 0, opacity: 1 } };
		case "scale":
			return { from: { scale: 0.9, opacity: 0 }, to: { scale: 1, opacity: 1 } };
		default:
			return { from: { y: distance, opacity: 0 }, to: { y: 0, opacity: 1 } };
	}
};

const setupHero = (extraDelay = 0) => {
	const h1 = document.querySelector<HTMLElement>("#hero h1");
	if (!h1) return;
	// Idempotency guard: never re-wrap an already-processed heading
	if (h1.dataset.heroReady) return;
	h1.dataset.heroReady = "true";

	// Word-mask effect: wrap words in spans for granular control
	const text = h1.innerText;
	h1.innerHTML = text
		.split(" ")
		.map(
			(word) =>
				`<span class="inline-block overflow-hidden align-bottom" style="perspective:600px"><span class="inline-block word-inner" style="transform-origin:bottom center">${word}</span></span>`,
		)
		.join(" ");

	// h1 has data-reveal so CSS hides it; reveal it immediately before word anim
	gsap.set(h1, { opacity: 1 });

	// Premium word-reveal: slides up from behind a clip mask with a 3-D tilt
	// and a stagger wave (ease on the stagger itself gives the cascade feel).
	gsap.fromTo(
		"#hero h1 .word-inner",
		{ yPercent: 110, rotateX: 55, opacity: 0 },
		{
			yPercent: 0,
			rotateX: 0,
			opacity: 1,
			duration: 0.85,
			stagger: { each: 0.065, ease: "power1.in" },
			ease: "power4.out",
			delay: 0.15 + extraDelay,
		},
	);

	// Animate other hero elements. Skip #hero-scroll-reveal — its subtitle +
	// CTAs are revealed by the orbital scroll choreography, not on load.
	const heroReveal = document.querySelectorAll(
		"#hero [data-reveal]:not(h1):not(#hero-scroll-reveal)",
	);
	for (const el of heroReveal) {
		const type = el.getAttribute("data-reveal") || "bottom";
		const delay =
			Number.parseFloat(el.getAttribute("data-delay") || "0") / 1000 +
			0.5 +
			extraDelay;
		const { from, to } = getReveal(type);

		gsap.fromTo(el, from, {
			...to,
			duration: CONFIG.defaults.duration,
			ease: CONFIG.defaults.ease,
			delay,
		});
	}
};

const setupCounters = () => {
	const counters = document.querySelectorAll("[data-count]");
	for (const el of counters) {
		const target = Number.parseFloat(el.getAttribute("data-count") || "0");
		const suffix = el.getAttribute("data-count-suffix") || "";
		const prefix = el.getAttribute("data-count-prefix") || "";

		const obj = { value: 0 };
		gsap.to(obj, {
			value: target,
			duration: 2,
			ease: "power2.out",
			scrollTrigger: {
				trigger: el,
				start: "top 90%",
			},
			onUpdate: () => {
				el.textContent = `${prefix}${Math.round(Math.abs(obj.value))}${suffix}`;
			},
		});
	}
};

// Tracks every tween/ScrollTrigger of the current page so they can be
// reverted in one call before the next View Transitions navigation.
let ctx: ReturnType<typeof gsap.context> | undefined;

export const initAnimations = () => {
	// Kill orbital tweens first, then context (order matters).
	killOrbital();
	ctx?.revert();

	// Respect prefers-reduced-motion
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
		for (const el of document.querySelectorAll("[data-reveal]")) {
			(el as HTMLElement).style.opacity = "1";
		}
		return;
	}

	const hasOrbital = !!document.getElementById("orbital-ring");

	ctx = gsap.context(() => {
		// Without orbital ring (non-hero pages) reveal the hero immediately.
		if (!hasOrbital) setupHero(0);
		setupCounters();
	});

	// When the orbital ring finishes forming the circle, reveal the hero text.
	// ctx.add() ensures the tweens are tracked and reverted on navigation.
	if (hasOrbital) {
		setupOrbital(() => ctx?.add(() => setupHero(0)));
	} else {
		setupOrbital();
	}

	// Recalculate trigger positions once layout/images have settled.
	ScrollTrigger.refresh();
};

// Runs on the initial load AND after every View Transitions navigation.
// (astro:page-load already fires on first load, so no manual call is needed.)
document.addEventListener("astro:page-load", initAnimations);
