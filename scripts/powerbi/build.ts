// Writes the Power BI project (PBIP) into powerbi/:
//   BallonTD.pbip
//   BallonTD.SemanticModel/   TMDL: tables, Power Query, relationships, measures
//   BallonTD.Report/          PBIR: pages and visuals
// Open BallonTD.pbip in Power BI Desktop (File > Open), set the DataFile parameter, refresh.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { ROOT } from '../env.mjs'
import { buildTables, EXPRESSIONS, RELATIONSHIPS, MEASURES_TABLE, measures, colName, type MTable, type Measure } from './model.ts'

export const PBI = path.join(ROOT, 'powerbi')
const NAME = 'BallonTD'
const SM = path.join(PBI, `${NAME}.SemanticModel`)
const RP = path.join(PBI, `${NAME}.Report`)

/** Stable GUIDs so regenerating the project gives clean diffs. */
const guid = (s: string) => {
  const h = crypto.createHash('sha1').update(`ballon-td:${s}`).digest('hex')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${((parseInt(h.slice(16, 17), 16) & 3) | 8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`
}
const hex20 = (s: string) => crypto.createHash('sha1').update(`ballon-td:${s}`).digest('hex').slice(0, 20)
const tn = (n: string) => (/^[A-Za-z_][A-Za-z0-9_]*$/.test(n) ? n : `'${n.replace(/'/g, "''")}'`)
const write = (file: string, text: string) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text) }
const json = (o: unknown) => JSON.stringify(o, null, 2) + '\n'
const indent = (text: string, tabs: number) => text.split('\n').map((l) => '\t'.repeat(tabs) + l).join('\n')

// =====================================================================================
//  Semantic model (TMDL)
// =====================================================================================
function tableTmdl(t: MTable): string {
  const L: string[] = [`table ${tn(t.name)}`, `\tlineageTag: ${guid(`table:${t.name}`)}`, '']
  if (t.description) L.splice(0, 0, ...t.description.split('\n').map((d) => `/// ${d}`))
  for (const c of t.columns) {
    if (c.description) L.push(...c.description.split('\n').map((d) => `\t/// ${d}`))
    L.push(`\tcolumn ${tn(c.name)}`)
    L.push(`\t\tdataType: ${c.dataType}`)
    if (c.isKey) L.push('\t\tisKey')
    if (c.hidden) L.push('\t\tisHidden')
    if (c.formatString) L.push(`\t\tformatString: ${c.formatString}`)
    L.push(`\t\tlineageTag: ${guid(`col:${t.name}:${c.name}`)}`)
    L.push(`\t\tsummarizeBy: ${c.summarize ?? 'none'}`)
    L.push(`\t\tsourceColumn: ${c.source}`)
    L.push('')
    if (c.isDate) L.push('\t\tannotation UnderlyingDateTimeDataType = Date', '')
    L.push('\t\tannotation SummarizationSetBy = Automatic', '')
  }
  for (const c of t.calcColumns ?? []) {
    if (c.description) L.push(`\t/// ${c.description}`)
    L.push(`\tcolumn ${tn(c.name)} = ${c.dax}`)
    L.push(`\t\tdataType: ${c.dataType}`)
    if (c.formatString) L.push(`\t\tformatString: ${c.formatString}`)
    L.push(`\t\tlineageTag: ${guid(`col:${t.name}:${c.name}`)}`)
    L.push('\t\tsummarizeBy: none', '')
    L.push('\t\tannotation SummarizationSetBy = Automatic', '')
  }
  L.push(`\tpartition ${tn(t.name)} = m`, '\t\tmode: import', '\t\tsource =', indent(t.m, 4), '')
  L.push('\tannotation PBI_ResultType = Table', '')
  return L.join('\n')
}

function measuresTmdl(ms: Measure[]): string {
  const L: string[] = ['/// All measures, grouped in display folders.', `table ${MEASURES_TABLE}`, `\tlineageTag: ${guid('table:measures')}`, '']
  for (const m of ms) {
    if (m.description) L.push(...m.description.split('\n').map((d) => `\t/// ${d}`))
    if (m.dax.includes('\n')) L.push(`\tmeasure ${tn(m.name)} = \`\`\``, indent(m.dax, 3), '\t\t\t```')
    else L.push(`\tmeasure ${tn(m.name)} = ${m.dax}`)
    if (m.formatString) L.push(`\t\tformatString: ${m.formatString}`)
    L.push(`\t\tdisplayFolder: ${m.folder}`)
    L.push(`\t\tlineageTag: ${guid(`measure:${m.name}`)}`, '')
  }
  L.push('\tcolumn Value', '\t\tisHidden', '\t\tformatString: 0', `\t\tlineageTag: ${guid('col:measures:value')}`, '\t\tsummarizeBy: sum', '\t\tisNameInferred', '\t\tsourceColumn: [Value]', '',
    '\t\tannotation SummarizationSetBy = Automatic', '')
  L.push(`\tpartition ${MEASURES_TABLE} = calculated`, '\t\tmode: import', '\t\tsource = ```', '\t\t\t\t{0}', '\t\t\t\t```', '')
  L.push(`\tannotation PBI_Id = ${guid('pbiid:measures').replace(/-/g, '')}`, '')
  return L.join('\n')
}

function expressionsTmdl(): string {
  const L: string[] = []
  for (const x of EXPRESSIONS) {
    L.push(`/// ${x.description}`)
    if (x.kind === 'parameter') {
      L.push(`expression ${x.name} = ${x.m} meta [IsParameterQuery=true, Type="Text", IsParameterQueryRequired=true]`)
    } else {
      L.push(`expression ${x.name} = \`\`\``, indent(x.m, 2), '\t\t```')
    }
    L.push(`\tlineageTag: ${guid(`expr:${x.name}`)}`, '')
    L.push(`\tannotation PBI_ResultType = ${x.kind === 'parameter' ? 'Text' : x.kind === 'function' ? 'Function' : 'Table'}`, '')
    if (x.kind === 'table') L.push('\tannotation PBI_NavigationStepName = Navigation', '')
  }
  return L.join('\n')
}

export function buildSemanticModel() {
  const tables = buildTables()
  const ms = measures(tables)
  fs.rmSync(SM, { recursive: true, force: true })
  const def = path.join(SM, 'definition')
  write(path.join(SM, 'definition.pbism'), json({ version: '4.1', settings: {} }))
  write(path.join(SM, '.platform'), json({
    $schema: 'https://developer.microsoft.com/json-schemas/fabric/gitIntegration/platformProperties/2.0.0/schema.json',
    metadata: { type: 'SemanticModel', displayName: NAME }, config: { version: '2.0', logicalId: guid('logical:semanticmodel') },
  }))
  write(path.join(def, 'database.tmdl'), 'database\n\tcompatibilityLevel: 1567\n\n')
  const order = [...EXPRESSIONS.map((x) => x.name), ...tables.map((t) => t.name)]
  write(path.join(def, 'model.tmdl'), [
    'model Model', '\tculture: en-US', '\tdefaultPowerBIDataSourceVersion: powerBI_V3', '\tdiscourageImplicitMeasures', '\tsourceQueryCulture: en-US',
    '\tdataAccessOptions', '\t\tlegacyRedirects', '\t\treturnErrorValuesAsNull', '',
    'annotation __PBI_TimeIntelligenceEnabled = 0', '',
    `annotation PBI_QueryOrder = ${JSON.stringify(order)}`, '',
    'annotation PBI_ProTooling = ["DevMode"]', '',
    ...tables.map((t) => `ref table ${tn(t.name)}`), `ref table ${MEASURES_TABLE}`, '',
  ].join('\n'))
  write(path.join(def, 'expressions.tmdl'), expressionsTmdl())
  for (const t of tables) write(path.join(def, 'tables', `${t.name}.tmdl`), tableTmdl(t))
  write(path.join(def, 'tables', `${MEASURES_TABLE}.tmdl`), measuresTmdl(ms))
  write(path.join(def, 'relationships.tmdl'), RELATIONSHIPS.map((r) =>
    `relationship ${guid(`rel:${r.from.join('.')}->${r.to.join('.')}`)}\n\tfromColumn: ${tn(r.from[0])}.${tn(r.from[1])}\n\ttoColumn: ${tn(r.to[0])}.${tn(r.to[1])}\n`).join('\n'))
  return { tables, measures: ms }
}

// =====================================================================================
//  Report (PBIR)
// =====================================================================================
const SCHEMA = {
  report: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/report/1.2.0/schema.json',
  version: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/versionMetadata/1.0.0/schema.json',
  pages: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/pagesMetadata/1.0.0/schema.json',
  page: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/1.3.0/schema.json',
  visual: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/1.5.0/schema.json',
  pbir: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definitionProperties/2.0.0/schema.json',
}
const lit = (v: string) => ({ expr: { Literal: { Value: v } } })
const str = (s: string) => lit(`'${s.replace(/'/g, "''")}'`)

type Field = { kind: 'col' | 'measure'; table: string; name: string; label?: string }
let TABLES: MTable[] = []
const col = (table: string, src: string, label?: string): Field => ({ kind: 'col', table, name: colName(TABLES, table, src), label })
const colRaw = (table: string, name: string, label?: string): Field => ({ kind: 'col', table, name, label })
const mea = (name: string, label?: string): Field => ({ kind: 'measure', table: MEASURES_TABLE, name, label })
function fieldExpr(f: Field) {
  const inner = { Expression: { SourceRef: { Entity: f.table } }, Property: f.name }
  return f.kind === 'col' ? { Column: inner } : { Measure: inner }
}
const projection = (f: Field, active = false) => ({
  field: fieldExpr(f), queryRef: `${f.table}.${f.name}`, nativeQueryRef: f.label ?? f.name,
  ...(f.label ? { displayName: f.label } : {}), ...(active ? { active: true } : {}),
})

type Pos = { x: number; y: number; w: number; h: number }
type VisualDef = { id: string; pos: Pos; json: any }
let z = 0

function container(id: string, pos: Pos, visual: any, title?: string): VisualDef {
  z += 100
  const v = { ...visual }
  if (title) v.visualContainerObjects = { ...(v.visualContainerObjects ?? {}), title: [{ properties: { show: lit('true'), text: str(title), fontSize: lit('11D') } }] }
  return {
    id, pos,
    json: { $schema: SCHEMA.visual, name: id, position: { x: pos.x, y: pos.y, z, height: pos.h, width: pos.w, tabOrder: z }, visual: { ...v, drillFilterOtherVisuals: true } },
  }
}
const queryVisual = (type: string, roles: Record<string, Field[]>, extra: any = {}) => ({
  visualType: type,
  query: { queryState: Object.fromEntries(Object.entries(roles).map(([role, fs]) => [role, { projections: fs.map((f, i) => projection(f, role === 'Category' || role === 'Rows' ? i === 0 : false)) }])) },
  ...extra,
})

const textbox = (id: string, pos: Pos, runs: { text: string; size?: number; bold?: boolean; color?: string }[][]) => container(id, pos, {
  visualType: 'textbox',
  objects: { general: [{ properties: { paragraphs: runs.map((p) => ({ textRuns: p.map((r) => ({ value: r.text, textStyle: { fontSize: `${r.size ?? 11}pt`, ...(r.bold ? { fontWeight: 'bold' } : {}), color: r.color ?? '#141E12' } })) })) } }] },
})
const card = (id: string, pos: Pos, f: Field, title: string) => container(id, pos, queryVisual('card', { Values: [f] }, {
  objects: { labels: [{ properties: { fontSize: lit('22D') } }], categoryLabels: [{ properties: { show: lit('false') } }] },
}), title)
const table = (id: string, pos: Pos, fields: Field[], title: string) => container(id, pos, queryVisual('tableEx', { Values: fields }), title)
const bar = (id: string, pos: Pos, category: Field, y: Field[], title: string, series?: Field, type = 'clusteredBarChart') =>
  container(id, pos, queryVisual(type, { Category: [category], ...(series ? { Series: [series] } : {}), Y: y }, { objects: { labels: [{ properties: { show: lit('true') } }] } }), title)
const column = (id: string, pos: Pos, category: Field, y: Field[], title: string, series?: Field) => bar(id, pos, category, y, title, series, series ? 'columnChart' : 'clusteredColumnChart')
const line = (id: string, pos: Pos, category: Field, y: Field[], title: string) => container(id, pos, queryVisual('lineChart', { Category: [category], Y: y }), title)
const donut = (id: string, pos: Pos, category: Field, y: Field, title: string) => container(id, pos, queryVisual('donutChart', { Category: [category], Y: [y] }), title)
const matrix = (id: string, pos: Pos, rows: Field[], cols: Field[], values: Field[], title: string) => container(id, pos, queryVisual('pivotTable', { Rows: rows, Columns: cols, Values: values }), title)
const slicer = (id: string, pos: Pos, f: Field, title: string, single = false) => container(id, pos, queryVisual('slicer', { Values: [f] }, {
  objects: { data: [{ properties: { mode: str('Dropdown') } }], ...(single ? { selection: [{ properties: { singleSelect: lit('true') } }] } : {}) },
}), title)

type PageDef = { id: string; name: string; visuals: VisualDef[] }

function pages(): PageDef[] {
  z = 0
  const W = 1280, M = 24, G = 16
  const H = (t: string, sub: string) => textbox('', { x: M, y: 16, w: 900, h: 64 }, [[{ text: t, size: 20, bold: true }], [{ text: sub, size: 10, color: '#6B716A' }]])
  const kpiRow = (prefix: string, items: [Field, string][], y = 96) => {
    const w = (W - 2 * M - G * (items.length - 1)) / items.length
    return items.map(([f, t], i) => card(`${prefix}k${i}`, { x: M + i * (w + G), y, w, h: 96 }, f, t))
  }
  const named = (p: PageDef) => { p.visuals.forEach((v, i) => { if (!v.id) { v.id = hex20(`${p.id}:v${i}`); v.json.name = v.id } }); return p }
  const clientSlicer = (p: string) => slicer(`${p}sc`, { x: 952, y: 24, w: 152, h: 56 }, colRaw('Employee', 'Client'), 'Client')
  const sectionSlicer = (p: string) => slicer(`${p}ss`, { x: 1112, y: 24, w: 144, h: 56 }, col('Employee', 'section'), 'Section')

  const overview: PageDef = { id: hex20('page:overview'), name: 'Overview', visuals: [
    H('Development overview', 'Readiness, gaps and activity for everyone in the filter. Pick a client or section on the right.'),
    clientSlicer('o'), sectionSlicer('o'),
    ...kpiRow('o', [[mea('People'), 'People'], [mea('Average Role Readiness'), 'Average role readiness'], [mea('Critical Gaps'), 'Critical gaps'], [mea('Overdue Actions'), 'Overdue plan actions'], [mea('Training Completion'), 'Training completion'], [mea('Coaching Effort Hours'), 'Coaching effort (h)']]),
    bar('', { x: M, y: 208, w: 600, h: 240 }, col('Employee', 'section'), [mea('Average Role Readiness')], 'Average role readiness by section'),
    donut('', { x: 640, y: 208, w: 616, h: 240 }, colRaw('Employee', 'Readiness band'), mea('People'), 'People by readiness band'),
    bar('', { x: M, y: 464, w: 600, h: 232 }, col('Competency', 'name'), [mea('Open Gaps')], 'Most common gaps'),
    column('', { x: 640, y: 464, w: 616, h: 232 }, colRaw('CoachingSession', 'Month'), [mea('Coaching Sessions')], 'Coaching sessions per month'),
  ] }

  const people: PageDef = { id: hex20('page:people'), name: 'People', visuals: [
    H('People', 'One row per person. Sort any column; use the slicers to narrow down.'),
    clientSlicer('p'), sectionSlicer('p'),
    slicer('pb', { x: 792, y: 24, w: 152, h: 56 }, colRaw('Employee', 'Readiness band'), 'Readiness band'),
    table('', { x: M, y: 96, w: W - 2 * M, h: 600 }, [
      col('Employee', 'id'), col('Employee', 'name'), col('Employee', 'jobTitle'), col('Employee', 'section'), colRaw('Employee', 'Line manager'),
      colRaw('Employee', 'Readiness band'), mea('Role Readiness'), mea('Next Role Readiness'), mea('Critical Gaps'), mea('Open Gaps'),
      mea('Plan Progress'), mea('Overdue Actions'), mea('Trainings Completed'), mea('Certifications Achieved'), mea('Coaching Sessions'), mea('Last Coaching'),
    ], 'People'),
  ] }

  const person: PageDef = { id: hex20('page:person'), name: 'Person', visuals: [
    H('Person', 'Pick one person. Everything on this page is for that person.'),
    slicer('ps', { x: 880, y: 24, w: 376, h: 56 }, col('Employee', 'name'), 'Person', true),
    ...kpiRow('pk', [[mea('Role Readiness'), 'Role readiness'], [mea('Next Role Readiness'), 'Next role readiness'], [mea('Critical Gaps'), 'Critical gaps'], [mea('Plan Progress'), 'Plan progress'], [mea('Coaching Effort Hours'), 'Coaching effort (h)'], [mea('Observed Average'), 'Observed average (1–5)']]),
    table('', { x: M, y: 208, w: 760, h: 300 }, [col('Competency', 'name'), colRaw('Competency', 'Framework'), colRaw('CurrentCompetency', 'Priority'), colRaw('CurrentCompetency', 'Level'), colRaw('CurrentCompetency', 'Required'), colRaw('CurrentCompetency', 'Gap'), colRaw('CurrentCompetency', 'Self level'), mea('Observed Average')], 'Competencies: level against requirement'),
    table('', { x: 800, y: 208, w: 456, h: 300 }, [col('IdpAction', 'title'), col('IdpAction', 'status'), col('IdpAction', 'progressPct'), col('IdpAction', 'plannedEnd')], 'Development plan'),
    table('', { x: M, y: 524, w: 760, h: 172 }, [col('CoachingSession', 'date'), col('CoachingSession', 'type'), colRaw('CoachingSession', 'Coach'), colRaw('CoachingSession', 'Total effort (min)'), col('CoachingSession', 'progressPct'), col('CoachingSession', 'summary')], 'Coaching'),
    table('', { x: 800, y: 524, w: 456, h: 172 }, [colRaw('ManagerValidation', 'Month'), col('Competency', 'name'), col('ManagerValidation', 'validatedLevel'), col('ManagerValidation', 'status')], 'Line-manager validation'),
  ] }

  const gaps: PageDef = { id: hex20('page:gaps'), name: 'Competency gaps', visuals: [
    H('Competency gaps', 'Average gap per person and competency (required − level; positive = below requirement).'),
    clientSlicer('g'), sectionSlicer('g'),
    slicer('gf', { x: 792, y: 24, w: 152, h: 56 }, colRaw('Competency', 'Framework'), 'Framework'),
    matrix('', { x: M, y: 96, w: 860, h: 600 }, [col('Employee', 'name')], [col('Competency', 'name')], [mea('Average Gap')], 'Gap by person and competency'),
    bar('', { x: 900, y: 96, w: 356, h: 600 }, col('Competency', 'name'), [mea('Critical Gaps')], 'Critical gaps by competency'),
  ] }

  const plan: PageDef = { id: hex20('page:plan'), name: 'Development plan', visuals: [
    H('Development plan', 'IDP segments S1–S5, department training needs and workplace assignments.'),
    clientSlicer('d'), sectionSlicer('d'),
    ...kpiRow('dk', [[mea('Plan Actions'), 'Plan actions'], [mea('Plan Actions Completed'), 'Completed'], [mea('Plan Progress'), 'Average progress'], [mea('Overdue Actions'), 'Overdue']]),
    bar('', { x: M, y: 208, w: 600, h: 488 }, colRaw('IdpAction', 'Segment'), [mea('Plan Actions')], 'Actions by segment and status', col('IdpAction', 'status'), 'barChart'),
    table('', { x: 640, y: 208, w: 616, h: 488 }, [col('Employee', 'name'), col('IdpAction', 'title'), col('IdpAction', 'status'), col('IdpAction', 'progressPct'), col('IdpAction', 'plannedEnd')], 'All actions'),
  ] }

  const training: PageDef = { id: hex20('page:training'), name: 'Training & observations', visuals: [
    H('Training and observed behaviours', 'Sessions, completion and the trainer scores from observed programmes (1–5).'),
    clientSlicer('t'), sectionSlicer('t'),
    ...kpiRow('tk', [[mea('Trainings Assigned'), 'Trainings'], [mea('Training Completion'), 'Completion'], [mea('Training Hours'), 'Hours completed'], [mea('Observed Days'), 'Observed days'], [mea('Observed Average'), 'Observed average']]),
    table('', { x: M, y: 208, w: 600, h: 240 }, [colRaw('CourseSession', 'Course'), col('CourseSession', 'startDate'), colRaw('CourseSession', 'Trainer'), col('CourseSession', 'status'), mea('Participants'), mea('Observed Average')], 'Sessions'),
    bar('', { x: 640, y: 208, w: 616, h: 240 }, col('ObservationParameter', 'category'), [mea('Observed Average')], 'Observed average by behaviour category'),
    bar('', { x: M, y: 464, w: 600, h: 232 }, col('ObservationParameter', 'name'), [mea('Observed Average')], 'Observed average by behaviour'),
    line('', { x: 640, y: 464, w: 616, h: 232 }, col('ObservationDay', 'dayNumber'), [mea('Observed Average')], 'Observed average by programme day'),
  ] }

  const coaching: PageDef = { id: hex20('page:coaching'), name: 'Coaching & validation', visuals: [
    H('Coaching and validation', 'Coaching effort from the coaching table, monthly line-manager progress (1–5) and coach evidence.'),
    clientSlicer('c'), sectionSlicer('c'),
    ...kpiRow('ck', [[mea('Coaching Sessions'), 'Coaching sessions'], [mea('Coaching Effort Hours'), 'Coaching effort (h)'], [mea('Average Validated Progress'), 'Validated progress (1–5)'], [mea('Validations Pending'), 'Validations pending'], [mea('Evidence Verified'), 'Evidence verified']]),
    column('', { x: M, y: 208, w: 600, h: 240 }, colRaw('CoachingSession', 'Month'), [mea('Coaching Effort Hours')], 'Coaching effort per month (h)'),
    line('', { x: 640, y: 208, w: 616, h: 240 }, colRaw('ManagerValidation', 'Month'), [mea('Average Validated Progress')], 'Line-manager validated progress by month'),
    table('', { x: M, y: 464, w: W - 2 * M, h: 232 }, [col('Employee', 'name'), col('Evidence', 'title'), col('Evidence', 'evidenceType'), col('Evidence', 'verificationStatus'), colRaw('Evidence', 'Verified by'), col('Evidence', 'date')], 'Coach validation evidence'),
  ] }

  const entry: PageDef = { id: hex20('page:entry'), name: 'Data entry', visuals: [
    H('Data entry', 'Add records here. They are written to the Excel data workbook and appear in the report after the next refresh.'),
    textbox('', { x: M, y: 96, w: 400, h: 600 }, [
      [{ text: 'How this page works', bold: true, size: 12 }],
      [{ text: '1. Select a person in the table below the instructions, or pick one inside the app.' }],
      [{ text: '2. Choose what to record: coaching session, line-manager validation, development action, training, certification, evidence or observation scores.' }],
      [{ text: '3. Save. The row is added to the matching table in BallonTD_Data.xlsx (SharePoint/OneDrive).' }],
      [{ text: '4. The report shows it after the dataset refreshes (scheduled, or Refresh now in the service).' }],
      [{ text: '' }],
      [{ text: 'Setup (once): insert the Power Apps visual into the empty area on the right, add Employee ID and Full name as its data, then create the app from the screens in powerbi/powerapps. Full steps: powerbi/README.md.', color: '#6B716A' }],
    ]),
    textbox('', { x: 440, y: 96, w: 816, h: 600 }, [[{ text: 'Power Apps visual goes here', size: 14, bold: true, color: '#93C926' }], [{ text: 'Visualizations pane → Power Apps for Power BI → drag here → Data: Employee ID, Full name → Create new.', color: '#6B716A' }]]),
  ] }
  return [overview, people, person, gaps, plan, training, coaching, entry].map(named)
}

const THEME = {
  name: 'Ballon TD',
  dataColors: ['#93C926', '#141E12', '#F0B54A', '#D4383E', '#0973DC', '#5D770D', '#C8E68A', '#6B716A', '#E4F7C7', '#C98A12'],
  background: '#FFFFFB', foreground: '#141E12', tableAccent: '#93C926',
  good: '#5D770D', neutral: '#F0B54A', bad: '#D4383E', maximum: '#93C926', center: '#F8DFA4', minimum: '#F4B4B0', null: '#F3F3F3',
}

export function buildReport(tables: MTable[]) {
  TABLES = tables
  fs.rmSync(RP, { recursive: true, force: true })
  write(path.join(RP, 'definition.pbir'), json({ $schema: SCHEMA.pbir, version: '4.0', datasetReference: { byPath: { path: `../${NAME}.SemanticModel` } } }))
  write(path.join(RP, '.platform'), json({
    $schema: 'https://developer.microsoft.com/json-schemas/fabric/gitIntegration/platformProperties/2.0.0/schema.json',
    metadata: { type: 'Report', displayName: NAME }, config: { version: '2.0', logicalId: guid('logical:report') },
  }))
  const def = path.join(RP, 'definition')
  write(path.join(def, 'version.json'), json({ $schema: SCHEMA.version, version: '2.0.0' }))
  write(path.join(def, 'report.json'), json({
    $schema: SCHEMA.report,
    themeCollection: {
      baseTheme: { name: 'CY24SU10', reportVersionAtImport: '5.61', type: 'SharedResources' },
      customTheme: { name: 'BallonTD_Theme.json', reportVersionAtImport: '5.61', type: 'RegisteredResources' },
    },
    layoutOptimization: 'None',
    resourcePackages: [
      { name: 'RegisteredResources', type: 'RegisteredResources', items: [{ name: 'BallonTD_Theme.json', path: 'BallonTD_Theme.json', type: 'CustomTheme' }] },
      { name: 'SharedResources', type: 'SharedResources', items: [{ name: 'CY24SU10', path: 'BaseThemes/CY24SU10.json', type: 'BaseTheme' }] },
    ],
    settings: { useStylableVisualContainerHeader: true, defaultDrillFilterOtherVisuals: true, allowChangeFilterTypes: true, useEnhancedTooltips: true, useDefaultAggregateDisplayName: true },
  }))
  const ps = pages()
  write(path.join(def, 'pages', 'pages.json'), json({ $schema: SCHEMA.pages, pageOrder: ps.map((p) => p.id), activePageName: ps[0].id }))
  for (const p of ps) {
    write(path.join(def, 'pages', p.id, 'page.json'), json({ $schema: SCHEMA.page, name: p.id, displayName: p.name, displayOption: 'FitToPage', height: 720, width: 1280 }))
    for (const v of p.visuals) write(path.join(def, 'pages', p.id, 'visuals', v.id, 'visual.json'), json(v.json))
  }
  // themes: the base theme Power BI expects, plus ours
  const base = path.join(PBI, 'resources', 'CY24SU10.json')
  write(path.join(RP, 'StaticResources', 'SharedResources', 'BaseThemes', 'CY24SU10.json'), fs.readFileSync(base, 'utf8'))
  write(path.join(RP, 'StaticResources', 'RegisteredResources', 'BallonTD_Theme.json'), json(THEME))
  return ps
}

export function buildProject() {
  const { tables, measures: ms } = buildSemanticModel()
  const ps = buildReport(tables)
  write(path.join(PBI, `${NAME}.pbip`), json({ version: '1.0', artifacts: [{ report: { path: `${NAME}.Report` } }], settings: { enableAutoRecovery: true } }))
  write(path.join(PBI, '.gitignore'), '**/.pbi/localSettings.json\n**/.pbi/cache.abf\n')
  return { tables, measures: ms, pages: ps }
}

if (process.argv[1]?.endsWith('build.ts')) {
  const r = buildProject()
  console.log(`Wrote powerbi/${NAME}.pbip — ${r.tables.length} tables, ${r.measures.length} measures, ${RELATIONSHIPS.length} relationships, ${r.pages.length} pages, ${r.pages.reduce((a, p) => a + p.visuals.length, 0)} visuals`)
}
