// Builds powerbi/data/BallonTD_Data.xlsx: one formatted Excel TABLE per database table
// (tbl_Employee, tbl_CoachingSession …). This workbook is the data store for the Power BI
// version: the semantic model reads it, and the Power Apps input screens add rows to it.
//
//   npm run powerbi:data                       everything in the app database
//   npm run powerbi:data -- --client Coca-Cola only that client's people (+ all reference data)
//
// Format rules (so Power Query and the Excel Online connector both read it cleanly):
//   • column headers = database column names, the first column is the key (`id`)
//   • dates are stored as ISO text (2026-10-22); Power Apps writes them the same way
//   • yes/no columns are TRUE/FALSE, numbers are numbers, empty = blank cell
import fs from 'node:fs'
import path from 'node:path'
import ExcelJS from 'exceljs'
import { ROOT } from '../env.mjs'
import { prisma, prepareDatabase } from '../../server/db.ts'
import { ENTITIES, type Entity } from '../../shared/entities.ts'

export const OUT_DIR = path.join(ROOT, 'powerbi', 'data')
export const FILE = 'BallonTD_Data.xlsx'

export type SheetSpec = { table: string; excelTable: string; columns: { name: string; type: string }[] }

/** Columns of each table as they appear in the workbook (shared with the model builder). */
export function workbookSpec(): SheetSpec[] {
  const out: SheetSpec[] = []
  for (const e of ENTITIES) {
    const cols = [{ name: 'id', type: 'text' }, ...e.fields.map((f) => ({ name: f.name, type: f.type }))]
    if (e.audit) cols.push({ name: 'createdAt', type: 'datetime' }, { name: 'createdBy', type: 'text' }, { name: 'updatedAt', type: 'datetime' }, { name: 'updatedBy', type: 'text' })
    out.push({ table: e.table, excelTable: `tbl_${e.table}`, columns: cols })
    for (const j of e.joins ?? []) out.push({ table: j.table, excelTable: `tbl_${j.table}`, columns: [{ name: j.parentKey, type: 'ref' }, { name: j.childKey, type: 'ref' }] })
  }
  return out
}

const iso = (d: unknown) => (d instanceof Date ? d.toISOString().slice(0, 10) : d)
const isoTime = (d: unknown) => (d instanceof Date ? d.toISOString().slice(0, 19).replace('T', ' ') : d)

async function rowsFor(e: Entity | null, table: string, empIds: Set<string> | null, clientIds: Set<string> | null) {
  const p: any = prisma
  const ids = empIds ? [...empIds] : null
  const byEmp = ids ? { employeeId: { in: ids } } : {}
  switch (table) {
    case 'Client': return p.client.findMany({ where: clientIds ? { id: { in: [...clientIds] } } : {}, orderBy: { id: 'asc' } })
    case 'Program': return p.program.findMany({ where: clientIds ? { clientId: { in: [...clientIds] } } : {}, orderBy: { id: 'asc' } })
    case 'Employee': return p.employee.findMany({ where: ids ? { id: { in: ids } } : {}, orderBy: { id: 'asc' } })
    case 'AssessmentRating': return p.assessmentRating.findMany({ where: ids ? { assessment: { employeeId: { in: ids } } } : {}, orderBy: { id: 'asc' } })
    case 'CourseSession': return p.courseSession.findMany({ where: clientIds ? { OR: [{ records: { some: { employeeId: { in: ids } } } }, { program: { clientId: { in: [...clientIds] } } }] } : {}, orderBy: { id: 'asc' } })
    case 'ObservationDay': return p.observationDay.findMany({ where: ids ? { trainingRecord: { employeeId: { in: ids } } } : {}, orderBy: { id: 'asc' } })
    case 'ObservationScore': return p.observationScore.findMany({ where: ids ? { observationDay: { trainingRecord: { employeeId: { in: ids } } } } : {}, orderBy: { id: 'asc' } })
    case 'CourseCompetency': return p.courseCompetency.findMany()
    case 'CertificationCompetency': return p.certificationCompetency.findMany()
    default:
      if (e?.employeeScoped) return p[e.model].findMany({ where: byEmp, orderBy: { id: 'asc' } })
      return p[e!.model].findMany({ orderBy: { id: 'asc' } })
  }
}

export async function buildWorkbook(clientFilter?: string) {
  await prepareDatabase()
  let clientIds: Set<string> | null = null, empIds: Set<string> | null = null
  if (clientFilter) {
    const clients = await prisma.client.findMany({ where: { name: { contains: clientFilter } } })
    if (!clients.length) throw new Error(`No client matches "${clientFilter}". Load it first (npm run db:coca-cola).`)
    clientIds = new Set(clients.map((c) => c.id))
    empIds = new Set((await prisma.employee.findMany({ where: { clientId: { in: [...clientIds] } }, select: { id: true } })).map((e) => e.id))
  }

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Ballon TD'
  wb.created = new Date()
  const readme = wb.addWorksheet('README', { properties: { tabColor: { argb: 'FF93C926' } } })
  const counts: [string, number][] = []
  const byTable = Object.fromEntries(ENTITIES.map((e) => [e.table, e]))

  for (const spec of workbookSpec()) {
    const e = byTable[spec.table] ?? null
    const data: any[] = await rowsFor(e, spec.table, empIds, clientIds)
    const ws = wb.addWorksheet(spec.table)
    const rows = data.map((r) => spec.columns.map((c) => {
      const v = r[c.name]
      if (v === null || v === undefined) return null
      if (c.type === 'date') return iso(v)
      if (c.type === 'datetime') return isoTime(v)
      if (c.type === 'bool') return !!v
      return v
    }))
    ws.addTable({
      name: spec.excelTable,
      ref: 'A1',
      headerRow: true,
      style: { theme: 'TableStyleLight9', showRowStripes: true },
      columns: spec.columns.map((c) => ({ name: c.name, filterButton: true })),
      // Excel needs at least one data row in a table; an empty row is ignored by Power Query (all null).
      rows: rows.length ? rows : [spec.columns.map(() => null)],
    })
    ws.views = [{ state: 'frozen', ySplit: 1 }]
    spec.columns.forEach((c, i) => {
      const col = ws.getColumn(i + 1)
      col.width = Math.min(48, Math.max(10, c.name.length + 2, ...rows.slice(0, 200).map((r) => String(r[i] ?? '').length + 2)))
      // Dates and times are kept as text so Power Apps and Power Query see the same value
      if (c.type === 'date' || c.type === 'datetime' || c.type === 'text' || c.type === 'ref' || c.type === 'lookup') col.numFmt = '@'
    })
    counts.push([spec.excelTable, data.length])
  }

  readme.getColumn(1).width = 30; readme.getColumn(2).width = 12; readme.getColumn(3).width = 90
  const add = (a: unknown, b: unknown = '', c: unknown = '', bold = false) => { const r = readme.addRow([a, b, c]); r.font = { bold }; r.alignment = { wrapText: true, vertical: 'top' } }
  add('Ballon TD — data workbook for Power BI and Power Apps', '', '', true)
  add('Built', '', new Date().toISOString().slice(0, 16).replace('T', ' ') + (clientFilter ? ` · client filter "${clientFilter}"` : ' · all clients'))
  add("")
  add('Rules', '', '', true)
  add('One Excel table per sheet', '', 'Each sheet holds one formatted Excel table named tbl_<Sheet>. Power BI reads the tables, Power Apps adds rows to them. Do not rename tables or columns.')
  add('Keys', '', 'The first column (id) is the key, e.g. EMP-0001. Columns ending in Id point to the id of another table.')
  add('Dates', '', 'Stored as text in ISO format (2026-10-22) so every tool reads them the same way.')
  add('Power Apps column', '', 'When Power Apps connects it may add a column __PowerAppsId__ to a table. That is expected; Power BI ignores it.')
  add('Editing', '', 'Do not edit this file in Excel while the Power Apps screens are in use: the Excel connector does not support simultaneous edits.')
  add("")
  add('Table', 'Rows', '', true)
  for (const [t, n] of counts) add(t, n)

  fs.mkdirSync(OUT_DIR, { recursive: true })
  const file = path.join(OUT_DIR, FILE)
  await wb.xlsx.writeFile(file)
  return { file, counts }
}

if (process.argv[1]?.endsWith('workbook.ts')) {
  const i = process.argv.indexOf('--client')
  const { file, counts } = await buildWorkbook(i > 0 ? process.argv[i + 1] : undefined)
  console.log(`Wrote ${path.relative(ROOT, file)} (${counts.length} tables, ${counts.reduce((a, [, n]) => a + n, 0).toLocaleString('en')} rows)`)
  await prisma.$disconnect()
}
