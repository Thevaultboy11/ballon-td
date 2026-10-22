// The development roadmap: the journey every person follows once their data is reported, worked out
// from the records that already exist (nothing is stored). Ten stages in programme order, each with what
// is done, what is still open and a status; a dated timeline of every event; and roll-ups for a
// department, a section or a line manager's team.
import type { Data, Summary } from './metrics.ts'
import type { Flag } from './risks.ts'

export type StageStatus = 'done' | 'active' | 'risk' | 'todo'
export type Item = { text: string; date: Date | null; due?: boolean; overdue?: boolean }
export type Stage = {
  key: string; label: string; short: string; status: StageStatus; progress: number | null
  headline: string; date: Date | null; done: Item[]; open: Item[]; flags: { code: string; name: string; severity: string }[]
}
export type Lane = 'Assessment' | 'Plan' | 'Training' | 'Observation' | 'Certification' | 'Coaching' | 'Validation'
export type Event = { date: Date; end?: Date | null; lane: Lane; label: string; state: 'done' | 'planned' | 'missed'; stage: string }
export type Roadmap = {
  employeeId: string; name: string; jobTitle: string | null; department: string | null; section: string | null; lineManager: string | null
  goal: string; progress: number; currentStage: string | null; stages: Stage[]; events: Event[]; next: (Item & { stage: string })[]
  window: { start: Date; end: Date }
}

export const STAGES: { key: string; label: string; short: string; risks: string[] }[] = [
  { key: 'enrol', label: 'Enrolment', short: 'Enrol', risks: [] },
  { key: 'baseline', label: 'Baseline survey', short: 'Baseline', risks: [] },
  { key: 'assess', label: 'Assessment & report', short: 'Assess', risks: ['R31', 'R32', 'R33'] },
  { key: 'plan', label: 'Development plan', short: 'Plan', risks: ['R21', 'R22', 'R25'] },
  { key: 'learn', label: 'Training & labs', short: 'Learn', risks: ['R19', 'R20', 'R24', 'R27', 'R28', 'R29'] },
  { key: 'observe', label: 'Observed programme', short: 'Observe', risks: ['R11', 'R12', 'R13', 'R14', 'R15', 'R16'] },
  { key: 'certify', label: 'Certifications', short: 'Certify', risks: ['R26'] },
  { key: 'coach', label: 'Coaching', short: 'Coach', risks: ['R23', 'R30'] },
  { key: 'validate', label: 'Manager validation', short: 'Validate', risks: [] },
  { key: 'goal', label: 'Role readiness', short: 'Goal', risks: ['R01', 'R02', 'R03', 'R04', 'R05', 'R07', 'R08'] },
]

const SEGMENT_NAMES: [string, string][] = [['S1', 'S1 Professional certification'], ['S2', 'S2 Hands-on labs'], ['S3', 'S3 AI certification'], ['S4', 'S4 LMS learning'], ['S5', 'S5 Cross-functional training'], ['DTN', 'Department training need']]
const fmtD = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : '')
const pct = (x: number) => `${Math.round(x * 100)}%`
const clamp = (x: number) => Math.max(0, Math.min(1, x))
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
const by = <T>(xs: T[], f: (x: T) => Date | null | undefined) => [...xs].sort((a, b) => (f(a)?.getTime() ?? 0) - (f(b)?.getTime() ?? 0))

/** One person's roadmap. `s` is the summary from metrics.summarize for the same person. */
export function buildRoadmap(d: Data, emp: Data['employees'][number], s: Summary, today = new Date()): Roadmap {
  const enrollment = (d.enrollments.get(emp.id) ?? [])[0]
  const baselines = d.baselines.get(emp.id) ?? []
  const assessments = d.assessments.get(emp.id) ?? []
  const idp = (d.idp.get(emp.id) ?? []).filter((a) => a.status !== 'Cancelled')
  const training = d.training.get(emp.id) ?? []
  const certs = (d.certs.get(emp.id) ?? []).filter((c) => !['Cancelled', 'Not Required'].includes(c.status))
  const coaching = d.coaching.get(emp.id) ?? []
  const validations = d.validations.get(emp.id) ?? []
  const events: Event[] = []
  const ev = (date: Date | null | undefined, lane: Lane, label: string, state: Event['state'], stage: string, end?: Date | null) => { if (date) events.push({ date, end: end ?? null, lane, label, state, stage }) }
  const past = (x: Date | null | undefined) => !!x && x < today

  const stages: Stage[] = []
  const stage = (key: string, status: StageStatus, progress: number | null, headline: string, date: Date | null, done: Item[], open: Item[]) => {
    const meta = STAGES.find((x) => x.key === key)!
    const flags = s.risks.filter((f: Flag) => meta.risks.includes(f.code) && f.severity !== 'Opportunity').map((f) => ({ code: f.code, name: f.name, severity: f.severity }))
    const st: StageStatus = status !== 'done' && flags.some((f) => f.severity === 'High') ? 'risk' : status
    stages.push({ key, label: meta.label, short: meta.short, status: st, progress: progress == null ? null : clamp(progress), headline, date, done, open, flags })
  }

  // 1 · enrolment
  {
    const ok = enrollment && !['Nominated', 'Withdrawn'].includes(enrollment.status ?? '')
    stage('enrol', ok ? 'done' : enrollment ? 'active' : 'todo', ok ? 1 : 0,
      enrollment ? `${enrollment.program.name}${enrollment.batch ? ` · ${enrollment.batch}` : ''}` : 'Not enrolled in a programme',
      enrollment?.startDate ?? enrollment?.program.startDate ?? null,
      enrollment ? [{ text: `Enrolled: ${enrollment.program.name} (${enrollment.status ?? 'status not set'})`, date: enrollment.startDate }] : [],
      ok ? [] : [{ text: enrollment ? `Confirm enrolment (now ${enrollment.status})` : 'Enrol in a programme and assign a coach', date: null }])
    if (enrollment?.startDate) ev(enrollment.startDate, 'Plan', 'Programme start', past(enrollment.startDate) ? 'done' : 'planned', 'enrol')
    if (enrollment?.endDate) ev(enrollment.endDate, 'Plan', 'Programme end', past(enrollment.endDate) ? 'done' : 'planned', 'goal')
  }

  // 2 · baseline survey
  {
    const b = baselines[baselines.length - 1]
    stage('baseline', b ? 'done' : 'todo', b ? 1 : 0, b ? `Self-rating ${s.baselineScore?.toFixed(2) ?? '–'} / 5` : 'No baseline survey yet', b?.date ?? null,
      b ? [{ text: `Baseline survey · self-rating ${s.baselineScore?.toFixed(2) ?? '–'} / 5${b.mbti ? ` · ${b.mbti}` : ''}`, date: b.date }] : [],
      b ? [] : [{ text: 'Baseline survey before day 1 of the observed programme', date: null }])
    for (const x of baselines) ev(x.date, 'Assessment', 'Baseline survey', 'done', 'baseline')
  }

  // 3 · assessment & report
  {
    const latest = (types: string[]) => [...assessments].reverse().find((a) => types.includes(a.type))
    const self = latest(['Self-Assessment']), interview = latest(['Validation Interview', 'Consultant Assessment'])
    const steps: [string, boolean, string, Date | null][] = [
      ['Self-assessment', self?.status === 'Completed', self?.status ?? 'Not Started', self?.date ?? null],
      ['Validation interview', interview?.status === 'Completed', interview?.status ?? 'Not Started', interview?.date ?? null],
      ['Individual report delivered', interview?.reportStatus === 'Delivered', interview?.reportStatus ?? 'Not Started', interview?.date ?? null],
    ]
    const n = steps.filter((x) => x[1]).length
    stage('assess', n === 3 ? 'done' : n || self || interview ? 'active' : 'todo', n / 3, `${n} of 3 milestones`, interview?.date ?? self?.date ?? null,
      steps.filter((x) => x[1]).map(([t, , , dt]) => ({ text: t, date: dt })),
      steps.filter((x) => !x[1]).map(([t, , st, dt]) => ({ text: `${t} (${st})`, date: dt, due: !!dt && !past(dt) })))
    for (const a of assessments) ev(a.date, 'Assessment', a.type, a.status === 'Completed' ? 'done' : past(a.date) ? 'missed' : 'planned', 'assess')
  }

  // 4 · development plan
  {
    const doneA = idp.filter((a) => a.status === 'Completed')
    const missing = SEGMENT_NAMES.filter(([k]) => !idp.some((a) => a.segment?.startsWith(k)))
    const anySeg = idp.some((a) => a.segment)
    const open: Item[] = by(idp.filter((a) => a.status !== 'Completed'), (a) => a.plannedEnd).map((a) => {
      const overdue = !!a.plannedEnd && a.plannedEnd < today
      return { text: `${a.title}${a.segment ? ` · ${a.segment.split(' ')[0]}` : ''} · ${a.status ?? 'Planned'}${a.progressPct != null ? ` ${a.progressPct}%` : ''}`, date: a.plannedEnd, due: !overdue && !!a.plannedEnd, overdue }
    })
    if (!idp.length) open.push({ text: 'Agree the development plan with the coach (segments S1–S5 and the department training need)', date: null })
    else if (anySeg) for (const [, name] of missing) open.push({ text: `No action yet for ${name}`, date: null })
    stage('plan', !idp.length ? 'todo' : doneA.length === idp.length ? 'done' : 'active', s.idpProgress == null ? 0 : s.idpProgress / 100,
      idp.length ? `${doneA.length} of ${idp.length} actions done${s.idpOverdue ? ` · ${s.idpOverdue} overdue` : ''}` : 'No plan yet', idp[0]?.plannedStart ?? null,
      by(doneA, (a) => a.actualEnd ?? a.plannedEnd).map((a) => ({ text: a.title, date: a.actualEnd ?? a.plannedEnd })), open)
    for (const a of idp) {
      const state: Event['state'] = a.status === 'Completed' ? 'done' : a.plannedEnd && a.plannedEnd < today ? 'missed' : 'planned'
      ev(a.plannedStart ?? a.plannedEnd, 'Plan', a.title, state, 'plan', a.plannedStart && a.plannedEnd ? a.plannedEnd : null)
    }
  }

  // 5 · training & labs (everything except observed programmes)
  {
    const plain = training.filter((t) => !t.course.observed)
    const live = plain.filter((t) => !['Cancelled', 'Expired'].includes(t.status))
    const doneT = live.filter((t) => t.status === 'Completed')
    const when = (t: (typeof training)[number]) => t.completionDate ?? t.startDate ?? t.session?.startDate ?? t.assignedDate
    const open: Item[] = by(live.filter((t) => t.status !== 'Completed'), when).map((t) => {
      const dt = when(t), missed = ['No-show', 'Incomplete', 'Deferred'].includes(t.status)
      const labs = t.labsCompleted != null && (t.labsTotal ?? t.course.labsTotal) ? ` · ${t.labsCompleted}/${t.labsTotal ?? t.course.labsTotal} labs` : ''
      return { text: `${t.course.name} · ${t.status}${labs}`, date: dt, due: !missed && !!dt && !past(dt), overdue: missed }
    })
    const part = (t: (typeof training)[number]) => { const tot = t.labsTotal ?? t.course.labsTotal; return t.status === 'Completed' ? 1 : t.labsCompleted != null && tot ? t.labsCompleted / tot : 0 }
    const progress = live.length ? live.reduce((x, t) => x + part(t), 0) / live.length : 0
    stage('learn', !live.length ? 'todo' : doneT.length === live.length ? 'done' : 'active', progress,
      live.length ? `${doneT.length} of ${live.length} completed${s.labsTotal ? ` · labs ${s.labsCompleted}/${s.labsTotal}` : ''}` : 'Nothing assigned yet', null,
      by(doneT, when).map((t) => ({ text: `${t.course.name}${t.hours ?? t.course.durationHours ? ` · ${t.hours ?? t.course.durationHours} h` : ''}`, date: when(t) })),
      open.length || live.length ? open : [{ text: 'Assign courses, LMS learning and lab collections from the plan', date: null }])
    for (const t of plain) {
      const dt = t.session?.startDate ?? t.startDate ?? t.assignedDate
      const state: Event['state'] = t.status === 'Completed' ? 'done' : ['No-show', 'Incomplete', 'Deferred'].includes(t.status) ? 'missed' : 'planned'
      ev(dt, 'Training', t.course.name, state, 'learn', t.session?.endDate ?? t.completionDate ?? null)
    }
  }

  // 6 · observed programme
  {
    const obs = training.filter((t) => t.course.observed && !['Cancelled', 'Expired'].includes(t.status))
    const expected = Math.max(5, ...obs.map((t) => t.course.days ?? 0))
    const days = obs.flatMap((t) => t.days.map((x) => ({ ...x, course: t.course })))
    const scored = days.filter((x) => x.attendance !== 'Absent' && x.scores.some((sc) => sc.score != null))
    const o = s.observation
    const done: Item[] = by(scored, (x) => x.date).map((x) => {
      const sc = x.scores.filter((y) => y.score != null).map((y) => y.score!)
      const title = (x.course.dayTitles ?? '').split(/\r?\n/)[x.dayNumber - 1]?.trim()
      return { text: `Day ${x.dayNumber}${title ? ` · ${title}` : ''} · average ${avg(sc)!.toFixed(2)}`, date: x.date }
    })
    const open: Item[] = days.filter((x) => x.attendance === 'Absent').map((x) => ({ text: `Day ${x.dayNumber} absent: arrange a make-up session`, date: x.date, overdue: true }))
    if (!obs.length) open.push({ text: 'Join an observed programme (5 days, scored by the trainer)', date: null })
    else for (let n = scored.length + open.length + 1; n <= expected; n++) open.push({ text: `Day ${n} not observed yet`, date: null })
    if (o && o.sessionsAssessed >= 3) done.push({ text: `${o.leadershipPotential} · ${o.timeframe} · ${o.classification}`, date: null })
    stage('observe', !obs.length ? 'todo' : scored.length >= expected ? 'done' : 'active', obs.length ? scored.length / expected : 0,
      obs.length ? `${scored.length} of ${expected} days${o ? ` · ${o.evidenceStrength} evidence` : ''}` : 'Not started', obs[0]?.session?.startDate ?? null, done, open)
    for (const x of days) ev(x.date, 'Observation', `Day ${x.dayNumber}`, x.attendance === 'Absent' ? 'missed' : x.scores.some((y) => y.score != null) ? 'done' : 'planned', 'observe')
    for (const t of obs) if (!t.days.length) ev(t.session?.startDate ?? t.startDate, 'Observation', t.course.name, 'planned', 'observe', t.session?.endDate)
  }

  // 7 · certifications
  {
    const doneC = certs.filter((c) => c.status === 'Completed')
    const tracks = new Set(certs.map((c) => c.certification.track))
    const open: Item[] = certs.filter((c) => c.status !== 'Completed').map((c) => {
      const dt = c.examDate ?? c.targetDate
      return { text: `${c.certification.name} · ${c.status}${c.examDate ? ` · exam ${fmtD(c.examDate)}` : ''}`, date: dt, due: !!dt && !past(dt), overdue: c.status === 'Failed' || c.status === 'Expired' || (!!c.targetDate && past(c.targetDate)) }
    })
    if (!tracks.has('Professional')) open.push({ text: 'Choose a professional certification (S1)', date: null })
    if (!tracks.has('AI')) open.push({ text: 'Choose an AI certification (S3)', date: null })
    stage('certify', !certs.length ? 'todo' : doneC.length === certs.length ? 'done' : 'active', certs.length ? doneC.length / certs.length : 0,
      certs.length ? `${doneC.length} of ${certs.length} achieved` : 'None planned', null,
      doneC.map((c) => ({ text: c.certification.name, date: c.completionDate })), open)
    for (const c of certs) {
      if (c.completionDate) ev(c.completionDate, 'Certification', c.certification.name, 'done', 'certify')
      else if (c.examDate) ev(c.examDate, 'Certification', `${c.certification.name} exam`, past(c.examDate) ? 'missed' : 'planned', 'certify')
      else if (c.targetDate) ev(c.targetDate, 'Certification', `${c.certification.name} target`, past(c.targetDate) ? 'missed' : 'planned', 'certify')
    }
  }

  // 8 · coaching
  {
    const doneS = coaching.filter((c) => c.status === 'Completed' || c.status == null)
    const segs = Object.entries(s.segmentProgress).filter(([, v]) => v != null) as [string, number][]
    const progress = segs.length ? avg(segs.map(([, v]) => v / 100))! : s.coachingProgress != null ? s.coachingProgress / 100 : doneS.length ? Math.min(1, doneS.length / 6) : 0
    const open: Item[] = coaching.filter((c) => c.status === 'Scheduled' || c.status === 'Rescheduled').map((c) => ({ text: `${c.type} (${c.status})`, date: c.date, due: !past(c.date), overdue: past(c.date) }))
    if (s.nextReview && !open.some((x) => x.date?.getTime() === s.nextReview!.getTime())) open.push({ text: 'Next review', date: s.nextReview, due: !past(s.nextReview), overdue: past(s.nextReview) })
    for (const [k, v] of segs) if (v < 100) open.push({ text: `${SEGMENT_NAMES.find(([x]) => x === k)?.[1] ?? k}: ${v}%`, date: null })
    if (!coaching.length) open.push({ text: 'Kick-off session with the coach', date: null })
    stage('coach', !doneS.length ? 'todo' : progress >= 1 ? 'done' : 'active', progress,
      doneS.length ? `${doneS.length} session${doneS.length > 1 ? 's' : ''}${segs.length ? ` · segments ${pct(progress)}` : ''}` : 'No sessions yet', doneS[0]?.date ?? null,
      doneS.map((c) => ({ text: `${c.type}${c.progressPct != null ? ` · ${c.progressPct}%` : ''}`, date: c.date })), open)
    for (const c of coaching) ev(c.date, 'Coaching', c.type, c.status === 'Completed' || c.status == null ? 'done' : ['No-show', 'Cancelled'].includes(c.status) ? 'missed' : 'planned', 'coach')
  }

  // 9 · manager validation
  {
    const ok = validations.filter((v) => v.status === 'Approved')
    const last = validations[validations.length - 1]
    const name = (v: (typeof validations)[number]) => (v.competencyId ? d.competencies.get(v.competencyId)?.name ?? 'Skill' : 'Whole assessment')
    stage('validate', !validations.length ? 'todo' : validations.every((v) => v.status === 'Approved') ? 'done' : 'active', validations.length ? ok.length / validations.length : 0,
      validations.length ? `${ok.length} of ${validations.length} approved` : 'Not validated yet', last?.date ?? null,
      ok.map((v) => ({ text: `${name(v)}${v.validatedLevel != null ? ` · level ${v.validatedLevel}` : ''}`, date: v.date })),
      validations.filter((v) => v.status !== 'Approved').map((v) => ({ text: `${name(v)} · ${v.status}`, date: v.date, overdue: v.status === 'Rejected' }))
        .concat(validations.length ? [] : [{ text: 'Line manager confirms progress (monthly)', date: null, overdue: false }]))
    for (const v of validations) ev(v.date, 'Validation', name(v), v.status === 'Approved' ? 'done' : v.status === 'Rejected' ? 'missed' : 'planned', 'validate')
  }

  // 10 · goal: role readiness, then the next role
  {
    const rated = s.competencies.filter((c) => c.level != null && c.required != null)
    const met = rated.filter((c) => (c.gap ?? 0) <= 0)
    const gaps = rated.filter((c) => (c.gap ?? 0) > 0).sort((a, b) => (b.priority === 'High' ? 1 : 0) - (a.priority === 'High' ? 1 : 0) || (b.gap ?? 0) - (a.gap ?? 0))
    const open: Item[] = gaps.map((c) => ({ text: `${c.name}: level ${c.level} → ${c.required}${c.priority === 'High' ? ' · high priority' : ''}`, date: null, overdue: c.priority === 'High' }))
    const unrated = s.competencies.filter((c) => c.required != null && c.level == null).length
    if (unrated) open.push({ text: `${unrated} required skill${unrated > 1 ? 's' : ''} not rated yet`, date: null })
    if (s.nextRole) open.push({ text: `Next role ${s.nextRole}: readiness ${s.nextRoleReadiness == null ? '–' : pct(s.nextRoleReadiness)} (ready at 92% with no critical gap)`, date: null })
    // The goal is the next role when one is set: progress is half current-role, half next-role readiness.
    const goalDone = s.readinessBand === 'Ready for next role' || (!s.nextRole && (s.roleReadiness ?? 0) >= 1)
    const goalProgress = s.roleReadiness == null ? 0 : s.nextRoleReadiness != null ? (s.roleReadiness + s.nextRoleReadiness) / 2 : s.roleReadiness
    stage('goal', goalDone ? 'done' : s.roleReadiness == null ? 'todo' : 'active', goalProgress,
      s.roleReadiness == null ? 'Not assessed yet' : `${pct(s.roleReadiness)} in role${s.nextRoleReadiness != null ? ` · ${pct(s.nextRoleReadiness)} for next` : ''} · ${s.readinessBand}`, null,
      met.length ? [{ text: `${met.length} of ${rated.length} rated skills at or above the requirement`, date: null }] : [], open)
  }

  const weight = (x: Stage) => (x.status === 'done' ? 1 : x.progress ?? 0)
  // Where the person is now: the first stage under way (or at risk); otherwise the first not started.
  const current = stages.find((x) => x.status === 'active' || x.status === 'risk') ?? stages.find((x) => x.status === 'todo') ?? null
  const next = stages.flatMap((x) => x.open.filter((i) => i.date && (i.due || i.overdue)).map((i) => ({ ...i, stage: x.label })))
    .sort((a, b) => (b.overdue ? 1 : 0) - (a.overdue ? 1 : 0) || a.date!.getTime() - b.date!.getTime()).slice(0, 6)
  if (next.length < 3 && current) for (const i of current.open) if (next.length < 3 && !next.some((n) => n.text === i.text)) next.push({ ...i, stage: current.label })

  const dates = events.flatMap((e) => [e.date, e.end ?? e.date])
  const lo = new Date(Math.min(today.getTime(), ...dates.map((x) => x.getTime())))
  const hi = new Date(Math.max(today.getTime() + 30 * 864e5, ...dates.map((x) => x.getTime())))
  return {
    employeeId: emp.id, name: emp.name, jobTitle: emp.jobTitle, department: emp.department, section: emp.section,
    lineManager: emp.lineManager?.name ?? emp.lineManagerName ?? null,
    goal: s.nextRole ? `${emp.jobRole?.name ?? emp.jobTitle ?? 'Current role'} → ${s.nextRole}` : emp.jobRole?.name ?? emp.jobTitle ?? 'Role profile not set',
    progress: stages.reduce((t, x) => t + weight(x), 0) / stages.length,
    currentStage: current?.key ?? null, stages, events: events.sort((a, b) => a.date.getTime() - b.date.getTime()), next,
    window: { start: new Date(Date.UTC(lo.getUTCFullYear(), lo.getUTCMonth(), 1)), end: new Date(Date.UTC(hi.getUTCFullYear(), hi.getUTCMonth() + 1, 1)) },
  }
}

// ------------------------------------------------------------------------------------------ teams
export type GroupBy = 'department' | 'section' | 'manager' | 'client'
export const groupKey = (e: Data['employees'][number], g: GroupBy) =>
  g === 'department' ? e.department ?? 'No department' : g === 'section' ? e.section ?? 'No section'
  : g === 'manager' ? e.lineManager?.name ?? e.lineManagerName ?? 'No line manager' : e.client.name

/** Stage-by-stage roll-up for a group of roadmaps. */
export function rollup(maps: Roadmap[], today = new Date()) {
  const n = maps.length
  const stages = STAGES.map(({ key, label, short }) => {
    const xs = maps.map((m) => m.stages.find((s) => s.key === key)!)
    const count = (st: StageStatus) => xs.filter((x) => x.status === st).length
    return { key, label, short, done: count('done'), active: count('active'), risk: count('risk'), todo: count('todo'),
      progress: n ? xs.reduce((t, x) => t + (x.status === 'done' ? 1 : x.progress ?? 0), 0) / n : 0,
      here: maps.filter((m) => m.currentStage === key).length }
  })
  const soon = new Date(today.getTime() + 60 * 864e5)
  const upcoming = maps.flatMap((m) => m.stages.flatMap((s) => s.open.filter((i) => i.date && (i.overdue || (i.date >= today && i.date <= soon)))
    .map((i) => ({ ...i, stage: s.label, employeeId: m.employeeId, name: m.name }))))
    .sort((a, b) => (b.overdue ? 1 : 0) - (a.overdue ? 1 : 0) || a.date!.getTime() - b.date!.getTime())
  return { people: n, progress: n ? maps.reduce((t, m) => t + m.progress, 0) / n : 0, stages, upcoming,
    finished: maps.filter((m) => m.stages.find((s) => s.key === 'goal')!.status === 'done').length,
    atRisk: maps.filter((m) => m.stages.some((s) => s.status === 'risk')).length }
}
