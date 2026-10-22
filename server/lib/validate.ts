// Converts form / API input into database values using the shared field definitions,
// and rejects anything that does not fit (unknown list values, out-of-range levels …).
import { prisma } from '../db.ts'
import type { Entity, Field } from '../../shared/entities.ts'

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) { super(message) }
}

let lookupCache: Map<string, Set<string>> | null = null
let lookupAt = 0
export const invalidateLookups = () => { lookupCache = null }
export async function lookupSets() {
  if (!lookupCache || Date.now() - lookupAt > 30_000) {
    lookupAt = Date.now()
    lookupCache = new Map()
    for (const v of await prisma.lookupValue.findMany()) {
      if (!lookupCache.has(v.list)) lookupCache.set(v.list, new Set())
      lookupCache.get(v.list)!.add(v.value)
    }
  }
  return lookupCache
}

export function parseDate(v: unknown): Date | null {
  if (v == null || v === '') return null
  if (v instanceof Date) return v
  const s = String(v).trim()
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
  const m2 = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/) // 21.10.2026 or 21/10/2026
  if (m2) return new Date(Date.UTC(+m2[3], +m2[2] - 1, +m2[1]))
  return null
}

function coerce(f: Field, raw: unknown, lists: Map<string, Set<string>>): unknown {
  if (raw === undefined) return undefined
  const empty = raw === null || (typeof raw === 'string' && raw.trim() === '')
  switch (f.type) {
    case 'bool':
      if (empty) return f.required ? false : null
      return raw === true || raw === 'true' || raw === 1 || raw === '1' || raw === 'Yes' || raw === 'yes'
    case 'int': case 'level': {
      if (empty) return null
      const n = Number(raw)
      if (!Number.isInteger(n)) throw new HttpError(400, `${f.label} must be a whole number.`)
      if (f.min != null && n < f.min) throw new HttpError(400, `${f.label} must be at least ${f.min}.`)
      if (f.max != null && n > f.max) throw new HttpError(400, `${f.label} must be at most ${f.max}.`)
      if (f.type === 'level' && (n < 0 || n > 5)) throw new HttpError(400, `${f.label} must be between 0 and 5.`)
      return n
    }
    case 'number': case 'percent': {
      if (empty) return null
      const n = Number(String(raw).replace(',', '.').replace('%', ''))
      if (!Number.isFinite(n)) throw new HttpError(400, `${f.label} must be a number.`)
      if (f.type === 'percent' && (n < 0 || n > 100)) throw new HttpError(400, `${f.label} must be between 0 and 100.`)
      if (f.min != null && n < f.min) throw new HttpError(400, `${f.label} must be at least ${f.min}.`)
      if (f.max != null && n > f.max) throw new HttpError(400, `${f.label} must be at most ${f.max}.`)
      return n
    }
    case 'date': {
      if (empty) return null
      const d = parseDate(raw)
      if (!d) throw new HttpError(400, `${f.label} is not a valid date (use YYYY-MM-DD).`)
      return d
    }
    case 'lookup': {
      if (empty) return null
      const v = String(raw).trim()
      const set = lists.get(f.list!)
      if (set && !set.has(v)) throw new HttpError(400, `"${v}" is not in the ${f.label} list. Add it on Library → Lists first.`)
      return v
    }
    case 'multilookup': {
      const arr = Array.isArray(raw) ? raw : empty ? [] : String(raw).split(/\s*;\s*/)
      const vals = arr.map((x) => String(x).trim()).filter(Boolean)
      const set = lists.get(f.list!)
      for (const v of vals) if (set && !set.has(v)) throw new HttpError(400, `"${v}" is not in the ${f.label} list.`)
      return vals.length ? vals.join('; ') : null
    }
    case 'email': {
      if (empty) return null
      const v = String(raw).trim().toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw new HttpError(400, `${f.label} is not a valid email address.`)
      return v
    }
    default:
      return empty ? null : String(raw).trim()
  }
}

/** Build the Prisma `data` object. On create, required fields must be present and defaults apply. */
export async function toData(e: Entity, input: Record<string, unknown>, mode: 'create' | 'update') {
  const lists = await lookupSets()
  const data: Record<string, unknown> = {}
  for (const f of e.fields) {
    if (mode === 'update' && f.createOnly) continue
    let v = coerce(f, input[f.name], lists)
    if (mode === 'create' && (v === undefined || v === null) && f.default !== undefined) v = f.default
    if (f.required && (mode === 'create' ? v == null : v === null)) throw new HttpError(400, `${f.label} is required.`)
    if (v !== undefined) data[f.name] = v
  }
  return data
}

/** Friendly messages for database errors. */
export function explainPrismaError(err: any, e?: Entity): HttpError | null {
  const code = err?.code
  if (code === 'P2002') {
    const target = err.meta?.target ?? err.meta?.driverAdapterError?.cause?.constraint?.fields
    return new HttpError(409, `A ${e?.label.toLowerCase() ?? 'record'} with the same ${Array.isArray(target) ? target.join(' + ') : 'key'} already exists.`)
  }
  if (code === 'P2003' || /FOREIGN KEY/i.test(err?.message ?? '')) {
    return new HttpError(409, 'This record is linked to other records, so it cannot be removed (or a linked record does not exist). For reference data, set Active to No instead.')
  }
  if (code === 'P2025') return new HttpError(404, 'Record not found. Someone may have deleted it.')
  return null
}
