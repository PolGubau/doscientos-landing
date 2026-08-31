import { getCollection } from 'astro:content'

export const blogs = (await getCollection('blog')).sort(
  (a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf(),
)
export type BlogMetadata = (typeof blogs)[number]

export const getBlogs = (limit = Number.MAX_SAFE_INTEGER): BlogMetadata[] => {
  const limitedBlogs = blogs.slice(0, limit)

  return limitedBlogs
}

export const getProjects = async (limit = Number.MAX_SAFE_INTEGER) =>
  (await getCollection('projects'))
    .filter((project) => project.data.available === true)
    .sort((a, b) => b.data.endedAt.valueOf() - a.data.endedAt.valueOf())
    .slice(0, limit)
