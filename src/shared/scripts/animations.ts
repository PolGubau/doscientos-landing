/**
 * Animation router — zero GSAP imports here.
 *
 * Mobile / prefers-reduced-motion: CSS-only reveals, no JS animation cost.
 * Desktop (≥ 768 px): dynamically imports the GSAP bundle so mobile never
 * downloads or parses the ~70 KB GSAP chunk.
 *
 * Section/title scroll reveals outside #hero are handled by
 * @polgubau/astro-reveal (pure CSS + IntersectionObserver).
 */

/** Immediately shows hero elements that GSAP would normally choreograph. */
const revealHeroStatic = () => {
  const scrollReveal = document.getElementById("hero-scroll-reveal");
  if (scrollReveal) {
    scrollReveal.style.opacity = "1";
    scrollReveal.style.visibility = "visible";
    scrollReveal.style.transform = "none";
  }
  // Reveal the h1 and any other hero [data-reveal] elements.
  for (const el of document.querySelectorAll<HTMLElement>(
    "#hero [data-reveal]",
  )) {
    el.style.opacity = "1";
    el.style.transform = "none";
  }
};

const initAnimations = async () => {
  const isDesktop = window.matchMedia("(min-width: 768px)").matches;
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // [data-scrub-text] headings start dimmed in CSS (see global.css) so
  // GSAP's word-scrub never flashes in at full color first. GSAP is the
  // only thing that lights them back up, so on paths where it never runs
  // we have to undo that dimming here or the text stays unreadable.
  const revealScrubText = () => {
    for (const el of document.querySelectorAll<HTMLElement>(
      "[data-scrub-text]",
    )) {
      el.style.opacity = "1";
    }
  };

  if (prefersReduced) {
    // Reveal everything at once — matches previous behaviour.
    for (const el of document.querySelectorAll<HTMLElement>("[data-reveal]")) {
      el.style.opacity = "1";
    }
    revealHeroStatic();
    revealScrubText();
    return;
  }

  if (!isDesktop) {
    // Mobile: only reveal hero elements; let astro-reveal handle the rest
    // via IntersectionObserver so section scroll-reveals still work.
    revealHeroStatic();
    revealScrubText();
    return;
  }

  // Desktop only — dynamic import keeps GSAP out of the mobile critical path.
  // The module is cached by the browser after the first load, so subsequent
  // astro:page-load calls (View Transitions) resolve instantly.
  const { initDesktopAnimations } = await import("./gsap-animations");
  initDesktopAnimations();
};

// Fires on first load AND after every View Transitions navigation.
document.addEventListener("astro:page-load", initAnimations);
