// Checks the generated Power BI project without Power BI Desktop:
//   1. every Power Query (M) expression parses (Microsoft's own parser, @microsoft/powerquery-parser)
//   2. every DAX reference to a table, column or measure exists; no name clashes
//   3. every field used by a report visual exists in the model
//   4. every report JSON file validates against Microsoft's published PBIR JSON schemas
//      (set SCHEMAS_DIR to a clone of https://github.com/microsoft/json-schemas to enable)
// The TMDL itself is parsed with Microsoft's Tabular Object Model in our CI-less check
// (see powerbi/README.md, "Validation").
import fs from 'node:fs'
import path from 'node:path'
import * as PQ from '@microsoft/powerquery-parser'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { buildTables, EXPRESSIONS, RELATIONSHIPS, MEASURES_TABLE, measures } from './model.ts'
import { PBI } from './build.ts'
import YAML from 'yaml'
import { workbookSpec } from './workbook.ts'
import { PA_DIR } from './powerapps.ts'

const errors: string[] = []
const ok = (label: string, n: number) => console.log(`  ✓ ${label} (${n})`)

const tables = buildTables()
const ms = measures(tables)

// 1. M ---------------------------------------------------------------------------------
let mCount = 0
for (const x of [...EXPRESSIONS.map((e) => ({ name: e.name, m: e.m })), ...tables.map((t) => ({ name: t.name, m: t.m }))]) {
  const r = await PQ.TaskUtils.tryLexParse(PQ.DefaultSettings, x.m)
  if (!PQ.TaskUtils.isParseStageOk(r)) errors.push(`M parse error in ${x.name}: ${(r as any).error?.message ?? 'unknown'}`)
  mCount++
}
// every query referenced by name must exist
const queryNames = new Set([...EXPRESSIONS.map((e) => e.name), ...tables.map((t) => t.name)])
for (const x of [...EXPRESSIONS, ...tables]) for (const ref of ['CurrentLevels', 'Workbook', 'Raw', 'ToText', 'ToNumber', 'ToInt', 'ToBool', 'ToDate', 'ToDateTime', 'DataFile']) if (x.m.includes(ref) && !queryNames.has(ref)) errors.push(`${x.name} uses missing query ${ref}`)
ok('Power Query expressions parse', mCount)

// 2. DAX references ------------------------------------------------------------------------
const cols = new Map<string, Set<string>>()
for (const t of tables) cols.set(t.name, new Set([...t.columns.map((c) => c.name), ...(t.calcColumns ?? []).map((c) => c.name)]))
cols.set(MEASURES_TABLE, new Set(['Value']))
const measureNames = new Set(ms.map((m) => m.name))
const lc = (s: string) => s.toLowerCase()
const daxSources = [...ms.map((m) => ({ where: `measure ${m.name}`, dax: m.dax })), ...tables.flatMap((t) => (t.calcColumns ?? []).map((c) => ({ where: `column ${t.name}[${c.name}]`, dax: c.dax })))]
let refCount = 0
for (const { where, dax } of daxSources) {
  if ((dax.match(/\(/g) ?? []).length !== (dax.match(/\)/g) ?? []).length) errors.push(`${where}: unbalanced parentheses`)
  for (const m of dax.matchAll(/'((?:[^']|'')+)'\[((?:[^\]]|\]\])+)\]/g)) {
    refCount++
    const [t, c] = [m[1].replace(/''/g, "'"), m[2].replace(/]]/g, ']')]
    if (!cols.has(t)) errors.push(`${where}: unknown table '${t}'`)
    else if (!cols.get(t)!.has(c)) errors.push(`${where}: unknown column '${t}'[${c}]`)
  }
  const noCols = dax.replace(/'(?:[^']|'')+'\[(?:[^\]]|\]\])+\]/g, ' ').replace(/"[^"]*"/g, ' ')
  for (const m of noCols.matchAll(/'((?:[^']|'')+)'/g)) { if (!cols.has(m[1].replace(/''/g, "'"))) errors.push(`${where}: unknown table '${m[1]}'`); refCount++ }
  const stripped = dax.replace(/'(?:[^']|'')+'\[(?:[^\]]|\]\])+\]/g, '').replace(/"[^"]*"/g, '')
  for (const m of stripped.matchAll(/\[((?:[^\]]|\]\])+)\]/g)) { refCount++; if (!measureNames.has(m[1])) errors.push(`${where}: unknown measure [${m[1]}]`) }
}
const allCols = [...cols.entries()].flatMap(([t, cs]) => [...cs].map((c) => ({ t, c })))
for (const m of ms) { const clash = allCols.find((x) => lc(x.c) === lc(m.name)); if (clash) errors.push(`measure [${m.name}] has the same name as column ${clash.t}[${clash.c}]`) }
if (new Set(ms.map((m) => lc(m.name))).size !== ms.length) errors.push('duplicate measure names')
for (const r of RELATIONSHIPS) for (const [t, c] of [r.from, r.to]) if (!cols.get(t)?.has(c)) errors.push(`relationship uses unknown column ${t}.${c}`)
ok('DAX references resolve', refCount)

// 3 + 4. report ----------------------------------------------------------------------------
const reportDir = path.join(PBI, 'BallonTD.Report')
const files: string[] = []
const walk = (d: string) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p); else if (f.name.endsWith('.json') || f.name.endsWith('.pbir')) files.push(p) } }
walk(reportDir)
let fieldCount = 0
for (const f of files.filter((x) => x.endsWith('visual.json'))) {
  const text = fs.readFileSync(f, 'utf8')
  for (const m of text.matchAll(/"(Column|Measure)":\s*\{\s*"Expression":\s*\{\s*"SourceRef":\s*\{\s*"Entity":\s*"([^"]+)"\s*\}\s*\},\s*"Property":\s*"([^"]+)"/g)) {
    fieldCount++
    const [, kind, t, p] = m
    if (kind === 'Measure' ? !(t === MEASURES_TABLE && measureNames.has(p)) : !cols.get(t)?.has(p)) errors.push(`${path.relative(PBI, f)}: unknown ${kind.toLowerCase()} ${t}.${p}`)
  }
}
ok('report fields exist in the model', fieldCount)

const schemasDir = process.env.SCHEMAS_DIR
if (schemasDir && fs.existsSync(schemasDir)) {
  const ajv = new Ajv({ strict: false, allErrors: true, validateSchema: false })
  addFormats(ajv)
  const root = path.join(schemasDir, 'fabric', 'item', 'report')
  const all: string[] = []
  const walkS = (d: string) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walkS(p); else if (f.name.endsWith('.json')) all.push(p) } }
  walkS(root)
  for (const s of all) { const j = JSON.parse(fs.readFileSync(s, 'utf8')); if (j.$id) try { ajv.addSchema(j) } catch { /* duplicate */ } }
  let n = 0
  for (const f of files) {
    const doc = JSON.parse(fs.readFileSync(f, 'utf8'))
    if (!doc.$schema) continue
    const validate = ajv.getSchema(doc.$schema)
    if (!validate) { errors.push(`${path.relative(PBI, f)}: schema not found ${doc.$schema}`); continue }
    if (!validate(doc)) errors.push(`${path.relative(PBI, f)}: ${ajv.errorsText(validate.errors, { separator: '; ' })}`)
    n++
  }
  ok('report files match Microsoft\'s PBIR JSON schemas', n)
} else {
  console.log('  – PBIR schema check skipped (set SCHEMAS_DIR to a clone of github.com/microsoft/json-schemas)')
}

// 5. Power Apps screens -------------------------------------------------------------------
const tablesInBook = new Set(workbookSpec().map((t) => t.excelTable))
const colsInBook = new Map(workbookSpec().map((t) => [t.excelTable, new Set(t.columns.map((c) => c.name))]))
let paRefs = 0
for (const f of fs.readdirSync(PA_DIR).filter((x) => /^\d\d-.*\.yaml$/.test(x))) {
  const doc = YAML.parse(fs.readFileSync(path.join(PA_DIR, f), 'utf8'))
  const names = new Set<string>(['scrMenu', 'scrCoaching', 'scrValidation', 'scrEvidence', 'scrPlan', 'scrTraining', 'scrCertification', 'scrObs'])
  const formulas: { where: string; text: string }[] = []
  const walk = (list: any[]) => { for (const item of list) { const [n, c] = Object.entries(item)[0] as [string, any]; names.add(n); for (const [k, v] of Object.entries(c.Properties ?? {})) formulas.push({ where: `${f} ${n}.${k}`, text: String(v) }); if (c.Children) walk(c.Children) } }
  walk(doc)
  for (const { where, text } of formulas) {
    const code = text.replace(/"(?:[^"]|"")*"/g, '""')
    for (const m of code.matchAll(/\b(?:cb|txt|dp|dd|tgl|gal|btn|lbl|con|scr)[A-Z]\w*/g)) { paRefs++; if (!names.has(m[0])) errors.push(`${where}: unknown control ${m[0]}`) }
    for (const m of code.matchAll(/\btbl_\w+/g)) { paRefs++; if (!tablesInBook.has(m[0])) errors.push(`${where}: unknown data source ${m[0]}`) }
    // Patch record fields must be workbook columns of the target table
    for (const pm of text.matchAll(/Patch\((tbl_\w+), Defaults\(\1\), \{([\s\S]*?)\n?\s*\}\)/g)) {
      for (const fm of pm[2].matchAll(/(?:^|,)\s*(\w+):/g)) { paRefs++; if (!colsInBook.get(pm[1])?.has(fm[1])) errors.push(`${where}: ${pm[1]} has no column ${fm[1]}`) }
    }
    if ((code.match(/\(/g) ?? []).length !== (code.match(/\)/g) ?? []).length) errors.push(`${where}: unbalanced parentheses`)
    if ((code.match(/\{/g) ?? []).length !== (code.match(/\}/g) ?? []).length) errors.push(`${where}: unbalanced braces`)
  }
}
ok('Power Apps controls, data sources and Patch columns resolve', paRefs)

if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n - ${errors.slice(0, 50).join('\n - ')}`)
  process.exit(1)
}
console.log('\nAll checks passed.')
