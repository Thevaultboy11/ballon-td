// Hand-drawn charts (plain SVG and HTML, no chart library). Colours come from CSS classes and tokens,
// so they follow the palette and both themes.
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

const f = (x: number) => Math.round(x * 100) / 100
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x))
export const pctTxt = (x: number | null | undefined, d = 0) => (x == null ? '–' : `${(x * 100).toFixed(d)}%`)
export const nf = (x: number | null | undefined, d = 0) => (x == null ? '–' : x.toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d }))

export function Ring({ value, size = 84, stroke = 8, label, tone }: { value: number | null | undefined; size?: number; stroke?: number; label?: string; tone?: string }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, v = value == null ? 0 : clamp(value)
  const cls = tone ?? (value == null ? '' : value >= 0.9 ? 'tone-accent' : value >= 0.75 ? 'tone-warn' : 'tone-bad')
  return (
    <svg className={`ring ${cls}`} width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label ?? pctTxt(value)}>
      <circle className="ring-track" cx={size / 2} cy={size / 2} r={f(r)} strokeWidth={stroke} fill="none" />
      <circle className="ring-value" cx={size / 2} cy={size / 2} r={f(r)} strokeWidth={stroke} fill="none" strokeDasharray={`${f(c * v)} ${f(c)}`} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" dy="0.35em" textAnchor="middle" className="ring-label">{value == null ? '–' : label ?? pctTxt(value)}</text>
    </svg>
  )
}

export type Seg = { value: number; cls: string; label: string }
export function Donut({ segments, size = 168, stroke = 22, center = '', sub = '' }: { segments: Seg[]; size?: number; stroke?: number; center?: string; sub?: string }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const r = (size - stroke) / 2, c = 2 * Math.PI * r
  const live = segments.filter((s) => s.value > 0)
  let offset = 0
  return (
    <svg className="donut" width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${center} ${sub}`}>
      <circle className="ring-track" cx={size / 2} cy={size / 2} r={f(r)} strokeWidth={stroke} fill="none" />
      {live.map((s) => {
        const len = (s.value / total) * c, gap = live.length > 1 ? 2 : 0
        const el = <circle key={s.label} className={`donut-seg ${s.cls}`} cx={size / 2} cy={size / 2} r={f(r)} strokeWidth={stroke} fill="none" strokeDasharray={`${f(Math.max(0, len - gap))} ${f(c)}`} strokeDashoffset={f(-offset)} transform={`rotate(-90 ${size / 2} ${size / 2})`}><title>{`${s.label}: ${s.value}`}</title></circle>
        offset += len
        return el
      })}
      <text x="50%" y="48%" textAnchor="middle" className="donut-center">{center}</text>
      <text x="50%" y="62%" textAnchor="middle" className="donut-sub">{sub}</text>
    </svg>
  )
}

export type Bar = { label: ReactNode; href?: string; value: number; part?: number; marker?: number; text: ReactNode; sub?: ReactNode; cls?: string; title?: string }
export function BarList({ items, empty = 'Nothing to show', stacked }: { items: Bar[]; empty?: string; stacked?: boolean }) {
  if (!items.length) return <p className="empty">{empty}</p>
  return (
    <div className={`barlist ${stacked ? 'stacked' : ''}`}>
      {items.map((it, i) => (
        <div key={i} className="barlist-row" title={it.title}>
          <div className="barlist-label">{it.href ? <Link to={it.href}>{it.label}</Link> : it.label}{it.sub != null && <span className="barlist-sub">{it.sub}</span>}</div>
          <div className="barlist-track">
            <div className={`barlist-fill ${it.cls ?? ''}`} style={{ width: `${f(clamp(it.value || 0) * 100)}%` }} />
            {it.part != null && <div className="barlist-part" style={{ width: `${f(clamp(it.part) * 100)}%` }} />}
            {it.marker != null && <div className="barlist-marker" style={{ left: `${f(clamp(it.marker) * 100)}%` }} />}
          </div>
          <div className="barlist-value">{it.text}</div>
        </div>
      ))}
    </div>
  )
}

export function StackBar({ segments, height = 12 }: { segments: Seg[]; height?: number }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  return <div className="stackbar" style={{ height }}>{segments.filter((s) => s.value > 0).map((s) => <div key={s.label} className={`stackbar-seg ${s.cls}`} style={{ width: `${f((s.value / total) * 100)}%` }} title={`${s.label}: ${s.value}`} />)}</div>
}

export function Legend({ rows, inline, onPick, active }: { rows: { cls: string; label: string; value?: ReactNode; key?: string; href?: string }[]; inline?: boolean; onPick?: (key: string) => void; active?: string | null }) {
  return (
    <div className={`legend ${inline ? 'inline' : ''}`}>
      {rows.map((r) => {
        const inner = <><span className={`dot ${r.cls}`} /><span>{r.label}</span>{r.value != null && <span className="val">{r.value}</span>}</>
        if (r.href) return <Link key={r.label} className="legend-row" to={r.href}>{inner}</Link>
        if (onPick) return <button key={r.label} type="button" className={`legend-row ${active === r.key ? 'active' : ''}`} onClick={() => onPick(r.key!)}>{inner}</button>
        return <span key={r.label} className="legend-row">{inner}</span>
      })}
    </div>
  )
}

export function Radar({ axes, series, max = 5, width = 600, height = 440 }: { axes: { label: string; title?: string }[]; series: { name: string; cls: string; values: (number | null)[]; dots?: boolean }[]; max?: number; width?: number; height?: number }) {
  const n = axes.length
  if (n < 3) return <p className="empty">Not enough competencies for a radar chart.</p>
  const cx = width / 2, cy = height / 2, R = height / 2 - 52
  const pt = (i: number, v: number) => { const a = -Math.PI / 2 + (2 * Math.PI * i) / n, rr = (clamp(v, 0, max) / max) * R; return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)] }
  return (
    <svg className="radar" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Competency radar">
      {Array.from({ length: max }, (_, l) => <polygon key={l} className="radar-grid" points={axes.map((_, i) => pt(i, l + 1).map(f).join(',')).join(' ')} />)}
      {axes.map((_, i) => { const [x, y] = pt(i, max); return <line key={i} className="radar-grid" x1={cx} y1={cy} x2={f(x)} y2={f(y)} /> })}
      {series.map((s) => (
        <g key={s.name}>
          <polygon className={`radar-shape ${s.cls}`} points={s.values.map((v, i) => pt(i, v ?? 0).map(f).join(',')).join(' ')} />
          {s.dots !== false && s.values.map((v, i) => { const [x, y] = pt(i, v ?? 0); return <circle key={i} className={`radar-dot ${s.cls}`} cx={f(x)} cy={f(y)} r={2.5}><title>{`${axes[i].title ?? axes[i].label} · ${s.name}: ${v ?? '–'}`}</title></circle> })}
        </g>
      ))}
      {axes.map((a, i) => {
        const ang = -Math.PI / 2 + (2 * Math.PI * i) / n, sin = Math.sin(ang), cos = Math.cos(ang)
        const x = cx + (R + 12) * cos, y = cy + (R + 12) * sin + (sin < -0.85 ? -6 : sin > 0.85 ? 8 : 0)
        return <text key={i} className="radar-label" x={f(x)} y={f(y)} dy="0.35em" textAnchor={Math.abs(cos) < 0.08 ? 'middle' : cos > 0 ? 'start' : 'end'}><title>{a.title ?? a.label}</title>{a.label}</text>
      })}
    </svg>
  )
}

export function LineChart({ labels, series, yMin = 1, yMax = 5, height = 200, width = 560 }: { labels: string[]; series: { name: string; cls: string; values: (number | null)[] }[]; yMin?: number; yMax?: number; height?: number; width?: number }) {
  const padL = 32, padR = 28, padT = 12, padB = 28, n = labels.length
  const X = (i: number) => padL + (n <= 1 ? (width - padL - padR) / 2 : (i * (width - padL - padR)) / (n - 1))
  const Y = (v: number) => padT + ((yMax - v) / (yMax - yMin)) * (height - padT - padB)
  return (
    <svg className="linechart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Trend">
      {Array.from({ length: yMax - yMin + 1 }, (_, k) => yMin + k).map((v) => <g key={v}><line className="chart-grid" x1={padL} x2={width - padR} y1={f(Y(v))} y2={f(Y(v))} /><text className="chart-tick" x={padL - 8} y={f(Y(v))} dy="0.35em" textAnchor="end">{v}</text></g>)}
      {labels.map((l, i) => <text key={i} className="chart-tick" x={f(X(i))} y={height - 8} textAnchor="middle">{l}</text>)}
      {series.map((s) => {
        let d = '', pen = false
        s.values.forEach((v, i) => { if (v == null) { pen = false; return } d += `${pen ? 'L' : 'M'}${f(X(i))} ${f(Y(v))}`; pen = true })
        return <g key={s.name}><path className={`line-path ${s.cls}`} d={d} fill="none" />{s.values.map((v, i) => (v == null ? null : <circle key={i} className={`line-dot ${s.cls}`} cx={f(X(i))} cy={f(Y(v))} r={3.5}><title>{`${labels[i]} · ${s.name}: ${v.toFixed(2)}`}</title></circle>))}</g>
      })}
    </svg>
  )
}

/** Colour for one competency cell: level − required. */
export const gapClass = (level: number, req: number) => { const d = level - req; return d >= 1 ? 'heat-ex' : d === 0 ? 'heat-ok' : d === -1 ? 'heat-g1' : 'heat-g2' }
/** Colour for an average (level − required) over a group. */
export const avgGapClass = (d: number | null) => (d == null ? 'heat-none' : d >= 0.5 ? 'heat-ex' : d >= -0.15 ? 'heat-ok' : d >= -0.6 ? 'heat-g1' : 'heat-g2')
/** Colour for an observed behaviour score (1–5). */
export const scoreClass = (v: number | null | undefined) => (v == null ? 'heat-none' : v >= 4.5 ? 'score-5' : v >= 3.5 ? 'score-4' : v >= 2.5 ? 'score-3' : v >= 1.5 ? 'score-2' : 'score-1')
export const readinessTone = (x: number | null | undefined) => (x == null ? 'muted' : x >= 0.9 ? '' : x >= 0.75 ? 'warn' : 'bad')

export const BANDS = [
  { id: 'ready', label: 'Ready now', short: 'Ready now' },
  { id: 'soon', label: 'Ready in 6–12 months', short: '6–12 months' },
  { id: 'growing', label: 'Growing in role', short: 'Growing' },
  { id: 'support', label: 'Needs support', short: 'Support' },
  { id: 'unassessed', label: 'Not assessed yet', short: 'Not assessed' },
] as const
export const BandTag = ({ id }: { id: string }) => {
  const b = BANDS.find((x) => x.id === id) ?? BANDS[4]
  const cls = { ready: 'tag-good', soon: 'tag-good', growing: '', support: 'tag-warn', unassessed: 'tag-muted' }[b.id]
  return <span className={`tag ${cls}`}><span className={`dot b-${b.id}`} />{b.short}</span>
}
