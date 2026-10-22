// Builds the Excel workbook.
//
//   README            what is in the file and how it is built
//   Employee_Summary  one row per person, everything calculated (the "manager view")
//   Activity_Log      one row per data point, every type of interaction in one sheet
//   Risk_Flags        every risk / opportunity rule that fires, per person and per group (team, section, skill)
//   Observation_Profile  one row per person per observed behaviour: average, finding, action cue
//   Roadmap           one row per person per journey stage: status, progress, what is done, what is still open
//   Data_Dictionary   every sheet and column: meaning, type, links, list
//   <Table> sheets    one per database table, column names = database columns, IDs intact
//                     (this is what gets imported when the real database is built)
import ExcelJS from 'exceljs'
import { prisma, delegate } from '../db.ts'
import { ENTITIES, ENTITY, type Entity, type Field } from '../../shared/entities.ts'
import { LOOKUP_BY_KEY } from '../../shared/lookups.ts'
import { loadData, summarize, groupRisks, type Scope } from './metrics.ts'
import { SEVERITY_ORDER, baselineScore } from './risks.ts'
import { buildRoadmap } from './roadmap.ts'

// Palette: navy (headers), royal blue (accent), pale blue (header fill), steel gray (secondary text)
const INK = 'FF1E3B6B', LIME = 'FFDCE7F5', ACCENT = 'FF1859A9', MUTED = 'FF4D5156', SOFT = 'FFF3F5F8'
const TYPE_LABEL: Record<string, string> = {
  text: 'Text', longtext: 'Long text', email: 'Email', url: 'Link', int: 'Whole number', number: 'Number', percent: 'Percent (0–100)',
  level: 'Level (0–5)', date: 'Date', bool: 'Yes/No', lookup: 'List value', multilookup: 'List values ("; "-separated)', ref: 'ID (link)', suggest: 'Text (list values suggested)',
}

function styleHeader(ws: ExcelJS.Worksheet, dark = false) {
  const row = ws.getRow(1)
  row.font = { bold: true, color: { argb: dark ? 'FFFFFFFF' : INK } }
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: dark ? INK : LIME } }
  row.alignment = { vertical: 'middle' }
  row.height = 20
  ws.views = [{ state: 'frozen', ySplit: 1, xSplit: 0 }]
  if (ws.columnCount) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } }
}

function widths(ws: ExcelJS.Worksheet, max = 48) {
  ws.columns.forEach((col) => {
    let w = 8
    col.eachCell?.({ includeEmpty: false }, (c) => {
      const v = c.value instanceof Date ? '2026-10-21' : c.value == null ? '' : String(typeof c.value === 'object' && 'text' in (c.value as any) ? (c.value as any).text : c.value)
      w = Math.max(w, Math.min(max, v.length + 2))
    })
    col.width = w
  })
}

const DATE_FMT = 'yyyy-mm-dd'
const PCT_FMT = '0%'
const pctOf = (v: number | null | undefined) => (v == null ? null : v / 100)

function fieldNote(e: Entity, f: Field) {
  const bits = [f.label, TYPE_LABEL[f.type]]
  if (f.ref) bits.push(`→ ${ENTITY[f.ref].table}.id`)
  if (f.list) bits.push(`List: ${LOOKUP_BY_KEY[f.list]?.label ?? f.list} (LookupValue.list = "${f.list}")`)
  if (f.required) bits.push('Required')
  if (f.help) bits.push(f.help)
  return bits.join('\n')
}

/** Columns of a table sheet: id, the entity fields, then audit columns. */
function tableColumns(e: Entity) {
  const cols: { key: string; field?: Field }[] = [{ key: 'id' }]
  for (const f of e.fields) cols.push({ key: f.name, field: f })
  if (e.audit) for (const k of ['createdAt', 'createdBy', 'updatedAt', 'updatedBy']) cols.push({ key: k })
  return cols
}

export async function buildWorkbook(scope: Scope & { includeLog?: boolean; exportedBy?: string | null }) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Ballon TD'
  wb.created = new Date()
  const d = await loadData(scope)
  const empIds = new Set(d.employees.map((e) => e.id))
  const client = scope.clientId ? await prisma.client.findUnique({ where: { id: scope.clientId } }) : null
  const scopeText = scope.employeeId ? `One person: ${d.employees[0]?.name ?? scope.employeeId} (${scope.employeeId})`
    : client ? `Client: ${client.name} (${client.id})` : 'Everything (all clients)'

  // ------------------------------------------------------------------ README (filled at the end)
  const readme = wb.addWorksheet('README', { properties: { tabColor: { argb: ACCENT } } })
  const summaryWs = wb.addWorksheet('Employee_Summary', { properties: { tabColor: { argb: ACCENT } } })
  const logWs = wb.addWorksheet('Activity_Log', { properties: { tabColor: { argb: ACCENT } } })
  const riskWs = wb.addWorksheet('Risk_Flags', { properties: { tabColor: { argb: ACCENT } } })
  const profileWs = wb.addWorksheet('Observation_Profile', { properties: { tabColor: { argb: ACCENT } } })
  const roadWs = wb.addWorksheet('Roadmap', { properties: { tabColor: { argb: ACCENT } } })
  const dictWs = wb.addWorksheet('Data_Dictionary', { properties: { tabColor: { argb: INK } } })

  // ------------------------------------------------------------------ Employee_Summary
  const today = new Date()
  const sums = d.employees.map((e) => ({ e, s: summarize(d, e, today) }))
  const S: [string, (x: (typeof sums)[number]) => unknown, string?][] = [
    ['Employee_ID', (x) => x.e.id], ['Employee_Name', (x) => x.e.name], ['Email', (x) => x.e.email], ['Client', (x) => x.e.client.name],
    ['Job_Title', (x) => x.e.jobTitle], ['Role_Profile', (x) => x.e.jobRole?.name], ['Department', (x) => x.e.department], ['Section', (x) => x.e.section],
    ['Line_Manager', (x) => x.e.lineManager?.name ?? x.e.lineManagerName], ['Status', (x) => x.e.status],
    ['Programme', (x) => x.s.program], ['Batch', (x) => x.s.batch], ['Enrolment_Status', (x) => x.s.enrollmentStatus], ['Coach', (x) => x.s.coach], ['Consultant', (x) => x.s.consultant],
    ['Self_Assessment', (x) => x.s.selfAssessment], ['Validation_Interview', (x) => x.s.validationInterview], ['Report', (x) => x.s.report], ['Manager_Validation', (x) => x.s.managerValidation],
    ['Competencies_Rated', (x) => x.s.competenciesRated], ['Open_Gaps', (x) => x.s.gaps], ['Critical_Gaps', (x) => x.s.criticalGaps],
    ['Role_Readiness', (x) => x.s.roleReadiness, PCT_FMT], ['Next_Role', (x) => x.s.nextRole], ['Next_Role_Readiness', (x) => x.s.nextRoleReadiness, PCT_FMT], ['Readiness_Band', (x) => x.s.readinessBand],
    ['IDP_Actions', (x) => x.s.idpActions], ['IDP_Completed', (x) => x.s.idpCompleted], ['IDP_Overdue', (x) => x.s.idpOverdue], ['IDP_Avg_Progress', (x) => (x.s.idpProgress == null ? null : x.s.idpProgress / 100), PCT_FMT],
    ['Trainings_Assigned', (x) => x.s.trainingAssigned], ['Trainings_Completed', (x) => x.s.trainingCompleted], ['Training_Completion', (x) => x.s.trainingCompletion, PCT_FMT], ['Training_Hours', (x) => x.s.trainingHours],
    ['Observed_Days', (x) => x.s.observedDays], ['Observed_Avg_Score', (x) => x.s.observedAvg, '0.00'], ['Latest_Day_Avg', (x) => x.s.latestDayAvg, '0.00'],
    ['Certifications', (x) => x.s.certsTotal], ['Certs_Completed', (x) => x.s.certsCompleted], ['Certs_In_Progress', (x) => x.s.certsActive],
    ['Coaching_Sessions', (x) => x.s.coachingSessions], ['Coaching_Effort_Min', (x) => x.s.coachingMinutes], ['Last_Coaching', (x) => x.s.lastCoaching, DATE_FMT], ['Coaching_Progress', (x) => (x.s.coachingProgress == null ? null : x.s.coachingProgress / 100), PCT_FMT], ['Next_Review', (x) => x.s.nextReview, DATE_FMT],
    ['Evidence', (x) => x.s.evidenceTotal], ['Evidence_Verified', (x) => x.s.evidenceVerified],
    ['Baseline_Score', (x) => x.s.baselineScore, '0.00'], ['Labs_Completed', (x) => (x.s.labsTotal ? x.s.labsCompleted : null)], ['Labs_Total', (x) => x.s.labsTotal || null], ['Labs_Completion', (x) => x.s.labsShare, PCT_FMT],
    ['S1_Prof_Cert_Progress', (x) => pctOf(x.s.segmentProgress.S1), PCT_FMT], ['S2_Labs_Progress', (x) => pctOf(x.s.segmentProgress.S2), PCT_FMT], ['S3_AI_Cert_Progress', (x) => pctOf(x.s.segmentProgress.S3), PCT_FMT],
    ['S4_LMS_Progress', (x) => pctOf(x.s.segmentProgress.S4), PCT_FMT], ['S5_Cross_Functional_Progress', (x) => pctOf(x.s.segmentProgress.S5), PCT_FMT], ['DTN_Progress', (x) => pctOf(x.s.segmentProgress.DTN), PCT_FMT],
    ['Sessions_Assessed', (x) => x.s.observation?.sessionsAssessed], ['Evidence_Strength', (x) => x.s.observation?.evidenceStrength], ['Observed_Overall_Avg', (x) => x.s.observation?.overallAvg, '0.00'],
    ['Improvement_Delta', (x) => x.s.observation?.improvementDelta, '0.00'], ['Leadership_Potential', (x) => x.s.observation?.leadershipPotential], ['Readiness_Timeframe', (x) => x.s.observation?.timeframe],
    ['Strongest_Domain', (x) => x.s.observation?.strongestDomain], ['Development_Domain', (x) => x.s.observation?.developmentDomain],
    ['Self_Assessed_Level', (x) => x.s.observation?.selfAssessedLevel, '0.00'], ['Validated_Level', (x) => x.s.observation?.validatedLevel], ['Target_Level', (x) => x.s.observation?.targetLevel],
    ['Gap_vs_Target', (x) => x.s.observation?.gapVsTarget, '0.00'], ['Alignment_Status', (x) => x.s.observation?.alignmentStatus], ['Assessment_Classification', (x) => x.s.observation?.classification],
    ['Risks_High', (x) => x.s.risksHigh], ['Risks_Medium', (x) => x.s.risksMedium], ['Risks_Low', (x) => x.s.risksLow], ['Opportunities', (x) => x.s.opportunities],
    ['Risk_Codes', (x) => x.s.risks.map((r) => r.code).join(', ') || null], ['Last_Activity', (x) => x.s.lastActivity, DATE_FMT],
  ]
  summaryWs.addRow(S.map((c) => c[0]))
  for (const x of sums) summaryWs.addRow(S.map((c) => c[1](x) ?? null))
  S.forEach((c, i) => { if (c[2]) summaryWs.getColumn(i + 1).numFmt = c[2] })
  styleHeader(summaryWs, true)
  widths(summaryWs, 36)

  // ------------------------------------------------------------------ Risk_Flags
  const RC = ['Scope', 'Subject', 'Employee_ID', 'Employee_Name', 'Department', 'Section', 'Rule_Code', 'Risk', 'Severity', 'Severity_Order', 'Panel', 'Area', 'Detail', 'Executive_Action', 'Owner', 'People_Affected']
  riskWs.addRow(RC)
  const flagRows: unknown[][] = []
  for (const { e, s } of sums) for (const f of s.risks) flagRows.push(['Individual', e.name, e.id, e.name, e.department, e.section, f.code, f.name, f.severity, SEVERITY_ORDER[f.severity] ?? null, f.panel, f.area, f.detail, f.action, f.owner, 1])
  for (const f of scope.employeeId ? [] : groupRisks(d, sums)) flagRows.push(['Group', f.subject, null, null, null, null, f.code, f.name, f.severity, SEVERITY_ORDER[f.severity] ?? null, f.panel, f.area, f.detail, f.action, f.owner, f.employeeIds.length])
  flagRows.sort((a, b) => Number(a[9]) - Number(b[9]) || String(a[6]).localeCompare(String(b[6])) || String(a[1]).localeCompare(String(b[1])))
  for (const r of flagRows) riskWs.addRow(r)
  styleHeader(riskWs, true)
  widths(riskWs, 60)

  // ------------------------------------------------------------------ Observation_Profile
  const PC = ['Employee_ID', 'Employee_Name', 'Department', 'Behaviour', 'Domain', 'Average_Score', 'Finding', 'Action_Cue']
  profileWs.addRow(PC)
  for (const { e, s } of sums) for (const p of s.observation?.parameters ?? []) profileWs.addRow([e.id, e.name, e.department, p.name, p.category, p.avg, p.finding, p.actionCue])
  profileWs.getColumn(6).numFmt = '0.00'
  styleHeader(profileWs, true)
  widths(profileWs, 40)

  // ------------------------------------------------------------------ Roadmap
  roadWs.addRow(['Employee_ID', 'Employee_Name', 'Department', 'Section', 'Line_Manager', 'Journey_Progress', 'Current_Stage', 'Step', 'Stage', 'Status', 'Stage_Progress', 'Headline', 'Done_Count', 'Done', 'Open_Count', 'Still_Open', 'Next_Date'])
  const WORD: Record<string, string> = { done: 'Done', active: 'In progress', risk: 'At risk', todo: 'Not started' }
  for (const { e, s } of sums) {
    if (['Out of Scope', 'Left Company'].includes(e.status ?? '')) continue
    const m = buildRoadmap(d, e, s)
    const cur = m.stages.find((x) => x.key === m.currentStage)?.label ?? 'Complete'
    m.stages.forEach((st, i) => {
      const nextDate = st.open.map((x) => x.date).filter(Boolean).sort((a, b) => a!.getTime() - b!.getTime())[0] ?? null
      roadWs.addRow([e.id, e.name, e.department, e.section, m.lineManager, m.progress, cur, i + 1, st.label, WORD[st.status], st.status === 'done' ? 1 : st.progress,
        st.headline, st.done.length, st.done.map((x) => x.text).join('\n') || null, st.open.length, st.open.map((x) => `${x.overdue ? '[overdue] ' : ''}${x.text}`).join('\n') || null, nextDate])
    })
  }
  roadWs.getColumn(6).numFmt = PCT_FMT; roadWs.getColumn(11).numFmt = PCT_FMT; roadWs.getColumn(17).numFmt = DATE_FMT
  styleHeader(roadWs, true)
  widths(roadWs, 60)

  // ------------------------------------------------------------------ Activity_Log
  const L = ['Activity_ID', 'Activity_Type', 'Parent_ID', 'Employee_ID', 'Employee_Name', 'Client', 'Department', 'Date', 'Activity', 'Detail',
    'Competency_Code', 'Competency', 'Status', 'Score', 'Target', 'Gap', 'Staff', 'Comments', 'Entered_By', 'Source', 'Last_Updated']
  logWs.addRow(L)
  type Row = Partial<Record<(typeof L)[number], unknown>>
  const rows: Row[] = []
  const comp = (id?: string | null) => (id ? d.competencies.get(id) : undefined)
  for (const e of d.employees) {
    const base = { Employee_ID: e.id, Employee_Name: e.name, Client: e.client.name, Department: e.department }
    const add = (r: Row, rec?: any) => rows.push({ ...base, Entered_By: rec?.updatedBy ?? rec?.createdBy ?? null, Source: rec?.source ?? null, Last_Updated: rec?.updatedAt ?? null, ...r })
    for (const b of d.baselines.get(e.id) ?? []) add({ Activity_ID: b.id, Activity_Type: 'Baseline survey', Date: b.date, Activity: 'Baseline survey', Detail: [b.yearsWithOrganisation != null && `${b.yearsWithOrganisation} years with the organisation`, b.totalYearsExperience != null && `${b.totalYearsExperience} years total`, b.mbti && `MBTI ${b.mbti}`].filter(Boolean).join(' · ') || null, Score: baselineScore(b), Target: 5, Comments: b.notes }, b)
    for (const x of d.enrollments.get(e.id) ?? []) add({ Activity_ID: x.id, Activity_Type: 'Programme enrolment', Date: x.startDate, Activity: x.program.name, Detail: [x.batch, x.coach && `Coach ${x.coach.name}`].filter(Boolean).join(' · '), Status: x.status, Staff: x.consultant?.name, Comments: x.notes }, x)
    for (const a of d.assessments.get(e.id) ?? []) {
      add({ Activity_ID: a.id, Activity_Type: 'Assessment', Date: a.date, Activity: a.type, Detail: `${a.ratings.length} competencies rated${a.reportStatus ? ` · report ${a.reportStatus}` : ''}`, Status: a.status, Staff: a.assessor?.name, Comments: a.summary }, a)
      for (const r of a.ratings) {
        const c = comp(r.competencyId)
        add({ Activity_ID: r.id, Activity_Type: 'Competency rating', Parent_ID: a.id, Date: a.date, Activity: `${a.type} rating`, Detail: r.priority ? `Priority ${r.priority}` : null, Competency_Code: c?.code, Competency: c?.name,
          Score: r.level, Target: r.requiredLevel, Gap: r.level != null && r.requiredLevel != null ? r.requiredLevel - r.level : null, Staff: a.assessor?.name, Comments: r.comment }, a)
      }
    }
    for (const v of d.validations.get(e.id) ?? []) {
      const c = comp(v.competencyId)
      add({ Activity_ID: v.id, Activity_Type: 'Manager validation', Parent_ID: v.assessmentId, Date: v.date, Activity: c ? `Validation of ${c.name}` : 'Validation of assessment', Detail: v.evidenceReviewed, Competency_Code: c?.code, Competency: c?.name, Status: v.status, Score: v.validatedLevel, Staff: v.manager?.name ?? v.managerName, Comments: v.comments }, v)
    }
    for (const a of d.idp.get(e.id) ?? []) {
      const c = comp(a.competencyId)
      add({ Activity_ID: a.id, Activity_Type: 'Development action', Date: a.plannedEnd ?? a.plannedStart, Activity: a.title, Detail: [a.actionType, a.estimatedHours != null && `${a.estimatedHours} h est.`].filter(Boolean).join(' · '), Competency_Code: c?.code, Competency: c?.name, Status: a.plannedEnd && a.plannedEnd < today && !['Completed', 'Cancelled'].includes(a.status ?? '') ? `${a.status ?? 'Planned'} (overdue)` : a.status, Score: a.progressPct, Target: 100, Staff: a.owner, Comments: a.comments }, a)
    }
    for (const t of d.training.get(e.id) ?? []) {
      add({ Activity_ID: t.id, Activity_Type: 'Training', Parent_ID: t.sessionId, Date: t.startDate ?? t.assignedDate, Activity: t.course.name, Detail: [t.course.type, t.attendancePct != null && `Attendance ${t.attendancePct}%`, t.hours != null && `${t.hours} h`].filter(Boolean).join(' · '), Status: t.status, Score: t.score, Staff: t.session?.trainer?.name, Comments: t.comments }, t)
      for (const day of t.days) {
        const scored = day.scores.filter((s) => s.score != null)
        add({ Activity_ID: day.id, Activity_Type: 'Observation day', Parent_ID: t.id, Date: day.date, Activity: `${t.course.name} · day ${day.dayNumber}`, Detail: day.potentialNote, Status: day.attendance, Score: scored.length ? Math.round((scored.reduce((s, x) => s + x.score!, 0) / scored.length) * 100) / 100 : null, Target: 5, Staff: day.observer?.name, Comments: day.notes }, day)
        for (const s of day.scores) {
          const p = d.parameters.get(s.parameterId)
          const c = comp(p?.competencyId)
          add({ Activity_ID: s.id, Activity_Type: 'Observation score', Parent_ID: day.id, Date: day.date, Activity: p?.name, Detail: `${t.course.name} · day ${day.dayNumber}`, Competency_Code: c?.code, Competency: c?.name, Score: s.score, Target: p?.maxScore, Staff: day.observer?.name, Comments: s.comment }, day)
        }
      }
    }
    for (const c of d.certs.get(e.id) ?? []) add({ Activity_ID: c.id, Activity_Type: 'Certification', Date: c.completionDate ?? c.examDate ?? c.targetDate, Activity: c.certification.name, Detail: [c.certification.track, c.result].filter(Boolean).join(' · '), Status: c.status, Score: c.score, Comments: c.comments }, c)
    for (const c of d.coaching.get(e.id) ?? []) add({ Activity_ID: c.id, Activity_Type: 'Coaching session', Date: c.date, Activity: c.type, Detail: [c.startTime && `${c.startTime}–${c.endTime ?? ''}`, (c.prepMinutes || c.durationMinutes || c.reportingMinutes) && `Total effort ${(c.prepMinutes ?? 0) + (c.durationMinutes ?? 0) + (c.reportingMinutes ?? 0)} min`, c.actionItems && `Actions: ${c.actionItems}`].filter(Boolean).join(' · '), Status: c.status, Score: c.progressPct, Target: 100, Staff: c.coach?.name, Comments: [c.summary, c.challenges && `Challenges: ${c.challenges}`].filter(Boolean).join(' | ') }, c)
    for (const v of d.evidence.get(e.id) ?? []) {
      const c = comp(v.competencyId)
      add({ Activity_ID: v.id, Activity_Type: 'Evidence', Parent_ID: v.relatedId, Date: v.date, Activity: v.title, Detail: v.evidenceType, Competency_Code: c?.code, Competency: c?.name, Status: v.verificationStatus, Staff: v.verifiedBy?.name, Comments: v.description }, v)
    }
  }
  rows.sort((a, b) => String(a.Employee_Name).localeCompare(String(b.Employee_Name)) || ((a.Date as Date)?.getTime?.() ?? 0) - ((b.Date as Date)?.getTime?.() ?? 0))
  for (const r of rows) logWs.addRow(L.map((k) => r[k] ?? null))
  logWs.getColumn(L.indexOf('Date') + 1).numFmt = DATE_FMT
  logWs.getColumn(L.indexOf('Last_Updated') + 1).numFmt = 'yyyy-mm-dd hh:mm'
  styleHeader(logWs, true)
  widths(logWs, 44)

  // ------------------------------------------------------------------ table sheets
  const tableCounts: [string, number, string][] = []
  const inScope = async (e: Entity): Promise<any[]> => {
    const all = !scope.clientId && !scope.employeeId
    if (all) return delegate(e.model).findMany({ orderBy: { id: 'asc' } })
    const ids = [...empIds]
    switch (e.key) {
      case 'clients': return prisma.client.findMany({ where: { id: { in: [...new Set(d.employees.map((x) => x.clientId))] } } })
      case 'programs': return prisma.program.findMany({ where: { clientId: { in: [...new Set(d.employees.map((x) => x.clientId))] } }, orderBy: { id: 'asc' } })
      case 'employees': return prisma.employee.findMany({ where: { id: { in: ids } }, orderBy: { id: 'asc' } })
      case 'ratings': return prisma.assessmentRating.findMany({ where: { assessment: { employeeId: { in: ids } } }, orderBy: { id: 'asc' } })
      case 'sessions': return prisma.courseSession.findMany({ where: { records: { some: { employeeId: { in: ids } } } }, orderBy: { id: 'asc' } })
      case 'observationDays': return prisma.observationDay.findMany({ where: { trainingRecord: { employeeId: { in: ids } } }, orderBy: { id: 'asc' } })
      case 'observationScores': return prisma.observationScore.findMany({ where: { observationDay: { trainingRecord: { employeeId: { in: ids } } } }, orderBy: { id: 'asc' } })
      default:
        if (e.employeeScoped) return delegate(e.model).findMany({ where: { employeeId: { in: ids } }, orderBy: { id: 'asc' } })
        return delegate(e.model).findMany({ orderBy: { id: 'asc' } })
    }
  }
  const order = [...ENTITIES.filter((e) => e.kind === 'activity'), ...ENTITIES.filter((e) => e.kind === 'reference')]
  for (const e of order) {
    const ws = wb.addWorksheet(e.table, { properties: { tabColor: { argb: e.kind === 'activity' ? 'FFC8E68A' : 'FFE6E8E5' } } })
    const cols = tableColumns(e)
    ws.addRow(cols.map((c) => c.key))
    const data = await inScope(e)
    for (const r of data) ws.addRow(cols.map((c) => r[c.key] ?? null))
    cols.forEach((c, i) => {
      const col = ws.getColumn(i + 1)
      const t = c.field?.type
      if (t === 'date' || c.key === 'createdAt' || c.key === 'updatedAt') col.numFmt = t === 'date' ? DATE_FMT : 'yyyy-mm-dd hh:mm'
      const cell = ws.getRow(1).getCell(i + 1)
      cell.note = c.field ? fieldNote(e, c.field) : c.key === 'id' ? `${e.label} ID (${e.prefix}-…). Primary key.` : 'Set automatically.'
    })
    styleHeader(ws)
    widths(ws)
    tableCounts.push([e.table, data.length, e.description])
    // Link (join) tables right after their parent
    for (const j of e.joins ?? []) {
      const jws = wb.addWorksheet(j.table, { properties: { tabColor: { argb: 'FFE6E8E5' } } })
      jws.addRow([j.parentKey, j.childKey])
      const parentIds = new Set(data.map((x) => x.id))
      const links = (await (prisma as any)[j.model].findMany()).filter((x: any) => parentIds.has(x[j.parentKey]))
      for (const l of links) jws.addRow([l[j.parentKey], l[j.childKey]])
      jws.getRow(1).getCell(1).note = `→ ${e.table}.id`
      jws.getRow(1).getCell(2).note = `→ ${ENTITY[j.ref].table}.id`
      styleHeader(jws); widths(jws)
      tableCounts.push([j.table, links.length, `${j.label}: links ${e.table} to ${ENTITY[j.ref].table} (many-to-many).`])
    }
  }
  if (scope.includeLog !== false) {
    const ws = wb.addWorksheet('ChangeLog', { properties: { tabColor: { argb: 'FFE6E8E5' } } })
    const cols = ['id', 'at', 'user', 'action', 'entity', 'recordId', 'employeeId', 'summary', 'changes']
    ws.addRow(cols)
    const logs = await prisma.changeLog.findMany({ where: scope.clientId || scope.employeeId ? { employeeId: { in: [...empIds] } } : {}, orderBy: { at: 'asc' } })
    for (const l of logs) ws.addRow(cols.map((c) => (l as any)[c] ?? null))
    ws.getColumn(2).numFmt = 'yyyy-mm-dd hh:mm'
    styleHeader(ws); widths(ws)
    tableCounts.push(['ChangeLog', logs.length, 'Every create, update and delete made in the app: who, when, which record, old → new values.'])
  }

  // ------------------------------------------------------------------ Data_Dictionary
  dictWs.addRow(['Sheet', 'Column', 'Label in the app', 'Type', 'Required', 'Links to', 'List', 'Description'])
  for (const e of order) {
    dictWs.addRow([e.table, 'id', `${e.label} ID`, 'ID', 'Yes', '', '', `Primary key. Format ${e.prefix}-${'0'.repeat(e.pad - 1)}1.`])
    for (const f of e.fields) dictWs.addRow([e.table, f.name, f.label, TYPE_LABEL[f.type], f.required ? 'Yes' : '', f.ref ? `${ENTITY[f.ref].table}.id` : '', f.list ?? '', f.help ?? ''])
    if (e.audit) for (const [k, t] of [['createdAt', 'When the row was added'], ['createdBy', 'Who added it (the "Entered by" name)'], ['updatedAt', 'When it last changed'], ['updatedBy', 'Who last changed it']]) dictWs.addRow([e.table, k, '', k.endsWith('At') ? 'Date & time' : 'Text', '', '', '', t])
    for (const j of e.joins ?? []) dictWs.addRow([j.table, `${j.parentKey} + ${j.childKey}`, j.label, 'ID pair', 'Yes', `${e.table}.id + ${ENTITY[j.ref].table}.id`, '', 'Many-to-many link table.'])
  }
  for (const [k, desc] of [
    ['Employee_ID … Last_Activity', 'Employee_Summary is calculated on export. Role_Readiness = Σ weight × min(level, required) ÷ Σ weight × required, weights High 3 / Medium 2 / Low 1. Current level = latest completed non-self assessment, self-assessment only when nothing else exists.'],
    ['Baseline_Score', 'Average of the leading digit (1–5) of the six self-ratings on the latest baseline survey.'],
    ['Labs_*', 'Hands-on labs over all lab training records: completed ÷ total. A completed record with no count counts all its labs.'],
    ['S1 … DTN progress', 'Latest value of each segment progress field on the coaching tracker.'],
    ['Evidence_Strength … Assessment_Classification', 'Observation summary on the 1–5 observation scale (the risk rules use 0–4, i.e. score − 1). Evidence strength: 4+ observed days High, 3 Moderate, fewer Limited. Leadership potential High: overall ≥ 3.4, leadership domain ≥ 3.2 and improvement ≥ 0.3; Emerging: 3.0 / 2.8 / 0.25. Gap_vs_Target = validated − target level.'],
    ['Risks_* / Risk_Codes', 'Count of risk and opportunity rules that fire for the person (see Risk_Flags and the RiskRule sheet for the rule text, threshold and owner). People marked Out of Scope or Left Company are not evaluated.'],
    ['Risk_Flags', 'One row per rule that fires. Scope Individual = one person; Group = a team, section or skill where a share of people is affected (R34–R36, groups of 3 or more).'],
    ['Observation_Profile', 'One row per person per observed behaviour: average on the 1–5 scale, finding (Acceptable / strength ≥ 3.5, Developing / monitor ≥ 2.5, Development priority below) and the matching action cue.'],
    ['Roadmap', 'The journey per person: ten stages in programme order (enrolment, baseline survey, assessment & report, development plan, training & labs, observed programme, certifications, coaching, manager validation, role readiness). Status Done / In progress / At risk (a High risk rule fires for the stage) / Not started. Journey_Progress = average of stage progress, a done stage counting 100%. Done and Still_Open list the records behind it.'],
    ['Activity_Log', 'One row per data point from every activity table. Activity_ID is the row ID in its own sheet (the prefix tells which). Parent_ID points to the record it belongs to (rating → assessment, observation score → observation day → training record).'],
  ]) dictWs.addRow(['(calculated)', k, '', '', '', '', '', desc])
  styleHeader(dictWs, true)
  widths(dictWs, 70)

  // ------------------------------------------------------------------ README
  readme.getColumn(1).width = 26; readme.getColumn(2).width = 14; readme.getColumn(3).width = 110
  const line = (a: unknown = '', b: unknown = '', c: unknown = '', opts: { bold?: boolean; size?: number; color?: string } = {}) => {
    const r = readme.addRow([a, b, c])
    r.font = { bold: opts.bold, size: opts.size, color: { argb: opts.color ?? INK } }
    r.alignment = { vertical: 'top', wrapText: true }
    return r
  }
  line('Ballon TD — development records export', '', '', { bold: true, size: 16 })
  line('Exported', '', new Date().toISOString().slice(0, 16).replace('T', ' ') + (scope.exportedBy ? ` by ${scope.exportedBy}` : ''), { color: MUTED })
  line('Scope', '', scopeText, { color: MUTED })
  line('People', '', d.employees.length, { color: MUTED })
  line()
  line('How to read this file', '', '', { bold: true, size: 13 })
  line('Employee_Summary', '', 'One row per person with every calculated value (readiness, gaps, completion, coaching, certifications). Start here.')
  line('Risk_Flags', '', 'Every risk and opportunity rule that fires, for one person or for a group, with severity, the suggested action and its owner. Sorted by severity.')
  line('Observation_Profile', '', 'Each person\'s average per observed behaviour with the finding and action cue.')
  line('Roadmap', '', 'Each person\'s journey stage by stage: what is done and what is still open. For one team, use the manager report on Roadmaps.')
  line('Activity_Log', '', 'Every interaction as one row: baseline surveys, ratings, validations, plan actions, training, each observation score, certifications, coaching, evidence. Filter Employee_Name to see one person\'s full history.')
  line('Data_Dictionary', '', 'What every column in every sheet means, its type, which list it uses and which sheet it links to.')
  line('Table sheets', '', 'One sheet per database table, with the exact column names and IDs. IDs are stable: EMP-0001 is always the same person. A column ending in "Id" holds the ID of a row in another sheet. These sheets can be imported straight into a database (one sheet = one table).')
  line()
  line('Sheet', 'Rows', 'Description', { bold: true })
  readme.lastRow!.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIME } }
  line('Employee_Summary', sums.length, 'Calculated, one row per person.')
  line('Risk_Flags', flagRows.length, 'Calculated, one row per rule that fires.')
  line('Observation_Profile', profileWs.rowCount - 1, 'Calculated, one row per person per behaviour.')
  line('Roadmap', roadWs.rowCount - 1, 'Calculated, one row per person per stage.')
  line('Activity_Log', rows.length, 'Calculated, one row per data point.')
  for (const [t, n, desc] of tableCounts) line(t, n, desc)
  line()
  line('ID prefixes', '', '', { bold: true, size: 13 })
  for (const e of order) line(`${e.prefix}-…`, '', `${e.table} — ${e.label}`, { color: MUTED })
  line('LOG-…', '', 'ChangeLog', { color: MUTED })
  for (let i = 1; i <= readme.rowCount; i++) if (i > 1) readme.getRow(i).getCell(2).alignment = { horizontal: 'right', vertical: 'top' }

  void SOFT
  return { wb, name: `ballon-td_${scope.employeeId ?? (client ? client.name.replace(/[^\w]+/g, '-').replace(/-+$/, '') : 'all')}_${new Date().toISOString().slice(0, 10)}.xlsx` }
}
