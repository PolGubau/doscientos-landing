import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { collectReport, parseArguments } from './npm-downloads-report.mjs'

const scopes = ['mesalvo', 'doscientos', 'codedbypol', 'polgubau', 'wisemark']

const options = parseArguments(scopes.flatMap((scope) => ['--scope', scope]))
const report = await collectReport(options)
const outputPath = resolve('src/data/npm-downloads.json')

await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`)
console.info(
  `npm downloads snapshot updated: ${report.totals.downloads} downloads across ${report.totals.packages} packages.`,
)
