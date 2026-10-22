// The manager's roadmap report: one workbook for a department, section, line manager's team or client.
//   Summary     where the group stands, stage by stage
//   People      one row per person, the ten stages as coloured cells (the horizontal roadmap)
//   Still_open  everything still to do, overdue first, with due dates
//   Done        everything already achieved, with dates
import ExcelJS from 'exceljs'
import { loadData, summarize } from './metrics.ts'
import { buildRoadmap, groupKey, rollup, STAGES, type GroupBy, type Roadmap, type StageStatus } from './roadmap.ts'

const NAVY = 'FF1E3B6B', ROYAL = 'FF1859A9', PALE = 'FFDCE7F5', STEEL = 'FF4D5156'
const FILL: Record<StageStatus, string> = { done: 'FF1859A9', active: 'FFDCE7F5', risk: 'FFF7E1E2', todo: 'FFF1F2F4' }
const INK: Record<StageStatus, string> = { done: 'FFFFFFFF', active: 'FF1E3B6B', risk: 'FFA9343A', todo: 'FF6B7076' }
const WORD: Record<StageStatus, string> = { done: 'Done', active: 'In progress', risk: 'At risk', todo: 'Not started' }
export const GROUP_LABEL: Record<GroupBy, string> = { department: 'Department', section: 'Section', manager: 'Line manager team', client: 'Client' }

/** Roadmaps for everyone in scope, optionally only one group. */
export async function teamRoadmaps(opts: { clientId?: string; groupBy: GroupBy; key?: string }, today = new Date()) {
  const d = await loadData({ clientId: opts.clientId })
  const people = d.employees.filter((e) => !['Out of Scope', 'Left Company'].includes(e.status ?? '') && (opts.key == null || groupKey(e, opts.groupBy) === opts.key))
  return { d, maps: people.map((e) => buildRoadmap(d, e, summarize(d, e, today), today)), people }
}

function head(ws: ExcelJS.Worksheet, row = 1) {
  const r = ws.getRow(row)
  r.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }
  r.alignment = { vertical: 'middle', wrapText: true }
  r.height = 30
  ws.views = [{ state: 'frozen', ySplit: row }]
  ws.autoFilter = { from: { row, column: 1 }, to: { row, column: ws.getRow(row).cellCount } }
}

export async function buildRoadmapReport(opts: { clientId?: string; groupBy: GroupBy; key?: string; exportedBy?: string | null }) {
  const today = new Date()
  const { d, maps } = await teamRoadmaps(opts, today)
  const r = rollup(maps, today)
  const title = opts.key ? `${GROUP_LABEL[opts.groupBy]}: ${opts.key}` : opts.clientId ? d.employees[0]?.client.name ?? 'Client' : 'Everyone'
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Ballon TD'
  wb.created = today

  // ---------------------------------------------------------------- Summary
  const sum = wb.addWorksheet('Summary', { properties: { tabColor: { argb: ROYAL } } })
  sum.getColumn(1).width = 30; for (let c = 2; c <= 8; c++) sum.getColumn(c).width = 14
  const line = (vals: unknown[], o: { bold?: boolean; size?: number; color?: string } = {}) => { const x = sum.addRow(vals); x.font = { bold: o.bold, size: o.size, color: { argb: o.color ?? NAVY } }; return x }
  line(['Development roadmap'], { bold: true, size: 16 })
  line([title], { bold: true, size: 13 })
  line([`Exported ${today.toISOString().slice(0, 16).replace('T', ' ')}${opts.exportedBy ? ` by ${opts.exportedBy}` : ''}`], { color: STEEL })
  line([])
  line(['People', r.people]); line(['Journey complete (average)', r.progress]).getCell(2).numFmt = '0%'
  line(['Ready for the next role', r.finished]); line(['With a stage at risk', r.atRisk])
  line([])
  const h = line(['Stage', 'Done', 'In progress', 'At risk', 'Not started', 'Currently here', 'Progress'], { bold: true, color: 'FFFFFFFF' })
  h.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }
  for (const s of r.stages) {
    const x = line([s.label, s.done, s.active, s.risk, s.todo, s.here, s.progress], { color: STEEL })
    x.getCell(7).numFmt = '0%'
    x.getCell(1).font = { bold: true, color: { argb: NAVY } }
  }
  line([])
  line(['Stages follow the programme: enrolment → baseline survey → assessment & report → development plan → training & labs → observed programme → certifications → coaching → manager validation → role readiness. "At risk" means a High risk rule fires for that stage.'], { color: STEEL })
  sum.lastRow!.getCell(1).alignment = { wrapText: true }; sum.mergeCells(sum.rowCount, 1, sum.rowCount, 7); sum.lastRow!.height = 48

  // ---------------------------------------------------------------- People (the horizontal roadmap)
  const ppl = wb.addWorksheet('People', { properties: { tabColor: { argb: ROYAL } } })
  ppl.addRow(['Employee_ID', 'Name', 'Job title', 'Department', 'Section', 'Line manager', 'Goal', 'Journey', 'Current stage', ...STAGES.map((s) => s.label), 'Next step', 'Next date'])
  for (const m of maps) {
    const cur = m.stages.find((s) => s.key === m.currentStage)
    const row = ppl.addRow([m.employeeId, m.name, m.jobTitle, m.department, m.section, m.lineManager, m.goal, m.progress, cur?.label ?? 'Complete',
      ...m.stages.map((s) => `${WORD[s.status]}${s.progress != null && s.status !== 'done' && s.status !== 'todo' ? ` ${Math.round(s.progress * 100)}%` : ''}`),
      m.next[0]?.text ?? null, m.next[0]?.date ?? null])
    row.getCell(8).numFmt = '0%'
    row.getCell(10 + STAGES.length + 1).numFmt = 'yyyy-mm-dd'
    m.stages.forEach((s, i) => {
      const c = row.getCell(10 + i)
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FILL[s.status] } }
      c.font = { color: { argb: INK[s.status] }, bold: s.status !== 'todo' }
      c.alignment = { horizontal: 'center' }
      c.note = [s.headline, ...s.open.slice(0, 4).map((x) => `• ${x.text}`)].join('\n')
    })
  }
  head(ppl)
  ;[12, 22, 26, 22, 22, 18, 34, 9, 18, ...STAGES.map(() => 13), 44, 12].forEach((w, i) => (ppl.getColumn(i + 1).width = w))

  // ---------------------------------------------------------------- Still open / Done
  const items = (name: string, pick: (m: Roadmap) => { stage: string; text: string; date: Date | null; overdue?: boolean; due?: boolean }[], open: boolean) => {
    const ws = wb.addWorksheet(name, { properties: { tabColor: { argb: open ? 'FFEE7623' : ROYAL } } })
    ws.addRow(['Employee_ID', 'Name', 'Department', 'Stage', open ? 'Still to do' : 'Done', 'Date', ...(open ? ['Overdue'] : [])])
    const rows = maps.flatMap((m) => pick(m).map((x) => ({ m, x })))
    if (open) rows.sort((a, b) => (b.x.overdue ? 1 : 0) - (a.x.overdue ? 1 : 0) || (a.x.date?.getTime() ?? 9e15) - (b.x.date?.getTime() ?? 9e15))
    for (const { m, x } of rows) {
      const row = ws.addRow([m.employeeId, m.name, m.department, x.stage, x.text, x.date, ...(open ? [x.overdue ? 'Yes' : null] : [])])
      row.getCell(6).numFmt = 'yyyy-mm-dd'
      if (open && x.overdue) row.getCell(7).font = { bold: true, color: { argb: 'FFA9343A' } }
    }
    head(ws)
    ;[12, 22, 24, 22, 70, 12, 10].forEach((w, i) => (ws.getColumn(i + 1).width = w))
    ws.getColumn(5).alignment = { wrapText: true, vertical: 'top' }
  }
  items('Still_open', (m) => m.stages.flatMap((s) => s.open.map((x) => ({ ...x, stage: s.label }))), true)
  items('Done', (m) => m.stages.flatMap((s) => s.done.map((x) => ({ ...x, stage: s.label }))), false)

  const safe = (opts.key ?? title).replace(/[^\w-]+/g, '_').slice(0, 40)
  return { wb, name: `roadmap_${safe}_${today.toISOString().slice(0, 10)}.xlsx` }
}
