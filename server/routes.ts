// The screens that need more than plain list/edit: people overview, the assessment ratings
// grid, session roster with bulk attendance, the observation grid, change log and export.
import { Router } from 'express'
import { prisma } from './db.ts'
import { ENTITY, ENTITIES } from '../shared/entities.ts'
import { LOOKUP_LISTS } from '../shared/lookups.ts'
import { nextId, nextIds } from './lib/ids.ts'
import { HttpError, toData, explainPrismaError } from './lib/validate.ts'
import { decorate, logChange, userOf, afterWrite } from './lib/crud.ts'
import { loadData, summarize, groupRisks } from './lib/metrics.ts'
import { SEVERITY_ORDER } from './lib/risks.ts'
import { buildWorkbook } from './lib/export.ts'
import { buildRoadmap, groupKey, rollup, type GroupBy } from './lib/roadmap.ts'
import { buildRoadmapReport, teamRoadmaps } from './lib/roadmap-report.ts'

export function appRouter() {
  const r = Router()

  // ---------------------------------------------------------------- meta
  r.get('/meta', async (_req, res) => {
    const values = await prisma.lookupValue.findMany({ orderBy: [{ list: 'asc' }, { sortOrder: 'asc' }, { value: 'asc' }] })
    const lists: Record<string, { value: string; description: string | null; active: boolean }[]> = {}
    for (const v of values) (lists[v.list] ??= []).push({ value: v.value, description: v.description, active: v.active })
    const listInfo = Object.fromEntries(LOOKUP_LISTS.map((l) => [l.key, { label: l.label, description: l.description }]))
    const counts = Object.fromEntries(await Promise.all(ENTITIES.filter((e) => e.kind === 'reference' || e.key === 'employees' || e.key === 'sessions').map((e) => e.key).map(async (k) => [k, await (prisma as any)[ENTITY[k].model].count()])))
    res.json({ lists, listInfo, counts })
  })

  // ---------------------------------------------------------------- people
  r.get('/people', async (req, res) => {
    const d = await loadData({ clientId: (req.query.clientId as string) || undefined })
    const today = new Date()
    const rows = await decorate(ENTITY.employees, d.employees.map(({ client, jobRole, lineManager, ...e }) => ({ ...e })))
    res.json(rows.map((e: any, i: number) => {
      const { competencies, observation, risks, ...s } = summarize(d, d.employees[i], today)
      return { ...e, summary: { ...s, riskCodes: risks.map((r) => `${r.code}:${r.severity}`), potential: observation?.leadershipPotential ?? null } }
    }))
  })

  // ---------------------------------------------------------------- risks and opportunities (individual + group)
  r.get('/risks', async (req, res) => {
    const d = await loadData({ clientId: (req.query.clientId as string) || undefined })
    const sums = d.employees.map((e) => ({ e, s: summarize(d, e) }))
    const individual = sums.flatMap(({ e, s }) => s.risks.map((f) => ({ ...f, employeeId: e.id, employeeName: e.name, clientId: e.clientId, client: e.client.name, department: e.department, section: e.section, jobTitle: e.jobTitle })))
    const group = groupRisks(d, sums)
    const rules = [...d.riskRules].sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9) || a.code.localeCompare(b.code))
    const clients = [...new Map(d.employees.map((e) => [e.clientId, e.client.name])).entries()]
    res.json({ rules, individual, group, people: sums.length, clients })
  })

  r.get('/people/:id', async (req, res) => {
    const d = await loadData({ employeeId: req.params.id })
    const emp = d.employees[0]
    if (!emp) throw new HttpError(404, `Person ${req.params.id} not found.`)
    const s = summarize(d, emp)
    const { client, jobRole, lineManager, ...plain } = emp
    const [row] = await decorate(ENTITY.employees, [plain])
    const behaviors = await prisma.competencyBehavior.findMany({ where: { competencyId: { in: s.competencies.map((c) => c.competencyId) } }, orderBy: { level: 'asc' } })
    const byComp: Record<string, { level: number; description: string }[]> = {}
    for (const b of behaviors) (byComp[b.competencyId] ??= []).push({ level: b.level, description: b.description })
    res.json({ employee: row, summary: s, behaviors: byComp, role: jobRole, client })
  })

  // ---------------------------------------------------------------- assessment ratings grid
  r.get('/assessments/:id/ratings', async (req, res) => {
    const a = await prisma.assessment.findUnique({ where: { id: req.params.id }, include: { ratings: true, employee: true, jobRole: true } })
    if (!a) throw new HttpError(404, 'Assessment not found.')
    const roleId = a.jobRoleId ?? a.employee.jobRoleId
    const reqs = roleId ? await prisma.roleRequirement.findMany({ where: { jobRoleId: roleId } }) : []
    const reqMap = new Map(reqs.map((x) => [x.competencyId, x]))
    const ids = new Set([...reqs.map((x) => x.competencyId), ...a.ratings.map((x) => x.competencyId)])
    const comps = await prisma.competency.findMany({ where: { id: { in: [...ids] } }, include: { category: { include: { framework: true } }, behaviors: { orderBy: { level: 'asc' } } }, orderBy: { sortOrder: 'asc' } })
    const ratings = new Map(a.ratings.map((x) => [x.competencyId, x]))
    res.json({
      assessment: (await decorate(ENTITY.assessments, [{ ...a, ratings: undefined, employee: undefined, jobRole: undefined }]))[0],
      roleName: a.jobRole?.name ?? null,
      rows: comps.map((c) => {
        const rt = ratings.get(c.id)
        return {
          competencyId: c.id, code: c.code, name: c.name, category: c.category.name, framework: c.category.framework.name, minLevel: c.minLevel, maxLevel: c.maxLevel,
          behaviors: c.behaviors.map((b) => ({ level: b.level, description: b.description })),
          ratingId: rt?.id ?? null, level: rt?.level ?? null, requiredLevel: rt?.requiredLevel ?? reqMap.get(c.id)?.requiredLevel ?? null,
          priority: rt?.priority ?? reqMap.get(c.id)?.priority ?? null, comment: rt?.comment ?? null, inRole: reqMap.has(c.id),
        }
      }),
    })
  })

  r.put('/assessments/:id/ratings', async (req, res) => {
    const user = userOf(req)
    const a = await prisma.assessment.findUnique({ where: { id: req.params.id }, include: { ratings: true } })
    if (!a) throw new HttpError(404, 'Assessment not found.')
    const rows: any[] = Array.isArray(req.body?.rows) ? req.body.rows : []
    const existing = new Map(a.ratings.map((x) => [x.competencyId, x]))
    let changed = 0
    await prisma.$transaction(async (tx: any) => {
      for (const input of rows) {
        const data = await toData(ENTITY.ratings, { ...input, assessmentId: a.id }, 'create')
        const before = existing.get(input.competencyId)
        if (before) {
          const same = ['level', 'requiredLevel', 'priority', 'comment'].every((k) => (before as any)[k] === (data[k] ?? null))
          if (same) continue
          const after = await tx.assessmentRating.update({ where: { id: before.id }, data })
          await logChange(tx, user, 'update', ENTITY.ratings, before.id, before, after, a.employeeId)
        } else {
          if (data.level == null && data.comment == null) continue
          const id = await nextId('RAT', tx)
          const after = await tx.assessmentRating.create({ data: { id, ...data } })
          await logChange(tx, user, 'create', ENTITY.ratings, id, null, after, a.employeeId)
        }
        changed++
      }
      await tx.assessment.update({ where: { id: a.id }, data: { updatedBy: user } })
    })
    afterWrite(ENTITY.ratings)
    res.json({ ok: true, changed })
  })

  // ---------------------------------------------------------------- sessions: roster & bulk attendance
  r.get('/sessions/:id/roster', async (req, res) => {
    const s = await prisma.courseSession.findUnique({ where: { id: req.params.id }, include: { course: true } })
    if (!s) throw new HttpError(404, 'Session not found.')
    const records = await prisma.trainingRecord.findMany({ where: { sessionId: s.id }, include: { employee: { include: { client: true } }, days: { include: { scores: true } } }, orderBy: { employee: { name: 'asc' } } })
    const [session] = await decorate(ENTITY.sessions, [{ ...s, course: undefined }])
    res.json({
      session, course: s.course,
      records: records.map((t) => ({
        id: t.id, employeeId: t.employeeId, name: t.employee.name, jobTitle: t.employee.jobTitle, client: t.employee.client.name,
        status: t.status, attendancePct: t.attendancePct, score: t.score, hours: t.hours, completionDate: t.completionDate, comments: t.comments, updatedAt: t.updatedAt,
        days: t.days.map((d) => ({ dayNumber: d.dayNumber, attendance: d.attendance, scored: d.scores.filter((x) => x.score != null).length })),
      })),
    })
  })

  r.post('/sessions/:id/participants', async (req, res) => {
    const user = userOf(req)
    const s = await prisma.courseSession.findUnique({ where: { id: req.params.id } })
    if (!s) throw new HttpError(404, 'Session not found.')
    const ids: string[] = [...new Set<string>(req.body?.employeeIds ?? [])]
    const already = new Set((await prisma.trainingRecord.findMany({ where: { sessionId: s.id }, select: { employeeId: true } })).map((x) => x.employeeId))
    const add = ids.filter((x) => !already.has(x))
    await prisma.$transaction(async (tx: any) => {
      const newIds = await nextIds('TRN', add.length, tx)
      for (const [i, employeeId] of add.entries()) {
        const row = await tx.trainingRecord.create({ data: { id: newIds[i], employeeId, courseId: s.courseId, sessionId: s.id, status: 'Assigned', assignedDate: new Date(), createdBy: user, updatedBy: user, source: req.body?.source || 'Direct entry' } })
        await logChange(tx, user, 'create', ENTITY.training, row.id, null, row)
      }
    })
    afterWrite(ENTITY.training)
    res.json({ added: add.length, skipped: ids.length - add.length })
  })

  r.put('/sessions/:id/records', async (req, res) => {
    const user = userOf(req)
    const rows: any[] = Array.isArray(req.body?.rows) ? req.body.rows : []
    const fields = ['status', 'attendancePct', 'score', 'hours', 'completionDate', 'comments']
    let changed = 0
    try {
      await prisma.$transaction(async (tx: any) => {
        for (const input of rows) {
          const before = await tx.trainingRecord.findUnique({ where: { id: input.id } })
          if (!before || before.sessionId !== req.params.id) throw new HttpError(400, `Training record ${input.id} is not in this session.`)
          const picked = Object.fromEntries(fields.filter((k) => k in input).map((k) => [k, input[k]]))
          const data = await toData({ ...ENTITY.training, fields: ENTITY.training.fields.filter((f) => fields.includes(f.name)) }, picked, 'update')
          const after = await tx.trainingRecord.update({ where: { id: input.id }, data: { ...data, updatedBy: user, source: req.body?.source || before.source } })
          await logChange(tx, user, 'update', ENTITY.training, input.id, before, after)
          changed++
        }
      })
    } catch (err) { throw explainPrismaError(err) ?? err }
    afterWrite(ENTITY.training)
    res.json({ ok: true, changed })
  })

  // ---------------------------------------------------------------- observation grid (one day of a session)
  r.get('/sessions/:id/observations', async (req, res) => {
    const day = Math.max(1, Number(req.query.day) || 1)
    const s = await prisma.courseSession.findUnique({ where: { id: req.params.id }, include: { course: true } })
    if (!s) throw new HttpError(404, 'Session not found.')
    const catOrder = new Map((await prisma.lookupValue.findMany({ where: { list: 'observationCategory' } })).map((v) => [v.value, v.sortOrder]))
    const params = (await prisma.observationParameter.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' }, include: { competency: true } }))
      .sort((a, b) => (catOrder.get(a.category) ?? 999) - (catOrder.get(b.category) ?? 999) || a.sortOrder - b.sortOrder)
    const records = await prisma.trainingRecord.findMany({ where: { sessionId: s.id }, include: { employee: true, days: { where: { dayNumber: day }, include: { scores: true } } }, orderBy: { employee: { name: 'asc' } } })
    res.json({
      day, days: s.course.days ?? 1, observed: s.course.observed,
      dayTitles: (s.course.dayTitles ?? '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean),
      parameters: params.map((p) => ({ id: p.id, code: p.code, name: p.name, category: p.category, maxScore: p.maxScore, competency: p.competency?.name ?? null, description: p.description })),
      rows: records.map((t) => {
        const d = t.days[0]
        return {
          trainingRecordId: t.id, employeeId: t.employeeId, name: t.employee.name, jobTitle: t.employee.jobTitle,
          dayId: d?.id ?? null, attendance: d?.attendance ?? null, potentialNote: d?.potentialNote ?? null, notes: d?.notes ?? null, updatedAt: d?.updatedAt ?? null,
          scores: Object.fromEntries((d?.scores ?? []).map((x) => [x.parameterId, x.score])),
        }
      }),
    })
  })

  r.put('/sessions/:id/observations', async (req, res) => {
    const user = userOf(req)
    const day = Math.max(1, Number(req.body?.day) || 1)
    const s = await prisma.courseSession.findUnique({ where: { id: req.params.id } })
    if (!s) throw new HttpError(404, 'Session not found.')
    const date = s.startDate ? new Date(s.startDate.getTime() + (day - 1) * 86400000) : null
    const rows: any[] = Array.isArray(req.body?.rows) ? req.body.rows : []
    const dayEntity = { ...ENTITY.observationDays, fields: ENTITY.observationDays.fields.filter((f) => ['attendance', 'potentialNote', 'notes'].includes(f.name)) }
    let saved = 0
    await prisma.$transaction(async (tx: any) => {
      for (const input of rows) {
        const t = await tx.trainingRecord.findUnique({ where: { id: input.trainingRecordId } })
        if (!t || t.sessionId !== s.id) throw new HttpError(400, `Training record ${input.trainingRecordId} is not in this session.`)
        const data = await toData(dayEntity, input, 'update')
        let dayRow = await tx.observationDay.findUnique({ where: { trainingRecordId_dayNumber: { trainingRecordId: t.id, dayNumber: day } } })
        const hasAny = Object.values(input.scores ?? {}).some((v) => v != null && v !== '') || data.attendance || data.notes || data.potentialNote
        if (!dayRow && !hasAny) continue
        if (!dayRow) {
          const id = await nextId('OBS', tx)
          dayRow = await tx.observationDay.create({ data: { id, trainingRecordId: t.id, dayNumber: day, date, observerId: s.trainerId, ...data, createdBy: user, updatedBy: user, source: req.body?.source || 'Direct entry' } })
          await logChange(tx, user, 'create', ENTITY.observationDays, id, null, dayRow, t.employeeId)
        } else {
          const after = await tx.observationDay.update({ where: { id: dayRow.id }, data: { ...data, updatedBy: user } })
          await logChange(tx, user, 'update', ENTITY.observationDays, dayRow.id, dayRow, after, t.employeeId)
        }
        const existing = new Map<string, any>((await tx.observationScore.findMany({ where: { observationDayId: dayRow.id } })).map((x: any) => [x.parameterId, x]))
        const maxOf = new Map<string, number>((await tx.observationParameter.findMany({ select: { id: true, maxScore: true } })).map((x: any) => [x.id, x.maxScore]))
        const changes: Record<string, [unknown, unknown]> = {}
        for (const [parameterId, raw] of Object.entries(input.scores ?? {})) {
          const score = raw === '' || raw == null ? null : Number(raw)
          const max = maxOf.get(parameterId) ?? 5
          if (score != null && (!Number.isInteger(score) || score < (max === 5 ? 1 : 0) || score > max)) throw new HttpError(400, `Scores must be whole numbers from ${max === 5 ? 1 : 0} to ${max} (${input.name ?? t.employeeId}).`)
          const prev = existing.get(parameterId)
          if (prev) { if (prev.score !== score) { await tx.observationScore.update({ where: { id: prev.id }, data: { score } }); changes[parameterId] = [prev.score, score] } }
          else if (score != null) { await tx.observationScore.create({ data: { id: await nextId('OSC', tx), observationDayId: dayRow.id, parameterId, score } }); changes[parameterId] = [null, score] }
        }
        if (Object.keys(changes).length) {
          await tx.changeLog.create({ data: { id: await nextId('LOG', tx), user, action: 'update', entity: 'ObservationScore', recordId: dayRow.id, employeeId: t.employeeId, summary: `Scored ${Object.keys(changes).length} behaviours (day ${day})`, changes: JSON.stringify(changes) } })
        }
        saved++
      }
    })
    afterWrite(ENTITY.observationScores)
    res.json({ ok: true, saved })
  })

  // ---------------------------------------------------------------- create an assessment pre-filled from the role
  r.post('/assessments/:id/copy-from/:sourceId', async (req, res) => {
    const user = userOf(req)
    const src = await prisma.assessment.findUnique({ where: { id: req.params.sourceId }, include: { ratings: true } })
    const dst = await prisma.assessment.findUnique({ where: { id: req.params.id }, include: { ratings: true } })
    if (!src || !dst) throw new HttpError(404, 'Assessment not found.')
    const have = new Set(dst.ratings.map((x) => x.competencyId))
    const add = src.ratings.filter((x) => !have.has(x.competencyId))
    await prisma.$transaction(async (tx: any) => {
      const ids = await nextIds('RAT', add.length, tx)
      for (const [i, x] of add.entries()) await tx.assessmentRating.create({ data: { id: ids[i], assessmentId: dst.id, competencyId: x.competencyId, level: x.level, requiredLevel: x.requiredLevel, priority: x.priority } })
      await tx.changeLog.create({ data: { id: await nextId('LOG', tx), user, action: 'update', entity: 'Assessment', recordId: dst.id, employeeId: dst.employeeId, summary: `Copied ${add.length} ratings from ${src.id}` } })
    })
    afterWrite(ENTITY.ratings)
    res.json({ copied: add.length })
  })

  // ---------------------------------------------------------------- change log
  r.get('/log', async (req, res) => {
    const where: any = {}
    if (req.query.employeeId) where.employeeId = req.query.employeeId
    if (req.query.recordId) where.recordId = req.query.recordId
    const rows = await prisma.changeLog.findMany({ where, orderBy: { at: 'desc' }, take: Math.min(Number(req.query.take) || 100, 1000) })
    res.json(rows)
  })

  // ---------------------------------------------------------------- roadmaps (person, team, manager report)
  const GROUPS: GroupBy[] = ['department', 'section', 'manager', 'client']
  const groupOf = (q: any): GroupBy => (GROUPS.includes(q) ? q : 'department')
  r.get('/people/:id/roadmap', async (req, res) => {
    const d = await loadData({ employeeId: req.params.id })
    const emp = d.employees[0]
    if (!emp) throw new HttpError(404, `Person ${req.params.id} not found.`)
    res.json(buildRoadmap(d, emp, summarize(d, emp)))
  })
  r.get('/roadmaps', async (req, res) => {
    const groupBy = groupOf(req.query.groupBy)
    const { d, maps, people } = await teamRoadmaps({ clientId: (req.query.clientId as string) || undefined, groupBy })
    const byKey = new Map<string, typeof maps>()
    people.forEach((e, i) => { const k = groupKey(e, groupBy); (byKey.get(k) ?? byKey.set(k, []).get(k)!).push(maps[i]) })
    const groups = [...byKey.entries()].map(([key, ms]) => { const { upcoming, ...x } = rollup(ms); return { key, ...x, overdue: upcoming.filter((u) => u.overdue).length } })
      .sort((a, b) => a.key.localeCompare(b.key))
    res.json({ groupBy, groups, total: rollup(maps).stages, people: maps.length, clients: [...new Map(d.employees.map((e) => [e.clientId, e.client.name])).entries()] })
  })
  r.get('/roadmaps/group', async (req, res) => {
    const groupBy = groupOf(req.query.groupBy)
    const key = req.query.key as string
    const { maps } = await teamRoadmaps({ clientId: (req.query.clientId as string) || undefined, groupBy, key })
    res.json({ groupBy, key, ...rollup(maps), members: maps.map(({ events, window, ...m }) => ({ ...m, stages: m.stages.map(({ done, ...st }) => ({ ...st, open: st.open.slice(0, 5), doneCount: done.length })) })) })
  })
  r.get('/roadmaps/report', async (req, res) => {
    const { wb, name } = await buildRoadmapReport({
      clientId: (req.query.clientId as string) || undefined, groupBy: groupOf(req.query.groupBy), key: (req.query.key as string) || undefined,
      exportedBy: userOf(req) ?? ((req.query.user as string) || null),
    })
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`)
    await wb.xlsx.write(res)
    res.end()
  })

  // ---------------------------------------------------------------- export
  r.get('/export', async (req, res) => {
    const scope = {
      clientId: (req.query.clientId as string) || undefined,
      employeeId: (req.query.employeeId as string) || undefined,
      includeLog: req.query.includeLog !== '0',
      exportedBy: userOf(req) ?? ((req.query.user as string) || null),
    }
    const { wb, name } = await buildWorkbook(scope)
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`)
    await wb.xlsx.write(res)
    res.end()
  })

  return r
}
