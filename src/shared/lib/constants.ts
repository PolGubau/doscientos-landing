import path from "node:path";
import { branding } from "~/config/branding";

export const paths = {
	projects: path.join(process.cwd(), "src", "content", "projects"),
};

export const baseUrl = branding.url;

export function getMetadata() {
	return {
		title: `${branding.name} | Productos digitales de calidad en España`,

		description: `${branding.name} ayuda a empresas y profesionales a ahorrar tiempo y dinero con automatización de procesos, inteligencia artificial y desarrollo web. Soluciones rápidas, escalables y sin complicaciones.`,

		name: branding.name,

		legalName: branding.legalName,

		legal: branding.legal,

		longName: `${branding.name} | Productos digitales y automatizaciones en España`,

		slogan: branding.slogan,

		picture: branding.assets.logo,

		getInTouch: {
			label: "Contáctanos",

			short_label: "¡Hablemos!",

			href: "/contact",
		},

		tags: [
			branding.name,

			"Automatización de Procesos",

			"IA Empresarial",

			"Chatbots",

			"Páginas Web",

			"Automatización España",

			"Inteligencia Artificial",

			"Ahorro de Tiempo",

			"Productividad",

			"N8n",

			"SEO",

			"Transformación Digital",

			"Automatización Tareas",

			"Digitalización",

			"Webs Corporativas",

			"Landing Pages",

			branding.location.city,

			branding.location.country,
		],

		links: {
			website: branding.url,

			twitter: branding.social.twitter,

			github: branding.social.github,

			linkedin: branding.social.linkedin,

			email: `mailto:${branding.contact.email}`,
		},

		homeOgImage: branding.assets.thumbnail,
	};
}

export const defaultLocale = "es";
