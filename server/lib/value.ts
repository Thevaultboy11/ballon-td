// Value & ROI: what the programme cost, what it returned, and every KPI of the catalogue that today's data can
// measure. Nothing is stored; the rates and assumptions come from the ValueAssumption table (sourced defaults in
// server/seed/library/valueAssumptions.json) and the KPI definitions from server/seed/library/kpiCatalogue.json.
//
// Method (Phillips ROI, conservative):
//   Costs     training hours × cost per learning hour, coaching hours × coaching rate, exam fees, lab seats,
//             assessment & reporting per person, platform fee per client, and (optionally) participants' time
//   Benefits  1 capability gained: readiness points gained × loaded cost × value of competence × attribution × confidence
//               (readiness gained = re-assessment gain + gap closure the line managers validated since the last assessment)
//             2 internal fills: people ready now or in 6–12 months × fill rate × (hire cost − upskill cost per person) × confidence
//             3 retention: participants × attrition × reduction × replacement cost × confidence
//   ROI = (benefits − costs) ÷ costs · BCR = benefits ÷ costs · payback = costs ÷ monthly benefit
//   "Projected" assumes every gap that has an open plan action is closed and the planned training and exams happen.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { prisma } from '../db.ts'
import { loadData, summarize, PRIORITY_WEIGHT, type Data, type Summary } from './metrics.ts'
import { dashboardModel } from './dashboard.ts'

const CATALOGUE = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'seed', 'library', 'kpiCatalogue.json'), 'utf8')).kpis as Record<string, string>[]
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const median = (xs: number[]) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }
const DAY = 864e5
const OUT = new Set(['Out of Scope', 'Left Company'])

function readiness(rows: { level: number | null; required: number | null; priority: string | null }[]) {
  let num = 0, den = 0
  for (const r of rows) {
    if (r.required == null || r.required <= 0 || r.level == null) continue
    const w = PRIORITY_WEIGHT[r.priority ?? 'Medium'] ?? 2
    num += w * Math.min(r.level, r.required); den += w * r.required
  }
  return den ? num / den : null
}

export async function loadAssumptions() {
  const rows = await prisma.valueAssumption.findMany({ orderBy: { sortOrder: 'asc' } })
  const A = (code: string, dflt: number) => rows.find((r) => r.code === code)?.value ?? dflt
  return { rows, A }
}

type Line = { key: string; label: string; quantity: number; unit: string; rate: number | null; rateUnit: string; amount: number; projected: number; basis: string; formula: string }

export async function computeValue(clientId?: string, today = new Date()) {
  const { rows: assumptions, A } = await loadAssumptions()
  const d = await loadData({ clientId })
  const emps = d.employees.filter((e) => !OUT.has(e.status ?? ''))
  const sums = new Map<string, Summary>(emps.map((e) => [e.id, summarize(d, e, today)]))
  const dash = await dashboardModel(clientId)
  const rowsById = new Map(dash.people.map((p) => [p.id, p]))
  const basisOf = (code: string) => assumptions.find((a) => a.code === code)?.basis ?? 'Assumption'
  const hourly = A('LOADED_SALARY', 95000) / A('WORK_HOURS', 1720)
  const includeTime = A('INCLUDE_TIME', 1) >= 0.5

  // ------------------------------------------------------------------ capability per person
  const people = emps.map((e) => {
    const s = sums.get(e.id)!
    const assessments = (d.assessments.get(e.id) ?? []).filter((a) => a.type !== 'Self-Assessment' && (a.status === 'Completed' || a.status == null))
    const first = assessments[0], last = assessments[assessments.length - 1]
    const baseRows = first ? first.ratings.map((r) => ({ level: r.level, required: r.requiredLevel, priority: r.priority })) : []
    const baseline = readiness(baseRows)
    const current = s.roleReadiness
    const reassessGain = baseline != null && current != null && first !== last ? Math.max(0, current - baseline) : 0
    // gap closure the line manager validated after the latest assessment (progress 1–5 → share of the gap closed)
    const after = (last?.date?.getTime() ?? 0)
    const latestVal = new Map<string, number>()
    for (const v of d.validations.get(e.id) ?? []) if (v.competencyId && v.validatedLevel != null && v.status === 'Approved' && (v.date?.getTime() ?? 0) > after) latestVal.set(v.competencyId, v.validatedLevel)
    const comps = s.competencies.filter((c) => c.required != null)
    const validated = comps.map((c) => {
      const p = latestVal.get(c.competencyId)
      const gap = c.level != null && c.required != null ? c.required - c.level : 0
      return { level: c.level != null && p != null && gap > 0 ? c.level + gap * Math.max(0, Math.min(1, (p - 1) / 4)) : c.level, required: c.required, priority: c.priority }
    })
    const validatedReadiness = readiness(validated)
    const validatedGain = current != null && validatedReadiness != null ? Math.max(0, validatedReadiness - current) : 0
    const planned = new Set((d.idp.get(e.id) ?? []).filter((a) => a.competencyId && !['Cancelled', 'Completed'].includes(a.status ?? '')).map((a) => a.competencyId!))
    const projectedReadiness = readiness(comps.map((c) => ({ level: c.level != null && planned.has(c.competencyId) ? Math.max(c.level, c.required!) : c.level, required: c.required, priority: c.priority })))
    const projectedGain = current != null && projectedReadiness != null ? Math.max(validatedGain, projectedReadiness - current) + reassessGain : 0
    return { e, s, baseline, current, gain: reassessGain + validatedGain, reassessGain, validatedGain, projectedGain, validatedCount: latestVal.size, gapsPlanned: planned.size }
  })
  const participants = people.filter((p) => (d.enrollments.get(p.e.id) ?? []).length || p.s.roleReadiness != null).length

  // ------------------------------------------------------------------ costs
  const T = emps.flatMap((e) => d.training.get(e.id) ?? [])
  const perHour = (t: (typeof T)[number]) => (t.course.durationHours && t.course.days ? t.course.durationHours / t.course.days : null)
  const attendedHours = (t: (typeof T)[number]) => {
    if (t.status === 'Completed') return t.hours ?? t.course.durationHours ?? 0
    const days = t.days.filter((x) => x.attendance === 'Present' || x.attendance === 'Partial').length
    return days && perHour(t) ? days * perHour(t)! : t.hours ?? 0
  }
  const DROPPED = new Set(['Cancelled', 'Deferred', 'Expired', 'No-show'])
  const trainHours = sum(T.map(attendedHours))
  const plannedHours = sum(T.filter((t) => !DROPPED.has(t.status) && t.status !== 'Completed').map((t) => Math.max(0, (t.course.durationHours ?? t.hours ?? 0) - attendedHours(t))))
  const C = emps.flatMap((e) => d.coaching.get(e.id) ?? []).filter((c) => c.status === 'Completed' || c.status == null)
  const coachHours = sum(C.map((c) => (c.prepMinutes ?? 0) + (c.durationMinutes ?? 0) + (c.reportingMinutes ?? 0))) / 60
  const coacheeHours = sum(C.map((c) => c.durationMinutes ?? 0)) / 60
  const certs = emps.flatMap((e) => d.certs.get(e.id) ?? [])
  const examsPaid = certs.filter((c) => ['Completed', 'Exam Scheduled', 'Failed'].includes(c.status)).length
  const examsPlanned = certs.filter((c) => ['Assigned', 'Not Started', 'Registered', 'In Progress'].includes(c.status)).length
  const labPeople = new Set(T.filter((t) => t.course.type === 'Immersive Lab' || t.labsTotal != null || t.course.labsTotal != null).map((t) => t.employeeId)).size
  const assessed = people.filter((p) => p.current != null).length
  const clients = new Set(emps.map((e) => e.clientId)).size

  const line = (key: string, label: string, quantity: number, unit: string, rateCode: string | null, rate: number | null, rateUnit: string, projectedQty: number, formula: string): Line =>
    ({ key, label, quantity, unit, rate, rateUnit, amount: quantity * (rate ?? 0), projected: (quantity + projectedQty) * (rate ?? 0), basis: rateCode ? basisOf(rateCode) : 'Calculated', formula })
  const costs: Line[] = [
    line('training', 'Training delivery', trainHours, 'learning hours', 'COST_LEARNING_HOUR', A('COST_LEARNING_HOUR', 165), 'per hour', plannedHours, 'Completed and attended course hours × cost per learning hour'),
    line('coaching', 'Coaching', coachHours, 'coach hours', 'COACH_RATE', A('COACH_RATE', 150), 'per hour', 0, 'Preparation + session + reporting minutes ÷ 60 × coaching rate'),
    line('exams', 'Certification exams', examsPaid, 'exams', 'CERT_EXAM', A('CERT_EXAM', 999), 'per exam', examsPlanned, 'Certifications achieved, failed or with an exam booked × exam fee'),
    line('labs', 'Hands-on lab seats', labPeople, 'people', 'LAB_SEAT', A('LAB_SEAT', 2500), 'per seat per year', 0, 'People with a lab collection × seat price'),
    line('assessment', 'Assessment & readiness reporting', assessed, 'people assessed', 'ASSESS_PER_PERSON', A('ASSESS_PER_PERSON', 450), 'per person', 0, 'People with a completed validation × reporting cost per person'),
    line('platform', 'Platform & executive dashboard', clients, clients === 1 ? 'client' : 'clients', 'PLATFORM_FEE', A('PLATFORM_FEE', 35000), 'per client per year', 0, 'Clients in scope × annual platform fee'),
  ]
  if (includeTime) costs.push(line('time', "Participants' time", trainHours + coacheeHours, 'hours away from work', 'LOADED_SALARY', hourly, 'loaded cost per hour', plannedHours, '(Training hours + coaching session hours) × loaded annual cost ÷ working hours'))
  const cost = sum(costs.map((c) => c.amount)), costProjected = sum(costs.map((c) => c.projected))

  // ------------------------------------------------------------------ benefits
  const salary = A('LOADED_SALARY', 95000), compValue = A('COMPETENCE_VALUE', 1), attribution = A('ATTRIBUTION', 0.5), confidence = A('CONFIDENCE', 0.8)
  const gainPts = sum(people.map((p) => p.gain)), gainPtsProjected = sum(people.map((p) => p.projectedGain))
  const ready = dash.people.filter((p) => p.band === 'ready' || p.band === 'soon').length
  const upskillPerPerson = participants ? cost / participants : 0
  const fillValue = Math.max(0, A('HIRE_COST', 28500) - upskillPerPerson)
  const fills = ready * A('INTERNAL_FILL', 0.5)
  const retained = participants * A('ATTRITION', 0.15) * A('ATTRITION_CUT', 0.2)
  const capFactor = salary * compValue * attribution * confidence
  const benefits = [
    { key: 'capability', label: 'Capability gained', quantity: gainPts * 100, unit: 'readiness points (sum over people)', amount: gainPts * capFactor, projected: gainPtsProjected * capFactor,
      basis: 'Calculated + assumptions', formula: `Readiness points gained × loaded cost × value of competence (${compValue * 100}%) × attribution (${attribution * 100}%) × confidence (${confidence * 100}%)`,
      detail: `${people.filter((p) => p.gain > 0).length} people improved: ${people.filter((p) => p.reassessGain > 0).length} by re-assessment, ${people.filter((p) => p.validatedGain > 0).length} by manager-validated gap closure since their last assessment. Projected: every gap with an open plan action closed.` },
    { key: 'fills', label: 'Hiring cost avoided (internal fills)', quantity: fills, unit: 'expected internal fills', amount: fills * fillValue * confidence, projected: fills * fillValue * confidence,
      basis: 'Calculated + assumptions', formula: `People ready now or in 6–12 months (${ready}) × fill rate × (hire cost − upskill cost per person ${Math.round(upskillPerPerson)}) × confidence`, detail: '' },
    { key: 'retention', label: 'Attrition avoided (retention)', quantity: retained, unit: 'leavers avoided per year', amount: retained * A('HIRE_COST', 28500) * confidence, projected: retained * A('HIRE_COST', 28500) * confidence,
      basis: 'Assumptions', formula: `Participants (${participants}) × attrition × reduction × replacement cost × confidence`, detail: 'Replace the attrition assumptions with measured retention after 12 months (KPI K032).' },
  ]
  const benefit = sum(benefits.map((b) => b.amount)), benefitProjected = sum(benefits.map((b) => b.projected))
  const totals = (c: number, b: number) => ({ cost: c, benefit: b, net: b - c, roi: c ? (b - c) / c : null, bcr: c ? b / c : null, paybackMonths: b > 0 ? c / (b / 12) : null })
  const years = [1, 2, 3].map((y) => ({ years: y, ...totals(cost + (y - 1) * (costs.find((x) => x.key === 'platform')!.amount + costs.find((x) => x.key === 'labs')!.amount), benefit * y) }))

  // value by department
  const byDept = new Map<string, typeof people>()
  for (const p of people) { const k = p.e.department ?? 'No department'; (byDept.get(k) ?? byDept.set(k, []).get(k)!).push(p) }
  const departments = [...byDept.entries()].map(([department, ps]) => {
    const share = ps.length / Math.max(1, people.length)
    const cap = sum(ps.map((p) => p.gain)) * capFactor
    const fill = dash.people.filter((r) => (r.band === 'ready' || r.band === 'soon') && r.department === department).length * A('INTERNAL_FILL', 0.5) * fillValue * confidence
    const ret = ps.length * A('ATTRITION', 0.15) * A('ATTRITION_CUT', 0.2) * A('HIRE_COST', 28500) * confidence
    const c = cost * share
    return { department, people: ps.length, cost: c, benefit: cap + fill + ret, net: cap + fill + ret - c, readinessGain: avg(ps.map((p) => p.gain)), readiness: avg(ps.filter((p) => p.current != null).map((p) => p.current!)) }
  }).sort((a, b) => b.net - a.net)

  const kpis = await computeKpis({ d, emps, sums, people, dash, rowsById, today, money: { cost, benefit, participants, trainHours, coachHours, examsPaid, examFee: A('CERT_EXAM', 999), gainPts, upskillPerPerson, fillValue, fills, hireCost: A('HIRE_COST', 28500), coachRate: A('COACH_RATE', 150) } })

  return {
    scope: { clientId: clientId ?? null, people: emps.length, participants, assessed, clients: dash.clients },
    currency: { code: assumptions.find((a) => a.code === 'CURRENCY')?.unit || 'USD', rate: A('CURRENCY', 1) },
    assumptions, costs, benefits,
    realised: totals(cost, benefit), projected: totals(costProjected, benefitProjected), years,
    breakEven: {
      // average readiness points each assessed person must gain for benefits to equal costs (other benefits unchanged)
      readinessPtsPerPerson: capFactor && assessed ? Math.max(0, (cost - benefits[1].amount - benefits[2].amount) / capFactor / assessed) * 100 : null,
      currentPtsPerPerson: assessed ? (gainPts / assessed) * 100 : null,
      projectedPtsPerPerson: assessed ? (gainPtsProjected / assessed) * 100 : null,
      headroomPtsPerPerson: avg(people.filter((p) => p.current != null).map((p) => 1 - p.current!)) == null ? null : avg(people.filter((p) => p.current != null).map((p) => 1 - p.current!))! * 100,
    },
    delivered: {
      trainHours, coachHours, certsAchieved: certs.filter((c) => c.status === 'Completed').length, examsBooked: examsPaid, labPeople,
      readinessNow: avg(people.filter((p) => p.current != null).map((p) => p.current!)), readyForNext: ready,
      validatedCompetencies: sum(people.map((p) => p.validatedCount)), improvedPeople: people.filter((p) => p.gain > 0).length,
      behaviourDelta: avg(emps.map((e) => sums.get(e.id)!.observation?.improvementDelta).filter((v): v is number => v != null)),
    },
    inputs: { hourly, salary, readinessGainAvg: avg(people.map((p) => p.gain)), readinessGainProjectedAvg: avg(people.map((p) => p.projectedGain)), ready, upskillPerPerson, trainHours, coachHours, plannedHours },
    departments, kpis,
    catalogue: {
      total: CATALOGUE.length, measured: kpis.filter((k) => k.value != null).length,
      byAvailability: { Yes: CATALOGUE.filter((k) => k.availability === 'Yes').length, Partly: CATALOGUE.filter((k) => k.availability === 'Partly').length, No: CATALOGUE.filter((k) => k.availability === 'No').length },
      notMeasured: CATALOGUE.filter((k) => !kpis.some((x) => x.id === k.id && x.value != null)).map((k) => ({ id: k.id, name: k.name, audience: k.audience, dataNeeded: k.dataNeeded, available: k.available, commercialValue: k.commercialValue })),
    },
  }
}

// ------------------------------------------------------------------------------------------ KPIs
type Kpi = { id: string; name: string; audience: string; value: number | null; display: string; unit: string; note?: string; formula: string; benchmark: string; availability: string; leadingLagging: string; question: string; tone?: 'good' | 'warn' | 'bad' }

async function computeKpis(x: {
  d: Data; emps: Data['employees']; sums: Map<string, Summary>; people: { e: Data['employees'][number]; s: Summary; baseline: number | null; current: number | null; gain: number; reassessGain: number; validatedGain: number; projectedGain: number }[]
  dash: Awaited<ReturnType<typeof dashboardModel>>; rowsById: Map<string, any>; today: Date
  money: { cost: number; benefit: number; participants: number; trainHours: number; coachHours: number; examsPaid: number; examFee: number; gainPts: number; upskillPerPerson: number; fillValue: number; fills: number; hireCost: number; coachRate: number }
}): Promise<Kpi[]> {
  const { d, emps, sums, people, dash, today, money } = x
  const S = [...sums.values()]
  const assessed = S.filter((s) => s.roleReadiness != null)
  const all = <T>(get: (id: string) => T[] | undefined) => emps.flatMap((e) => get(e.id) ?? [])
  const T = all((id) => d.training.get(id)), C = all((id) => d.coaching.get(id)), V = all((id) => d.validations.get(id)), EV = all((id) => d.evidence.get(id))
  const CR = all((id) => d.certs.get(id)), IDP = all((id) => d.idp.get(id)), AS = all((id) => d.assessments.get(id))
  const pct = (v: number | null) => (v == null ? '–' : `${Math.round(v * 100)}%`)
  const n = (v: number | null, dgt = 0) => (v == null ? '–' : v.toLocaleString('en-US', { maximumFractionDigits: dgt, minimumFractionDigits: dgt }))
  const out: Kpi[] = []
  const add = (id: string, value: number | null, display: string, unit = '', note?: string, tone?: Kpi['tone']) => {
    const k = CATALOGUE.find((c) => c.id === id)!
    out.push({ id, name: k.name, audience: k.audience, value, display, unit, note, formula: k.formula, benchmark: k.benchmark, availability: k.availability, leadingLagging: k.leadingLagging, question: k.question, tone })
  }
  const rated = assessed.flatMap((s) => s.competencies.filter((c) => c.level != null && c.required != null))
  const critical = rated.filter((c) => c.priority === 'High' && (c.gap ?? 0) > 0).length
  const roleR = avg(assessed.map((s) => s.roleReadiness!))

  // ---- Board / CEO
  add('K001', roleR, pct(roleR), 'weighted', `${assessed.length} assessed people`, roleR == null ? undefined : roleR >= 0.9 ? 'good' : roleR >= 0.8 ? 'warn' : 'bad')
  add('K002', critical, n(critical), 'requirements', `${assessed.filter((s) => s.criticalGaps).length} people affected`, critical ? 'bad' : 'good')
  const critPos = dash.people.filter((p) => p.criticalPosition)
  const bench = critPos.length ? sum(critPos.map((p) => p.successors.length)) / critPos.length : null
  add('K003', bench, n(bench, 2), 'ready successors per critical role', 'Critical roles = Lead / Manager / Head / Executive role profiles', bench != null && bench < 1 ? 'warn' : 'good')
  const covered = critPos.filter((p) => p.successors.length).length
  add('K004', critPos.length ? covered / critPos.length : null, pct(critPos.length ? covered / critPos.length : null), '', `${covered} of ${critPos.length} critical positions have a ready successor`, critPos.length && covered / critPos.length < 0.5 ? 'bad' : 'warn')
  add('K005', dash.singles.length, n(dash.singles.length), 'competencies', 'Held at expert level by one person in their section', dash.singles.length ? 'warn' : 'good')
  add('K006', money.cost ? (money.benefit - money.cost) / money.cost : null, pct(money.cost ? (money.benefit - money.cost) / money.cost : null), 'ROI', 'Realised to date, 12-month benefit; see the ROI section for the method and assumptions', money.cost && money.benefit < money.cost ? 'bad' : 'good')
  const gainAvg = avg(people.filter((p) => p.current != null).map((p) => p.gain))
  add('K008', gainAvg, gainAvg == null ? '–' : `+${n(gainAvg * 100, 1)} pts`, 'readiness points per person', 'Re-assessment gain plus manager-validated gap closure since the last assessment')
  const bands = ['Ready for next role', 'Ready in 6–12 months', 'Growing in role', 'Needs support', 'Not assessed'].map((b) => S.filter((s) => s.readinessBand === b).length)
  add('K200', bands[0] + bands[1], `${bands[0]} · ${bands[1]} · ${bands[2]} · ${bands[3]}`, 'ready · 6–12 m · growing · support')
  // ---- CISO
  add('K014', dash.singles.length, n(dash.singles.length), 'competencies')
  const in90 = CR.filter((c) => c.expiryDate && c.expiryDate >= today && c.expiryDate.getTime() - today.getTime() <= 90 * 864e5).length
  add('K017', in90, n(in90), 'certifications expiring in 90 days', undefined, in90 ? 'warn' : 'good')
  const attempts = CR.filter((c) => ['Completed', 'Failed'].includes(c.status))
  add('K203', attempts.length ? attempts.filter((c) => c.status === 'Completed').length / attempts.length : null, pct(attempts.length ? attempts.filter((c) => c.status === 'Completed').length / attempts.length : null), 'pass rate', `${attempts.length} exams with a result`)
  const cloud = rated.filter((c) => /cloud/i.test(c.name))
  add('K130', cloud.length ? readinessOf(cloud) : null, pct(cloud.length ? readinessOf(cloud) : null), 'readiness on cloud competencies', `${cloud.length} ratings`)
  const ai = rated.filter((c) => /\bAI\b|artificial intelligence|machine learning/i.test(c.name))
  add('K129', ai.length ? readinessOf(ai) : null, pct(ai.length ? readinessOf(ai) : null), 'readiness on AI competencies', `${ai.length} ratings`)
  // ---- CHRO
  const promo = assessed.filter((s) => (s.nextRoleReadiness ?? 0) >= 0.8).length
  add('K028', promo, n(promo), 'people ≥ 80% ready for the next role')
  const observed = S.filter((s) => s.observation && s.observation.sessionsAssessed >= 1)
  const hipo = observed.filter((s) => s.observation!.leadershipPotential === 'High potential').length
  add('K030', observed.length ? hipo / observed.length : null, pct(observed.length ? hipo / observed.length : null), '', `${hipo} of ${observed.length} observed people`)
  const eng = S.map((s) => avg([s.trainingCompletion, s.idpProgress == null ? null : s.idpProgress / 100, s.coachingSessions ? Math.min(1, s.coachingSessions / 3) : 0].filter((v): v is number => v != null)))
  const engAvg = avg(eng.filter((v): v is number => v != null))
  add('K036', engAvg, pct(engAvg), 'index', 'Average of training completion, plan progress and coaching attendance (3 sessions = 100%)')
  const clarity = emps.filter((e) => sums.get(e.id)!.nextRole && (d.idp.get(e.id) ?? []).length).length
  add('K037', emps.length ? clarity / emps.length : null, pct(emps.length ? clarity / emps.length : null), '', 'People with a next role and a development plan')
  add('K038', dash.people.filter((p) => p.potential != null && p.assessed).length, `${dash.people.filter((p) => p.potential != null && p.assessed).length} placed`, 'people in the 9-box', 'See Teams → Performance × potential')
  const risky = S.filter((s) => s.risksHigh > 0 && (s.idpOverdue > 0 || (s.idpProgress ?? 0) < 40)).length
  add('K123', risky, n(risky), 'people', 'High risk flag plus overdue plan actions or plan progress under 40%', risky ? 'warn' : 'good')
  // ---- L&D
  const deltas = S.map((s) => s.observation?.improvementDelta).filter((v): v is number => v != null)
  add('K041', avg(deltas), avg(deltas) == null ? '–' : `${avg(deltas)! >= 0 ? '+' : ''}${n(avg(deltas), 2)}`, 'observed score change, first to last day (1–5)', `${deltas.length} people`)
  add('K044', money.trainHours ? (money.gainPts * 100) / money.trainHours : null, money.trainHours ? n((money.gainPts * 100) / money.trainHours, 2) : '–', 'readiness points per training hour')
  const countable = T.filter((t) => !['Cancelled', 'Deferred', 'Expired'].includes(t.status))
  const done = T.filter((t) => t.status === 'Completed')
  add('K046', countable.length ? done.length / countable.length : null, pct(countable.length ? done.length / countable.length : null), '', `${done.length} of ${countable.length}`)
  const att = T.filter((t) => t.attendancePct != null).map((t) => t.attendancePct! / 100)
  add('K047', avg(att), pct(avg(att)), 'average attendance')
  const reg = T.filter((t) => !['Cancelled', 'Assigned', 'Not Started'].includes(t.status))
  add('K048', reg.length ? T.filter((t) => t.status === 'No-show').length / reg.length : null, pct(reg.length ? T.filter((t) => t.status === 'No-show').length / reg.length : null), '', undefined)
  const slopes = S.map((s) => { const a = s.observation?.dayAverages ?? []; return a.length >= 2 ? (a[a.length - 1] - a[0]) / (a.length - 1) : null }).filter((v): v is number => v != null)
  add('K051', avg(slopes), avg(slopes) == null ? '–' : `${avg(slopes)! >= 0 ? '+' : ''}${n(avg(slopes), 2)}`, 'score per day')
  add('K052', emps.length ? money.trainHours / emps.length : null, n(emps.length ? money.trainHours / emps.length : null, 1), 'hours per person', 'Benchmark: 13.7 formal learning hours per employee (ATD 2025)')
  const due = IDP.filter((a) => a.plannedEnd && a.plannedEnd < today && a.status !== 'Cancelled')
  const onTime = due.filter((a) => a.status === 'Completed' && (!a.actualEnd || a.actualEnd <= a.plannedEnd!))
  add('K053', due.length ? onTime.length / due.length : null, pct(due.length ? onTime.length / due.length : null), '', `${onTime.length} of ${due.length} due actions done on time`)
  const overdue = IDP.filter((a) => a.plannedEnd && a.plannedEnd < today && !['Completed', 'Cancelled'].includes(a.status ?? '')).length
  add('K054', overdue, n(overdue), 'actions', undefined, overdue ? 'warn' : 'good')
  const byType = new Map<string, number>()
  for (const a of IDP.filter((a) => a.status !== 'Cancelled')) byType.set(a.actionType, (byType.get(a.actionType) ?? 0) + (a.estimatedHours ?? 0))
  const totalH = sum([...byType.values()])
  const mix = [...byType.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} ${Math.round((v / (totalH || 1)) * 100)}%`).join(' · ')
  add('K055', totalH || null, mix || '–', 'share of planned hours')
  const seg = S.map((s) => avg(Object.values(s.segmentProgress).filter((v): v is number => v != null).map((v) => v / 100))).filter((v): v is number => v != null)
  add('K056', avg(seg), pct(avg(seg)), 'average S1–S5 / DTN progress', `${seg.length} people with segment progress`)
  const gapComps = new Set(rated.filter((c) => (c.gap ?? 0) > 0).map((c) => c.competencyId))
  const courseComps = new Map((await prisma.courseCompetency.findMany()).reduce((m, cc) => m.set(cc.courseId, [...(m.get(cc.courseId) ?? []), cc.competencyId]), new Map<string, string[]>()))
  const hrs = done.map((t) => ({ h: t.hours ?? t.course.durationHours ?? 0, gap: (courseComps.get(t.courseId) ?? []).some((c) => gapComps.has(c)) }))
  add('K202', sum(hrs.map((h) => h.h)) ? sum(hrs.filter((h) => h.gap).map((h) => h.h)) / sum(hrs.map((h) => h.h)) : null, pct(sum(hrs.map((h) => h.h)) ? sum(hrs.filter((h) => h.gap).map((h) => h.h)) / sum(hrs.map((h) => h.h)) : null), 'of completed hours on gap competencies')
  const obsAvg = avg(S.map((s) => s.observedAvg).filter((v): v is number => v != null))
  add('K205', obsAvg, n(obsAvg, 2), 'average observed score (1–5)')
  // ---- CFO (with the value assumptions)
  add('K043', money.cost ? ((money.benefit - money.cost) / money.cost) * 100 : null, money.cost ? `${n(((money.benefit - money.cost) / money.cost) * 100)}%` : '–', 'Phillips ROI')
  add('K057', money.participants ? money.cost / money.participants : null, money.participants ? `$${n(money.cost / money.participants)}` : '–', 'per participant', undefined)
  add('K058', money.gainPts ? money.cost / (money.gainPts * 100) : null, money.gainPts ? `$${n(money.cost / (money.gainPts * 100))}` : '–', 'per readiness point gained')
  add('K045', money.gainPts ? money.cost / (money.gainPts * 100) : null, money.gainPts ? `$${n(money.cost / (money.gainPts * 100))}` : '–', 'per readiness point (level gains are weighted into readiness)')
  add('K059', money.fills * money.fillValue, `$${n(money.fills * money.fillValue)}`, 'before the confidence adjustment')
  add('K025', money.hireCost ? money.upskillPerPerson / money.hireCost : null, money.hireCost ? n(money.upskillPerPerson / money.hireCost, 2) : '–', 'upskill cost ÷ hire cost', 'Below 1 = building is cheaper than buying')
  add('K063', money.trainHours ? money.cost / money.trainHours : null, money.trainHours ? `$${n(money.cost / money.trainHours)}` : '–', 'total cost per learning hour', 'ATD 2025 benchmark: US$165 for delivery alone')
  const passes = CR.filter((c) => c.status === 'Completed').length
  add('K064', passes ? (money.examsPaid * money.examFee) / passes : null, passes ? `$${n((money.examsPaid * money.examFee) / passes)}` : '–', 'exam spend per pass')
  // ---- Compliance
  const withEv = new Set(EV.filter((e) => e.competencyId).map((e) => `${e.employeeId}\u0000${e.competencyId}`))
  const ratedKeys = assessed.flatMap((s) => s.competencies.filter((c) => c.level != null).map((c) => `${s.employeeId}\u0000${c.competencyId}`))
  add('K075', ratedKeys.length ? ratedKeys.filter((k) => withEv.has(k)).length / ratedKeys.length : null, pct(ratedKeys.length ? ratedKeys.filter((k) => withEv.has(k)).length / ratedKeys.length : null), 'of ratings backed by evidence')
  add('K076', EV.length ? EV.filter((e) => e.verificationStatus === 'Verified').length / EV.length : null, pct(EV.length ? EV.filter((e) => e.verificationStatus === 'Verified').length / EV.length : null), '', `${EV.length} evidence items`)
  const held = CR.filter((c) => c.status === 'Completed')
  add('K078', held.length ? held.filter((c) => !c.expiryDate || c.expiryDate >= today).length / held.length : null, pct(held.length ? held.filter((c) => !c.expiryDate || c.expiryDate >= today).length / held.length : null), 'of held certifications in date')
  const auditRows = [...AS, ...V, ...IDP, ...T, ...CR, ...C, ...EV] as { createdBy?: string | null; updatedBy?: string | null }[]
  add('K079', auditRows.length ? auditRows.filter((r) => r.createdBy || r.updatedBy).length / auditRows.length : null, pct(auditRows.length ? auditRows.filter((r) => r.createdBy || r.updatedBy).length / auditRows.length : null), 'of activity rows with who entered them', 'Imported and demo rows have no entered-by name; everything typed in the app does')
  const evAge = median(EV.filter((e) => e.date).map((e) => (today.getTime() - e.date!.getTime()) / DAY))
  add('K080', evAge, evAge == null ? '–' : `${n(evAge)} days`, 'median evidence age')
  // ---- Line manager
  const stretch = assessed.filter((s) => (s.roleReadiness ?? 0) >= 0.9 && (s.nextRoleReadiness ?? 0) >= 0.6).length
  add('K082', stretch, n(stretch), 'people', 'Role readiness ≥ 90% and next-role readiness ≥ 60%')
  const pending = V.filter((v) => v.status === 'Pending').length
  add('K083', pending, n(pending), 'pending validations')
  const months = new Map<string, number[]>()
  for (const v of V) if (v.date && v.validatedLevel != null) { const k = v.date.toISOString().slice(0, 7); (months.get(k) ?? months.set(k, []).get(k)!).push(v.validatedLevel) }
  const mlist = [...months.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([k, xs]) => `${k}: ${avg(xs)!.toFixed(1)}`)
  add('K084', months.size ? avg([...months.values()].at(-1)!) : null, mlist.slice(-3).join(' → ') || '–', 'average validated progress (1–5) by month')
  add('K086', V.length ? V.filter((v) => ['Rejected', 'Requires Further Evidence'].includes(v.status ?? '')).length / V.length : null, pct(V.length ? V.filter((v) => ['Rejected', 'Requires Further Evidence'].includes(v.status ?? '')).length / V.length : null), '')
  const sessions = C.filter((c) => c.status !== 'Cancelled')
  add('K088', sessions.length ? sessions.filter((c) => c.status === 'Completed' || c.status == null).length / sessions.length : null, pct(sessions.length ? sessions.filter((c) => c.status === 'Completed' || c.status == null).length / sessions.length : null), 'held ÷ planned')
  add('K201', rated.filter((c) => (c.gap ?? 0) < 0).length, n(rated.filter((c) => (c.gap ?? 0) < 0).length), 'competency ratings above requirement')
  // ---- Coach / consultant
  add('K097', money.coachHours, `${n(money.coachHours)} h`, 'preparation + session + reporting')
  const cm = sum(C.filter((c) => c.status === 'Completed' || c.status == null).map((c) => (c.prepMinutes ?? 0) + (c.durationMinutes ?? 0) + (c.reportingMinutes ?? 0)))
  add('K098', money.gainPts ? cm / (money.gainPts * 100) : null, money.gainPts ? `${n(cm / (money.gainPts * 100))} min` : '–', 'coaching minutes per readiness point')
  add('K099', money.gainPts ? (cm / 60) * money.coachRate / (money.gainPts * 100) : null, money.gainPts ? `$${n((cm / 60) * money.coachRate / (money.gainPts * 100))}` : '–', 'coaching cost per readiness point')
  const sess = C.filter((c) => (c.status === 'Completed' || c.status == null) && c.durationMinutes)
  add('K102', sum(sess.map((c) => c.durationMinutes!)) ? sum(sess.map((c) => (c.prepMinutes ?? 0) + (c.reportingMinutes ?? 0))) / sum(sess.map((c) => c.durationMinutes!)) : null, n(sum(sess.map((c) => c.durationMinutes!)) ? sum(sess.map((c) => (c.prepMinutes ?? 0) + (c.reportingMinutes ?? 0))) / sum(sess.map((c) => c.durationMinutes!)) : null, 2), '(prep + report) ÷ session time')
  const coachGain = avg(people.filter((p) => (d.coaching.get(p.e.id) ?? []).length).map((p) => p.gain))
  add('K100', coachGain, coachGain == null ? '–' : `+${n(coachGain * 100, 1)} pts`, 'readiness gained per coachee')
  // ---- Programme / account
  const enr = all((id) => d.enrollments.get(id))
  const funnel = [enr.length, enr.filter((x) => x.status !== 'Nominated').length, assessed.length, emps.filter((e) => (d.idp.get(e.id) ?? []).length).length, enr.filter((x) => x.status === 'Active').length, enr.filter((x) => x.status === 'Completed').length]
  add('K106', funnel[0], funnel.join(' → '), 'nominated → enrolled → assessed → plan → active → completed')
  add('K109', avg(people.filter((p) => p.reassessGain > 0).map((p) => p.reassessGain)), people.some((p) => p.reassessGain > 0) ? `+${n(avg(people.filter((p) => p.reassessGain > 0).map((p) => p.reassessGain))! * 100, 1)} pts` : 'No re-assessments yet', 'readiness points', 'Needs a second completed assessment per person')
  const firstOf = (id: string) => (d.assessments.get(id) ?? []).filter((a) => a.type !== 'Self-Assessment' && (a.status === 'Completed' || a.status == null))[0]
  const baseGaps = sum(people.map((p) => firstOf(p.e.id)?.ratings.filter((r) => r.level != null && r.requiredLevel != null && r.requiredLevel > r.level).length ?? 0))
  const nowGaps = sum(assessed.map((s) => s.gaps))
  add('K113', baseGaps ? Math.max(0, baseGaps - nowGaps) / baseGaps : null, pct(baseGaps ? Math.max(0, baseGaps - nowGaps) / baseGaps : null), '', `${baseGaps} gaps at baseline, ${nowGaps} open now`)
  // ---- Assessment quality
  const conf = rated.filter((c) => c.selfLevel != null && c.level != null).map((c) => c.selfLevel! - c.level!)
  add('K114', avg(conf), avg(conf) == null ? '–' : `${avg(conf)! >= 0 ? '+' : ''}${n(avg(conf), 2)}`, 'levels (self − validated)', avg(conf) != null && avg(conf)! > 0.25 ? 'Over-confident on average' : avg(conf) != null && avg(conf)! < -0.25 ? 'Under-confident on average' : 'Well calibrated')
  const dist = [0, 1, 2, 3, 4, 5].map((l) => rated.filter((c) => c.level === l).length)
  add('K116', rated.length, dist.map((v, i) => `L${i} ${v}`).filter((s) => !s.endsWith(' 0')).join(' · '), 'ratings by level')
  const req = S.reduce((t, s) => t + s.competenciesRequired, 0), rat = S.reduce((t, s) => t + s.competenciesRated, 0)
  add('K117', req ? rat / req : null, pct(req ? rat / req : null), 'of required competencies rated')
  const rec = median(S.map((s) => s.competencies.map((c) => c.sourceDate?.getTime() ?? 0).reduce((a, b) => Math.max(a, b), 0)).filter((t) => t > 0).map((t) => (today.getTime() - t) / DAY))
  add('K118', rec, rec == null ? '–' : `${n(rec)} days`, 'median days since last rating')
  // individual KPIs as averages
  add('K089', roleR, pct(roleR), 'average (each person sees their own on their page)')
  const nextR = avg(assessed.filter((s) => s.nextRoleReadiness != null).map((s) => s.nextRoleReadiness!))
  add('K090', nextR, pct(nextR), 'average next-role readiness')
  const plan = avg(S.filter((s) => s.idpProgress != null).map((s) => s.idpProgress! / 100))
  add('K092', plan, pct(plan), 'average plan progress')
  return out
}

const readinessOf = (rows: { level: number | null; required: number | null; priority: string | null }[]) => readiness(rows)
