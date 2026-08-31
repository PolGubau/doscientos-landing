import { describe, expect, it } from 'vitest'

import {
  getResourceCategories,
  getResourceCategory,
  resourceCategories,
} from './resourceCategories'

describe('resource categories', () => {
  it('keeps a small taxonomy with URL-safe slugs', () => {
    expect(resourceCategories).toHaveLength(7)
    expect(resourceCategories.every(({ slug }) => /^[a-z0-9-]+$/.test(slug))).toBe(true)
  })

  it('groups spelling variants under the same category', () => {
    const slugs = getResourceCategories(['automatización', 'software de gestion']).map(
      ({ slug }) => slug,
    )

    expect(slugs).toEqual(['automatizacion', 'gestion-empresarial'])
  })

  it('ignores specific tags outside the curated taxonomy', () => {
    expect(getResourceCategories(['barcelona', 'precios'])).toEqual([])
    expect(getResourceCategory('digitalizacion')?.label).toBe('Digitalización')
  })
})
