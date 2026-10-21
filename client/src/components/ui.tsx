import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useToasts, initials, type Option } from '../api'

const Svg = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: d }} />
)
export const Icon = {
  logo: () => <svg viewBox="0 0 24 24" fill="none" stroke="#141e12" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" /></svg>,
  users: () => <Svg d='<path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1"/><circle cx="9.5" cy="7.5" r="3.5"/><path d="M21 19v-1a4 4 0 0 0-3-3.87M16 4.13a3.5 3.5 0 0 1 0 6.75"/>' />,
  target: () => <Svg d='<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".5"/>' />,
  alert: () => <Svg d='<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17.5v.01"/>' />,
  check: () => <Svg d='<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>' />,
  clock: () => <Svg d='<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>' />,
  badge: () => <Svg d='<circle cx="12" cy="9" r="5"/><path d="M8.5 13l-1.5 8 5-3 5 3-1.5-8"/>' />,
  book: () => <Svg d='<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M8 7h7"/>' />,
  sun: () => <Svg d='<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>' />,
  moon: () => <Svg d='<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>' />,
  search: () => <Svg d='<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>' />,
  plus: () => <Svg d='<path d="M12 5v14M5 12h14"/>' />,
  download: () => <Svg d='<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>' />,
  edit: () => <Svg d='<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>' />,
  x: () => <Svg d='<path d="M6 6l12 12M18 6L6 18"/>' />,
  user: () => <Svg d='<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>' />,
  grid: () => <Svg d='<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>' />,
  chat: () => <Svg d='<path d="M5 18l-1 3 4-2h9a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v9"/>' />,
}

export const Avatar = ({ name, lg }: { name: string; lg?: boolean }) => <span className={`avatar ${lg ? 'lg' : ''}`}>{initials(name)}</span>

const STATUS_TONE: Record<string, string> = {
  Completed: 'tag-lime', Delivered: 'tag-lime', Approved: 'tag-lime', Verified: 'tag-lime', Active: 'tag-lime', Present: 'tag-lime', Pass: 'tag-lime',
  'Ready for next role': 'tag-lime', 'Ready in 6–12 months': 'tag-lime', 'High potential': 'tag-lime', Promising: 'tag-lime',
  'In Progress': '', Scheduled: '', 'Exam Scheduled': '', Registered: '', 'In Draft': '', 'In Review': '', Enrolled: '', Submitted: '', 'Under Review': '', 'Growing in role': '', Steady: '',
  Planned: 'tag-muted', 'Not Started': 'tag-muted', Assigned: 'tag-muted', Pending: 'tag-muted', Invited: 'tag-muted', Nominated: 'tag-muted', 'Not assessed': 'tag-muted', Cancelled: 'tag-muted', 'Not Required': 'tag-muted', Excused: 'tag-muted',
  Incomplete: 'tag-warn', Deferred: 'tag-warn', 'On Hold': 'tag-warn', Partial: 'tag-warn', 'Requires Further Evidence': 'tag-warn', 'Needs More Information': 'tag-warn', 'Needs support': 'tag-warn', Rescheduled: 'tag-warn', Postponed: 'tag-warn',
  Failed: 'tag-bad', Rejected: 'tag-bad', Expired: 'tag-bad', 'No-show': 'tag-bad', Absent: 'tag-bad', Fail: 'tag-bad', 'At risk': 'tag-bad', Withdrawn: 'tag-bad', Overdue: 'tag-bad', 'Left Company': 'tag-muted',
}
export const Status = ({ v }: { v?: string | null }) => (v ? <span className={`tag ${STATUS_TONE[v] ?? ''}`}>{v}</span> : <span className="muted">–</span>)

export function Pline({ value, tone }: { value: number | null | undefined; tone?: string }) {
  const t = tone ?? (value == null ? 'muted' : value >= 0.9 ? '' : value >= 0.75 ? 'warn' : 'bad')
  return <div className={`pline ${t}`}><div className="pline-fill" style={{ width: `${Math.max(0, Math.min(1, value ?? 0)) * 100}%` }} /></div>
}

export function Kpi({ label, value, sub, icon, tone = '', bar }: { label: string; value: ReactNode; sub?: ReactNode; icon?: ReactNode; tone?: string; bar?: ReactNode }) {
  return (
    <div className={`card kpi compact ${tone}`}>
      <div className="kpi-label">{icon && <span className="kpi-icon">{icon}</span>}{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
      {bar && <div className="kpi-bar">{bar}</div>}
    </div>
  )
}

export function Drawer({ title, sub, onClose, children, foot, wide }: { title: ReactNode; sub?: ReactNode; onClose: () => void; children: ReactNode; foot?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && !document.querySelector('.modal') && onClose()
    window.addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = '' }
  }, [onClose])
  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <aside className={`drawer ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true">
        <div className="drawer-head">
          <div><h2>{title}</h2>{sub && <div className="sub">{sub}</div>}</div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon.x /></button>
        </div>
        <div className="drawer-body">{children}</div>
        {foot && <div className="drawer-foot">{foot}</div>}
      </aside>
    </>
  )
}

export function Modal({ title, text, children, actions, onClose }: { title: string; text?: ReactNode; children?: ReactNode; actions: ReactNode; onClose?: () => void }) {
  return (
    <>
      <div className="backdrop top" onClick={onClose} />
      <div className="modal" role="dialog" aria-modal="true">
        <h2>{title}</h2>
        {text && <p>{text}</p>}
        {children}
        <div className="actions">{actions}</div>
      </div>
    </>
  )
}

export function Toasts() {
  const t = useToasts()
  return <div className="toasts" aria-live="polite">{t.map((x) => <div key={x.id} className={`toast ${x.bad ? 'bad' : ''}`}>{x.text}</div>)}</div>
}

/** Searchable dropdown for long lists (people, competencies, courses …). */
export function Combobox({ options, value, onChange, placeholder = 'Search…', allowEmpty = true, small, autoFocus }: {
  options: Option[] | null; value: string | null; onChange: (v: string | null) => void; placeholder?: string; allowEmpty?: boolean; small?: boolean; autoFocus?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [hl, setHl] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const current = options?.find((o) => o.id === value)
  const filtered = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean)
    return (options ?? []).filter((o) => (o.active || o.id === value) && words.every((w) => `${o.label} ${o.sub} ${o.id}`.toLowerCase().includes(w))).slice(0, 200)
  }, [options, q, value])
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  useEffect(() => { listRef.current?.querySelector('.hl')?.scrollIntoView({ block: 'nearest' }) }, [hl])
  const choose = (o: Option) => { onChange(o.id); setOpen(false); setQ('') }
  return (
    <div className="combo" ref={box}>
      <input
        className={`input ${small ? 'sm' : ''}`} autoFocus={autoFocus}
        value={open ? q : current ? current.label : value ? value : ''}
        placeholder={options ? placeholder : 'Loading…'}
        onFocus={() => { setOpen(true); setQ(''); setHl(0) }}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setHl(0) }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHl((h) => Math.min(h + 1, filtered.length - 1)) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setHl((h) => Math.max(h - 1, 0)) }
          else if (e.key === 'Enter' && open && filtered[hl]) { e.preventDefault(); choose(filtered[hl]) }
          else if (e.key === 'Escape') { setOpen(false); (e.target as HTMLInputElement).blur() }
        }}
      />
      {allowEmpty && value && !open && <button type="button" className="combo-clear" aria-label="Clear" onClick={() => onChange(null)}>×</button>}
      {open && (
        <div className="combo-list" ref={listRef}>
          {filtered.length === 0 && <div className="combo-empty">{options ? 'No matches' : 'Loading…'}</div>}
          {filtered.map((o, i) => (
            <div key={o.id} className={`combo-opt ${i === hl ? 'hl' : ''} ${o.id === value ? 'sel' : ''}`} onMouseDown={(e) => { e.preventDefault(); choose(o) }} onMouseEnter={() => setHl(i)}>
              <span>{o.label}</span>{o.sub && <span className="sub">{o.sub}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function MultiCombobox({ options, value, onChange, placeholder }: { options: Option[] | null; value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const map = new Map((options ?? []).map((o) => [o.id, o]))
  return (
    <div>
      {value.length > 0 && (
        <div className="multi">
          {value.map((id) => <span key={id} className="tag tag-lime">{map.get(id)?.label ?? id}<button type="button" aria-label="Remove" onClick={() => onChange(value.filter((x) => x !== id))}>×</button></span>)}
        </div>
      )}
      <Combobox options={(options ?? []).filter((o) => !value.includes(o.id))} value={null} onChange={(v) => v && onChange([...value, v])} placeholder={placeholder ?? 'Add…'} allowEmpty={false} />
    </div>
  )
}

export function Spark({ values, max = 5 }: { values: number[]; max?: number }) {
  if (values.length < 2) return null
  const w = 120, h = 32
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (w - 4) + 2, h - 2 - (v / max) * (h - 4)])
  return <svg className="spark" viewBox={`0 0 ${w} ${h}`}><path d={pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')} /></svg>
}
