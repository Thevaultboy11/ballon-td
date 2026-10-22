// The manager dashboard: who is ready, what is missing and where to act, for the whole organisation,
// one department or one section. Built from the same records as everything else (metrics.summarize),
// so the numbers match the person pages, the roadmap and the export. Nothing is stored.
//
//   Band               from the readiness band (Ready for next role · 6–12 months · Growing · Needs support · Not assessed)
//   Critical position  a role profile of seniority Lead / Manager / Head / Executive, or a title with Lead, Head, Director,
//                      Chief, Manager or CISO
//   Successor          someone whose role profile's next role is the holder's role, and who is ready now or in 6–12 months
//   Key person         the only person in their section (3+ assessed people, critical positions excluded) at expert level
//                      in a competency (level 4, or the top of the scale when it is lower)
//   Potential          average observed score (1–5) on the Leadership and Learning Agility behaviours
import { prisma } from '../db.ts'
import { loadData, summarize, type Data, type Summary } from './metrics.ts'

export type Band = 'ready' | 'soon' | 'growing' | 'support' | 'unassessed'
export const BAND_OF: Record<string, Band> = { 'Ready for next role': 'ready', 'Ready in 6–12 months': 'soon', 'Growing in role': 'growing', 'Needs support': 'support', 'Not assessed': 'unassessed' }
const CRITICAL_SENIORITY = new Set(['Lead', 'Manager', 'Head', 'Executive'])
const CRITICAL_TITLE = /\b(Lead|Head|Director|Chief|Manager|CISO)\b/i
const POTENTIAL_DOMAINS = new Set(['Leadership', 'Learning Agility'])
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)

export type DashPerson = ReturnType<typeof personRow>

function personRow(d: Data, e: Data['employees'][number], s: Summary, paramIndex: Map<string, number>) {
  const training = d.training.get(e.id) ?? []
  const t = { done: 0, inProgress: 0, incomplete: 0, upcoming: 0, cancelled: 0, hours: 0 }
  for (const x of training) {
    if (x.status === 'Completed') { t.done++; t.hours += x.hours ?? x.course.durationHours ?? 0 }
    else if (x.status === 'In Progress') t.inProgress++
    else if (x.status === 'Incomplete' || x.status === 'No-show') t.incomplete++
    else if (x.status === 'Not Started' || x.status === 'Assigned') t.upcoming++
    else t.cancelled++
  }
  const started = t.done + t.inProgress + t.incomplete
  // observed behaviours: average per parameter over attended days
  const per: number[][] = Array.from({ length: paramIndex.size }, () => [])
  const potential: number[] = []
  let lastNote: string | null = null, lastDate = 0
  for (const x of training) for (const day of x.days) {
    if (day.attendance === 'Absent') continue
    for (const sc of day.scores) {
      if (sc.score == null) continue
      const i = paramIndex.get(sc.parameterId)
      if (i != null) per[i].push(sc.score)
      if (POTENTIAL_DOMAINS.has(d.parameters.get(sc.parameterId)?.category ?? '')) potential.push(sc.score)
    }
    if (day.potentialNote && (day.date?.getTime() ?? 0) >= lastDate) { lastNote = day.potentialNote; lastDate = day.date?.getTime() ?? 0 }
  }
  const behaviorAvg = per.map((xs) => avg(xs))
  const rated = s.competencies.filter((c) => c.level != null && c.required != null)
  const certs = (d.certs.get(e.id) ?? []).filter((c) => !['Cancelled', 'Not Required'].includes(c.status))
  const role = e.jobRole
  return {
    id: e.id, name: e.name, email: e.email, jobTitle: e.jobTitle, role: role?.name ?? e.jobTitle, family: role?.family ?? null, seniority: role?.seniority ?? null,
    jobRoleId: e.jobRoleId, nextRoleId: role?.nextRoleId ?? null,
    clientId: e.clientId, client: e.client.name, division: e.division, department: e.department ?? 'No department', section: e.section ?? 'No section',
    lineManager: e.lineManager?.name ?? e.lineManagerName ?? null, status: e.status,
    selfAssessment: s.selfAssessment, validation: s.validationInterview, report: s.report,
    assessed: s.roleReadiness != null, roleReadiness: s.roleReadiness, nextRole: s.nextRole, nextReadiness: s.nextRoleReadiness,
    band: BAND_OF[s.readinessBand] ?? 'unassessed' as Band,
    criticalGaps: rated.filter((c) => c.priority === 'High' && (c.gap ?? 0) > 0).map((c) => c.name),
    gapCount: rated.filter((c) => (c.gap ?? 0) > 0).length,
    exceeds: rated.filter((c) => (c.gap ?? 0) < 0).length,
    exceedsRole: rated.length > 0 && rated.every((c) => (c.gap ?? 0) <= 0) && rated.some((c) => (c.gap ?? 0) < 0),
    gaps: rated.map((c) => ({ id: c.competencyId, level: c.level!, req: c.required!, priority: c.priority, max: c.maxLevel })),
    training: { ...t, started, rate: started ? t.done / started : null, allDone: started > 0 && !t.inProgress && !t.incomplete, finishing: t.inProgress > 0 && !t.incomplete },
    potential: avg(potential), observedAvg: s.observedAvg, potentialNote: lastNote, behaviorAvg: behaviorAvg.some((x) => x != null) ? behaviorAvg : null,
    certCompleted: certs.filter((c) => c.status === 'Completed' && c.certification.track !== 'AI').length, certTotal: certs.filter((c) => c.certification.track !== 'AI').length,
    aiCompleted: certs.filter((c) => c.status === 'Completed' && c.certification.track === 'AI').length, aiTotal: certs.filter((c) => c.certification.track === 'AI').length,
    risksHigh: s.risksHigh, roadmapStage: null as string | null,
    criticalPosition: CRITICAL_SENIORITY.has(role?.seniority ?? '') || CRITICAL_TITLE.test(role?.name ?? e.jobTitle ?? ''),
    keyFor: [] as string[], successors: [] as { id: string; name: string; nextReadiness: number | null; band: Band }[],
  }
}

/** Aggregates for any group of dashboard rows (everyone, a department or a section). */
export function aggregate(people: DashPerson[]) {
  const assessed = people.filter((p) => p.assessed)
  const bands: Record<Band, number> = { ready: 0, soon: 0, growing: 0, support: 0, unassessed: 0 }
  for (const p of people) bands[p.band]++
  const t = { done: 0, started: 0, hours: 0, allDone: 0, finishing: 0 }
  for (const p of people) { t.done += p.training.done; t.started += p.training.started; t.hours += p.training.hours; if (p.training.allDone) t.allDone++; if (p.training.finishing) t.finishing++ }
  const critical = people.filter((p) => p.criticalPosition)
  return {
    count: people.length, assessedCount: assessed.length,
    selfAssessed: people.filter((p) => p.selfAssessment === 'Completed').length,
    validated: people.filter((p) => p.validation === 'Completed').length,
    reported: people.filter((p) => p.report === 'Delivered').length,
    avgRoleReadiness: avg(assessed.map((p) => p.roleReadiness!)),
    avgNextReadiness: avg(assessed.filter((p) => p.nextReadiness != null).map((p) => p.nextReadiness!)),
    criticalGaps: assessed.reduce((n, p) => n + p.criticalGaps.length, 0),
    peopleWithCritical: assessed.filter((p) => p.criticalGaps.length).length,
    exceedsRole: assessed.filter((p) => p.exceedsRole).length,
    bands, training: { ...t, rate: t.started ? t.done / t.started : null },
    keyPeople: people.filter((p) => p.keyFor.length).length,
    criticalPositions: critical.length, uncovered: critical.filter((p) => !p.successors.length).length,
    certAchieved: people.reduce((n, p) => n + p.certCompleted, 0), certTotal: people.reduce((n, p) => n + p.certTotal, 0),
    aiAchieved: people.reduce((n, p) => n + p.aiCompleted, 0), aiTotal: people.reduce((n, p) => n + p.aiTotal, 0),
  }
}

/** Every person's dashboard row plus the organisation structure, for one client or all. */
export async function dashboardModel(clientId?: string) {
  const d = await loadData({ clientId })
  const params = [...d.parameters.values()]
  const paramIndex = new Map(params.map((p, i) => [p.id, i]))
  const inScope = d.employees.filter((e) => !['Out of Scope', 'Left Company'].includes(e.status ?? ''))
  const people = inScope.map((e) => personRow(d, e, summarize(d, e), paramIndex))

  // successors for critical positions
  for (const h of people) {
    if (!h.criticalPosition || !h.jobRoleId) continue
    h.successors = people.filter((p) => p !== h && p.nextRoleId === h.jobRoleId && p.clientId === h.clientId && (p.band === 'ready' || p.band === 'soon'))
      .sort((a, b) => (b.nextReadiness ?? 0) - (a.nextReadiness ?? 0)).map((p) => ({ id: p.id, name: p.name, nextReadiness: p.nextReadiness, band: p.band }))
  }

  // key people and uncovered competencies, per section
  const singles: { competencyId: string; name: string; personId: string; person: string; holders: number; section: string; department: string }[] = []
  const none: { competencyId: string; name: string; holders: number; section: string; department: string }[] = []
  const bySection = new Map<string, DashPerson[]>()
  for (const p of people) { const k = `${p.clientId}\u0000${p.department}\u0000${p.section}`; (bySection.get(k) ?? bySection.set(k, []).get(k)!).push(p) }
  for (const group of bySection.values()) {
    const assessed = group.filter((p) => p.assessed && !p.criticalPosition)
    if (assessed.length < 3) continue
    const ids = new Set(assessed.flatMap((p) => p.gaps.map((g) => g.id)))
    for (const id of ids) {
      const holders = assessed.filter((p) => p.gaps.some((g) => g.id === id))
      const experts = holders.filter((p) => { const g = p.gaps.find((x) => x.id === id)!; return g.level >= Math.min(4, g.max) })
      const high = holders.some((p) => p.gaps.find((x) => x.id === id)!.priority === 'High')
      const name = d.competencies.get(id)?.name ?? id
      if (experts.length === 1) { singles.push({ competencyId: id, name, personId: experts[0].id, person: experts[0].name, holders: holders.length, section: group[0].section, department: group[0].department }); experts[0].keyFor.push(name) }
      else if (!experts.length && high && holders.length >= 3) none.push({ competencyId: id, name, holders: holders.length, section: group[0].section, department: group[0].department })
    }
  }

  const usedComp = new Set(people.flatMap((p) => p.gaps.map((g) => g.id)))
  const competencies = [...usedComp].map((id) => d.competencies.get(id)!).filter(Boolean)
    .sort((a, b) => a.category.framework.name.localeCompare(b.category.framework.name) || a.category.sortOrder - b.category.sortOrder || a.sortOrder - b.sortOrder)
    .map((c) => ({ id: c.id, code: c.code, name: c.name, category: c.category.name, framework: c.category.framework.name, frameworkCode: c.category.framework.code }))
  return {
    people, singles, none, competencies,
    parameters: params.map((p) => ({ id: p.id, code: p.code, name: p.name, category: p.category, competency: p.competencyId ? d.competencies.get(p.competencyId)?.name ?? null : null })),
    clients: [...new Map(d.employees.map((e) => [e.clientId, e.client.name])).entries()],
  }
}

/** The scoped view the pages use: everyone (with department cards) or one department / section. */
export async function dashboardView(opts: { clientId?: string; department?: string; section?: string }) {
  const m = await dashboardModel(opts.clientId)
  const scope = m.people.filter((p) => (!opts.department || p.department === opts.department) && (!opts.section || p.section === opts.section))
  const inScope = new Set(scope.map((p) => p.id))
  const deptMap = new Map<string, DashPerson[]>()
  for (const p of m.people) (deptMap.get(p.department) ?? deptMap.set(p.department, []).get(p.department)!).push(p)
  const departments = [...deptMap.entries()].map(([department, ps]) => ({
    department, division: ps.find((p) => p.division)?.division ?? null, sections: [...new Set(ps.map((p) => p.section))].sort(),
    people: ps.length, summary: aggregate(ps), singles: m.singles.filter((x) => x.department === department).length,
  })).sort((a, b) => b.people - a.people || a.department.localeCompare(b.department))

  // most common gaps in scope
  const gapCount = new Map<string, { id: string; name: string; category: string; assessed: number; withGap: number; critical: number; gapSum: number }>()
  for (const p of scope) for (const g of p.gaps) {
    const c = m.competencies.find((x) => x.id === g.id)
    const x = gapCount.get(g.id) ?? gapCount.set(g.id, { id: g.id, name: c?.name ?? g.id, category: c?.category ?? '', assessed: 0, withGap: 0, critical: 0, gapSum: 0 }).get(g.id)!
    x.assessed++
    if (g.req - g.level > 0) { x.withGap++; x.gapSum += g.req - g.level; if (g.priority === 'High') x.critical++ }
  }
  const topGaps = [...gapCount.values()].filter((x) => x.withGap).sort((a, b) => b.withGap - a.withGap || b.critical - a.critical).slice(0, 12)

  // readiness by sub-group (departments, or sections inside a department)
  const subKey = (p: DashPerson) => (opts.department ? p.section : p.department)
  const sub = new Map<string, DashPerson[]>()
  if (!opts.section) for (const p of scope) (sub.get(subKey(p)) ?? sub.set(subKey(p), []).get(subKey(p))!).push(p)
  const byGroup = [...sub.entries()].map(([label, ps]) => {
    const a = ps.filter((p) => p.assessed)
    return { label, people: ps.length, readiness: avg(a.map((p) => p.roleReadiness!)), ready: ps.filter((p) => p.band === 'ready' || p.band === 'soon').length }
  }).filter((g) => g.readiness != null).sort((a, b) => (b.readiness ?? 0) - (a.readiness ?? 0))

  // section-level heatmap rows when the scope is large
  const secRows = scope.length > 80 ? [...new Map(scope.map((p) => [`${p.department} · ${p.section}`, 0])).keys()].map((label) => {
    const ps = scope.filter((p) => `${p.department} · ${p.section}` === label && p.assessed)
    return { label, people: ps.length, cells: Object.fromEntries(m.competencies.map((c) => {
      const ds = ps.flatMap((p) => p.gaps.filter((g) => g.id === c.id).map((g) => g.level - g.req))
      return [c.id, avg(ds)]
    })) }
  }).filter((r) => r.people >= 2) : null

  return {
    scope: { clientId: opts.clientId ?? null, department: opts.department ?? null, section: opts.section ?? null },
    clients: m.clients, departments, summary: aggregate(scope),
    people: scope, competencies: m.competencies.filter((c) => scope.some((p) => p.gaps.some((g) => g.id === c.id))), parameters: m.parameters,
    singles: m.singles.filter((x) => scope.some((p) => p.id === x.personId)), none: m.none.filter((x) => (!opts.department || x.department === opts.department) && (!opts.section || x.section === opts.section)),
    topGaps, byGroup, sectionHeat: secRows,
    criticalPositions: scope.filter((p) => p.criticalPosition).map((p) => ({ id: p.id, name: p.name, role: p.role, department: p.department, section: p.section, assessed: p.assessed, roleReadiness: p.roleReadiness, successors: p.successors }))
      .sort((a, b) => a.successors.length - b.successors.length || a.department.localeCompare(b.department)),
    inScopeCount: inScope.size,
  }
}

// ------------------------------------------------------------------------------------------ one person
/** Everything the person "Analysis" tab draws: radar, focus list, behaviour days, training, certifications, plan. */
export async function personAnalysis(employeeId: string) {
  const d = await loadData({ employeeId })
  const e = d.employees[0]
  if (!e) return null
  const s = summarize(d, e)
  const comps = s.competencies.filter((c) => c.required != null || c.level != null)
  const W: Record<string, number> = { High: 3, Medium: 2, Low: 1 }
  const focusSrc = s.nextRole
    ? comps.filter((c) => c.nextRequired != null && c.level != null && c.nextRequired > c.level).map((c) => ({ c, target: c.nextRequired! }))
    : comps.filter((c) => c.required != null && c.level != null && c.required > c.level).map((c) => ({ c, target: c.required! }))
  focusSrc.sort((a, b) => (b.target - b.c.level!) * (W[b.c.priority ?? 'Medium'] ?? 2) - (a.target - a.c.level!) * (W[a.c.priority ?? 'Medium'] ?? 2))
  const behaviors = await prisma.competencyBehavior.findMany({ where: { OR: focusSrc.map((f) => ({ competencyId: f.c.competencyId, level: f.target })) }, orderBy: { code: 'asc' } })

  const training = d.training.get(e.id) ?? []
  const days = training.flatMap((t) => t.days.map((day) => ({ t, day }))).sort((a, b) => (a.day.date?.getTime() ?? 0) - (b.day.date?.getTime() ?? 0) || a.day.dayNumber - b.day.dayNumber)
  const params = [...d.parameters.values()]
  const COACHABILITY = new Set(['Openness to feedback', 'Learning speed', 'Applies feedback', 'Reflection quality'])
  const present = days.filter((x) => x.day.attendance !== 'Absent' && x.day.scores.some((sc) => sc.score != null))
  const dayAvg = (x: (typeof days)[number], filter?: (pid: string) => boolean) => avg(x.day.scores.filter((sc) => sc.score != null && (!filter || filter(sc.parameterId))).map((sc) => sc.score!))
  const isLA = (pid: string) => POTENTIAL_DOMAINS.has(d.parameters.get(pid)?.category ?? '')
  const last = present[present.length - 1]
  const firstOfLast = last ? present.find((x) => x.t.id === last.t.id)! : null

  // key person / critical position / successors need the person's section, so take the row from the client model
  const row = (await dashboardModel(e.clientId)).people.find((p) => p.id === e.id) ?? null
  return {
    row: row && { criticalPosition: row.criticalPosition, keyFor: row.keyFor, successors: row.successors, training: row.training, exceeds: row.exceeds, exceedsRole: row.exceedsRole, gapCount: row.gapCount, criticalGaps: row.criticalGaps, potentialNote: row.potentialNote },
    employeeId: e.id, name: e.name, role: e.jobRole?.name ?? e.jobTitle, nextRole: s.nextRole, roleReadiness: s.roleReadiness, nextReadiness: s.nextRoleReadiness,
    band: BAND_OF[s.readinessBand] ?? 'unassessed',
    competencies: comps.map((c) => ({ id: c.competencyId, name: c.name, category: c.category, framework: c.framework, level: c.level, required: c.required, next: c.nextRequired, priority: c.priority, max: c.maxLevel, gap: c.gap, observed: c.observedAvg })),
    focus: focusSrc.map(({ c, target }) => ({ id: c.competencyId, name: c.name, priority: c.priority, level: c.level, target, behaviors: behaviors.filter((b) => b.competencyId === c.competencyId).map((b) => b.description) })),
    days: days.map(({ t, day }) => ({ id: day.id, date: day.date, dayNumber: day.dayNumber, course: t.course.name, title: (t.course.dayTitles ?? '').split(/\r?\n/)[day.dayNumber - 1]?.trim() || null,
      trainer: day.observer?.name ?? t.session?.trainer?.name ?? null, attendance: day.attendance, note: day.potentialNote, notes: day.notes,
      overall: dayAvg({ t, day }), leadershipAgility: dayAvg({ t, day }, isLA),
      scores: Object.fromEntries(day.scores.filter((sc) => sc.score != null).map((sc) => [sc.parameterId, sc.score])) })),
    parameters: params.map((p) => ({ id: p.id, name: p.name, category: p.category, competency: p.competencyId ? d.competencies.get(p.competencyId)?.name ?? null : null })),
    potential: last ? dayAvg(last, isLA) : null,
    coachability: last ? avg(last.day.scores.filter((sc) => sc.score != null && COACHABILITY.has(d.parameters.get(sc.parameterId)?.name ?? '')).map((sc) => sc.score!)) : null,
    growth: last && firstOfLast && last !== firstOfLast ? dayAvg(last)! - dayAvg(firstOfLast)! : null,
    training: training.map((t) => ({ id: t.id, course: t.course.name, type: t.course.type, mode: t.session?.mode ?? t.course.deliveryMode, start: t.session?.startDate ?? t.startDate ?? t.assignedDate, end: t.session?.endDate ?? t.completionDate,
      status: t.status, attendancePct: t.attendancePct, hours: t.hours ?? (t.status === 'Completed' ? t.course.durationHours : null), labs: t.labsTotal ?? t.course.labsTotal ? `${t.labsCompleted ?? 0}/${t.labsTotal ?? t.course.labsTotal}` : null }))
      .sort((a, b) => (b.start?.getTime() ?? 0) - (a.start?.getTime() ?? 0)),
    certifications: (d.certs.get(e.id) ?? []).map((c) => ({ id: c.id, name: c.certification.name, track: c.certification.track, provider: c.certification.provider, status: c.status, target: c.targetDate, exam: c.examDate, completed: c.completionDate, expiry: c.expiryDate, description: c.certification.description })),
    plan: (d.idp.get(e.id) ?? []).filter((a) => a.status !== 'Cancelled').map((a) => ({ id: a.id, title: a.title, segment: a.segment, type: a.actionType, hours: a.estimatedHours, progress: a.progressPct, status: a.status, due: a.plannedEnd })),
    trainingHours: s.trainingHours,
  }
}
