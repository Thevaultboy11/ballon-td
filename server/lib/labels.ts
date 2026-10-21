// Turns rows into readable names ("Manager Essentials · 2026-10-14") using the entity's
// title template, and keeps a small cache of {id → label} per table for dropdowns.
import { delegate } from '../db.ts'
import { ENTITY, type Entity } from '../../shared/entities.ts'

export const fmtDate = (d: unknown) => (d instanceof Date ? d.toISOString().slice(0, 10) : d == null ? '' : String(d))

function get(row: any, path: string) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), row)
}

export function render(template: string | undefined, row: any): string {
  if (!template) return ''
  return template
    .replace(/\{([\w.]+)\}/g, (_, p) => fmtDate(get(row, p)) || '')
    .replace(/^[\s·]+|[\s·]+$/g, '')
    .replace(/\s·\s(?=\s·|$)/g, '')
    .replace(/(\s·\s){2,}/g, ' · ')
}

/** Prisma `include` needed to render the title/subtitle templates. */
export function includeFor(e: Entity) {
  const include: Record<string, any> = {}
  for (const t of [e.title, e.subtitle]) {
    for (const [, p] of (t ?? '').matchAll(/\{([\w.]+)\}/g)) {
      const parts = p.split('.')
      if (parts.length > 1) include[parts[0]] = parts.length > 2 ? { include: { [parts[1]]: true } } : true
    }
  }
  return Object.keys(include).length ? include : undefined
}

export type Option = { id: string; label: string; sub: string; row: any }
const cache = new Map<string, Option[]>()
export const invalidateLabels = () => cache.clear()

export async function options(key: string): Promise<Option[]> {
  const hit = cache.get(key)
  if (hit) return hit
  const e = ENTITY[key]
  const rows = await delegate(e.model).findMany({ include: includeFor(e), orderBy: e.orderBy })
  const opts = rows.map((r: any) => ({ id: r.id, label: render(e.title, r), sub: render(e.subtitle, r), row: r }))
  cache.set(key, opts)
  return opts
}

export async function labelMap(key: string): Promise<Map<string, string>> {
  return new Map((await options(key)).map((o) => [o.id, o.label]))
}
