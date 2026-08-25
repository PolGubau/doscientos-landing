export interface ResourceCategory {
  slug: string;
  label: string;
  description: string;
  aliases: readonly string[];
}

export const resourceCategories: readonly ResourceCategory[] = [
  {
    slug: "automatizacion",
    label: "Automatización",
    description:
      "Procesos, productividad, RPA e inteligencia artificial aplicada.",
    aliases: [
      "automatización",
      "automatizacion",
      "procesos",
      "procesos empresariales",
      "productividad",
      "rpa",
      "ia aplicada",
    ],
  },
  {
    slug: "software-a-medida",
    label: "Software a medida",
    description:
      "Producto digital, SaaS, MVP y desarrollo de soluciones propias.",
    aliases: [
      "software a medida",
      "software empresarial",
      "saas",
      "mvp",
      "producto",
      "producto digital",
      "startup",
      "startups",
    ],
  },
  {
    slug: "digitalizacion",
    label: "Digitalización",
    description:
      "Modernización de sistemas, migraciones y transformación digital.",
    aliases: [
      "digitalización",
      "transformación digital",
      "modernización",
      "legacy",
      "sistemas legacy",
      "migración",
      "access",
      "excel",
    ],
  },
  {
    slug: "desarrollo-web",
    label: "Desarrollo web",
    description:
      "Webs, ecommerce, rendimiento, conversión y tecnología frontend.",
    aliases: [
      "desarrollo web",
      "desarrollo-web",
      "página web",
      "web empresa",
      "diseño web que convierte",
      "landing page b2b",
      "ecommerce",
      "tienda online",
      "prestashop",
      "astro",
      "next.js",
      "rendimiento web",
      "conversión",
    ],
  },
  {
    slug: "aplicaciones-moviles",
    label: "Aplicaciones móviles",
    description:
      "Apps nativas y multiplataforma, sincronización y trabajo offline.",
    aliases: [
      "app móvil",
      "desarrollo móvil",
      "apps de eventos",
      "react native",
      "ios",
      "android",
      "flutter",
      "offline-first",
      "arquitectura móvil",
      "sincronización",
    ],
  },
  {
    slug: "arquitectura-software",
    label: "Arquitectura de software",
    description:
      "Decisiones técnicas, APIs, escalabilidad y calidad de software.",
    aliases: [
      "arquitectura de software",
      "arquitectura frontend",
      "arquitectura móvil",
      "api",
      "backend",
      "bases de datos",
      "integración de sistemas",
      "microservicios",
      "monolito modular",
      "decisión tecnológica",
      "decisiones técnicas",
      "documentación técnica",
      "adr",
      "calidad de software",
      "escalabilidad",
      "refactoring",
    ],
  },
  {
    slug: "gestion-empresarial",
    label: "Gestión empresarial",
    description:
      "CRM, ERP, backoffice, clientes, contratos y operativa interna.",
    aliases: [
      "gestión empresarial",
      "software de gestión",
      "software de gestion",
      "crm",
      "erp",
      "gestión de clientes",
      "backoffice",
      "portal de cliente",
      "área de clientes",
      "contratos",
      "renovaciones",
      "incidencias",
      "reservas online",
      "administradores de fincas",
      "software asesoría energética",
      "gestión contratos energía",
      "partes de trabajo",
    ],
  },
];

function normalizeTag(tag: string): string {
  return tag.trim().toLocaleLowerCase("es").replaceAll("-", " ");
}

export function getResourceCategories(
  tags: readonly string[] = [],
): ResourceCategory[] {
  const normalizedTags = new Set(tags.map(normalizeTag));
  return resourceCategories.filter((category) =>
    category.aliases.some((alias) => normalizedTags.has(normalizeTag(alias))),
  );
}

export function getResourceCategory(
  slug: string,
): ResourceCategory | undefined {
  return resourceCategories.find((category) => category.slug === slug);
}
