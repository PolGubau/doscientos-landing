import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Hero storyboard: a single pinned, scroll-scrubbed timeline that turns a
 * scattered cloud of "chaos" tool chips into one finished software window.
 * The promise and CTA remain visible; the scroll earns the click by showing
 * the operational change instead of hiding the message until the end.
 * Replaces the old orbital-ring hero — the subtitle/CTA stay static below
 * the stage for the whole scroll, only the stage and caption above are
 * choreographed.
 *
 * Mobile: never runs (chaos + window are CSS-hidden, the payoff headline is
 * shown statically instead, first caption is shown). Reduced motion:
 * skipped entirely, see revealHeroStatic() in animations.ts.
 */

let tl: gsap.core.Timeline | undefined;

export const killHeroStage = () => {
  tl?.scrollTrigger?.kill();
  tl?.kill();
  tl = undefined;
};

// Resting scale of a chip's card once it has popped in, and how far it has
// shrunk by the time it's fully absorbed into the window in phase 2.
const REST_SCALE = 0.9;
const CONVERGE_SCALE = 0.18;

// Phase boundaries, expressed as timeline position (not evenly spaced — each
// phase gets however long its beat needs). They intentionally match the
// caption crossfade points below so the visuals and the copy beat change
// together: "vive repartida" -> growth, "lo conectamos" -> fusion, "hecho a
// medida" -> integrated result, then the software window is removed and the
// payoff headline ("deja de hacer a mano...") fades in in its place as the
// closing beat.
const P1_END = 0.2;
const P2_END = 0.62;
// Window has fully formed and its rows/metric have finished revealing by
// ~1.07 (see the phase 3 reveal loop below); P3_END gives it a short beat to
// be seen before phase 4 removes it.
const P3_END = 1;

export const setupHeroStage = () => {
  killHeroStage();

  const hero = document.getElementById("hero");
  const stage = document.getElementById("hero-stage");
  const win = document.getElementById("hero-window");
  const linesLayer = document.getElementById("hero-lines");
  const chaosWraps = Array.from(
    document.querySelectorAll<HTMLElement>(".hero-chaos-item"),
  );
  const chaosInners = Array.from(
    document.querySelectorAll<HTMLElement>(".hero-chaos-inner"),
  );
  const rows = Array.from(
    document.querySelectorAll<HTMLElement>(".hero-window-row"),
  );
  const metric = document.querySelector<HTMLElement>(".hero-window-metric");
  // Content pieces inside each chip's preview (mail draft bars, spreadsheet/
  // calendar cells, WhatsApp photo + read receipt) — filled in progressively
  // during phase 1 instead of growing the whole card. See the gsap.set below
  // and the phase 1 tweens further down.
  const chaosBars = Array.from(
    document.querySelectorAll<HTMLElement>(".hero-chaos-bar"),
  );
  const chaosActiveCells = Array.from(
    document.querySelectorAll<HTMLElement>(".hero-chaos-cell.is-active"),
  );
  const chaosChatPhotos = Array.from(
    document.querySelectorAll<HTMLElement>(".hero-chaos-chat-photo"),
  );
  const chaosChatMeta = Array.from(
    document.querySelectorAll<HTMLElement>(".hero-chaos-chat-meta"),
  );
  const chaosWatermarks = Array.from(
    document.querySelectorAll<HTMLElement>(".hero-chaos-watermark"),
  );
  if (!hero || !stage || !win || chaosWraps.length === 0) return;

  // Pre-compute how far each chip must travel to reach the stage's centre,
  // so the "absorption" tween reads as chips flying into the window rather
  // than a generic fade. Reading the transform GSAP finds on first tween
  // (translate(-50%,-50%) from CSS) as its baseline, so `x`/`y` below add on
  // top of that centring instead of overwriting it.
  const stageRect = stage.getBoundingClientRect();
  const cx = stageRect.left + stageRect.width / 2;
  const cy = stageRect.top + stageRect.height / 2;
  for (const wrap of chaosWraps) {
    const r = wrap.getBoundingClientRect();
    wrap.dataset.dx = String(cx - (r.left + r.width / 2));
    wrap.dataset.dy = String(cy - (r.top + r.height / 2));
  }

  // One connecting line per chip, drawn from the chip's own resting spot
  // towards the stage centre. Built fresh on every setup (view transitions
  // can call this again) so stale lines from a previous layout never linger.
  const lines: HTMLElement[] = [];
  if (linesLayer) {
    linesLayer.innerHTML = "";
    for (const wrap of chaosWraps) {
      const dx = Number(wrap.dataset.dx);
      const dy = Number(wrap.dataset.dy);
      const length = Math.hypot(dx, dy);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const line = document.createElement("div");
      line.className = "hero-chaos-line";
      line.style.left = wrap.style.left;
      line.style.top = wrap.style.top;
      line.style.setProperty(
        "--chip-color",
        wrap.style.getPropertyValue("--chip-color"),
      );
      linesLayer.appendChild(line);
      gsap.set(line, {
        width: length,
        rotation: angle,
        transformOrigin: "0% 50%",
        autoAlpha: 0,
        scaleX: 0,
      });
      lines.push(line);
    }
  }

  // Each chip's preview starts as an empty shell — its content (draft text,
  // spreadsheet cells, chat photo) is filled in during phase 1 as the user
  // scrolls, rather than the old approach of growing the whole card to a
  // large peak scale (which looked bad and started overlapping neighbours
  // once the previews got bigger than the old icon pills).
  gsap.set(chaosBars, { scaleX: 0, transformOrigin: "0% 50%" });
  gsap.set(chaosActiveCells, { autoAlpha: 0, scale: 0.6 });
  gsap.set(chaosChatPhotos, { autoAlpha: 0, scale: 0.7 });
  gsap.set(chaosChatMeta, { autoAlpha: 0, y: 4 });
  gsap.set(chaosWatermarks, { autoAlpha: 0 });

  // Document-relative (scroll-invariant) resting offset of #hero from the
  // top of the viewport — i.e. the space the fixed navbar's spacer reserves
  // above it. getBoundingClientRect().top alone is viewport-relative, so if
  // window.scrollY isn't exactly 0 at the instant this runs (scroll-position
  // restoration, HMR, timing quirks) it silently bakes in whatever scroll
  // already happened, pushing the pin's start point further down the page
  // and creating a "dead" scroll range before the storyboard visibly reacts.
  // Adding scrollY back recovers the true resting offset regardless of when
  // this is measured.
  const heroOffset = Math.round(
    hero.getBoundingClientRect().top + window.scrollY,
  );
  const startOffset = heroOffset > 0 ? `${heroOffset}px` : "top";

  // The chaos cloud must already be on screen the instant the page loads —
  // it's the very first thing a visitor sees, before they've scrolled at
  // all. A scrubbed tween can't provide that: at scroll position 0 the
  // timeline renders its progress-0 ("from") state, which would be
  // invisible until the user starts scrolling, reading as a blank hero.
  // So the appearance itself is a plain, non-scrubbed entrance that plays
  // once on load (to a small "rest" scale), and the scrubbed timeline below
  // grows/converges/absorbs the chips as the user actually scrolls.
  //
  // This has to be deferred a frame: the caller (initDesktopAnimations)
  // calls ScrollTrigger.refresh() synchronously right after this function
  // returns, and refreshing a pinned/scrubbed ScrollTrigger forces its
  // timeline to render at the current scroll progress (0 here) — which
  // re-applies phase 1's `fromTo` start value (autoAlpha:1) to every chip
  // in one shot, instantly, regardless of immediateRender:false (that flag
  // only skips the render at THIS tween's own creation time, not a later
  // explicit refresh/render of the timeline). Left alone, that refresh
  // stomps the staggered entrance a moment after it starts, so all chips
  // end up visible almost immediately instead of appearing one by one.
  // Creating the entrance tween on the next animation frame guarantees it
  // runs after that synchronous refresh instead of before it, so its own
  // immediateRender snaps every chip back to invisible right before the
  // first real paint, and the stagger plays out untouched from there.
  requestAnimationFrame(() => {
    gsap.set(chaosInners, { autoAlpha: 1, scale: REST_SCALE, y: 0 });
    gsap.from(chaosInners, {
      autoAlpha: 0,
      scale: 0.5,
      y: 10,
      // "Poco a poco": each chip pops in ~0.16s after the previous one, in
      // randomized order, so the cloud visibly builds note-by-note instead
      // of materializing as a single block.
      stagger: { each: 0.16, from: "random" },
      ease: "power2.out",
      duration: 0.6,
      delay: 0.15,
      // The scrubbed timeline also tweens autoAlpha/scale on these same
      // elements (phase 1 growth, phase 2 convergence). GSAP's default
      // overwrite:"auto" would kill whichever tween last touched those
      // properties the moment this one starts; overwrite:false keeps this
      // entrance safe from that.
      overwrite: false,
    });

    // The first caption's entrance is handled by a pure-CSS keyframe
    // animation (see .hero-caption:first-child in Hero.astro), not GSAP —
    // it needs to appear immediately on paint regardless of when this
    // dynamically-imported chunk finishes loading. Animating it here too
    // (via gsap.from + immediateRender) would snap it back to hidden the
    // instant this code runs, undoing the CSS entrance that may already be
    // mid-flight or finished, and reading as a jarring "pop, vanish,
    // replay" whenever the import lagged behind first paint.
  });

  tl = gsap.timeline({
    scrollTrigger: {
      trigger: hero,
      start: `top ${startOffset}`,
      pin: true,
      // Scroll distance for the whole storyboard, scaled to the timeline's
      // total duration (~1.4 units, up from ~1.07 before phase 4 was added)
      // so the added window-removal + payoff beat gets proportionally the
      // same scroll-per-unit pacing as the rest of the story.
      end: "+=105%",
      // Lower smoothing than the default scrub:1 so the very first wheel
      // tick visibly moves the timeline right away instead of spending its
      // first fraction of a second catching up (which read as a dead
      // scroll).
      scrub: 0.35,
    },
  });

  // Phase 1 (0 → P1_END): "el problema se reconoce" — each
  // chip's card is already visible (poco a poco entrance above) but starts
  // as an empty shell; as the visitor scrolls, its content fills in — draft
  // text/spreadsheet cells/chat photo — so the chaos reads as "stuff is
  // actively happening in a dozen scattered places" instead of the old
  // effect of the whole card growing to a large peak scale (which looked odd
  // and started overlapping neighbours once the previews got bigger than
  // the old icon pills).
  //
  // autoAlpha is held at 1 throughout even though the entrance tween already
  // sets it — this is a scrubbed timeline, and the convergence tween further
  // down is a one-directional autoAlpha:0 tween. Without an explicit tween
  // holding autoAlpha:1 across this whole phase, scrubbing back past the
  // convergence tween's start point would leave opacity/visibility stuck at
  // their converged (0/hidden) values forever, since nothing else in
  // [0, P1_END] would ever re-assert autoAlpha:1.
  tl.fromTo(
    chaosInners,
    { scale: REST_SCALE, autoAlpha: 1 },
    {
      scale: REST_SCALE,
      autoAlpha: 1,
      duration: P1_END,
      overwrite: false,
      // This tween starts at time 0, exactly where the scrubbed timeline's
      // playhead sits when it's first created. By default GSAP immediately
      // renders a fromTo's "from" values the instant it's added at the
      // current playhead position — which would force autoAlpha:1 on every
      // chip right away, stomping the staggered entrance fade-in above
      // before it gets to play "poco a poco". immediateRender:false skips
      // that one-off creation-time snap; normal scrubbed rendering (e.g.
      // scrolling back to the very top) still re-applies autoAlpha:1 here
      // exactly as before.
      immediateRender: false,
    },
    0,
  );

  const fillDuration = P1_END * 0.85;
  if (chaosBars.length > 0) {
    tl.fromTo(
      chaosBars,
      { scaleX: 0 },
      {
        scaleX: 1,
        stagger: { each: 0.02, from: "random" },
        ease: "power2.out",
        duration: fillDuration,
        overwrite: false,
      },
      0,
    );
  }
  if (chaosActiveCells.length > 0) {
    tl.fromTo(
      chaosActiveCells,
      { autoAlpha: 0, scale: 0.6 },
      {
        autoAlpha: 1,
        scale: 1,
        stagger: { each: 0.03, from: "random" },
        ease: "back.out(2)",
        duration: fillDuration,
        overwrite: false,
      },
      0,
    );
  }
  if (chaosChatPhotos.length > 0) {
    tl.fromTo(
      chaosChatPhotos,
      { autoAlpha: 0, scale: 0.7 },
      {
        autoAlpha: 1,
        scale: 1,
        stagger: { each: 0.05, from: "random" },
        ease: "back.out(2)",
        duration: fillDuration,
        overwrite: false,
      },
      0,
    ).fromTo(
      chaosChatMeta,
      { autoAlpha: 0, y: 4 },
      {
        autoAlpha: 1,
        y: 0,
        stagger: { each: 0.05, from: "random" },
        ease: "power2.out",
        duration: fillDuration * 0.6,
        overwrite: false,
      },
      P1_END * 0.3,
    );
  }
  if (chaosWatermarks.length > 0) {
    tl.fromTo(
      chaosWatermarks,
      { autoAlpha: 0 },
      {
        autoAlpha: 0.22,
        stagger: { each: 0.03, from: "random" },
        ease: "power1.out",
        duration: fillDuration,
        overwrite: false,
      },
      0,
    );
  }

  // Phase 2 (P1_END → P2_END): "lo conectamos todo" —
  // connecting lines radiate from every chip towards the centre while the
  // chips themselves get violently sucked inward (with a little chaotic
  // wind-up rotation per chip) and dissolve as the software window
  // materialises in their place. Every tween below is a `fromTo` with an
  // explicit start value (never a plain `.to()`), and none of them overlap
  // on the same property for the same target — this is what keeps the
  // scrubbed timeline symmetric in both scroll directions (see the reverse-
  // scroll fix above for why an implicit "from" breaks that).
  const fusionStart = P1_END;
  const fusionSpan = P2_END - P1_END;

  // Lines: draw from each chip toward the centre early in the phase, hold
  // at full length while the chips wind up and launch, then fade out as the
  // chips arrive and dissolve into the forming window.
  if (lines.length > 0) {
    tl.fromTo(
      lines,
      { scaleX: 0, autoAlpha: 0 },
      {
        scaleX: 1,
        autoAlpha: 0.9,
        stagger: { each: 0.02, from: "random" },
        ease: "power2.out",
        duration: fusionSpan * 0.35,
        overwrite: false,
      },
      fusionStart,
    ).fromTo(
      lines,
      { autoAlpha: 0.9 },
      {
        autoAlpha: 0,
        stagger: { each: 0.02, from: "random" },
        ease: "power1.in",
        duration: fusionSpan * 0.2,
        overwrite: false,
      },
      fusionStart + fusionSpan * 0.75,
    );
  }

  // Chips: a chaotic, snappy collapse into the centre — `back.in` gives each
  // chip a little wind-up (drifting slightly away/rotating) before it gets
  // yanked to the exact centre point, and the random per-chip stagger +
  // rotation keeps the whole cloud from moving in lockstep.
  tl.fromTo(
    chaosWraps,
    { x: 0, y: 0, rotation: 0 },
    {
      x: (_i, target: HTMLElement) => Number(target.dataset.dx),
      y: (_i, target: HTMLElement) => Number(target.dataset.dy),
      rotation: () => gsap.utils.random(-28, 28),
      stagger: { each: 0.035, from: "random" },
      ease: "back.in(1.6)",
      duration: fusionSpan * 0.7,
      overwrite: false,
    },
    fusionStart + fusionSpan * 0.15,
  );
  tl.fromTo(
    chaosInners,
    { scale: REST_SCALE },
    {
      scale: CONVERGE_SCALE,
      stagger: { each: 0.035, from: "random" },
      ease: "power2.in",
      duration: fusionSpan * 0.7,
      overwrite: false,
    },
    fusionStart + fusionSpan * 0.15,
  );
  // Separate, later tween for the fade so the chips stay fully visible while
  // they fly inward and only dissolve once they've essentially arrived —
  // reads as "colliding and merging" into the window rather than fading
  // away mid-flight. Only touches autoAlpha, so it never overlaps the scale
  // tween above on the same property.
  tl.fromTo(
    chaosInners,
    { autoAlpha: 1 },
    {
      autoAlpha: 0,
      stagger: { each: 0.02, from: "random" },
      ease: "power1.in",
      duration: fusionSpan * 0.15,
      overwrite: false,
    },
    fusionStart + fusionSpan * 0.8,
  );
  tl.fromTo(
    win,
    { autoAlpha: 0, y: 16, scale: 0.85 },
    {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      ease: "back.out(1.5)",
      duration: fusionSpan * 0.35,
    },
    fusionStart + fusionSpan * 0.6,
  );

  // Phase 3 (P2_END → P3_END): "el resultado funciona" — the
  // chips are gone, fully integrated; reveal the window's rows and metric
  // one by one as the finished, running result, then hold so it's actually
  // seen before phase 4 removes it.
  rows.forEach((row, i) => {
    tl?.fromTo(
      row,
      { autoAlpha: 0, y: 8 },
      { autoAlpha: 1, y: 0, ease: "power2.out", duration: 0.12 },
      P2_END + 0.05 + i * 0.09,
    );
  });
  if (metric) {
    tl.fromTo(
      metric,
      { autoAlpha: 0, y: 8 },
      { autoAlpha: 1, y: 0, ease: "power2.out", duration: 0.15 },
      P2_END + 0.05 + rows.length * 0.09,
    );
  }

  // Final proof beat: the result gets a short, high-contrast pulse. It gives
  // the story a memorable payoff without removing the system or the CTA.
  const metricValue = document.querySelector<HTMLElement>(
    ".hero-window-metric-value",
  );
  tl.to(win, { scale: 1.035, y: -6, duration: 0.16, ease: "power2.out" }, P3_END)
    .to(win, { scale: 1, y: 0, duration: 0.16, ease: "power2.inOut" }, ">")
    .to(
      metricValue,
      { scale: 1.12, color: "#1f5b35", duration: 0.16, ease: "back.out(1.7)" },
      P3_END,
    )
    .to(metricValue, { scale: 1, duration: 0.2, ease: "power2.out" }, ">")
    .to({}, { duration: 0.08 }, ">");
};
