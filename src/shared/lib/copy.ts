// Pain-forward: el target (clínica, empresa con Excel+SaaS+procesos manuales) se reconoce al instante.
// "No al revés" es el differentiator - apunta directamente al SAP, Salesforce, HubSpot que los obliga a adaptarse.
// Shared between `hero.title` and the stage's closing payoff headline (see
// below) so the line only has to be written once.
const heroTitle = "Deja de hacer a mano lo que tu negocio puede hacer solo";

export const copy = {
  hero: {
    title: heroTitle,
    // 1 frase. Nombra exactamente qué reemplazamos (Excel, SaaS genérico, procesos manuales) y a quién va dirigido.
    subtitle:
      "Sistemas internos para empresas que ya no caben en Excel, progmas genéricos ni procesos manuales",
    brand: "doscientos.",
    cta: "Cuéntanos tu proyecto",
    // Scroll-driven storyboard rendered above the stage (desktop-only GSAP
    // pin, see setupHeroStage in hero-stage.ts). Captions crossfade as the
    // scattered tools converge into the software window; the payoff line
    // (heroTitle) is NOT part of this crossfade — it's the big headline
    // that replaces the software window itself once it fades out (see
    // #hero-payoff in Hero.astro), so it reads as the story's conclusion
    // rather than one more small caption.
    stage: {
      captions: [
        "Tu operativa vive repartida en mil sitios distintos",
        "Lo conectamos todo en un solo sistema",
        "Hecho a medida de cómo ya trabajáis",
      ],
      chaos: [
        {
          icon: "file-spreadsheet",
          label: "facturas_V3_final.xlsx",
          color: "#16a34a",
        },
        { icon: "folder", label: "Carpeta compartida", color: "#2563eb" },
        {
          icon: "notebook-pen",
          label: "Notas de la reunión",
          color: "#7c3aed",
        },
        { icon: "pen-line", label: "Apuntado en papel", color: "#d97706" },
        { icon: "mail", label: "Pendiente de responder", color: "#dc2626" },
        {
          icon: "message-circle",
          label: "Foto por WhatsApp",
          color: "#059669",
        },
        { icon: "calendar", label: "Recordatorio manual", color: "#0891b2" },
        { icon: "receipt", label: "Ticket en un cajón", color: "#ca8a04" },
        { icon: "file-text", label: "Contrato_v2.pdf", color: "#4f46e5" },
        {
          icon: "sticky-note",
          label: "Post-it en el monitor",
          color: "#db2777",
        },
      ],
      window: {
        label: "Tu software",
        rows: [
          "Pedido #1042 confirmado",
          "Factura enviada automáticamente",
          "Cliente notificado por email",
        ],
        metricValue: 20,
        metricSuffix: "h",
        metricLabel: "ahorradas cada semana",
      },
    },
  },

  method: {
    steps: [
      {
        title: "Semana 1 - Discovery",
        description:
          "Una llamada de 60 minutos para entender tu negocio, tus usuarios y lo que el producto tiene que conseguir. Salimos con un alcance cerrado, no con una lista de dudas.",
      },
      {
        title: "Semana 2 - Propuesta y arquitectura",
        description:
          "Recibes una propuesta con entregables, plazos y precio fijo. Definimos el stack y la arquitectura antes de escribir una sola línea de código. Sin sorpresas.",
      },
      {
        title: "Semanas 3-4 - Diseño y desarrollo",
        description:
          "Cada viernes recibes una demo funcional para dar feedback. Iteramos rápido y sin burocracia - tus decisiones moldean el producto en tiempo real.",
      },
      {
        title: "Semana 5 - Testing y ajustes",
        description:
          "Pruebas con usuarios reales, corrección de bugs y ajustes de UX. Tu feedback entra en producción en 24-48h. El producto se afina hasta que esté listo.",
      },
      {
        title: "Semana 6 - Lanzamiento",
        description:
          "Deploy a producción, analytics configurado y monitorización activa. Te entregamos el código completo, la documentación técnica y 30 días de soporte incluidos.",
      },
    ],
  },

  finalCta: {
    // Pregunta retórica: el lector se visualiza como cliente potencial.
    question:
      "¿Tu equipo sigue haciendo en 3 horas lo que un sistema haría en 5 minutos?",
    // Elimina la fricción del primer paso: no prometemos vender, prometemos ayudar.
    description:
      "Cuéntanos el problema. En menos de 24 horas te damos feedback honesto y un plan de acción - aunque al final no trabajemos juntos.",
    cta: "Cuéntanos tu proyecto",
  },

  nav: {
    home: "Inicio",
    projects: "Proyectos",
    blog: "Recursos",
    contact: "Contacto",
  },

  footer: {
    tagline: "Software de negocio que funciona en producción.",
    copyright: "© 2026 Doscientos",
  },
} as const;

export type Copy = typeof copy;
