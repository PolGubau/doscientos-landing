import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { killHeroStage, setupHeroStage } from "./hero-stage";

gsap.registerPlugin(ScrollTrigger);

/**
 * Desktop-only GSAP animation bundle.
 * Dynamically imported by animations.ts only on viewports ≥ 768px.
 * Handles: hero word-mask, the hero storyboard stage, scroll-driven counters,
 * the Method pipeline, the Case Studies horizontal-scroll carousel, heading
 * word scrub, media parallax, magnetic CTAs and the cursor spotlight.
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

/**
 * "Así trabajamos" (Method) pipeline: a scroll-scrubbed progress line that
 * grows in sync with the scrollbar, cumulatively marks passed steps as
 * "active", and puts a soft reading-focus spotlight on whichever step is
 * currently being read — dimming the rest. Replaces Method.astro's plain
 * IntersectionObserver baseline (which stays as the mobile/reduced-motion
 * fallback and is skipped there once this runs).
 */
const setupMethod = () => {
  const section = document.getElementById("method");
  const stepsContainer =
    section?.querySelector<HTMLElement>(".method-step")?.parentElement;
  const badges = Array.from(
    section?.querySelectorAll<HTMLElement>(".step-badge") ?? [],
  );
  const progressLine = section?.querySelector<HTMLElement>("#progress-line");
  if (!section || !stepsContainer || !progressLine || badges.length === 0)
    return;

  const containerTop =
    stepsContainer.getBoundingClientRect().top + window.scrollY;
  const centers = badges.map((badge) => {
    const rect = badge.getBoundingClientRect();
    return rect.top + window.scrollY + rect.height / 2 - containerTop;
  });
  const maxHeight = centers[centers.length - 1];
  if (!maxHeight) return;

  section.classList.add("gsap-ready");
  gsap.set(progressLine, { height: 0 });

  ScrollTrigger.create({
    trigger: stepsContainer,
    start: "top center",
    end: `+=${maxHeight}`,
    scrub: 0.4,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      const currentPx = self.progress * maxHeight;
      progressLine.style.height = `${currentPx}px`;

      let currentIndex = -1;
      badges.forEach((_, i) => {
        if (currentPx >= centers[i] - 1) currentIndex = i;
      });

      badges.forEach((badge, i) => {
        const isPast = i <= currentIndex;
        const isCurrent = i === currentIndex;
        badge.classList.toggle("active", isPast);
        badge.classList.toggle("current", isCurrent);

        const content = badge
          .closest(".method-step")
          ?.querySelector<HTMLElement>(".step-content");
        content?.classList.toggle("active", isCurrent);
        content?.classList.toggle("is-past", isPast && !isCurrent);
      });
    },
  });
};

/**
 * Scroll-scrubbed word reveal for headings marked with [data-scrub-text].
 * Words start dimmed and light up one by one as the heading crosses the
 * viewport, pulling the eye through the message instead of showing a static
 * block. The split happens at runtime, so the pre-rendered HTML crawlers
 * receive is untouched plain text.
 */
const setupScrubText = () => {
  const targets = document.querySelectorAll<HTMLElement>("[data-scrub-text]");
  for (const el of targets) {
    if (el.dataset.scrubReady) continue;
    el.dataset.scrubReady = "true";

    // CSS starts the heading at opacity 0.18 (see global.css) so it never
    // flashes at full color before this script loads. Hand control over to
    // the per-word tween below in the same tick, before anything paints.
    gsap.set(el, { opacity: 1 });

    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) textNodes.push(walker.currentNode as Text);

    const words: HTMLElement[] = [];
    for (const node of textNodes) {
      const parts = (node.textContent ?? "").split(/(\s+)/).filter(Boolean);
      if (parts.length === 0) continue;

      const fragment = document.createDocumentFragment();
      for (const part of parts) {
        if (/^\s+$/.test(part)) {
          fragment.append(document.createTextNode(part));
          continue;
        }
        const word = document.createElement("span");
        word.textContent = part;
        fragment.append(word);
        words.push(word);
      }
      node.replaceWith(fragment);
    }
    if (words.length === 0) continue;

    gsap.fromTo(
      words,
      { opacity: 0.18 },
      {
        opacity: 1,
        ease: "none",
        stagger: 0.35,
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          end: "top 45%",
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      },
    );
  }
};

/**
 * Depth parallax for [data-parallax] media wrappers: the wrapper drifts
 * vertically inside its overflow-hidden frame while the page scrolls. It is
 * pre-scaled by twice the drift so the frame never shows an empty edge.
 * Elements inside #hero are skipped — the pinned hero stage already owns them.
 */
const setupParallax = () => {
  const targets = document.querySelectorAll<HTMLElement>("[data-parallax]");
  for (const el of targets) {
    if (el.closest("#hero")) continue;
    const drift = Number.parseFloat(el.dataset.parallax || "6");

    gsap.fromTo(
      el,
      { yPercent: -drift, scale: 1 + drift / 50 },
      {
        yPercent: drift,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
          invalidateOnRefresh: true,
        },
      },
    );
  }
};

/**
 * Magnetic pull for [data-magnetic] CTAs: the element leans towards the
 * cursor while it hovers and springs back on leave. Returns a cleanup.
 */
const setupMagnetic = (): (() => void) => {
  const disposers: Array<() => void> = [];

  for (const el of document.querySelectorAll<HTMLElement>("[data-magnetic]")) {
    const strength = Number.parseFloat(el.dataset.magnetic || "0.3");
    const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      xTo((event.clientX - (rect.left + rect.width / 2)) * strength);
      yTo((event.clientY - (rect.top + rect.height / 2)) * strength);
    };
    const onLeave = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    disposers.push(() => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    });
  }

  return () => {
    for (const dispose of disposers) dispose();
  };
};

/**
 * Cursor-following highlight for [data-spotlight] cards. Only feeds the
 * --mx/--my custom properties consumed by the ::after gradient in
 * custom-styles.css, so it never touches transforms and cannot clash with
 * the CSS hover states or astro-reveal. Returns a cleanup.
 */
const setupSpotlight = (): (() => void) => {
  const disposers: Array<() => void> = [];

  for (const el of document.querySelectorAll<HTMLElement>("[data-spotlight]")) {
    let frame = 0;

    const onMove = (event: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = el.getBoundingClientRect();
        el.style.setProperty(
          "--mx",
          `${((event.clientX - rect.left) / rect.width) * 100}%`,
        );
        el.style.setProperty(
          "--my",
          `${((event.clientY - rect.top) / rect.height) * 100}%`,
        );
      });
    };

    el.addEventListener("pointermove", onMove);
    disposers.push(() => {
      el.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    });
  }

  return () => {
    for (const dispose of disposers) dispose();
  };
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
  killHeroStage();
  ctx?.revert();

  // Hero must be set up FIRST: it creates a pinned ScrollTrigger ("+=180%")
  // that inserts a pin-spacer above every later section. GSAP's
  // ScrollTrigger.refresh() recalculates trigger positions in creation
  // order, so any trigger created before the pin (e.g. Method's) would be
  // measured against the pre-spacer layout and end up with stale start/end
  // values once the spacer is inserted.
  ctx = gsap.context(() => {
    setupHero(0);
    setupHeroStage();
    setupCounters();
    setupMethod();
    setupScrubText();
    setupParallax();

    const disposers = [setupMagnetic(), setupSpotlight()];
    return () => {
      for (const dispose of disposers) dispose();
    };
  });

  ScrollTrigger.refresh();
};
