import { rename, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const DEFAULT_ENDPOINT = 'https://app.doscientos.es/api/public/brand-kit'
const endpoint = process.env.PUBLIC_BRAND_KIT_API_URL || DEFAULT_ENDPOINT
const outputPath = resolve('src/data/brand-tokens.json')
const temporaryPath = `${outputPath}.tmp`

function toCssTokens(tokens) {
  const cssTokens = {}

  for (const token of Array.isArray(tokens) ? tokens : []) {
    if (!token || typeof token !== 'object') continue
    const { token_group, key, value } = token
    if (!/^(color|radius|spacing|shadow|typography)$/.test(token_group)) continue
    if (!/^[a-z0-9-]+$/.test(key)) continue
    if (typeof value !== 'string' || !/^[a-zA-Z0-9#().,%\-\s/]+$/.test(value)) continue
    cssTokens[`--${key}`] = value.trim()
  }

  return cssTokens
}

try {
  const response = await fetch(endpoint, { signal: AbortSignal.timeout(4_000) })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const { tokens } = await response.json()
  const snapshot = toCssTokens(tokens)
  if (Object.keys(snapshot).length === 0) throw new Error('no valid tokens returned')

  await writeFile(temporaryPath, `${JSON.stringify(snapshot, null, 2)}\n`)
  await rename(temporaryPath, outputPath)
  console.info(`Brand tokens snapshot updated (${Object.keys(snapshot).length} tokens).`)
} catch (error) {
  console.warn(
    `Could not update the brand tokens snapshot; keeping the existing file (${error.message}).`,
  )
}
