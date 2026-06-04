export const branding = {
	// Información de marca
	name: "doscientos",
	legalName: "DOSCIENTOS DESARROLLO TECNOLOGICO, S.L.",
	slogan: "Modernizamos sistemas críticos sin detener tu negocio",
	domain: "doscientos.es",
	url: "https://doscientos.es",

	team: [
		{
			name: "Pol",
			role: "Co-fundador · Frontend & Design",
			bio: "Ingeniero de software especializado en interfaces de usuario y arquitectura frontend. Antes en equipos de producto de empresas tecnológicas europeas. Obsesionado con la velocidad y la experiencia de usuario.",
			image: "/assets/team/pol.jpg",
			link: "https://polgubau.com",
		},
		{
			name: "Gerard",
			role: "Co-fundador · Backend & DevOps",
			bio: "Ingeniero de software con experiencia en backend, infraestructura y DevOps. Ha trabajado en startups tecnológicas europeas, liderando proyectos de migración a la nube y optimización de sistemas críticos.",
			image: "/assets/team/gerard.jpg",
			link: "https://www.linkedin.com/in/gerard-martinez-alcocer/",
		},
	],
	// Contacto
	contact: {
		calComUrl: "https://cal.com/doscientos/30min",
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
	},

	// Reseñas
	reviews: {
		googleReviewUrl: "https://g.page/r/CVVDrT1qq_qvEBM/review",
	},

	// Ubicación
	location: {
		city: "Barcelona",
		country: "España",
	},

	// Assets
	assets: {
		logo: "/assets/branding/logo.png",
		thumbnail: "/assets/media/og-image.png",
	},
} as const;

// Tipo derivado para TypeScript
export type Branding = typeof branding;
