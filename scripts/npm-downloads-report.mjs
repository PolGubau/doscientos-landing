import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DOWNLOADS_API = 'https://api.npmjs.org'
const REGISTRY_API = 'https://registry.npmjs.org'
const FIRST_AVAILABLE_DAY = '2015-01-10'
const REQUEST_INTERVAL_MS = 5_000
let nextRequestAt = 0

function dateAtUtc(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`Invalid date: ${value}`)
  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`Invalid date: ${value}`)
  }
  return date
}

function formatDate(date) {
  return date.toISOString().slice(0, 10)
}

function yesterday() {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - 1)
  return formatDate(date)
}

export function splitDateRange(from, to) {
  const end = dateAtUtc(to)
  const ranges = []
  let start = dateAtUtc(from)

  while (start <= end) {
    const next = new Date(start)
    next.setUTCMonth(next.getUTCMonth() + 18)
    next.setUTCDate(next.getUTCDate() - 1)
    const rangeEnd = next > end ? end : next
    ranges.push({ from: formatDate(start), to: formatDate(rangeEnd) })
    start = new Date(rangeEnd)
    start.setUTCDate(start.getUTCDate() + 1)
  }

  return ranges
}

export function parseArguments(args) {
  const options = {
    scopes: [],
    from: FIRST_AVAILABLE_DAY,
    to: yesterday(),
    output: 'npm-downloads-report.json',
  }

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]
    if (argument === '--help' || argument === '-h') return { help: true }
    const equalIndex = argument.indexOf('=')
    const flag = equalIndex === -1 ? argument : argument.slice(0, equalIndex)
    const value = equalIndex === -1 ? args[++index] : argument.slice(equalIndex + 1)
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`)

    if (flag === '--user') options.user = value
    else if (flag === '--scope') options.scopes.push(value.replace(/^@/, ''))
    else if (flag === '--from') options.from = value
    else if (flag === '--to') options.to = value
    else if (flag === '--output') options.output = value
    else throw new Error(`Unknown option: ${flag}`)
  }

  if (!options.user && options.scopes.length === 0) {
    throw new Error('Provide --user, at least one --scope, or both.')
  }
  if (dateAtUtc(options.from) > dateAtUtc(options.to))
    throw new Error('--from must be before or equal to --to.')
  options.scopes = [...new Set(options.scopes)]
  return options
}

async function getJson(url, fetchImpl) {
  let lastError
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let retryAfterMs = 0
    try {
      if (fetchImpl === fetch) {
        const now = Date.now()
        const waitTime = Math.max(0, nextRequestAt - now)
        nextRequestAt = Math.max(now, nextRequestAt) + REQUEST_INTERVAL_MS
        if (waitTime > 0) await new Promise((resolve) => setTimeout(resolve, waitTime))
      }
      const response = await fetchImpl(url)
      if (response.ok) return response.json()
      lastError = new Error(`Request failed (${response.status}): ${url}`)
      if (response.status !== 429 && response.status < 500) throw lastError
      const retryAfter = Number(response.headers.get('retry-after'))
      retryAfterMs = Number.isFinite(retryAfter) ? retryAfter * 1_000 : 30_000
    } catch (error) {
      lastError = error
    }
    await new Promise((resolve) =>
      setTimeout(resolve, Math.max(1_000 * 2 ** attempt, retryAfterMs)),
    )
  }
  throw lastError
}

async function findPackages(path, fetchImpl) {
  const result = await getJson(new URL(path, REGISTRY_API), fetchImpl)
  return result && typeof result === 'object' ? Object.keys(result) : []
}

async function findScopePackages(scope, fetchImpl) {
  const prefix = `@${scope}/`
  const packages = await findPackages(`/-/org/${encodeURIComponent(scope)}/package`, fetchImpl)
  return packages.filter((name) => name.startsWith(prefix))
}

async function collectPackageDownloads(name, ranges, fetchImpl) {
  const daily = new Map()
  for (const range of ranges) {
    const path = `/downloads/range/${range.from}:${range.to}/${encodeURIComponent(name)}`
    const result = await getJson(new URL(path, DOWNLOADS_API), fetchImpl)
    for (const entry of Array.isArray(result.downloads) ? result.downloads : []) {
      if (typeof entry.day !== 'string' || !Number.isFinite(entry.downloads)) continue
      daily.set(entry.day, (daily.get(entry.day) ?? 0) + entry.downloads)
    }
  }
  return daily
}

async function mapWithConcurrency(items, limit, callback) {
  const results = []
  let nextIndex = 0
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex
      nextIndex += 1
      results[index] = await callback(items[index])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

export async function collectReport(options, fetchImpl = fetch) {
  const discovered = await Promise.all([
    ...(options.user
      ? [findPackages(`/-/user/${encodeURIComponent(options.user)}/package`, fetchImpl)]
      : []),
    ...options.scopes.map((scope) => findScopePackages(scope, fetchImpl)),
  ])
  const names = [...new Set(discovered.flat())].sort((left, right) => left.localeCompare(right))
  const ranges = splitDateRange(options.from, options.to)
  const daily = new Map()
  const packages = await mapWithConcurrency(names, 2, async (name) => {
    const packageDaily = await collectPackageDownloads(name, ranges, fetchImpl)
    const downloads = [...packageDaily.values()].reduce((total, value) => total + value, 0)
    for (const [day, value] of packageDaily) daily.set(day, (daily.get(day) ?? 0) + value)
    return { name, downloads }
  })

  return {
    generatedAt: new Date().toISOString(),
    period: { from: options.from, to: options.to },
    sources: { user: options.user ?? null, scopes: options.scopes },
    totals: {
      packages: packages.length,
      downloads: packages.reduce((total, item) => total + item.downloads, 0),
    },
    packages: packages.sort(
      (left, right) => right.downloads - left.downloads || left.name.localeCompare(right.name),
    ),
    daily: [...daily]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([day, downloads]) => ({ day, downloads })),
  }
}

export const usage = `Usage: pnpm npm:downloads -- (--user <npm-user> | --scope <scope>) [options]

Options:
  --scope <scope>    Include a public npm scope; repeat for each organization.
  --from <YYYY-MM-DD>  First day to include (default: ${FIRST_AVAILABLE_DAY}).
  --to <YYYY-MM-DD>    Last day to include (default: yesterday, UTC).
  --output <file>    JSON output path (default: npm-downloads-report.json).`

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2))
    if (options.help) return console.info(usage)
    const report = await collectReport(options)
    await writeFile(resolve(options.output), `${JSON.stringify(report, null, 2)}\n`)
    console.info(
      `Report written to ${options.output}: ${report.totals.downloads} downloads across ${report.totals.packages} packages.`,
    )
  } catch (error) {
    console.error(error.message)
    console.error(usage)
    process.exitCode = 1
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
