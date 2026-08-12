export const branding = {
  // Información de marca
  name: "doscientos",
  legalName: "DOSCIENTOS DESARROLLO TECNOLOGICO, S.L.",
  slogan: "Modernizamos sistemas críticos sin detener tu negocio",
  domain: "doscientos.es",
  url: "https://doscientos.es",

  team: [
    {
      name: "Pol Gubau Amores",
      role: "Co-fundador · Frontend & Design",
      bio: "Ingeniero de software especializado en interfaces de usuario y arquitectura frontend. Antes en equipos de producto de empresas tecnológicas europeas. Obsesionado con la velocidad y la experiencia de usuario.",
      image: "/assets/team/pol.jpg",
      link: "https://www.linkedin.com/in/polgubauamores/",
    },
    {
      name: "Gerard Martínez Alcocer",
      role: "Co-fundador · Backend & DevOps",
      bio: "Ingeniero de software con experiencia en backend, infraestructura y DevOps. Ha trabajado en startups tecnológicas europeas, liderando proyectos de migración a la nube y optimización de sistemas críticos.",
      image: "/assets/team/gerard.jpg",
      link: "https://www.linkedin.com/in/gerard-martinez-alcocer/",
    },
  ],
  // Contacto
  contact: {
    calCom: {
      bookingUrl: "https://cal.eu/doscientos/30min",
      path: "doscientos/30min",
    },
    whatsapp: {
      number: "34671171525",
      displayNumber: "+34 671 17 15 25",
      defaultMessage:
        "Hola, quiero saber más sobre las soluciones de automatización, IA y desarrollo web que ofrecéis.",
    },
    email: "hola@doscientos.es",
  },

  // Redes sociales
  social: {
    twitter: "https://twitter.com/doscientos_es",
    github: "https://github.com/doscientos",
    linkedin: "https://www.linkedin.com/company/doscientos",
    instagram: "https://instagram.com/doscientos.es",
    brandfetch: "https://brandfetch.com/doscientos.es",
  },

  // Reseñas
  reviews: {
    googleReviewUrl: "https://g.page/r/CVVDrT1qq_qvEBM/review",
  },

  // Ubicación
  location: {
    city: "Premià de Mar",
    serviceArea: "Barcelona y el Maresme",
    country: "España",
  },

  // Datos legales y fiscales (LSSICE Art. 10)
  legal: {
    nif: "B88873393",
    registry: {
      office: "Barcelona",
      sheet: "658663",
    },
    address: {
      street: "Carrer Can Pou, 12",
      postalCode: "08330",
      city: "Premià de Mar",
      province: "Barcelona",
      country: "España",
    },
    administrators: ["Pol Gubau Amores", "Gerard Martínez Alcocer"],
  },

  // Assets
  assets: {
    logo: "/logo.png",
    isotype: "/iso.svg",
    thumbnail: "/assets/media/og-image.png",
  },
} as const;

// Tipo derivado para TypeScript
export type Branding = typeof branding;
