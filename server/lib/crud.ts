// Generic list / read / create / update / delete for every table in shared/entities.ts.
import { Router, type Request } from 'express'
import { prisma, delegate } from '../db.ts'
import { ENTITY, type Entity } from '../../shared/entities.ts'
import { nextId } from './ids.ts'
import { toData, HttpError, explainPrismaError, invalidateLookups } from './validate.ts'
import { options, labelMap, invalidateLabels, fmtDate, render } from './labels.ts'

export const userOf = (req: Request) => {
  const raw = req.get('x-user')
  try { return raw ? decodeURIComponent(raw).slice(0, 80) : null } catch { return raw?.slice(0, 80) ?? null }
}

const plain = (v: unknown) => (v instanceof Date ? fmtDate(v) : v)

/** Writes one ChangeLog row. `before`/`after` are rows; only changed fields are kept. */
export async function logChange(tx: any, user: string | null, action: 'create' | 'update' | 'delete', e: Entity | { table: string; label: string }, recordId: string, before: any, after: any, employeeId?: string | null) {
  const changes: Record<string, [unknown, unknown]> = {}
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])
  const isRelation = (v: unknown) => v !== null && typeof v === 'object' && !(v instanceof Date)
  for (const k of keys) {
    if (['updatedAt', 'createdAt', 'updatedBy', 'createdBy'].includes(k)) continue
    if (isRelation(before?.[k]) || isRelation(after?.[k])) continue
    const a = plain(before?.[k]), b = plain(after?.[k])
    if (JSON.stringify(a ?? null) !== JSON.stringify(b ?? null)) changes[k] = [a ?? null, b ?? null]
  }
  if (action === 'update' && !Object.keys(changes).length) return
  const id = await nextId('LOG', tx)
  await tx.changeLog.create({
    data: {
      id, user, action, entity: e.table, recordId,
      employeeId: employeeId ?? after?.employeeId ?? before?.employeeId ?? (e.table === 'Employee' ? recordId : null),
      summary: `${action === 'create' ? 'Added' : action === 'update' ? 'Changed' : 'Deleted'} ${e.label.toLowerCase()}${action === 'update' ? ': ' + Object.keys(changes).join(', ') : ''}`,
      changes: Object.keys(changes).length ? JSON.stringify(changes) : null,
    },
  })
}

export function afterWrite(e: Entity) {
  invalidateLabels()
  if (e.key === 'lookups') invalidateLookups()
}

/** Adds `_ref` (labels of linked rows) and join id arrays to rows for display. */
export async function decorate(e: Entity, rows: any[]) {
  const refFields = e.fields.filter((f) => f.type === 'ref')
  const maps = new Map<string, Map<string, string>>()
  for (const f of refFields) if (!maps.has(f.ref!)) maps.set(f.ref!, await labelMap(f.ref!))
  for (const r of rows) {
    r._ref = {}
    for (const f of refFields) if (r[f.name]) r._ref[f.name] = maps.get(f.ref!)!.get(r[f.name]) ?? r[f.name]
    r._title = render(e.title, { ...r, ...Object.fromEntries(refFields.map((f) => [f.name.replace(/Id$/, ''), { name: r._ref[f.name] }])) })
    for (const j of e.joins ?? []) {
      const rel = relationName(j.model)
      if (Array.isArray(r[rel])) { r[j.name] = r[rel].map((x: any) => x[j.childKey]); delete r[rel] }
    }
  }
  return rows
}

function joinInclude(e: Entity) {
  if (!e.joins?.length) return undefined
  return Object.fromEntries(e.joins.map((j) => [relationName(j.model), true]))
}
// The relation field on the parent model that holds the join rows (Course.competencies, Certification.competencies)
function relationName(joinModel: string) {
  return joinModel === 'courseCompetency' || joinModel === 'certificationCompetency' ? 'competencies' : joinModel
}

async function writeJoins(tx: any, e: Entity, id: string, input: any) {
  for (const j of e.joins ?? []) {
    if (!Array.isArray(input[j.name])) continue
    await tx[j.model].deleteMany({ where: { [j.parentKey]: id } })
    const ids = [...new Set(input[j.name].filter(Boolean))]
    if (ids.length) await tx[j.model].createMany({ data: ids.map((c) => ({ [j.parentKey]: id, [j.childKey]: c })) })
  }
}

function where(e: Entity, q: Record<string, any>) {
  const w: Record<string, any> = {}
  for (const f of e.fields) {
    const v = q[f.name]
    if (v === undefined || v === '') continue
    if (f.type === 'ref' || f.type === 'lookup') w[f.name] = v === '_none' ? null : v
    else if (f.type === 'bool') w[f.name] = v === 'true'
  }
  if (q.q) {
    const text = e.fields.filter((f) => ['text', 'email', 'longtext'].includes(f.type)).slice(0, 6)
    if (text.length) w.OR = text.map((f) => ({ [f.name]: { contains: String(q.q) } }))
  }
  return w
}

export function crudRouter() {
  const r = Router()

  r.get('/options/:entity', async (req, res) => {
    const e = ENTITY[req.params.entity]
    if (!e) throw new HttpError(404, 'Unknown table')
    let opts = await options(e.key)
    // Filters like ?employeeId=EMP-0001 narrow the list (used by dependent dropdowns).
    for (const [k, v] of Object.entries(req.query)) if (typeof v === 'string' && v) opts = opts.filter((o) => o.row[k] === v)
    res.json(opts.map(({ id, label, sub, row }) => ({ id, label, sub, active: row.active !== false })))
  })

  r.get('/:entity', async (req, res) => {
    const e = ENTITY[req.params.entity]
    if (!e) throw new HttpError(404, 'Unknown table')
    const take = Math.min(Number(req.query.take) || 5000, 20000)
    const rows = await delegate(e.model).findMany({ where: where(e, req.query as any), orderBy: e.orderBy, include: joinInclude(e), take })
    res.json(await decorate(e, rows))
  })

  r.get('/:entity/:id', async (req, res) => {
    const e = ENTITY[req.params.entity]
    if (!e) throw new HttpError(404, 'Unknown table')
    const row = await delegate(e.model).findUnique({ where: { id: req.params.id }, include: joinInclude(e) })
    if (!row) throw new HttpError(404, `${e.label} ${req.params.id} not found.`)
    res.json((await decorate(e, [row]))[0])
  })

  r.post('/:entity', async (req, res) => {
    const e = ENTITY[req.params.entity]
    if (!e) throw new HttpError(404, 'Unknown table')
    const user = userOf(req)
    const data = await toData(e, req.body ?? {}, 'create')
    if (e.audit) { data.createdBy = user; data.updatedBy = user; if (!data.source) data.source = 'Direct entry' }
    try {
      const row = await prisma.$transaction(async (tx: any) => {
        const id = await nextId(e.prefix, tx)
        const created = await tx[e.model].create({ data: { id, ...data } })
        await writeJoins(tx, e, id, req.body ?? {})
        await logChange(tx, user, 'create', e, id, null, created)
        return created
      })
      afterWrite(e)
      res.status(201).json((await decorate(e, [await delegate(e.model).findUnique({ where: { id: row.id }, include: joinInclude(e) })]))[0])
    } catch (err) { throw explainPrismaError(err, e) ?? err }
  })

  r.put('/:entity/:id', async (req, res) => {
    const e = ENTITY[req.params.entity]
    if (!e) throw new HttpError(404, 'Unknown table')
    const user = userOf(req)
    const id = req.params.id
    const data = await toData(e, req.body ?? {}, 'update')
    if (e.audit) data.updatedBy = user
    try {
      const row = await prisma.$transaction(async (tx: any) => {
        const before = await tx[e.model].findUnique({ where: { id } })
        if (!before) throw new HttpError(404, `${e.label} ${id} not found. Someone may have deleted it.`)
        const seen = req.body?._updatedAt
        if (seen && before.updatedAt && new Date(seen).getTime() !== before.updatedAt.getTime()) {
          throw new HttpError(409, `${before.updatedBy ?? 'Someone'} changed this ${e.label.toLowerCase()} after you opened it. Close the form and open it again to see their version.`)
        }
        const updated = await tx[e.model].update({ where: { id }, data })
        await writeJoins(tx, e, id, req.body ?? {})
        await logChange(tx, user, 'update', e, id, before, updated)
        return updated
      })
      afterWrite(e)
      res.json((await decorate(e, [await delegate(e.model).findUnique({ where: { id: row.id }, include: joinInclude(e) })]))[0])
    } catch (err) { throw explainPrismaError(err, e) ?? err }
  })

  r.delete('/:entity/:id', async (req, res) => {
    const e = ENTITY[req.params.entity]
    if (!e) throw new HttpError(404, 'Unknown table')
    const user = userOf(req)
    try {
      await prisma.$transaction(async (tx: any) => {
        const before = await tx[e.model].findUnique({ where: { id: req.params.id } })
        if (!before) throw new HttpError(404, 'Already deleted.')
        await tx[e.model].delete({ where: { id: req.params.id } })
        await logChange(tx, user, 'delete', e, req.params.id, before, null)
      })
      afterWrite(e)
      res.json({ ok: true })
    } catch (err) { throw explainPrismaError(err, e) ?? err }
  })

  return r
}
