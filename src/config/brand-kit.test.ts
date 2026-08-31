import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('loadPublishedBrandTokens', () => {
  it('reads the local snapshot without calling the backoffice', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { loadPublishedBrandTokens } = await import('./brand-kit')
    const snapshot = await loadPublishedBrandTokens()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(snapshot).toBeTypeOf('object')
  })
})
