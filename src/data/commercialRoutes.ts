import { specificLandings } from "./specificLandings";

export type BlogCtaVariant =
	| "contact"
	| "diagnostic"
	| "automation"
	| "legacy"
	| "mvp"
	| "app"
	| "packs"
	| "projects"
	| "barcelona"
	| "madrid"
	| "maresme";

export interface CommercialRoute {
	href: string;
	label: string;
	description: string;
	priority: "primary" | "secondary";
}

export const diagnosticRoute = {
	href: "/diagnostico-procesos",
	label: "Diagnostico de procesos",
	description:
		"Te decimos que automatizar primero, que evitar y si merece la pena construir.",
} satisfies Omit<CommercialRoute, "priority">;

export const pillarRoute = {
	href: "/automatizacion-procesos",
	label: "Automatizacion de procesos",
	description:
		"Guia para priorizar automatizaciones rentables en pymes antes de construir.",
} satisfies Omit<CommercialRoute, "priority">;

export const commercialRoutes: CommercialRoute[] = [
	{ ...diagnosticRoute, priority: "primary" },
	{ ...pillarRoute, priority: "primary" },
	...specificLandings.map((landing) => ({
		href: `/${landing.slug}`,
		label: landing.label,
		description: landing.description,
		priority: "secondary" as const,
	})),
];

export const headerNavItems = [
	diagnosticRoute,
	{ href: pillarRoute.href, label: "Automatizar" },
	{ href: "/projects", label: "Proyectos" },
	{ href: "/blog", label: "Blog" },
];

export const footerLinkColumns = [
	{
		title: "Automatizacion",
		links: [
			diagnosticRoute,
			pillarRoute,
			...commercialRoutes
				.filter((route) => route.priority === "secondary")
				.map(({ href, label }) => ({ href, label })),
		],
	},
	{
		title: "Prueba y casos",
		links: [
			{ label: "Proyectos", href: "/projects" },
			{ label: "Caso Optinergia", href: "/projects/optinergia" },
			{ label: "Caso Bitacora ERP", href: "/projects/bitacora-erp" },
			{ label: "Blog", href: "/blog" },
			{ label: "Sobre nosotros", href: "/sobre-nosotros" },
			{ label: "Contacto", href: "/contact" },
		],
	},
	{
		title: "Zonas",
		links: [
			{ label: "Barcelona", href: "/desarrollo-web-barcelona" },
			{ label: "Castellon", href: "/desarrollo-web-castellon" },
			{ label: "Maresme", href: "/agencia-digital-maresme" },
		],
	},
];

export const commercialBlogCtaBySlug: Record<string, BlogCtaVariant> = {
	"automatizacion-procesos-empresariales": "automation",
	"automatizacion-empresas-maresme": "automation",
	"automatizar-partes-trabajo-empresas-servicios": "automation",
	"crm-renovaciones-contratos-pymes": "automation",
	"excel-como-crm-cuando-cambiar": "automation",
	"software-administradores-fincas-incidencias": "automation",
	"software-gestion-asesoria-energetica": "automation",
	"software-gestion-empresas-pymes": "automation",
	"software-a-medida-vs-saas": "automation",
	"transformacion-digital-pymes-castellon": "automation",
	"modernizacion-sistemas-legacy": "legacy",
	"migrar-access-a-web-2026": "legacy",
	"validar-mvp-6-semanas": "mvp",
	"mvp-vs-producto-completo": "mvp",
	"desarrollar-app-movil-2026": "app",
	"cuanto-cuesta-desarrollar-app-2026": "app",
};

export const commercialBlogLinks = commercialRoutes
	.filter((route) =>
		[
			"/diagnostico-procesos",
			"/automatizacion-procesos",
			"/automatizar-excel",
			"/crm-renovaciones",
		].includes(route.href),
	)
	.map(({ href, label }) => ({ href, label }));
