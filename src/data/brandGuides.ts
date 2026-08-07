export type BrandGuide = {
  slug: string;
  title: string;
  description: string | null;
  content: string;
  sort_order: number;
  published_at?: string | null;
};

export type BrandToken = {
  token_group: "color" | "typography" | "spacing" | "radius" | "shadow";
  key: string;
  value: string;
  value_dark: string | null;
  description: string | null;
  sort_order: number;
};

const fallbackGuides: BrandGuide[] = [
  {
    slug: "voz-y-tono",
    title: "Voz y tono",
    description: "Claro, cercano y con criterio técnico.",
    sort_order: 10,
    content:
      "Hablamos con claridad y sin adornos. Explicamos qué hacemos, por qué importa y cuál es el siguiente paso.\n\nUsamos lenguaje directo, frases concretas y ejemplos reales. La tecnología es el medio, no el protagonista.\n\nEvitamos promesas absolutas, jerga vacía y tecnicismos que no ayudan a decidir.",
  },
  {
    slug: "aplicacion",
    title: "Aplicación",
    description: "Una identidad consistente en cada punto de contacto.",
    sort_order: 20,
    content:
      "El verde doscientos se reserva para decisiones, acciones y elementos con intención. El espacio y el contraste hacen el resto.\n\nPriorizamos composiciones sobrias, legibles y útiles. Antes de añadir un elemento visual, comprobamos que ayude a entender, decidir o avanzar.",
  },
];

const fallbackTokens: BrandToken[] = [
  {
    token_group: "color",
    key: "primary",
    value: "#2a4227",
    value_dark: null,
    description: "Color primario de marca",
    sort_order: 10,
  },
  {
    token_group: "color",
    key: "accent",
    value: "#2a4227",
    value_dark: null,
    description: "Color de acento",
    sort_order: 20,
  },
  {
    token_group: "color",
    key: "background",
    value: "#fafafa",
    value_dark: null,
    description: "Fondo principal",
    sort_order: 30,
  },
  {
    token_group: "color",
    key: "foreground",
    value: "#171717",
    value_dark: null,
    description: "Texto principal",
    sort_order: 31,
  },
  {
    token_group: "typography",
    key: "font-sans",
    value: "Inter, ui-sans-serif, system-ui, sans-serif",
    value_dark: null,
    description: "Fuente principal",
    sort_order: 10,
  },
];

function isBrandGuide(value: unknown): value is BrandGuide {
  if (!value || typeof value !== "object") return false;
  const guide = value as Record<string, unknown>;
  return (
    typeof guide.slug === "string" &&
    typeof guide.title === "string" &&
    typeof guide.content === "string" &&
    typeof guide.sort_order === "number"
  );
}

function isBrandToken(value: unknown): value is BrandToken {
  if (!value || typeof value !== "object") return false;
  const token = value as Record<string, unknown>;
  return (
    typeof token.token_group === "string" &&
    ["color", "typography", "spacing", "radius", "shadow"].includes(token.token_group) &&
    typeof token.key === "string" &&
    typeof token.value === "string" &&
    (token.value_dark === null || typeof token.value_dark === "string") &&
    (token.description === null || typeof token.description === "string") &&
    typeof token.sort_order === "number"
  );
}

export type BrandKit = { guides: BrandGuide[]; tokens: BrandToken[] };

/**
 * A build can opt into the backoffice feed with PUBLIC_BRAND_KIT_API_URL.
 * The checked-in content is a resilient public fallback, never a draft source.
 */
export async function getBrandKit(): Promise<BrandKit> {
  const endpoint = import.meta.env.PUBLIC_BRAND_KIT_API_URL;
  if (!endpoint) return { guides: fallbackGuides, tokens: fallbackTokens };

  try {
    const response = await fetch(endpoint, {
      signal: AbortSignal.timeout(4_000),
    });
    if (!response.ok) return { guides: fallbackGuides, tokens: fallbackTokens };
    const payload = (await response.json()) as { guides?: unknown; tokens?: unknown };
    const guides = Array.isArray(payload.guides)
      ? payload.guides.filter(isBrandGuide)
      : [];
    const tokens = Array.isArray(payload.tokens)
      ? payload.tokens.filter(isBrandToken)
      : [];
    return {
      guides: guides.length > 0 ? guides.sort((a, b) => a.sort_order - b.sort_order) : fallbackGuides,
      tokens: tokens.length > 0 ? tokens.sort((a, b) => a.sort_order - b.sort_order) : fallbackTokens,
    };
  } catch {
    return { guides: fallbackGuides, tokens: fallbackTokens };
  }
}
