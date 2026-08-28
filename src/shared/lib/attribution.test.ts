import { describe, expect, it } from "vitest";
import { buildAttributedCalendarBookingUrl } from "./attribution";

describe("buildAttributedCalendarBookingUrl", () => {
  it("preserves the booking URL and stamps the visitor attribution as Cal metadata", () => {
    const result = buildAttributedCalendarBookingUrl(
      "https://cal.example/team/intro?existing=value",
      {
        event_id: "event-1",
        visitor_id: "visitor-1",
        conversion_step: "calendar_booking",
        first_landing_path: "/",
        first_referrer: "https://search.example",
        first_utm_source: "google",
        first_utm_medium: "cpc",
        first_utm_campaign: "summer",
        first_utm_term: "automation",
        first_utm_content: "hero",
        last_landing_path: "/",
        last_referrer: "https://search.example",
        last_utm_source: "google",
        last_utm_medium: "cpc",
        last_utm_campaign: "summer",
        last_utm_term: "automation",
        last_utm_content: "hero",
        internal_traffic: false,
      },
      "home-hero",
    );

    const url = new URL(result ?? "");
    expect(url.searchParams.get("existing")).toBe("value");
    expect(url.searchParams.get("metadata[eventId]")).toBe("event-1");
    expect(url.searchParams.get("metadata[visitorId]")).toBe("visitor-1");
    expect(url.searchParams.get("metadata[landingRef]")).toBe("home-hero");
    expect(url.searchParams.get("metadata[firstUtmCampaign]")).toBe("summer");
  });

  it("returns null for an invalid booking URL", () => {
    expect(
      buildAttributedCalendarBookingUrl("not a URL", {
        event_id: "event-1",
        visitor_id: "visitor-1",
        conversion_step: "calendar_booking",
        first_landing_path: "",
        first_referrer: "",
        first_utm_source: "",
        first_utm_medium: "",
        first_utm_campaign: "",
        first_utm_term: "",
        first_utm_content: "",
        last_landing_path: "",
        last_referrer: "",
        last_utm_source: "",
        last_utm_medium: "",
        last_utm_campaign: "",
        last_utm_term: "",
        last_utm_content: "",
        internal_traffic: false,
      }),
    ).toBeNull();
  });
});