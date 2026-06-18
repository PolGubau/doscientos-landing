export const copy = {
	hero: {
		// Pain-forward: el target (clínica, empresa con Excel+SaaS+procesos manuales) se reconoce al instante.
		// "No al revés" es el differentiator — apunta directamente al SAP, Salesforce, HubSpot que los obliga a adaptarse.
		title: "Sistemas internos a medida. De idea a producción en 6 semanas",
		// 1 frase. Nombra exactamente qué reemplazamos (Excel, SaaS genérico, procesos manuales) y a quién va dirigido.
		subtitle:
			"Sistemas internos para empresas que ya no caben en Excel, el SaaS estándar ni los procesos manuales",
		brand: "doscientos.",
		cta: "Cuéntanos tu proyecto",
	},

	method: {
		steps: [
			{
				title: "Semana 1 — Discovery",
				description:
					"Una llamada de 60 minutos para entender tu negocio, tus usuarios y lo que el producto tiene que conseguir. Salimos con un alcance cerrado, no con una lista de dudas.",
			},
			{
				title: "Semana 2 — Propuesta y arquitectura",
				description:
					"Recibes una propuesta con entregables, plazos y precio fijo. Definimos el stack y la arquitectura antes de escribir una sola línea de código. Sin sorpresas.",
			},
			{
				title: "Semanas 3-4 — Diseño y desarrollo",
				description:
					"Cada viernes recibes una demo funcional para dar feedback. Iteramos rápido y sin burocracia — tus decisiones moldean el producto en tiempo real.",
			},
			{
				title: "Semana 5 — Testing y ajustes",
				description:
					"Pruebas con usuarios reales, corrección de bugs y ajustes de UX. Tu feedback entra en producción en 24-48h. El producto se afina hasta que esté listo.",
			},
			{
				title: "Semana 6 — Lanzamiento",
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
			"Cuéntanos el problema. En menos de 24 horas te damos feedback honesto y un plan de acción — aunque al final no trabajemos juntos.",
		cta: "Pedir propuesta gratis",
	},

	nav: {
		home: "Inicio",
		projects: "Proyectos",
		blog: "Blog",
		contact: "Contacto",
	},

	footer: {
		tagline: "Software de negocio que funciona en producción.",
		copyright: "© 2026 Doscientos",
	},
} as const;

export type Copy = typeof copy;
