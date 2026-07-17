import { readFileSync } from "node:fs";

const checks = [];

function read(path) {
	return readFileSync(path, "utf8");
}

function assert(condition, message) {
	checks.push({ ok: Boolean(condition), message });
}

const schemaOrg = read("src/components/seo/SchemaOrg.astro");
assert(
	!schemaOrg.includes("aggregateRating"),
	"SchemaOrg must not emit aggregateRating without eligible review data.",
);
assert(
	!schemaOrg.includes("reviewRating"),
	"SchemaOrg must not emit reviewRating without eligible review data.",
);
assert(
	!schemaOrg.includes('"@type": "Review"'),
	"SchemaOrg must not emit Review snippets for generic testimonials.",
);

const commercialRoutes = read("src/data/commercialRoutes.ts");
for (const href of [
	"/diagnostico-procesos",
	"/automatizacion-procesos",
	"/automatizar-excel",
	"/crm-renovaciones",
]) {
	assert(
		commercialRoutes.includes(href),
		`commercialRoutes.ts must include ${href}.`,
	);
}

const sitemap = read("src/pages/sitemap.xml.ts");
assert(
	sitemap.includes("commercialRoutes"),
	"sitemap.xml.ts must use the shared commercial route registry.",
);
assert(
	sitemap.includes('route.href !== "/diagnostico-procesos"'),
	"sitemap.xml.ts must avoid duplicating the diagnostic route.",
);

const blogTemplate = read("src/pages/blog/[...slug].astro");
assert(
	!blogTemplate.includes("as any"),
	"Blog template must not cast CTA variants with as any.",
);
assert(
	blogTemplate.includes("commercialBlogLinks"),
	"Blog template must use shared commercial internal links.",
);

const failed = checks.filter((check) => !check.ok);

if (failed.length > 0) {
	console.error("SEO check failed:");
	for (const check of failed) {
		console.error(`- ${check.message}`);
	}
	process.exit(1);
}

console.log(`SEO check passed (${checks.length} checks).`);
