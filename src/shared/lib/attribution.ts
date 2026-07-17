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
	return typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
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
	if (ref.includes("pack") || path.startsWith("/packs")) return "pack_cta";
	if (path === "/contact") return "contact_form";
	if (path.startsWith("/blog")) return "blog_cta";
	if (path.startsWith("/diagnostico")) return "diagnostic_form";
	return "landing_form";
}

export function buildAttributionPayload(conversionStep = inferConversionStep()): AttributionPayload {
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
