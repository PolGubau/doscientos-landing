import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ site }) => {
	const blog = await getCollection("blog", ({ data }) => !data.draft);

	return rss({
		title: "Blog de doscientos | Desarrollo Web y Automatización",
		description:
			"Artículos técnicos sobre desarrollo web, automatización de procesos, MVPs y transformación digital.",
		site: site?.toString() || "https://doscientos.es",
		items: blog.map((post) => ({
			title: post.data.title,
			pubDate: post.data.publishDate,
			description: post.data.description,
			link: `/blog/${post.id}/`,
		})),
		customData: "<language>es-es</language>",
	});
};
