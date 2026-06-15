import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Premium GSAP Animation Engine
 * Replaces @polgubau/astro-reveal with high-performance, polished animations.
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

const getAnimateFrom = (
	type: string,
	distance: number = CONFIG.defaults.distance,
) => {
	switch (type) {
		case "bottom":
			return { y: distance, opacity: 0 };
		case "top":
			return { y: -distance, opacity: 0 };
		case "left":
			return { x: -distance, opacity: 0 };
		case "right":
			return { x: distance, opacity: 0 };
		case "scale":
			return { scale: 0.9, opacity: 0 };
		default:
			return { y: distance, opacity: 0 };
	}
};

const setupHero = () => {
	const h1 = document.querySelector("h1");
	if (!h1) return;

	// Word-mask effect: wrap words in spans for granular control
	const text = h1.innerText;
	h1.innerHTML = text
		.split(" ")
		.map(
			(word) =>
				`<span class="inline-block overflow-hidden"><span class="inline-block word-inner">${word}</span></span>`,
		)
		.join(" ");

	gsap.from(".word-inner", {
		yPercent: 100,
		opacity: 0,
		duration: 1,
		stagger: 0.05,
		ease: "power4.out",
		delay: 0.2,
	});

	// Animate other hero elements
	const heroReveal = document.querySelectorAll("#hero [data-reveal]:not(h1)");
	for (const el of heroReveal) {
		const type = el.getAttribute("data-reveal") || "bottom";
		const delay =
			Number.parseFloat(el.getAttribute("data-delay") || "0") / 1000 + 0.5;

		gsap.from(el, {
			...getAnimateFrom(type),
			duration: CONFIG.defaults.duration,
			ease: CONFIG.defaults.ease,
			delay,
		});
	}
};

const setupScrollReveals = () => {
	// Stagger containers
	const containers = document.querySelectorAll("[data-stagger]");
	for (const container of containers) {
		const staggerVal =
			Number.parseInt(container.getAttribute("data-stagger") || "100") / 1000;
		const children = container.querySelectorAll("[data-reveal]");

		if (children.length === 0) continue;

		children.forEach((child, i) => {
			const type = child.getAttribute("data-reveal") || "bottom";
			const distanceVal =
				child.getAttribute("data-distance") === "small"
					? 15
					: CONFIG.defaults.distance;

			gsap.from(child, {
				scrollTrigger: {
					trigger: container,
					start: "top 85%",
				},
				...getAnimateFrom(type, distanceVal),
				duration: CONFIG.defaults.duration,
				ease: CONFIG.defaults.ease,
				delay: i * staggerVal,
			});
		});
	}

	// Standalone reveals
	const standalone = document.querySelectorAll(
		"[data-reveal]:not([data-stagger] [data-reveal]):not(#hero [data-reveal])",
	);
	for (const el of standalone) {
		const type = el.getAttribute("data-reveal") || "bottom";
		const speed =
			(el.getAttribute("data-speed") as keyof typeof CONFIG.speeds) || "normal";
		const easing =
			(el.getAttribute("data-easing") as keyof typeof CONFIG.easings) || "soft";
		const delay =
			Number.parseFloat(el.getAttribute("data-delay") || "0") / 1000;

		gsap.from(el, {
			scrollTrigger: {
				trigger: el,
				start: "top 90%",
			},
			...getAnimateFrom(type),
			duration: CONFIG.speeds[speed] || CONFIG.defaults.duration,
			ease: CONFIG.easings[easing] || CONFIG.defaults.ease,
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
				el.textContent = `${prefix}${Math.floor(obj.value)}${suffix}`;
			},
		});
	}
};

export const initAnimations = () => {
	// Respect prefers-reduced-motion
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
		for (const el of document.querySelectorAll("[data-reveal]")) {
			(el as HTMLElement).style.opacity = "1";
		}
		return;
	}

	setupHero();
	setupScrollReveals();
	setupCounters();
};

// Auto-init on page load (Astro compatible)
document.addEventListener("astro:page-load", initAnimations);

// Initial call for the first load
if (
	document.readyState === "complete" ||
	document.readyState === "interactive"
) {
	initAnimations();
} else {
	document.addEventListener("DOMContentLoaded", initAnimations);
}
