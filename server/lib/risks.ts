// Risk and opportunity rules (R01 … R36) and the observation programme summary.
// The logic per rule code lives here; the threshold, severity, wording, action and owner come from
// the RiskRule table (Library → Risk rules), so they can be tuned without code changes.
// Nothing is stored: flags are worked out from the records on every request and on export.

export type Rule = {
  code: string; name: string; panel: string; area: string; appliesTo: string; rule: string
  threshold: number | null; thresholdUnit: string | null; severity: string; executiveAction: string | null; owner: string | null; active: boolean
}
export type Flag = {
  code: string; name: string; severity: string; panel: string; area: string; owner: string | null; action: string | null
  detail: string; scope: 'Individual' | 'Group'; subject: string; employeeIds: string[]
}
export const SEVERITY_ORDER: Record<string, number> = { High: 1, Medium: 2, Low: 3, Opportunity: 4 }

/** Observation scores are 1–5 on the grid; the rule thresholds are on the 0–4 scale of the source. */
export const toFourScale = (score: number, maxScore: number) => (maxScore === 5 ? score - 1 : (score * 4) / maxScore)

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
const r2 = (x: number) => Math.round(x * 100) / 100
const fmt = (x: number | null | undefined, d = 2) => (x == null ? '–' : x.toFixed(d))
const list = (xs: string[], n = 5) => (xs.length > n ? `${xs.slice(0, n).join(', ')} and ${xs.length - n} more` : xs.join(', '))

// ------------------------------------------------------------------------------------------ inputs
export type CompRow = { name: string; frameworkKind: 'technical' | 'cross' | 'other'; level: number | null; required: number | null; priority: string | null; maxLevel: number }
export type ObsDay = { date: Date | null; attendance: string | null; scores: { parameterId: string; name: string; category: string; score: number; maxScore: number }[] }
export type TrainingRow = {
  status: string; courseType: string; courseName: string; hours: number | null; attendancePct: number | null
  labsCompleted: number | null; labsTotal: number | null; date: Date | null
}
export type PersonInput = {
  employeeId: string; name: string; competencies: CompRow[]; days: ObsDay[]; training: TrainingRow[]
  certTracks: string[] // tracks of active certification records (Professional, AI …)
  coachingDates: (Date | null)[]; cycle: { start: Date | null; end: Date | null } | null
  s5PlanHours: number | null
  selfAssessment: string; validationInterview: string; report: string
}

const inCycle = (d: Date | null, c: PersonInput['cycle']) => !c || !d || ((!c.start || d >= c.start) && (!c.end || d <= c.end))
const DROPPED = new Set(['Cancelled', 'Expired', 'Not Required'])
const CROSS_TYPES = new Set(['Workshop', 'Leadership Programme'])

/** Gap rows used by the capability rules: competencies with both a level and a required level. */
const rated = (p: PersonInput) => p.competencies.filter((c) => c.level != null && c.required != null && c.required > 0)

export function labStats(training: TrainingRow[]) {
  const labs = training.filter((t) => t.courseType === 'Immersive Lab' && !DROPPED.has(t.status))
  let done = 0, total = 0, unknown = 0
  for (const t of labs) {
    const tot = t.labsTotal ?? 0
    total += tot
    if (t.labsCompleted != null) done += t.labsCompleted
    else if (t.status === 'Completed') done += tot
    else if (t.status === 'In Progress') unknown++ // started, but the platform count was not entered
  }
  const completedAny = labs.some((t) => t.status === 'Completed')
  const started = labs.some((t) => t.status === 'In Progress' || ((t.labsCompleted ?? 0) > 0 && (t.labsCompleted ?? 0) < (t.labsTotal ?? Infinity)))
  return { assigned: labs.length, done, total, share: total ? done / total : null, started, noneCompleted: done === 0 && !unknown && !completedAny }
}

export function observationScores(days: ObsDay[]) {
  const scored = days.filter((d) => d.attendance !== 'Absent' && d.scores.length)
  const all = scored.flatMap((d) => d.scores.map((s) => toFourScale(s.score, s.maxScore)))
  const byCat = new Map<string, number[]>()
  for (const d of scored) for (const s of d.scores) (byCat.get(s.category) ?? byCat.set(s.category, []).get(s.category)!).push(toFourScale(s.score, s.maxScore))
  const dayAvg = scored.map((d) => avg(d.scores.map((s) => toFourScale(s.score, s.maxScore)))!)
  const la = scored.flatMap((d) => d.scores.filter((s) => s.category === 'Leadership' || s.category === 'Learning Agility').map((s) => toFourScale(s.score, s.maxScore)))
  return { scored, all, byCat, dayAvg, overall: avg(dayAvg), leadershipAgility: avg(la) }
}

// ------------------------------------------------------------------------------------------ individual rules
export function evaluatePerson(p: PersonInput, rules: Rule[]): Flag[] {
  const out: Flag[] = []
  const R = new Map(rules.filter((r) => r.active).map((r) => [r.code, r]))
  const fire = (code: string, detail: string) => {
    const r = R.get(code)
    if (!r) return
    out.push({ code, name: r.name, severity: r.severity, panel: r.panel, area: r.area, owner: r.owner, action: r.executiveAction, detail, scope: 'Individual', subject: p.name, employeeIds: [p.employeeId] })
  }
  const T = (code: string, dflt: number) => R.get(code)?.threshold ?? dflt
  const has = (code: string) => R.has(code)

  // ---- capability (ratings against the role)
  const rows = rated(p)
  const gapOf = (c: CompRow) => c.required! - c.level!
  if (rows.length) {
    const crit = rows.filter((c) => gapOf(c) >= T('R01', 2))
    if (has('R01') && crit.length) fire('R01', `${crit.length} skill${crit.length > 1 ? 's' : ''} ${T('R01', 2)}+ levels below: ${list(crit.map((c) => c.name))}`)
    const pri = rows.filter((c) => c.priority === 'High' && gapOf(c) >= T('R02', 2))
    if (has('R02') && pri.length) fire('R02', `High-priority skills ${T('R02', 2)}+ levels below: ${list(pri.map((c) => c.name))}`)
    const below = rows.filter((c) => gapOf(c) > 0)
    if (has('R03') && below.length / rows.length >= T('R03', 0.4)) fire('R03', `${below.length} of ${rows.length} assessed skills below required (${Math.round((below.length / rows.length) * 100)}%)`)
    const tech = rows.filter((c) => c.frameworkKind === 'technical'), cross = rows.filter((c) => c.frameworkKind === 'cross')
    const techGap = avg(tech.map(gapOf)), crossGap = avg(cross.map(gapOf))
    if (has('R04') && techGap != null && techGap >= T('R04', 1)) fire('R04', `Average technical gap ${fmt(techGap)} levels over ${tech.length} skills`)
    if (has('R05') && crossGap != null && crossGap >= T('R05', 0.5)) fire('R05', `Average cross-functional gap ${fmt(crossGap)} levels over ${cross.length} skills`)
    const above = rows.filter((c) => gapOf(c) < 0)
    if (has('R06') && above.length >= T('R06', 5) && !crit.length) fire('R06', `${above.length} skills above required and no critical gap`)
    const zero = rows.filter((c) => c.level === 0 && c.required! >= 1)
    if (has('R07') && zero.length) fire('R07', `No proficiency (level 0) in: ${list(zero.map((c) => c.name))}`)
    if (has('R08') && techGap != null && crossGap != null && techGap > 0 && crossGap > 0) fire('R08', `Average gap: technical ${fmt(techGap)}, cross-functional ${fmt(crossGap)}`)
    if (has('R09') && !below.length) fire('R09', `All ${rows.length} assessed skills at or above required`)
    const experts = p.competencies.filter((c) => c.level != null && c.level >= c.maxLevel)
    if (has('R10') && experts.length >= T('R10', 3)) fire('R10', `Maximum level in ${experts.length} skills: ${list(experts.map((c) => c.name))}`)
  }

  // ---- behaviour (observation days, scores on the 0–4 scale)
  const o = observationScores(p.days)
  if (o.all.length) {
    const lowCats = [...o.byCat.entries()].map(([k, v]) => [k, avg(v)!] as const).filter(([, v]) => v < T('R11', 3))
    if (has('R11') && lowCats.length) fire('R11', `Below ${T('R11', 3)}: ${lowCats.map(([k, v]) => `${k} ${fmt(v)}`).join(', ')}`)
    const low = new Set(o.scored.flatMap((d) => d.scores.filter((s) => toFourScale(s.score, s.maxScore) <= T('R12', 2)).map((s) => s.name)))
    if (has('R12') && low.size) fire('R12', `${low.size} behaviour${low.size > 1 ? 's' : ''} scored ${T('R12', 2)} or lower (0–4 scale): ${list([...low])}`)
    if (has('R14') && o.leadershipAgility != null && o.leadershipAgility < T('R14', 3)) fire('R14', `Leadership + Agility average ${fmt(o.leadershipAgility)} (0–4)`)
    if (has('R15') && o.overall != null && o.overall < T('R15', 3)) fire('R15', `Overall day average ${fmt(o.overall)} (0–4)`)
    if (o.dayAvg.length >= 2) {
      const delta = o.dayAvg[o.dayAvg.length - 1] - o.dayAvg[0]
      if (has('R16') && -delta >= T('R16', 0.3)) fire('R16', `Fell ${fmt(-delta)} from first to last day`)
      if (has('R17') && delta >= T('R17', 0.3)) fire('R17', `Rose ${fmt(delta)} from first to last day`)
    }
    if (has('R18') && o.overall != null && o.overall >= T('R18', 3.5)) fire('R18', `Average behaviour score ${fmt(o.overall)} (0–4)`)
  }
  const absentDays = p.days.filter((d) => d.attendance === 'Absent').length
  if (has('R13') && absentDays >= T('R13', 2)) fire('R13', `Absent on ${absentDays} observed training days`)

  // ---- development plan
  const labs = labStats(p.training)
  if (labs.assigned) {
    if (has('R19') && labs.noneCompleted && labs.done <= T('R19', 0)) fire('R19', `${labs.assigned} lab collection${labs.assigned > 1 ? 's' : ''} assigned, ${labs.done} labs completed`)
    if (has('R20') && labs.done > 0 && labs.share != null && labs.share < T('R20', 0.25)) fire('R20', `${labs.done} of ${labs.total} labs completed (${Math.round(labs.share * 100)}%)`)
    if (has('R27') && labs.started && labs.share != null && labs.share < 1) fire('R27', `Started, ${labs.done} of ${labs.total} labs completed`)
  }
  if (has('R21') && !p.certTracks.includes('Professional')) fire('R21', 'No professional certification in the plan')
  if (has('R22') && !p.certTracks.includes('AI')) fire('R22', 'No AI certification in the plan')
  const coached = p.coachingDates.filter((d) => inCycle(d, p.cycle))
  if (has('R23') && !coached.length) fire('R23', p.cycle ? 'No coaching session in the current programme cycle' : 'No coaching session recorded')
  if (has('R30') && coached.length === T('R30', 1)) fire('R30', 'Only one coaching session recorded')
  const absence = p.training.filter((t) => ['No-show', 'Deferred', 'Incomplete'].includes(t.status) || (t.attendancePct != null && t.attendancePct < 100))
  const partialDays = p.days.filter((d) => d.attendance === 'Partial' || d.attendance === 'Absent')
  if (has('R24') && (absence.length || partialDays.length)) fire('R24', [absence.length && `${absence.length} training record${absence.length > 1 ? 's' : ''} absent, partial or to reschedule`, partialDays.length && `${partialDays.length} observed day${partialDays.length > 1 ? 's' : ''} absent or partial`].filter(Boolean).join('; '))
  const absentSessions = p.training.filter((t) => t.status === 'No-show' || t.status === 'Deferred' || t.attendancePct === 0).length
  if (has('R28') && absentSessions >= T('R28', 2)) fire('R28', `Absent from ${absentSessions} training sessions`)
  const crossHours = p.training.filter((t) => CROSS_TYPES.has(t.courseType) && (t.status === 'Completed' || (t.attendancePct ?? 0) > 0)).reduce((s, t) => s + (t.hours ?? 0) * ((t.attendancePct ?? 100) / 100), 0)
  if (has('R25') && p.s5PlanHours && crossHours / p.s5PlanHours < T('R25', 0.5)) fire('R25', `${fmt(crossHours, 1)} of ${p.s5PlanHours} planned cross-functional hours attended`)
  const aiCourse = p.training.some((t) => t.courseType === 'Certification Preparation' && (t.status === 'Completed' || t.status === 'In Progress'))
  if (has('R26') && p.certTracks.includes('AI') && !aiCourse) fire('R26', 'AI certification assigned; certification course not attended')
  const attended = p.training.filter((t) => (t.status === 'Completed' || t.status === 'In Progress' || (t.attendancePct ?? 0) > 0) && inCycle(t.date, p.cycle))
  if (has('R29') && !attended.length) fire('R29', p.cycle ? 'No training attended in the current programme cycle' : 'No training attended')

  // ---- assessment milestones
  if (has('R31') && p.selfAssessment !== 'Completed') fire('R31', `Self-assessment: ${p.selfAssessment}`)
  if (has('R32') && p.validationInterview !== 'Completed') fire('R32', `Validation interview: ${p.validationInterview}`)
  if (has('R33') && p.report === 'Not Started') fire('R33', 'Validation report not started')
  return sortFlags(out)
}

export const sortFlags = (f: Flag[]) => f.sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9) || a.code.localeCompare(b.code))

// ------------------------------------------------------------------------------------------ group rules
export type GroupMember = { employeeId: string; name: string; lineManager: string | null; section: string | null; criticalGap: boolean; competencies: CompRow[] }
export function evaluateGroup(members: GroupMember[], rules: Rule[], minSize = 3): Flag[] {
  const R = new Map(rules.filter((r) => r.active).map((r) => [r.code, r]))
  const out: Flag[] = []
  const fire = (code: string, subject: string, detail: string, ids: string[]) => {
    const r = R.get(code)
    if (r) out.push({ code, name: r.name, severity: r.severity, panel: r.panel, area: r.area, owner: r.owner, action: r.executiveAction, detail, scope: 'Group', subject, employeeIds: ids })
  }
  const byKey = (key: (m: GroupMember) => string | null, code: string, what: string) => {
    if (!R.has(code)) return
    const groups = new Map<string, GroupMember[]>()
    for (const m of members) { const k = key(m); if (k) (groups.get(k) ?? groups.set(k, []).get(k)!).push(m) }
    for (const [k, g] of groups) {
      if (g.length < minSize) continue
      const crit = g.filter((m) => m.criticalGap)
      const share = crit.length / g.length
      if (share >= (R.get(code)!.threshold ?? 0.5)) fire(code, `${what}: ${k}`, `${crit.length} of ${g.length} people have a critical skill gap (${Math.round(share * 100)}%)`, crit.map((m) => m.employeeId))
    }
  }
  byKey((m) => m.lineManager, 'R34', 'Team of')
  byKey((m) => m.section, 'R35', 'Section')
  if (R.has('R36')) {
    const t = R.get('R36')!.threshold ?? 0.5
    const byComp = new Map<string, { n: number; below: string[] }>()
    for (const m of members) for (const c of m.competencies) {
      if (c.level == null || c.required == null || c.required <= 0) continue
      const x = byComp.get(c.name) ?? byComp.set(c.name, { n: 0, below: [] }).get(c.name)!
      x.n++
      if (c.required - c.level > 0) x.below.push(m.employeeId)
    }
    for (const [name, x] of byComp) if (x.n >= minSize && x.below.length / x.n >= t) fire('R36', `Skill: ${name}`, `${x.below.length} of ${x.n} assessed people below required (${Math.round((x.below.length / x.n) * 100)}%)`, x.below)
  }
  return sortFlags(out)
}

// ------------------------------------------------------------------------------------------ observation programme summary
export const DOMAINS = ['Personal Effectiveness', 'Communication', 'Collaboration', 'Problem Solving', 'Leadership', 'Learning Agility'] as const

/** The observation toolkit's summary for one person (scores on the 1–5 grid scale). */
export function observationSummary(days: ObsDay[], levels: { selfAssessed: number | null; validated: number | null; target: number | null }) {
  const scored = days.filter((d) => d.attendance !== 'Absent' && d.scores.length)
  if (!scored.length && !days.length) return null
  const dayAvg = scored.map((d) => avg(d.scores.map((s) => s.score))!)
  const sessions = scored.length
  const overall = avg(dayAvg)
  const domains = Object.fromEntries(DOMAINS.map((k) => [k, avg(scored.flatMap((d) => d.scores.filter((s) => s.category === k).map((s) => s.score)))]))
  const leadership = domains.Leadership
  const delta = dayAvg.length >= 2 ? dayAvg[dayAvg.length - 1] - dayAvg[0] : null
  const evidence = sessions >= 4 ? 'High' : sessions === 3 ? 'Moderate' : 'Limited'
  const potential = sessions < 3 ? 'Limited evidence'
    : overall! >= 3.4 && (leadership ?? 0) >= 3.2 && (delta ?? 0) >= 0.3 ? 'High potential'
    : overall! >= 3.0 && (leadership ?? 0) >= 2.8 && (delta ?? 0) >= 0.25 ? 'Emerging high-potential contributor' : 'Developing'
  const timeframe = potential === 'Limited evidence' ? 'Reassess after additional attendance' : potential === 'High potential' ? '12-18 months'
    : potential === 'Emerging high-potential contributor' ? '18-24 months' : (overall ?? 0) >= 3 ? '24+ months' : 'Not currently ready'
  const ranked = Object.entries(domains).filter(([, v]) => v != null) as [string, number][]
  ranked.sort((a, b) => b[1] - a[1])
  const strongest = ranked[0] ?? null, weakest = ranked[ranked.length - 1] ?? null
  const keyFindings = sessions < 3
    ? `Limited evidence across ${sessions} of ${Math.max(5, days.length)} sessions. Scores are preliminary and should not be interpreted as leadership readiness.`
    : `Observed across ${sessions} of ${Math.max(5, days.length)} sessions with an overall proficiency level of ${fmt(overall)}/5 and movement of ${delta == null ? '–' : `${delta >= 0 ? '+' : ''}${fmt(delta)}`}. Strongest domain: ${strongest?.[0]}; primary development domain: ${weakest?.[0]}.`
  const action = sessions < 3
    ? 'Arrange make-up coaching and collect at least three additional observed data points before potential ranking.'
    : `Use a manager-led development plan focused on ${weakest?.[0]}. Reinforce through structured workplace practice, concise updates, action tracking and follow-up observation.`
  const gapVsValidated = overall != null && levels.validated != null ? overall - levels.validated : null
  const gapVsTarget = overall != null && levels.target != null ? overall - levels.target : null
  const alignment = gapVsTarget == null ? null : gapVsTarget >= 0 ? 'Meets/exceeds current target' : gapVsTarget >= -0.25 ? 'Near target - monitor' : 'Below target - development required'
  const classification = sessions < 3 ? 'Insufficient Evidence' : potential === 'High potential' ? 'Stretch Candidate' : potential === 'Emerging high-potential contributor' ? 'Developing Potential' : 'Coaching Need'
  // per behaviour: average, finding, action cue
  const byParam = new Map<string, { name: string; category: string; scores: number[] }>()
  for (const d of scored) for (const s of d.scores) (byParam.get(s.parameterId) ?? byParam.set(s.parameterId, { name: s.name, category: s.category, scores: [] }).get(s.parameterId)!).scores.push(s.score)
  const parameters = [...byParam.values()].map((x) => {
    const a = avg(x.scores)!
    return { name: x.name, category: x.category, avg: r2(a), finding: a >= 3.5 ? 'Acceptable / strength' : a >= 2.5 ? 'Developing / monitor' : 'Development priority',
      actionCue: a >= 3.5 ? 'Sustain and use as a strength' : a >= 2.5 ? 'Reinforce through continued practice' : 'Coach deliberately and re-observe' }
  })
  return {
    sessionsAssessed: sessions, daysRecorded: days.length, absentDays: days.filter((d) => d.attendance === 'Absent').length,
    evidenceStrength: evidence, overallAvg: overall, domains, improvementDelta: delta, leadershipPotential: potential, timeframe,
    keyFindings, recommendedAction: action, strongestDomain: strongest?.[0] ?? null, developmentDomain: weakest?.[0] ?? null,
    selfAssessedLevel: levels.selfAssessed, validatedLevel: levels.validated, observedLevel: overall, targetLevel: levels.target,
    gapVsValidated, gapVsTarget, alignmentStatus: alignment, classification, dayAverages: dayAvg, parameters,
  }
}

/** Baseline score = average position (1–5) of the six self-ratings ("3 - Average" → 3). */
export function baselineScore(b: Record<string, unknown> | null | undefined) {
  if (!b) return null
  const vals = ['confidence', 'emotionalRegulation', 'communication', 'accountability', 'productivity', 'organisation']
    .map((k) => Number(String(b[k] ?? '').match(/^\s*(\d)/)?.[1])).filter((n) => n >= 1 && n <= 5)
  return vals.length ? avg(vals) : null
}
