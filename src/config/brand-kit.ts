import publishedBrandTokens from '~/data/brand-tokens.json'

/**
 * Returns the snapshot produced by the build's prebuild step. The resulting
 * values are embedded into each static page and never fetched by page renders.
 */
export async function loadPublishedBrandTokens(): Promise<Record<string, string>> {
  return publishedBrandTokens
}

export function brandTokenStyle(tokens: Record<string, string>): string {
  return Object.entries(tokens)
    .map(([key, value]) => `${key}:${value}`)
    .join(';')
}
