import {
	type InferEntrySchema,
	defineCollection,
	type getCollection,
	z,
} from "astro:content";
import { glob } from "astro/loaders";

const projects = defineCollection({
	loader: glob({ base: "./src/content/projects", pattern: "**/*.{md,mdx}" }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			summary: z.string(),
			seoTitle: z.string().optional(),
			metaDescription: z.string().optional(),
			available: z.boolean(),
			client: z.string(),
			timeline: z.number().int().positive(),
			endedAt: z.string().transform((str) => new Date(str)),
			color: z.string(),
			link: z.string().optional(),
			cover: image(),
			logo: image().optional(),
			services_provided: z.array(z.string()).optional().default([]),
		}),
});

const blog = defineCollection({
	loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			publishDate: z.string().transform((str) => new Date(str)),
			updatedDate: z
				.string()
				.transform((str) => new Date(str))
				.optional(),
			coverImage: image().optional(),
			tags: z.array(z.string()).optional(),
			resourceType: z
				.enum([
					"articulo",
					"guia",
					"checklist",
					"plantilla",
					"calculadora",
					"caso",
					"newsletter",
				])
				.default("articulo"),
			buyerStage: z.enum(["awareness", "consideration", "decision"]).default("consideration"),
			leadMagnet: z
				.object({
					title: z.string(),
					description: z.string(),
					cta: z.string().default("Recibir recurso"),
					href: z.string().optional(),
				})
				.optional(),
			author: z.string().default("doscientos"),
			draft: z.boolean().default(false),
			faqs: z
				.array(
					z.object({
						question: z.string(),
						answer: z.string(),
					}),
				)
				.optional(),
		}),
});

export type Project = InferEntrySchema<"projects">;
export type ProjectMetadata = Awaited<
	ReturnType<typeof getCollection<"projects">>
>[number];

export type BlogPost = InferEntrySchema<"blog">;
export type BlogPostMetadata = typeof blog;

export const collections = { projects, blog };
