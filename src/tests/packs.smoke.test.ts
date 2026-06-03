/**
 * Smoke tests for /packs/* static pages.
 *
 * Run AFTER `pnpm build`:
 *   pnpm test
 *
 * Validates:
 *  1. Each pack.slug has a generated HTML file (≡ HTTP 200).
 *  2. Every <script type="application/ld+json"> block in that file parses as valid JSON.
 *  3. At least one LD+JSON block declares "@type": "Service".
 *  4. The hub page (dist/packs/index.html) exists.
 *  5. The hub page contains an ItemList schema.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { packs } from "~/data/packs";

// @astrojs/vercel copies static output here; falls back to dist/ for other adapters.
const DIST = existsSync(join(process.cwd(), ".vercel/output/static"))
	? join(process.cwd(), ".vercel/output/static")
	: join(process.cwd(), "dist");

/** Extract and parse all ld+json blocks from an HTML string. */
function extractSchemas(html: string): unknown[] {
	const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
	const schemas: unknown[] = [];
	for (const match of html.matchAll(re)) {
		schemas.push(JSON.parse(match[1]));
	}
	return schemas;
}

/** Recursively collect all @type values from a schema graph. */
function collectTypes(schema: unknown): string[] {
	if (!schema || typeof schema !== "object") return [];
	const obj = schema as Record<string, unknown>;
	const types: string[] = [];
	if (typeof obj["@type"] === "string") types.push(obj["@type"]);
	if (Array.isArray(obj["@graph"])) {
		for (const node of obj["@graph"] as unknown[]) {
			types.push(...collectTypes(node));
		}
	}
	return types;
}

// ─────────────────────────────────────────────
// Hub page
// ─────────────────────────────────────────────
describe("packs hub (/packs)", () => {
	const hubPath = join(DIST, "packs", "index.html");

	it("index.html exists", () => {
		expect(existsSync(hubPath), `Missing: ${hubPath}`).toBe(true);
	});

	it("JSON-LD parses without errors", () => {
		const html = readFileSync(hubPath, "utf-8");
		expect(() => extractSchemas(html)).not.toThrow();
		expect(extractSchemas(html).length).toBeGreaterThan(0);
	});

	it("contains ItemList schema", () => {
		const html = readFileSync(hubPath, "utf-8");
		const types = extractSchemas(html).flatMap(collectTypes);
		expect(types).toContain("ItemList");
	});
});

// ─────────────────────────────────────────────
// Individual pack detail pages
// ─────────────────────────────────────────────
describe("packs detail pages", () => {
	for (const pack of packs) {
		const htmlPath = join(DIST, "packs", pack.slug, "index.html");

		it(`[${pack.slug}] HTML file exists (HTTP 200)`, () => {
			expect(existsSync(htmlPath), `Missing: ${htmlPath}`).toBe(true);
		});

		it(`[${pack.slug}] JSON-LD parses without errors`, () => {
			const html = readFileSync(htmlPath, "utf-8");
			expect(() => extractSchemas(html)).not.toThrow();
			const schemas = extractSchemas(html);
			expect(
				schemas.length,
				"Expected at least one ld+json block",
			).toBeGreaterThan(0);
		});

		it(`[${pack.slug}] JSON-LD contains Service type`, () => {
			const html = readFileSync(htmlPath, "utf-8");
			const types = extractSchemas(html).flatMap(collectTypes);
			expect(types, `No Service schema found in ${pack.slug}`).toContain(
				"Service",
			);
		});

		it(`[${pack.slug}] robots meta is index,follow`, () => {
			const html = readFileSync(htmlPath, "utf-8");
			expect(html).toMatch(/content="index,\s*follow"/i);
		});
	}
});
