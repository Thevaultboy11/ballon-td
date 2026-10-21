import { useCallback, useEffect, useRef, useState, createContext, useContext } from 'react'

// ------------------------------------------------------------------ who is entering data
// There are no logins. Everyone picks their name once; it is stored in this browser and sent
// with every change, so the database knows who entered what (createdBy / updatedBy / ChangeLog).
const USER_KEY = 'btd-user'
export function getUser(): string {
  try { return localStorage.getItem(USER_KEY) || '' } catch { return '' }
}
export function setUser(name: string) {
  try { localStorage.setItem(USER_KEY, name) } catch { /* private mode */ }
}

// ------------------------------------------------------------------ fetch
let version = 0
const listeners = new Set<() => void>()
/** Called after every change so lists and dropdowns refresh. */
export function bumpData() {
  version++
  optionCache.clear()
  listeners.forEach((l) => l())
}
export function useDataVersion() {
  const [v, setV] = useState(version)
  useEffect(() => { const l = () => setV(version); listeners.add(l); return () => { listeners.delete(l) } }, [])
  return v
}

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: opts.method ?? 'GET',
    headers: { 'Content-Type': 'application/json', 'X-User': encodeURIComponent(getUser()) },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  })
  const text = await res.text()
  let data: any = null
  try { data = text ? JSON.parse(text) : null } catch { data = { error: text } }
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`)
  if (opts.method && opts.method !== 'GET') bumpData()
  return data as T
}

export function useApi<T = any>(path: string | null) {
  const v = useDataVersion()
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean }>({ data: null, error: null, loading: !!path })
  const seq = useRef(0)
  const load = useCallback(() => {
    if (!path) return
    const n = ++seq.current
    setState((s) => ({ ...s, loading: true }))
    api<T>(path).then(
      (data) => n === seq.current && setState({ data, error: null, loading: false }),
      (e) => n === seq.current && setState((s) => ({ data: s.data, error: e.message, loading: false })),
    )
  }, [path])
  useEffect(() => { load() }, [load, v])
  return { ...state, reload: load }
}

// ------------------------------------------------------------------ dropdown options
export type Option = { id: string; label: string; sub: string; active: boolean }
const optionCache = new Map<string, Promise<Option[]>>()
export function fetchOptions(entity: string, filter: Record<string, string | null | undefined> = {}) {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v) as [string, string][]).toString()
  const key = `${entity}?${qs}`
  if (!optionCache.has(key)) optionCache.set(key, api<Option[]>(`/options/${entity}${qs ? `?${qs}` : ''}`).catch((e) => { optionCache.delete(key); throw e }))
  return optionCache.get(key)!
}
export function useOptions(entity: string | undefined, filter: Record<string, string | null | undefined> = {}) {
  const v = useDataVersion()
  const fkey = JSON.stringify(filter)
  const [opts, setOpts] = useState<Option[] | null>(null)
  useEffect(() => {
    if (!entity) return
    let live = true
    fetchOptions(entity, filter).then((o) => live && setOpts(o), () => live && setOpts([]))
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity, fkey, v])
  return opts
}

// ------------------------------------------------------------------ lists (LookupValue)
export type Meta = {
  lists: Record<string, { value: string; description: string | null; active: boolean }[]>
  listInfo: Record<string, { label: string; description: string }>
  counts: Record<string, number>
}
export const MetaContext = createContext<Meta | null>(null)
export const useMeta = () => useContext(MetaContext)!

// ------------------------------------------------------------------ toasts
type Toast = { id: number; text: string; bad?: boolean }
let toastId = 0
const toastListeners = new Set<(t: Toast[]) => void>()
let toasts: Toast[] = []
export function toast(text: string, bad = false) {
  const t = { id: ++toastId, text, bad }
  toasts = [...toasts, t]
  toastListeners.forEach((l) => l(toasts))
  setTimeout(() => { toasts = toasts.filter((x) => x.id !== t.id); toastListeners.forEach((l) => l(toasts)) }, bad ? 6000 : 2600)
}
export function useToasts() {
  const [t, setT] = useState<Toast[]>(toasts)
  useEffect(() => { toastListeners.add(setT); return () => { toastListeners.delete(setT) } }, [])
  return t
}

// ------------------------------------------------------------------ formatting
export const fmtDate = (v: unknown) => (v ? String(v).slice(0, 10) : '')
export const pct = (x: number | null | undefined, digits = 0) => (x == null ? '–' : `${(x * 100).toFixed(digits)}%`)
export const dec = (x: number | null | undefined, d = 1) => (x == null ? '–' : x.toFixed(d))
export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
export function ago(v: unknown) {
  if (!v) return ''
  const d = new Date(String(v))
  const days = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  return fmtDate(v)
}
