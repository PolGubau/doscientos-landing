const FIRST_TOUCH_KEY = "doscientos:first-touch";
const EVENT_ID_KEY = "doscientos:event-id";
const VISITOR_ID_KEY = "doscientos:visitor-id";

const TRACKING_ENDPOINT =
  import.meta.env.PUBLIC_TRACKING_ENDPOINT || "https://app.doscientos.es";

type Touch = {
  landing_path: string;
  referrer: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
  captured_at: string;
};

export type AttributionPayload = {
  event_id: string;
  visitor_id: string;
  conversion_step: string;
  first_landing_path: string;
  first_referrer: string;
  first_utm_source: string;
  first_utm_medium: string;
  first_utm_campaign: string;
  first_utm_term: string;
  first_utm_content: string;
  last_landing_path: string;
  last_referrer: string;
  last_utm_source: string;
  last_utm_medium: string;
  last_utm_campaign: string;
  last_utm_term: string;
  last_utm_content: string;
};

function params(): URLSearchParams {
  return typeof window === "undefined"
    ? new URLSearchParams()
    : new URLSearchParams(window.location.search);
}

function currentTouch(): Touch {
  const p = params();
  return {
    landing_path: typeof window === "undefined" ? "" : window.location.pathname,
    referrer: typeof document === "undefined" ? "" : document.referrer,
    utm_source: p.get("utm_source") || "",
    utm_medium: p.get("utm_medium") || "",
    utm_campaign: p.get("utm_campaign") || "",
    utm_term: p.get("utm_term") || "",
    utm_content: p.get("utm_content") || "",
    captured_at: new Date().toISOString(),
  };
}

function readFirstTouch(current: Touch): Touch {
  if (typeof window === "undefined") return current;
  try {
    const stored = window.localStorage.getItem(FIRST_TOUCH_KEY);
    if (stored) return { ...current, ...JSON.parse(stored) };
    window.localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(current));
    return current;
  } catch {
    return current;
  }
}

export function getOrCreateEventId(): string {
  if (typeof window === "undefined") return crypto.randomUUID();
  try {
    const existing = window.sessionStorage.getItem(EVENT_ID_KEY);
    if (existing) return existing;
    const next = crypto.randomUUID();
    window.sessionStorage.setItem(EVENT_ID_KEY, next);
    return next;
  } catch {
    return crypto.randomUUID();
  }
}

export function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return crypto.randomUUID();
  try {
    const existing = window.localStorage.getItem(VISITOR_ID_KEY);
    if (existing) return existing;
    const next = crypto.randomUUID();
    window.localStorage.setItem(VISITOR_ID_KEY, next);
    return next;
  } catch {
    return crypto.randomUUID();
  }
}

export function inferConversionStep(): string {
  const p = params();
  const explicit = p.get("conversion_step");
  if (explicit) return explicit;

  const ref = p.get("ref") || "";
  const path = typeof window === "undefined" ? "" : window.location.pathname;
  if (ref.includes("calculadora")) return "calculator";
  if (ref.startsWith("blog-")) return "blog_cta";
  if (ref.startsWith("recurso-")) return "resource_cta";
  if (ref.includes("pack") || path.startsWith("/packs")) return "pack_cta";
  if (path === "/contact") return "contact_form";
  if (path.startsWith("/blog")) return "blog_cta";
  if (path.startsWith("/recursos")) return "resource_cta";
  if (path.startsWith("/diagnostico")) return "diagnostic_form";
  return "landing_form";
}

export function buildAttributionPayload(
  conversionStep = inferConversionStep(),
): AttributionPayload {
  const last = currentTouch();
  const first = readFirstTouch(last);
  return {
    event_id: getOrCreateEventId(),
    visitor_id: getOrCreateVisitorId(),
    conversion_step: conversionStep,
    first_landing_path: first.landing_path,
    first_referrer: first.referrer,
    first_utm_source: first.utm_source,
    first_utm_medium: first.utm_medium,
    first_utm_campaign: first.utm_campaign,
    first_utm_term: first.utm_term,
    first_utm_content: first.utm_content,
    last_landing_path: last.landing_path,
    last_referrer: last.referrer,
    last_utm_source: last.utm_source,
    last_utm_medium: last.utm_medium,
    last_utm_campaign: last.utm_campaign,
    last_utm_term: last.utm_term,
    last_utm_content: last.utm_content,
  };
}

export function buildTrackedWhatsappUrl({
  phone,
  text,
  conversionStep = "whatsapp_click",
  landingRef = "",
}: {
  phone: string;
  text: string;
  conversionStep?: string;
  landingRef?: string;
}): string {
  const url = new URL("/api/public/whatsapp-click", TRACKING_ENDPOINT);
  url.searchParams.set("phone", phone);
  url.searchParams.set("text", text);
  url.searchParams.set("conversion_step", conversionStep);
  if (landingRef) url.searchParams.set("landing_ref", landingRef);
  return url.toString();
}

/**
 * Client-only attribution bootstrap. Deliberately minimal: no global click
 * hijacking, y el único tráfico de red que genera sale por `sendBeacon`
 * (ver trackEvent). Hace las dos cosas de las que depende ventas:
 *
 * 1. Capture first-touch (referrer/UTMs) once per visitor, so the eventual
 *    lead submission can report both first- and last-touch attribution.
 * 2. Stamp the visitor/event id + current touch onto WhatsApp CTA links so
 *    the click — logged server-side by /api/public/whatsapp-click — can be
 *    linked back to the lead once it converts.
 */
export function hydrateWhatsappLinks(): void {
  if (typeof document === "undefined") return;
  const touch = currentTouch();
  readFirstTouch(touch); // side-effect only: persists first-touch once per visitor
  const eventId = getOrCreateEventId();
  const visitorId = getOrCreateVisitorId();

  const links = document.querySelectorAll<HTMLAnchorElement>(
    'a[href*="/api/public/whatsapp-click"]',
  );
  for (const link of links) {
    try {
      const url = new URL(link.href);
      url.searchParams.set("event_id", eventId);
      url.searchParams.set("visitor_id", visitorId);
      url.searchParams.set("landing_path", touch.landing_path);
      if (touch.referrer) url.searchParams.set("referrer", touch.referrer);
      for (const key of [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
      ] as const) {
        if (touch[key]) url.searchParams.set(key, touch[key]);
      }
      link.href = url.toString();
    } catch {
      // Leave the original href untouched if URL parsing fails.
    }
  }
}

/**
 * URL de reproducción de la sesión en Microsoft Clarity, si Clarity está
 * cargado (solo con consentimiento analítico). Se resuelve de forma asíncrona
 * y se cachea en memoria: los eventos que se envíen después la adjuntan para
 * que el backoffice pueda enlazar directamente a la grabación del visitante.
 */
let clarityPlaybackUrl: string | null = null;

type ClarityMetadata = {
  projectId?: string;
  userId?: string;
  sessionId?: string;
};
type ClarityFn = (
  command: string,
  callback: (metadata: ClarityMetadata) => void,
  sync: boolean,
) => void;

export function captureClarityPlayback(): void {
  if (typeof window === "undefined" || clarityPlaybackUrl) return;
  const clarity = (window as unknown as { clarity?: ClarityFn }).clarity;
  if (typeof clarity !== "function") return;
  try {
    // El tercer argumento pide a Clarity que espere a tener la sesión lista en
    // lugar de descartar la llamada si todavía se está inicializando.
    clarity(
      "metadata",
      (metadata) => {
        if (!metadata?.projectId || !metadata.userId || !metadata.sessionId)
          return;
        clarityPlaybackUrl = `https://clarity.microsoft.com/player/${metadata.projectId}/${metadata.userId}/${metadata.sessionId}`;
      },
      true,
    );
  } catch {
    // Clarity bloqueado o versión sin la API "metadata": seguimos sin enlace.
  }
}

const TRACK_DEDUPE_MS = 200;
const lastSentAt = new Map<string, number>();

/**
 * Envía un evento intermedio (page_view, calculator_used, …) al backoffice sin
 * bloquear nada: `sendBeacon` deja la petición en manos del navegador (fuera
 * del hilo principal y sobreviviendo a la navegación) y solo si no está
 * disponible cae a `fetch` con `keepalive`. Nunca lanza ni espera respuesta.
 *
 * Los eventos idénticos disparados con menos de 200 ms de diferencia se
 * descartan: evita duplicados cuando un mismo handler se registra dos veces
 * (DOMContentLoaded + astro:page-load) o cuando el usuario teclea rápido.
 */
export function trackEvent(
  eventName: string,
  options: { conversionStep?: string; payload?: Record<string, unknown> } = {},
): void {
  if (typeof window === "undefined") return;

  const dedupeKey = `${eventName}:${options.conversionStep ?? ""}`;
  const now = Date.now();
  if (now - (lastSentAt.get(dedupeKey) ?? 0) < TRACK_DEDUPE_MS) return;
  lastSentAt.set(dedupeKey, now);

  const touch = currentTouch();
  const body = JSON.stringify({
    event_id: getOrCreateEventId(),
    visitor_id: getOrCreateVisitorId(),
    event_name: eventName,
    conversion_step: options.conversionStep ?? inferConversionStep(),
    landing_path: touch.landing_path,
    landing_ref: params().get("ref") || null,
    referrer: touch.referrer || null,
    utm_source: touch.utm_source || null,
    utm_medium: touch.utm_medium || null,
    utm_campaign: touch.utm_campaign || null,
    utm_term: touch.utm_term || null,
    utm_content: touch.utm_content || null,
    payload: {
      ...options.payload,
      ...(clarityPlaybackUrl ? { clarity_url: clarityPlaybackUrl } : {}),
    },
  });

  const endpoint = new URL(
    "/api/public/track-event",
    TRACKING_ENDPOINT,
  ).toString();
  // text/plain a propósito: es un content-type de la lista segura de CORS, así
  // que el navegador manda la petición directa, sin preflight OPTIONS. El
  // endpoint parsea el cuerpo como JSON igualmente.
  const contentType = "text/plain;charset=UTF-8";
  try {
    if (
      navigator.sendBeacon?.(endpoint, new Blob([body], { type: contentType }))
    ) {
      return;
    }
  } catch {
    // sendBeacon puede fallar por tamaño o política: probamos con fetch.
  }
  void fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body,
    keepalive: true,
  }).catch(() => {
    // El tracking nunca debe romper la navegación.
  });
}

/**
 * Registra la visita a la página en cuanto el navegador está ocioso, nunca
 * durante la carga: el evento no aporta nada al usuario y no debe competir
 * con el render. Reintenta antes la captura de Clarity porque su script es
 * async y raramente está listo en el DOMContentLoaded.
 */
export function trackPageView(): void {
  if (typeof window === "undefined") return;
  const send = () => {
    captureClarityPlayback();
    trackEvent("page_view");
  };
  const idle = (
    window as unknown as {
      requestIdleCallback?: (
        cb: () => void,
        opts?: { timeout: number },
      ) => void;
    }
  ).requestIdleCallback;
  if (typeof idle === "function") idle(send, { timeout: 3000 });
  else window.setTimeout(send, 1200);
}

export function initAttribution(): void {
  hydrateWhatsappLinks();
  captureClarityPlayback();
  trackPageView();
}
