export type BrandGuide = {
  slug: string;
  title: string;
  description: string | null;
  content: string;
  sort_order: number;
  published_at?: string | null;
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

/**
 * A build can opt into the backoffice feed with PUBLIC_BRAND_KIT_API_URL.
 * The checked-in content is a resilient public fallback, never a draft source.
 */
export async function getBrandGuides(): Promise<BrandGuide[]> {
  const endpoint = import.meta.env.PUBLIC_BRAND_KIT_API_URL;
  if (!endpoint) return fallbackGuides;

  try {
    const response = await fetch(endpoint, {
      signal: AbortSignal.timeout(4_000),
    });
    if (!response.ok) return fallbackGuides;
    const payload = (await response.json()) as { guides?: unknown };
    const guides = Array.isArray(payload.guides)
      ? payload.guides.filter(isBrandGuide)
      : [];
    return guides.length > 0
      ? guides.sort((a, b) => a.sort_order - b.sort_order)
      : fallbackGuides;
  } catch {
    return fallbackGuides;
  }
}
