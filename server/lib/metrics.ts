// Calculated values. Nothing here is stored: it is worked out from the records every time,
// shown in the app and written into the Excel export (Employee_Summary).
import { prisma } from '../db.ts'
import { evaluatePerson, evaluateGroup, observationSummary, baselineScore, labStats, type CompRow, type ObsDay, type Rule, type Flag } from './risks.ts'

export const PRIORITY_WEIGHT: Record<string, number> = { High: 3, Medium: 2, Low: 1 }
const DONE_TRAINING = new Set(['Completed'])
const DROPPED_TRAINING = new Set(['Cancelled', 'Deferred', 'Expired'])
const CERT_ACTIVE = new Set(['Registered', 'In Progress', 'Exam Scheduled'])
const IDP_CLOSED = new Set(['Completed', 'Cancelled'])

export type Scope = { clientId?: string; employeeId?: string }

/** Loads every activity record for the people in scope, in one go. */
export async function loadData(scope: Scope = {}) {
  const empWhere: any = scope.employeeId ? { id: scope.employeeId } : scope.clientId ? { clientId: scope.clientId } : {}
  const employees = await prisma.employee.findMany({ where: empWhere, include: { client: true, jobRole: true, lineManager: true }, orderBy: { name: 'asc' } })
  const ids = employees.map((e) => e.id)
  const byEmp = { employeeId: { in: ids } }
  const [enrollments, assessments, validations, idp, training, certs, coaching, evidence, requirements, competencies, parameters, baselines, riskRules] = await Promise.all([
    prisma.enrollment.findMany({ where: byEmp, include: { program: true, coach: true, consultant: true }, orderBy: { startDate: 'desc' } }),
    prisma.assessment.findMany({ where: byEmp, include: { ratings: true, assessor: true }, orderBy: { date: 'asc' } }),
    prisma.managerValidation.findMany({ where: byEmp, include: { manager: true }, orderBy: { date: 'asc' } }),
    prisma.idpAction.findMany({ where: byEmp, orderBy: { plannedEnd: 'asc' } }),
    prisma.trainingRecord.findMany({ where: byEmp, include: { course: true, session: { include: { trainer: true } }, days: { include: { scores: true, observer: true }, orderBy: { dayNumber: 'asc' } } } }),
    prisma.certificationRecord.findMany({ where: byEmp, include: { certification: true } }),
    prisma.coachingSession.findMany({ where: byEmp, include: { coach: true }, orderBy: { date: 'asc' } }),
    prisma.evidence.findMany({ where: byEmp, include: { verifiedBy: true } }),
    prisma.roleRequirement.findMany(),
    prisma.competency.findMany({ include: { category: { include: { framework: true } } } }),
    prisma.observationParameter.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.baselineSurvey.findMany({ where: byEmp, orderBy: { date: 'asc' } }),
    prisma.riskRule.findMany({ orderBy: { sortOrder: 'asc' } }),
  ])
  const group = <T extends { employeeId: string }>(rows: T[]) => {
    const m = new Map<string, T[]>()
    for (const r of rows) (m.get(r.employeeId) ?? m.set(r.employeeId, []).get(r.employeeId)!).push(r)
    return m
  }
  const reqByRole = new Map<string, typeof requirements>()
  for (const r of requirements) (reqByRole.get(r.jobRoleId) ?? reqByRole.set(r.jobRoleId, []).get(r.jobRoleId)!).push(r)
  const roles = new Map((await prisma.jobRole.findMany()).map((r) => [r.id, r]))
  return {
    employees, roles, reqByRole,
    competencies: new Map(competencies.map((c) => [c.id, c])),
    parameters: new Map(parameters.map((p) => [p.id, p])),
    enrollments: group(enrollments), assessments: group(assessments), validations: group(validations), idp: group(idp),
    training: group(training), certs: group(certs), coaching: group(coaching), evidence: group(evidence), baselines: group(baselines),
    riskRules: riskRules as Rule[],
  }
}
export type Data = Awaited<ReturnType<typeof loadData>>

export type CompetencyStatus = {
  competencyId: string; code: string; name: string; category: string; framework: string; frameworkCode: string; minLevel: number; maxLevel: number
  level: number | null; selfLevel: number | null; required: number | null; priority: string | null; gap: number | null
  nextRequired: number | null; source: string | null; sourceDate: Date | null; observedAvg: number | null
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)

/** Technical vs cross-functional, for the framework-level risk rules (R04, R05, R08). */
export function frameworkKind(code: string, name: string): CompRow['frameworkKind'] {
  if (/^TECH/i.test(code) || /technical/i.test(name)) return 'technical'
  if (/^(LEAD|LEX)/i.test(code) || /cross-functional|leadership|behaviou?r/i.test(name)) return 'cross'
  return 'other'
}
const SEGMENTS = [['S1', 's1'], ['S2', 's2'], ['S3', 's3'], ['S4', 's4'], ['S5', 's5'], ['DTN', 'dtn']] as const
const maxDate = (ds: (Date | null | undefined)[]) => ds.reduce<Date | null>((m, d) => (d && (!m || d > m) ? d : m), null)

function readiness(rows: { level: number | null; required: number | null; priority: string | null }[]) {
  let num = 0, den = 0
  for (const r of rows) {
    if (r.required == null || r.required <= 0) continue
    const w = PRIORITY_WEIGHT[r.priority ?? 'Medium'] ?? 2
    num += w * Math.min(r.level ?? 0, r.required)
    den += w * r.required
  }
  return den ? num / den : null
}

/** Everything calculated for one person. */
export function summarize(d: Data, emp: Data['employees'][number], today = new Date()) {
  const assessments = d.assessments.get(emp.id) ?? []
  const done = assessments.filter((a) => a.status === 'Completed' || a.status == null)
  // Current level per competency: the latest non-self rating; self-assessment only if nothing else exists.
  const current = new Map<string, { level: number; required: number | null; priority: string | null; source: string; date: Date | null }>()
  const self = new Map<string, number>()
  for (const a of done) {
    for (const r of a.ratings) {
      if (r.level == null) continue
      if (a.type === 'Self-Assessment') { self.set(r.competencyId, r.level); if (current.has(r.competencyId) && current.get(r.competencyId)!.source !== 'Self-Assessment') continue }
      current.set(r.competencyId, { level: r.level, required: r.requiredLevel, priority: r.priority, source: a.type, date: a.date })
    }
  }
  const roleReqs = emp.jobRoleId ? d.reqByRole.get(emp.jobRoleId) ?? [] : []
  const nextRole = emp.jobRoleId ? d.roles.get(emp.jobRoleId)?.nextRoleId : null
  const nextReqs = new Map((nextRole ? d.reqByRole.get(nextRole) ?? [] : []).map((r) => [r.competencyId, r]))
  const roleReqMap = new Map(roleReqs.map((r) => [r.competencyId, r]))

  // Observed behaviour averages per competency
  const training = d.training.get(emp.id) ?? []
  const obsScores: number[] = []
  const obsByComp = new Map<string, number[]>()
  const obsByName = new Map<string, number[]>()
  const dayAvgs: { date: Date | null; avg: number }[] = []
  for (const t of training) for (const day of t.days) {
    const s = day.scores.filter((x) => x.score != null)
    if (s.length) dayAvgs.push({ date: day.date, avg: avg(s.map((x) => x.score!))! })
    for (const x of s) {
      obsScores.push(x.score!)
      const comp = d.parameters.get(x.parameterId)?.competencyId
      if (comp) (obsByComp.get(comp) ?? obsByComp.set(comp, []).get(comp)!).push(x.score!)
      // Also by competency name, so a behaviour counts for a same-named competency in another framework
      const nm = comp ? d.competencies.get(comp)?.name.toLowerCase() : null
      if (nm) (obsByName.get(nm) ?? obsByName.set(nm, []).get(nm)!).push(x.score!)
    }
  }
  dayAvgs.sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0))

  const compIds = new Set([...roleReqMap.keys(), ...current.keys()])
  const competencies: CompetencyStatus[] = [...compIds].map((cid) => {
    const c = d.competencies.get(cid)!
    const cur = current.get(cid)
    const req = cur?.required ?? roleReqMap.get(cid)?.requiredLevel ?? null
    const priority = cur?.priority ?? roleReqMap.get(cid)?.priority ?? null
    const level = cur?.level ?? null
    return {
      competencyId: cid, code: c.code, name: c.name, category: c.category.name, framework: c.category.framework.name, frameworkCode: c.category.framework.code, minLevel: c.minLevel, maxLevel: c.maxLevel,
      level, selfLevel: self.get(cid) ?? null, required: req, priority, gap: level != null && req != null ? req - level : null,
      nextRequired: nextReqs.get(cid)?.requiredLevel ?? null, source: cur?.source ?? null, sourceDate: cur?.date ?? null,
      observedAvg: avg(obsByComp.get(cid) ?? obsByName.get(c.name.toLowerCase()) ?? []),
    }
  }).sort((a, b) => (a.framework === b.framework ? a.code.localeCompare(b.code) : a.framework.localeCompare(b.framework)))

  const rated = competencies.filter((c) => c.level != null)
  const gaps = rated.filter((c) => (c.gap ?? 0) > 0)
  const nextRows = [...nextReqs.values()].map((r) => ({ level: current.get(r.competencyId)?.level ?? null, required: r.requiredLevel, priority: r.priority }))

  const latestOf = (type: string) => [...assessments].reverse().find((a) => a.type === type)
  const selfA = latestOf('Self-Assessment')
  const interview = latestOf('Validation Interview') ?? latestOf('Consultant Assessment')
  const validations = d.validations.get(emp.id) ?? []
  const idp = d.idp.get(emp.id) ?? []
  const certs = d.certs.get(emp.id) ?? []
  const coaching = d.coaching.get(emp.id) ?? []
  const coachingDone = coaching.filter((c) => c.status === 'Completed' || c.status == null)
  const lastCoaching = coachingDone[coachingDone.length - 1]
  const evidence = d.evidence.get(emp.id) ?? []
  const enrollment = (d.enrollments.get(emp.id) ?? [])[0]
  const countable = training.filter((t) => !DROPPED_TRAINING.has(t.status))
  const trainingDone = training.filter((t) => DONE_TRAINING.has(t.status))
  const overdue = idp.filter((a) => a.plannedEnd && a.plannedEnd < today && !IDP_CLOSED.has(a.status ?? ''))
  const idpOpen = idp.filter((a) => a.status !== 'Cancelled')

  const roleReadiness = readiness(rated.map((c) => ({ level: c.level, required: c.required, priority: c.priority })))
  const nextRoleReadiness = nextRows.length && rated.length ? readiness(nextRows) : null
  const criticalGaps = gaps.filter((c) => c.priority === 'High').length

  // ---- observation days (behaviour scores), baseline, labs, coaching per segment, risk flags
  const days: ObsDay[] = training.flatMap((t) => t.days.map((day) => ({
    date: day.date, attendance: day.attendance,
    scores: day.scores.filter((x) => x.score != null).map((x) => { const p = d.parameters.get(x.parameterId)!; return { parameterId: x.parameterId, name: p?.name ?? x.parameterId, category: p?.category ?? '', score: x.score!, maxScore: p?.maxScore ?? 5 } }),
  }))).sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0))
  const baselines = d.baselines.get(emp.id) ?? []
  const baseline = baselines[baselines.length - 1] ?? null
  const observedRec = [...training].reverse().find((t) => t.validatedLevel != null || t.targetLevel != null)
  const observation = observationSummary(days, { selfAssessed: baselineScore(baseline), validated: observedRec?.validatedLevel ?? null, target: observedRec?.targetLevel ?? null })
  const trainingRows = training.map((t) => ({
    status: t.status, courseType: t.course.type, courseName: t.course.name, hours: t.hours ?? t.course.durationHours ?? null, attendancePct: t.attendancePct,
    labsCompleted: t.labsCompleted, labsTotal: t.labsTotal ?? t.course.labsTotal ?? null, date: t.completionDate ?? t.startDate ?? t.session?.startDate ?? t.assignedDate,
  }))
  const labs = labStats(trainingRows)
  const segmentProgress = Object.fromEntries(SEGMENTS.map(([seg, k]) => {
    const last = [...coaching].reverse().find((c) => (c as any)[`${k}Progress`] != null)
    return [seg, last ? (last as any)[`${k}Progress`] as number : null]
  })) as Record<string, number | null>
  const prog = enrollment?.program
  const cycle = prog?.startDate || prog?.endDate || enrollment?.startDate || enrollment?.endDate
    ? { start: enrollment?.startDate ?? prog?.startDate ?? null, end: enrollment?.endDate ?? prog?.endDate ?? null } : null
  const s5 = idp.filter((a) => a.segment?.startsWith('S5') && a.status !== 'Cancelled')
  const compRows: CompRow[] = competencies.map((c) => ({ name: c.name, frameworkKind: frameworkKind(c.frameworkCode, c.framework), level: c.level, required: c.required, priority: c.priority, maxLevel: c.maxLevel }))
  const inScope = !['Out of Scope', 'Left Company'].includes(emp.status ?? '')
  const risks: Flag[] = inScope ? evaluatePerson({
    employeeId: emp.id, name: emp.name, competencies: compRows, days, training: trainingRows,
    certTracks: certs.filter((c) => !['Cancelled', 'Not Required', 'Expired'].includes(c.status)).map((c) => c.certification.track ?? ''),
    coachingDates: coachingDone.map((c) => c.date), cycle, s5PlanHours: s5.length ? s5.reduce((t, a) => t + (a.estimatedHours ?? 0), 0) || null : null,
    selfAssessment: selfA?.status ?? 'Not Started', validationInterview: interview?.status ?? 'Not Started', report: interview?.reportStatus ?? 'Not Started',
  }, d.riskRules) : []
  const riskCount = (sev: string) => risks.filter((r) => r.severity === sev).length

  return {
    employeeId: emp.id,
    program: enrollment?.program?.name ?? null, batch: enrollment?.batch ?? null, enrollmentStatus: enrollment?.status ?? null,
    coach: enrollment?.coach?.name ?? null, consultant: enrollment?.consultant?.name ?? null,
    enrollmentId: enrollment?.id ?? null, coachId: enrollment?.coachId ?? null, consultantId: enrollment?.consultantId ?? null,
    selfAssessment: selfA?.status ?? 'Not Started', validationInterview: interview?.status ?? 'Not Started', report: interview?.reportStatus ?? 'Not Started',
    managerValidation: validations.length ? validations[validations.length - 1].status : null,
    competenciesRated: rated.filter((c) => c.required != null).length, competenciesRequired: roleReqs.length,
    gaps: gaps.length, criticalGaps, roleReadiness, nextRole: nextRole ? d.roles.get(nextRole)?.name ?? null : null, nextRoleReadiness,
    readinessBand: roleReadiness == null ? 'Not assessed'
      : nextRoleReadiness != null && nextRoleReadiness >= 0.92 && criticalGaps === 0 ? 'Ready for next role'
      : nextRoleReadiness != null && nextRoleReadiness >= 0.85 && criticalGaps <= 1 ? 'Ready in 6–12 months'
      : roleReadiness >= 0.85 ? 'Growing in role' : 'Needs support',
    idpActions: idpOpen.length, idpCompleted: idp.filter((a) => a.status === 'Completed').length, idpOverdue: overdue.length,
    idpProgress: avg(idpOpen.map((a) => a.progressPct ?? 0)),
    trainingAssigned: training.length, trainingCompleted: trainingDone.length,
    trainingCompletion: countable.length ? trainingDone.length / countable.length : null,
    trainingHours: trainingDone.reduce((s, t) => s + (t.hours ?? t.course.durationHours ?? 0), 0),
    observedDays: dayAvgs.length, observedAvg: avg(obsScores), latestDayAvg: dayAvgs.length ? dayAvgs[dayAvgs.length - 1].avg : null,
    dayTrend: dayAvgs.map((x) => x.avg),
    certsTotal: certs.length, certsCompleted: certs.filter((c) => c.status === 'Completed').length, certsActive: certs.filter((c) => CERT_ACTIVE.has(c.status)).length,
    coachingSessions: coachingDone.length, coachingMinutes: coachingDone.reduce((t, c) => t + (c.prepMinutes ?? 0) + (c.durationMinutes ?? 0) + (c.reportingMinutes ?? 0), 0), lastCoaching: lastCoaching?.date ?? null, coachingProgress: [...coaching].reverse().find((c) => c.progressPct != null)?.progressPct ?? null,
    nextReview: lastCoaching?.nextReviewDate ?? null,
    evidenceTotal: evidence.length, evidenceVerified: evidence.filter((e) => e.verificationStatus === 'Verified').length,
    baselineScore: baselineScore(baseline), baselineDate: baseline?.date ?? null,
    labsAssigned: labs.assigned, labsCompleted: labs.done, labsTotal: labs.total, labsShare: labs.share,
    segmentProgress, observation,
    risks, risksHigh: riskCount('High'), risksMedium: riskCount('Medium'), risksLow: riskCount('Low'), opportunities: riskCount('Opportunity'),
    criticalSkillGap: risks.some((r) => r.code === 'R01'),
    lastActivity: maxDate([emp.updatedAt, ...assessments.map((a) => a.updatedAt), ...validations.map((v) => v.updatedAt), ...idp.map((a) => a.updatedAt), ...training.map((t) => t.updatedAt), ...certs.map((c) => c.updatedAt), ...coaching.map((c) => c.updatedAt), ...evidence.map((e) => e.updatedAt)]),
    competencies,
  }
}
export type Summary = ReturnType<typeof summarize>

/** Group rules (R34 team, R35 section, R36 organisation-wide skill) for a set of people. */
export function groupRisks(d: Data, sums: { e: Data['employees'][number]; s: Summary }[]) {
  const members = sums.filter((x) => !['Out of Scope', 'Left Company'].includes(x.e.status ?? '')).map(({ e, s }) => ({
    employeeId: e.id, name: e.name, lineManager: e.lineManager?.name ?? e.lineManagerName ?? null, section: e.section,
    criticalGap: s.criticalSkillGap, competencies: s.competencies.map((c) => ({ name: c.name, frameworkKind: frameworkKind(c.frameworkCode, c.framework), level: c.level, required: c.required, priority: c.priority, maxLevel: c.maxLevel })),
  }))
  return evaluateGroup(members, d.riskRules)
}
