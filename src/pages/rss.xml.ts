import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const GET: APIRoute = async ({ site }) => {
  const blog = await getCollection("blog", ({ data }) => !data.draft);
  const baseUrl = (site?.toString() || "https://doscientos.es").replace(/\/$/, "");

  const sorted = blog.sort(
    (a, b) =>
      (b.data.updatedDate ?? b.data.publishDate).getTime() -
      (a.data.updatedDate ?? a.data.publishDate).getTime(),
  );

  return rss({
    title: "Recursos de doscientos | Desarrollo Web y Automatización",
    description:
      "Guías, checklists y artículos técnicos sobre desarrollo web, automatización de procesos, MVPs y transformación digital.",
    site: baseUrl,
    xmlns: {
      media: "http://search.yahoo.com/mrss/",
      atom: "http://www.w3.org/2005/Atom",
    },
    items: sorted.map((post) => ({
      title: post.data.title,
      pubDate: post.data.updatedDate ?? post.data.publishDate,
      description: post.data.description,
      link: `/recursos/${post.id}/`,
      categories: post.data.tags ?? [],
      author: `hola@doscientos.es (${post.data.author})`,
      customData: post.data.coverImage
        ? `<media:content url="${baseUrl}${post.data.coverImage}" medium="image" />`
        : `<media:content url="${baseUrl}/og-image.png" medium="image" />`,
    })),
    customData: [
      "<language>es-es</language>",
      `<atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />`,
      "<ttl>1440</ttl>",
    ].join("\n"),
  });
};
