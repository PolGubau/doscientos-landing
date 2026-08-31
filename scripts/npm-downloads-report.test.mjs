import { describe, expect, it } from 'vitest'

import { collectReport, parseArguments, splitDateRange } from './npm-downloads-report.mjs'

describe('npm downloads report', () => {
  it('splits long periods into npm-compatible 18-month ranges', () => {
    expect(splitDateRange('2015-01-10', '2018-01-10')).toEqual([
      { from: '2015-01-10', to: '2016-07-09' },
      { from: '2016-07-10', to: '2018-01-09' },
      { from: '2018-01-10', to: '2018-01-10' },
    ])
  })

  it('requires a user or organization scope', () => {
    expect(() => parseArguments([])).toThrow('Provide --user')
  })

  it('deduplicates packages and aggregates their downloads', async () => {
    const fetchImpl = async (input) => {
      const url = new URL(input)
      if (url.pathname === '/-/user/ada/package')
        return { ok: true, json: async () => ({ alpha: 'write', '@team/beta': 'write' }) }
      if (url.pathname === '/-/org/team/package')
        return { ok: true, json: async () => ({ unrelated: 'read', '@team/beta': 'write' }) }
      const downloads = decodeURIComponent(url.pathname).endsWith('alpha') ? 2 : 3
      return { ok: true, json: async () => ({ downloads: [{ day: '2015-01-10', downloads }] }) }
    }
    const report = await collectReport(
      { user: 'ada', scopes: ['team'], from: '2015-01-10', to: '2015-01-10' },
      fetchImpl,
    )

    expect(report.totals).toEqual({ packages: 2, downloads: 5 })
    expect(report.packages).toEqual([
      { name: '@team/beta', downloads: 3 },
      { name: 'alpha', downloads: 2 },
    ])
    expect(report.daily).toEqual([{ day: '2015-01-10', downloads: 5 }])
  })
})
