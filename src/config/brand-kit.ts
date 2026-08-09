type BrandToken = {
  token_group: string;
  key: string;
  value: string;
};

type BrandKitResponse = { tokens?: BrandToken[] };

const DEFAULT_ENDPOINT = "https://app.doscientos.es/api/public/brand-kit";

/**
 * Loads the published design tokens at build time. The checked-in CSS remains
 * the fallback so a temporary backoffice outage never blocks a landing build.
 */
export async function loadPublishedBrandTokens(): Promise<Record<string, string>> {
  const endpoint = import.meta.env.PUBLIC_BRAND_KIT_API_URL || DEFAULT_ENDPOINT;
  try {
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(4000) });
    if (!response.ok) return {};
    const body = (await response.json()) as BrandKitResponse;
    const tokens: Record<string, string> = {};

    for (const token of body.tokens ?? []) {
      if (!/^(color|radius|spacing|shadow|typography)$/.test(token.token_group)) continue;
      if (!/^[a-z0-9-]+$/.test(token.key)) continue;
      // Only accept CSS-safe scalar values from the public feed.
      if (!/^[a-zA-Z0-9#().,%\-\s/]+$/.test(token.value)) continue;
      tokens[`--${token.key}`] = token.value.trim();
    }
    return tokens;
  } catch {
    return {};
  }
}

export function brandTokenStyle(tokens: Record<string, string>): string {
  return Object.entries(tokens)
    .map(([key, value]) => `${key}:${value}`)
    .join(";");
}
