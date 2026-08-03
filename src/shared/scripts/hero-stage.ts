import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Hero storyboard: a single pinned, scroll-scrubbed timeline that turns a
 * scattered cloud of "chaos" tool chips (Excel, Drive, Notion, pen…) into one
 * finished software window, then removes that window again and reveals the
 * payoff headline (#hero-payoff, same text as the page's sr-only <h1>) in
 * its place as the small caption above crossfades through three beats.
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
  document.body.classList.remove("hero-cta-active");
};

// Resting scale of a chip's card once it has popped in, and how far it has
// shrunk by the time it's fully absorbed into the window in phase 2.
const REST_SCALE = 0.9;
const CONVERGE_SCALE = 0.25;

// Phase boundaries, expressed as timeline position (not evenly spaced — each
// phase gets however long its beat needs). They intentionally match the
// caption crossfade points below so the visuals and the copy beat change
// together: "vive repartida" -> growth, "lo conectamos" -> fusion, "hecho a
// medida" -> integrated result, then the software window is removed and the
// payoff headline ("deja de hacer a mano...") fades in in its place as the
// closing beat.
const P1_END = 0.267;
const P2_END = 0.6;
// Window has fully formed and its rows/metric have finished revealing by
// ~1.07 (see the phase 3 reveal loop below); P3_END gives it a short beat to
// be seen before phase 4 removes it.
const P3_END = 1.15;
const P4_END = 1.4;

export const setupHeroStage = () => {
  killHeroStage();

  const hero = document.getElementById("hero");
  const stage = document.getElementById("hero-stage");
  const win = document.getElementById("hero-window");
  const payoff = document.getElementById("hero-payoff");
  const payoffWords = payoff
    ? Array.from(payoff.querySelectorAll<HTMLElement>(".payoff-word-inner"))
    : [];
  const cta = document.getElementById("hero-payoff-cta");
  const linesLayer = document.getElementById("hero-lines");
  const chaosWraps = Array.from(
    document.querySelectorAll<HTMLElement>(".hero-chaos-item"),
  );
  const chaosInners = Array.from(
    document.querySelectorAll<HTMLElement>(".hero-chaos-inner"),
  );
  const captions = Array.from(
    document.querySelectorAll<HTMLElement>(".hero-caption"),
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
  // Hidden until phase 4: without this, the payoff headline's only
  // autoAlpha reference is the fromTo tween created near the end of this
  // function, and since that tween sits well past timeline position 0, it
  // never runs its immediateRender at setup time — leaving the headline at
  // its CSS default (visible) from the very first frame instead of hidden
  // until the software window fades out.
  if (payoff) gsap.set(payoff, { autoAlpha: 0 });
  // Each word starts masked below/tilted back inside its overflow-hidden
  // outer span (see .payoff-word-outer/.payoff-word-inner in Hero.astro);
  // the phase 4 tween below lifts+untilts them back into place. Kept
  // separate from the container's own autoAlpha above for the same
  // immediateRender reason.
  if (payoffWords.length > 0) {
    gsap.set(payoffWords, { yPercent: 120, rotateX: 55, opacity: 0 });
  }
  // Same immediateRender concern as the payoff headline: the CTA also only
  // becomes visible once the timeline's playhead actually reaches phase 4.
  if (cta) gsap.set(cta, { autoAlpha: 0, y: 12 });

  const heroOffset = Math.round(hero.getBoundingClientRect().top);
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
      end: "+=225%",
      scrub: 1,
      onUpdate: (self) => {
        document.body.classList.toggle(
          "hero-cta-active",
          self.progress > 0.1 && self.progress < 0.9,
        );
      },
    },
  });

  // Caption crossfade: 3 beats, one per storyboard phase (chaos, fusion,
  // integrated result). First caption is already visible at rest (CSS
  // default), so only the transitions are animated. Each transition is
  // pinned to the exact phase boundary it narrates (P1_END/P2_END above)
  // instead of being evenly spread across the timeline. The payoff line
  // itself is not part of this stack — see the #hero-payoff tween in phase
  // 4 below.
  //
  // Beyond a plain opacity fade, the outgoing caption also drifts up and
  // shrinks slightly while the incoming one rises up from below and pops
  // back to full size (`back.out`) — a pure fade was too subtle to notice
  // mid-scroll, so the added motion gives the eye something to track and
  // makes each change register as a distinct "beat" instead of one static
  // line quietly changing text.
  //
  // The two tweens are sequential, not overlapping: the outgoing caption
  // must reach autoAlpha:0 by `boundary` before the incoming one starts
  // there, otherwise both are partially visible at once mid-scroll (looks
  // like the new line "arrives" on top of the old one instead of after it).
  const captionDuration = 0.14;
  // One boundary per transition (i.e. captions.length - 1 entries).
  const captionBoundaries = [P1_END, P2_END];
  captions.forEach((caption, i) => {
    if (i === 0) return;
    const boundary = captionBoundaries[i - 1];
    if (boundary === undefined) return;
    tl?.to(
      captions[i - 1],
      {
        autoAlpha: 0,
        y: -16,
        scale: 0.94,
        duration: captionDuration,
        ease: "power2.in",
      },
      boundary - captionDuration,
    ).fromTo(
      caption,
      { autoAlpha: 0, y: 16, scale: 0.94 },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: captionDuration,
        ease: "back.out(1.7)",
      },
      boundary,
    );
  });

  // Phase 1 (0 → P1_END): "tu operativa vive repartida en mil sitios" — each
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

  // Phase 2 (P1_END → P2_END): "lo conectamos todo en un solo sistema" —
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

  // Phase 3 (P2_END → P3_END): "hecho a medida de cómo ya trabajáis" — the
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

  // Phase 4 (P3_END → P4_END): "deja de hacer a mano lo que tu negocio
  // puede hacer solo" — the payoff headline. The finished software window
  // (step 3) is removed rather than left lingering, so the headline lands
  // in the stage with nothing competing for attention instead of
  // overlapping a static illustration. Fading the window's own opacity
  // also hides its rows/metric with it, since they're children of
  // #hero-window.
  const phase4Span = P4_END - P3_END;
  tl.fromTo(
    win,
    { autoAlpha: 1, y: 0, scale: 1 },
    {
      autoAlpha: 0,
      y: -16,
      scale: 0.92,
      ease: "power1.in",
      duration: phase4Span * 0.6,
    },
    P3_END,
  );
  // Payoff headline starts slightly after the window begins dissolving, so
  // the two overlap briefly (window fading out while the headline fades/
  // builds in) rather than leaving a bare gap on the stage between them.
  const payoffStart = P3_END + phase4Span * 0.25;
  if (payoff) {
    // Container itself only fades — no y/scale "pop" here, since that job
    // now belongs to the individual words below (a whole-block pop plus a
    // per-word entrance would double up and read as jittery).
    tl.fromTo(
      payoff,
      { autoAlpha: 0 },
      { autoAlpha: 1, ease: "power1.out", duration: phase4Span * 0.25 },
      payoffStart,
    );
  }
  // Word-by-word build: each word rises out of its mask and untilts back to
  // flat, one after another, so the closing line lands as a stronger,
  // deliberate reveal instead of the whole sentence just appearing at once.
  const wordStagger = phase4Span * 0.045;
  const wordDuration = phase4Span * 0.55;
  if (payoffWords.length > 0) {
    tl.fromTo(
      payoffWords,
      { yPercent: 120, rotateX: 55, opacity: 0 },
      {
        yPercent: 0,
        rotateX: 0,
        opacity: 1,
        stagger: wordStagger,
        ease: "power3.out",
        duration: wordDuration,
      },
      payoffStart,
    );
  }
  // CTA lands once the words have mostly settled, right after the headline
  // rather than alongside it, so the eye reads the line first.
  if (cta) {
    const wordsSpan =
      payoffWords.length > 0
        ? wordDuration + wordStagger * (payoffWords.length - 1)
        : 0;
    tl.fromTo(
      cta,
      { autoAlpha: 0, y: 12 },
      { autoAlpha: 1, y: 0, ease: "power2.out", duration: phase4Span * 0.35 },
      payoffStart + wordsSpan * 0.55,
    );
  }
};
