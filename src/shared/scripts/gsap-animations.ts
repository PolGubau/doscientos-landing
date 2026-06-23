import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { killOrbital, setupOrbital } from "./orbital";

gsap.registerPlugin(ScrollTrigger);

/**
 * Desktop-only GSAP animation bundle.
 * Dynamically imported by animations.ts only on viewports ≥ 768px.
 * Handles: hero word-mask, orbital ring, scroll-driven counters.
 *
 * Section/title scroll reveals are handled by @polgubau/astro-reveal
 * (pure CSS + IntersectionObserver). GSAP must NOT animate [data-reveal]
 * elements outside #hero.
 */

const CONFIG = {
	defaults: { duration: 0.8, ease: "power3.out", distance: 30 },
	speeds: { fast: 0.5, normal: 0.8, slow: 1.2 },
	easings: {
		smooth: "power2.inOut",
		soft: "power3.out",
		bounce: "back.out(1.7)",
		elastic: "elastic.out(1, 0.3)",
	},
};

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
	if (h1.dataset.heroReady) return;
	h1.dataset.heroReady = "true";

	const text = h1.innerText;
	h1.innerHTML = text
		.split(" ")
		.map(
			(word) =>
				`<span class="inline-block overflow-hidden align-bottom" style="perspective:600px"><span class="inline-block word-inner" style="transform-origin:bottom center">${word}</span></span>`,
		)
		.join(" ");

	gsap.set(h1, { opacity: 1 });

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
			scrollTrigger: { trigger: el, start: "top 90%" },
			onUpdate: () => {
				el.textContent = `${prefix}${Math.round(Math.abs(obj.value))}${suffix}`;
			},
		});
	}
};

// Tracks every tween/ScrollTrigger of the current page.
let ctx: ReturnType<typeof gsap.context> | undefined;

export const initDesktopAnimations = () => {
	killOrbital();
	ctx?.revert();

	const hasOrbital = !!document.getElementById("orbital-ring");

	ctx = gsap.context(() => {
		if (!hasOrbital) setupHero(0);
		setupCounters();
	});

	if (hasOrbital) {
		setupOrbital(() => ctx?.add(() => setupHero(0)));
	} else {
		setupOrbital();
	}

	ScrollTrigger.refresh();
};
