// The horizontal roadmap: a stage rail (where a person or team is on the journey), the detail of one
// stage (what is done, what is still open) and a dated swimlane timeline.
import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { fmtDate } from '../api'

export type StageStatus = 'done' | 'active' | 'risk' | 'todo'
export type Item = { text: string; date: string | null; due?: boolean; overdue?: boolean }
export type Stage = { key: string; label: string; short: string; status: StageStatus; progress: number | null; headline: string; date?: string | null; done?: Item[]; doneCount?: number; open: Item[]; flags: { code: string; name: string; severity: string }[] }
export type Event = { date: string; end?: string | null; lane: string; label: string; state: 'done' | 'planned' | 'missed'; stage: string }

export const STATUS_WORD: Record<StageStatus, string> = { done: 'Done', active: 'In progress', risk: 'At risk', todo: 'Not started' }
const pct = (x: number | null | undefined) => (x == null ? '' : `${Math.round(x * 100)}%`)

const Check = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
const Bang = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6v7M12 17.5v.01" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg>

/** Ten stages left to right, joined by a line that fills as stages are completed. */
export function StageRail({ stages, current, selected, onSelect, sub }: {
  stages: Stage[]; current?: string | null; selected?: string | null; onSelect?: (key: string) => void; sub?: (s: Stage) => ReactNode
}) {
  return (
    <div className="rail-scroll">
      <ol className="rail" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(96px, 1fr))` }}>
        {stages.map((s, i) => {
          const next = stages[i + 1]
          const p = s.status === 'done' ? 1 : s.progress ?? 0
          return (
            <li key={s.key} className={`rail-stage st-${s.status} ${current === s.key ? 'is-current' : ''} ${selected === s.key ? 'is-selected' : ''}`}>
              {next && <span className={`rail-line ${s.status === 'done' ? 'full' : ''}`} />}
              <button type="button" className="rail-node" onClick={() => onSelect?.(s.key)} aria-label={`${s.label}: ${STATUS_WORD[s.status]}`} title={`${s.label} · ${STATUS_WORD[s.status]}${s.progress != null && s.status !== 'done' ? ` · ${pct(s.progress)}` : ''}`}
                style={{ ['--p' as any]: `${p * 360}deg` }}>
                <span className="rail-dot">{s.status === 'done' ? <Check /> : s.status === 'risk' ? <Bang /> : <b>{i + 1}</b>}</span>
              </button>
              {current === s.key && <span className="rail-here">Now</span>}
              <div className="rail-label">{s.short}</div>
              <div className="rail-meta">{s.status === 'done' ? 'Done' : s.status === 'todo' ? 'Not started' : pct(s.progress)}</div>
              {sub ? <div className="rail-sub">{sub(s)}</div> : <div className="rail-sub" title={s.headline}>{s.headline}</div>}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/** What is done and what is still open for one stage. */
export function StageDetail({ stage }: { stage: Stage }) {
  return (
    <div className="stage-detail">
      <div className="stage-detail-head">
        <div><h3>{stage.label}</h3><div className="card-sub">{stage.headline}</div></div>
        <span className={`tag st-tag-${stage.status}`}>{STATUS_WORD[stage.status]}{stage.progress != null && stage.status !== 'done' && stage.status !== 'todo' ? ` · ${pct(stage.progress)}` : ''}</span>
      </div>
      <div className="grid g-2">
        <div>
          <div className="col-title"><span className="ok-mark"><Check /></span>Done{stage.done ? ` (${stage.done.length})` : ''}</div>
          {!stage.done?.length ? <div className="muted small">Nothing yet.</div> : (
            <ul className="todo-list">{stage.done.map((x, i) => <li key={i} className="is-done"><span>{x.text}</span>{x.date && <span className="when">{fmtDate(x.date)}</span>}</li>)}</ul>
          )}
        </div>
        <div>
          <div className="col-title"><span className="open-mark" />Still to do ({stage.open.length})</div>
          {!stage.open.length ? <div className="muted small">Nothing left in this stage.</div> : (
            <ul className="todo-list">{stage.open.map((x, i) => (
              <li key={i} className={x.overdue ? 'is-overdue' : ''}><span>{x.text}</span>{x.date && <span className={`when ${x.overdue ? 'bad' : x.due ? 'due' : ''}`}>{x.overdue ? 'overdue · ' : x.due ? 'due ' : ''}{fmtDate(x.date)}</span>}</li>
            ))}</ul>
          )}
        </div>
      </div>
      {stage.flags.length > 0 && (
        <div className="row wrap mt16" style={{ gap: 6 }}>
          {stage.flags.map((f) => <span key={f.code} className={`tag ${f.severity === 'High' ? 'tag-bad' : f.severity === 'Medium' ? 'tag-warn' : ''}`} title={f.name}>{f.code} {f.name}</span>)}
        </div>
      )}
    </div>
  )
}

const LANES = ['Assessment', 'Plan', 'Training', 'Observation', 'Certification', 'Coaching', 'Validation']
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Swimlanes by month: filled = done, hollow = planned, red = missed. Today is the vertical line. */
export function Timeline({ events, window }: { events: Event[]; window: { start: string; end: string } }) {
  const t0 = new Date(window.start).getTime(), t1 = new Date(window.end).getTime()
  const x = (d: string | Date) => `${Math.max(0, Math.min(100, ((new Date(d).getTime() - t0) / (t1 - t0)) * 100))}%`
  const months = useMemo(() => {
    const out: { label: string; at: string }[] = []
    const d = new Date(t0)
    while (d.getTime() < t1) { out.push({ label: `${MONTH[d.getUTCMonth()]}${d.getUTCMonth() === 0 || !out.length ? ` ${d.getUTCFullYear()}` : ''}`, at: x(d) }); d.setUTCMonth(d.getUTCMonth() + 1) }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t0, t1])
  const lanes = LANES.filter((l) => events.some((e) => e.lane === l))
  // Pack each lane into rows so overlapping marks do not hide each other.
  const packed = useMemo(() => {
    const span = 4 * 864e5 * ((t1 - t0) / (180 * 864e5))
    return LANES.map((l) => {
      const ends: number[] = []
      const items = events.filter((e) => e.lane === l).map((e) => {
        const a = new Date(e.date).getTime(), isBar = !!e.end && new Date(e.end).getTime() - a > 2 * 864e5
        const b = isBar ? new Date(e.end!).getTime() : a + span
        let row = ends.findIndex((end) => end < a - span / 2)
        if (row < 0) { row = ends.length; ends.push(b) } else ends[row] = b
        return { e, isBar, row }
      })
      return { lane: l, items, rows: Math.max(1, ends.length) }
    })
  }, [events, t0, t1])
  if (!lanes.length) return <div className="muted small">No dated records yet.</div>
  return (
    <div className="tl-scroll">
      <div className="tl">
        <div className="tl-axis"><span />
          <div className="tl-track">{months.map((m) => <span key={m.at} className="tl-month" style={{ left: m.at }}>{m.label}</span>)}</div>
        </div>
        {packed.filter((p) => p.items.length).map(({ lane, items, rows }) => (
          <div key={lane} className="tl-lane" style={{ height: Math.max(34, rows * 16 + 18) }}>
            <span className="tl-name">{lane}</span>
            <div className="tl-track">
              {months.map((m) => <span key={m.at} className="tl-grid" style={{ left: m.at }} />)}
              {items.map(({ e, isBar, row }, i) => {
                const top = rows === 1 ? '50%' : `${9 + row * 16 + 8}px`
                return isBar
                  ? <span key={i} className={`tl-bar ${e.state}`} style={{ top, left: x(e.date), width: `calc(${x(e.end!)} - ${x(e.date)})` }} title={`${e.label} · ${fmtDate(e.date)} → ${fmtDate(e.end)} · ${e.state}`} />
                  : <span key={i} className={`tl-dot ${e.state}`} style={{ top, left: x(e.date) }} title={`${e.label} · ${fmtDate(e.date)} · ${e.state}`} />
              })}
            </div>
          </div>
        ))}
        <div className="tl-today" style={{ left: `calc(130px + (100% - 130px) * ${(Date.now() - t0) / (t1 - t0)})` }}><span>Today</span></div>
      </div>
      <div className="tl-legend"><span><i className="tl-dot done" />Done</span><span><i className="tl-dot planned" />Planned</span><span><i className="tl-dot missed" />Missed / overdue</span><span><i className="tl-bar planned" />Planned period</span></div>
    </div>
  )
}

/** One person's ten stages as a compact strip (team view). */
export function MiniRail({ stages, current }: { stages: Stage[]; current?: string | null }) {
  return (
    <div className="mini-rail">
      {stages.map((s) => (
        <span key={s.key} className={`mini-seg st-${s.status} ${current === s.key ? 'is-current' : ''}`} title={`${s.label} · ${STATUS_WORD[s.status]}${s.progress != null && s.status !== 'done' ? ` ${pct(s.progress)}` : ''} · ${s.headline}`}>
          {s.status !== 'done' && s.status !== 'todo' && <i style={{ width: pct(s.progress ?? 0) }} />}
        </span>
      ))}
    </div>
  )
}

export function NextSteps({ items }: { items: (Item & { stage: string; name?: string; employeeId?: string })[] }) {
  if (!items.length) return <div className="muted small">Nothing scheduled.</div>
  return (
    <ul className="todo-list next">
      {items.map((x, i) => (
        <li key={i} className={x.overdue ? 'is-overdue' : ''}>
          <span>{x.employeeId && <><Link to={`/people/${x.employeeId}?tab=roadmap`}><b>{x.name}</b></Link> · </>}{x.text}<span className="muted"> · {x.stage}</span></span>
          {x.date && <span className={`when ${x.overdue ? 'bad' : 'due'}`}>{x.overdue ? 'overdue · ' : ''}{fmtDate(x.date)}</span>}
        </li>
      ))}
    </ul>
  )
}
