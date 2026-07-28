import { execFileSync } from "node:child_process";
import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { commercialRoutes } from "~/data/commercialRoutes";
import { packs } from "~/data/packs";

// Fecha de fallback cuando no hay historial git disponible (clones superficiales)
const FALLBACK_DATE = "2025-01-01";

/** Fecha (YYYY-MM-DD) del último commit que tocó el archivo; fallback si no hay historial */
function gitLastmod(file: string, fallback = FALLBACK_DATE): string {
	try {
		const iso = execFileSync("git", ["log", "-1", "--format=%cI", "--", file], {
			encoding: "utf8",
		}).trim();
		return iso ? iso.split("T")[0] : fallback;
	} catch {
		return fallback;
	}
}

/** Fecha más reciente de una lista (ISO YYYY-MM-DD ordena cronológicamente) */
function maxDate(dates: string[], fallback: string): string {
	const sorted = dates.filter(Boolean).sort();
	return sorted.length ? sorted[sorted.length - 1] : fallback;
}

interface StaticPage {
	url: string;
	source: string;
	priority: string;
	changefreq: string;
	lastmod?: string;
}

export const GET: APIRoute = async ({ site }) => {
	const baseUrl = (site?.toString() || "https://doscientos.es").replace(
		/\/$/,
		"",
	);

	// Obtener proyectos y posts
	const projects = await getCollection(
		"projects",
		({ data }) => data.available,
	);
	const blogPosts = await getCollection("blog", ({ data }) => !data.draft);

	// Generar URLs de proyectos — lastmod = fecha de finalización del proyecto
	const projectUrls = projects.map((project) => ({
		url: `projects/${project.id}`,
		priority: "0.8",
		changefreq: "monthly",
		lastmod:
			project.data.endedAt instanceof Date
				? project.data.endedAt.toISOString().split("T")[0]
				: project.data.endedAt,
	}));

	// Generar URLs de recursos — lastmod = updatedDate o publishDate
	const blogUrls = blogPosts.map((post) => {
		const date = post.data.updatedDate ?? post.data.publishDate;
		return {
			url: `recursos/${post.id}`,
			priority: "0.7",
			changefreq: "monthly",
			lastmod: date instanceof Date ? date.toISOString().split("T")[0] : date,
		};
	});

	// Generar URLs de packs — lastmod = último cambio en los datos de packs
	const packsDataLastmod = gitLastmod("src/data/packs.ts");
	const packUrls = packs.map((pack) => ({
		url: `packs/${pack.slug}`,
		priority: "0.8",
		changefreq: "monthly",
		lastmod: packsDataLastmod,
	}));

	const commercialRoutesLastmod = maxDate(
		[
			gitLastmod("src/data/commercialRoutes.ts"),
			gitLastmod("src/data/specificLandings.ts"),
		],
		FALLBACK_DATE,
	);
	const commercialRouteUrls = commercialRoutes
		.filter((route) => route.href !== "/diagnostico-procesos")
		.map((route) => ({
			url: route.href.replace(/^\//, ""),
			priority: route.priority === "primary" ? "0.95" : "0.9",
			changefreq: "monthly",
			lastmod: commercialRoutesLastmod,
		}));

	// Páginas estáticas — lastmod automático desde el último commit del archivo fuente.
	// Los índices usan la fecha del contenido más reciente, no la del template.
	const staticPages: StaticPage[] = [
		{
			url: "",
			source: "src/pages/index.astro",
			priority: "1.0",
			changefreq: "weekly",
		}, // Homepage
		{
			url: "projects",
			source: "src/pages/projects/index.astro",
			priority: "0.9",
			changefreq: "weekly",
			lastmod: maxDate(
				projectUrls.map((p) => p.lastmod),
				gitLastmod("src/pages/projects/index.astro"),
			),
		},
		{
			url: "recursos",
			source: "src/pages/recursos/index.astro",
			priority: "0.9",
			changefreq: "daily",
			lastmod: maxDate(
				blogUrls.map((p) => p.lastmod),
				gitLastmod("src/pages/recursos/index.astro"),
			),
		},
		{
			url: "contact",
			source: "src/pages/contact.astro",
			priority: "0.8",
			changefreq: "monthly",
		},
		{
			url: "diagnostico-procesos",
			source: "src/pages/diagnostico-procesos.astro",
			priority: "0.95",
			changefreq: "monthly",
		},
		{
			url: "sobre-nosotros",
			source: "src/pages/sobre-nosotros.astro",
			priority: "0.8",
			changefreq: "monthly",
		},
		{
			url: "jobs",
			source: "src/pages/jobs.astro",
			priority: "0.6",
			changefreq: "monthly",
		},
		// Páginas SEO locales
		{
			url: "desarrollo-web-valencia",
			source: "src/pages/desarrollo-web-valencia.astro",
			priority: "0.85",
			changefreq: "monthly",
		},
		{
			url: "desarrollo-web-sevilla",
			source: "src/pages/desarrollo-web-sevilla.astro",
			priority: "0.85",
			changefreq: "monthly",
		},
		{
			url: "desarrollo-web-barcelona",
			source: "src/pages/desarrollo-web-barcelona.astro",
			priority: "0.85",
			changefreq: "monthly",
		},
		{
			url: "desarrollo-web-castellon",
			source: "src/pages/desarrollo-web-castellon.astro",
			priority: "0.85",
			changefreq: "monthly",
		},
		{
			url: "desarrollo-web-madrid",
			source: "src/pages/desarrollo-web-madrid.astro",
			priority: "0.85",
			changefreq: "monthly",
		},
		{
			url: "agencia-digital-maresme",
			source: "src/pages/agencia-digital-maresme.astro",
			priority: "0.85",
			changefreq: "monthly",
		},
		{
			url: "desarrollo-web-canarias",
			source: "src/pages/desarrollo-web-canarias.astro",
			priority: "0.85",
			changefreq: "monthly",
		},
		// Packs de webs para negocios locales (índice movido por los datos)
		{
			url: "packs",
			source: "src/pages/packs/index.astro",
			priority: "0.85",
			changefreq: "monthly",
			lastmod: packsDataLastmod,
		},
		{
			url: "legal",
			source: "src/pages/legal.astro",
			priority: "0.3",
			changefreq: "yearly",
		},
		{
			url: "terminos",
			source: "src/pages/terminos.astro",
			priority: "0.3",
			changefreq: "yearly",
		},
		{
			url: "privacy",
			source: "src/pages/privacy.astro",
			priority: "0.3",
			changefreq: "yearly",
		},
		{
			url: "cookies",
			source: "src/pages/cookies.astro",
			priority: "0.3",
			changefreq: "yearly",
		},
	].map((page) => ({
		...page,
		lastmod: page.lastmod ?? gitLastmod(page.source),
	}));

	// Combinar todas las URLs
	const allUrls = [
		...staticPages,
		...commercialRouteUrls,
		...projectUrls,
		...blogUrls,
		...packUrls,
	];

	// Generar XML
	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
	.map(
		(page) => `  <url>
    <loc>${baseUrl}/${page.url}</loc>
    ${page.lastmod ? `<lastmod>${page.lastmod}</lastmod>` : ""}
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
	)
	.join("\n")}
</urlset>`;

	return new Response(sitemap, {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
		},
	});
};
