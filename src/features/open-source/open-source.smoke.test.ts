import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const dist = join(process.cwd(), 'dist')
const npmDownloads = JSON.parse(
  readFileSync(join(process.cwd(), 'src', 'data', 'npm-downloads.json'), 'utf-8'),
)
const formattedDownloads = new Intl.NumberFormat('es-ES').format(npmDownloads.totals.downloads)

describe.skipIf(!existsSync(dist))('open-source showcase', () => {
  const pagePath = join(dist, 'open-source', 'index.html')

  it('builds the technical detail page', () => {
    expect(existsSync(pagePath), `Missing: ${pagePath}`).toBe(true)
  })

  it('links the home authority section to the technical page', () => {
    const home = readFileSync(join(dist, 'index.html'), 'utf-8')

    expect(home).toContain('No empezamos de cero donde no aporta valor.')
    expect(home).toContain('href="/open-source"')
    expect(home).toContain('descargas acumuladas de nuestras herramientas abiertas')
    expect(home).toContain(formattedDownloads)
  })

  it('includes each public foundation', () => {
    const page = readFileSync(pagePath, 'utf-8')

    for (const packageName of [
      '@doscientos/verifactu',
      '@doscientos/billing',
      '@doscientos/pwa',
      '@doscientos/ui',
      '@doscientos/configs',
    ]) {
      expect(page).toContain(packageName)
    }
    expect(page).toContain('descargas históricas de')
    expect(page).toContain('Una descarga no equivale a una persona usuaria única')
    expect(page).toContain(formattedDownloads)
  })
})
