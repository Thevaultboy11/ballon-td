// The person "Analysis" tab: the employee page of the stand-alone skills dashboard, on live data
// (GET /api/people/:id/analysis). Readiness rings, competency radar, what to grow for the next role,
// observed behaviours day by day, training, certifications and the learning plan.
import { useApi, fmtDate } from '../api'
import { Icon, Kpi, Status } from './ui'
import { BarList, Donut, Legend, LineChart, Radar, Ring, nf, pctTxt, scoreClass, BandTag } from './charts'
import { Pline } from './ui'

const TRAINING_STATUSES = [
  { id: ['Completed'], cls: 's-done', label: 'Completed' },
  { id: ['In Progress'], cls: 's-progress', label: 'In progress' },
  { id: ['Incomplete', 'No-show'], cls: 's-incomplete', label: 'Incomplete / no-show' },
  { id: ['Not Started', 'Assigned'], cls: 's-upcoming', label: 'Upcoming' },
  { id: ['Cancelled', 'Deferred', 'Expired'], cls: 's-cancelled', label: 'Deferred / cancelled' },
]
const short = (d: string | null) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '–')
const shortName = (n: string) => (n.length > 24 ? `${n.slice(0, 22)}…` : n)

export function Analysis({ employeeId }: { employeeId: string }) {
  const { data, error } = useApi<any>(`/people/${employeeId}/analysis`)
  if (error && !data) return <div className="alert">{error}</div>
  if (!data) return <div className="loading">Loading…</div>
  const a = data, row = a.row ?? {}, t = row.training ?? { done: 0, started: 0, inProgress: 0, incomplete: 0, upcoming: 0, rate: null, allDone: false }
  const rated = a.competencies.filter((c: any) => c.level != null && c.required != null)
  const met = rated.filter((c: any) => c.level >= c.required).length
  const maxScale = Math.max(4, ...a.competencies.map((c: any) => c.max ?? 4))
  const present = a.days.filter((d: any) => d.attendance !== 'Absent' && d.overall != null)
  const segs = TRAINING_STATUSES.map((s) => ({ value: a.training.filter((x: any) => s.id.includes(x.status)).length, cls: s.cls, label: s.label }))
  const planMax = Math.max(1, ...a.plan.map((p: any) => p.hours ?? 0))
  const key = row.criticalPosition || row.keyFor?.length

  return (
    <div className="stack">
      <div className="row wrap" style={{ gap: 6 }}>
        <BandTag id={a.band} />
        {row.criticalPosition && <span className="tag tag-dark">Critical position</span>}
        {row.keyFor?.length > 0 && <span className="tag tag-warn">Key person · {row.keyFor.length}</span>}
        {row.exceedsRole && <span className="tag tag-good">Exceeds role</span>}
        {row.potentialNote && <Status v={row.potentialNote} />}
      </div>

      <div className="grid g-3">
        <div className="card kpi"><div className="kpi-label">Role readiness</div>
          <div className="kpi-ring mt8"><Ring value={a.roleReadiness} /><div><div style={{ fontSize: 13.5 }}>Meets <b>{met}</b> of {rated.length} requirements</div><div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>as {a.role ?? '–'}</div></div></div></div>
        <div className="card kpi"><div className="kpi-label">Next role readiness</div>
          <div className="kpi-ring mt8"><Ring value={a.nextReadiness} />{a.nextRole
            ? <div><div style={{ fontSize: 13.5 }}>→ <b>{a.nextRole}</b></div><div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>{a.focus.length} {a.focus.length === 1 ? 'gap' : 'gaps'} to close</div></div>
            : <div><div style={{ fontSize: 13.5 }}><b>No next role set</b></div><div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>Set one on the role profile</div></div>}</div></div>
        <Kpi label="Critical gaps" icon={<Icon.alert />} tone={row.criticalGaps?.length ? 'bad' : ''} value={nf(row.criticalGaps?.length ?? 0)} sub={row.criticalGaps?.length ? row.criticalGaps.join(', ') : 'No High-priority competency is below requirement'} />
        <div className={`card kpi ${key ? 'warn' : ''}`}><div className="kpi-label"><span className="kpi-icon"><Icon.key /></span>Key position</div>
          <div className="yesno">{key ? 'Yes' : 'No'}</div>
          <div className="kpi-sub">{[row.criticalPosition && `Holds a critical position (${a.role})`, row.keyFor?.length && `Only expert in the section for ${row.keyFor.join(', ')}`].filter(Boolean).join('. ') || 'Not a critical role and nobody depends on them alone for a competency'}
            {row.criticalPosition && <> · {row.successors?.length ? `${row.successors.length} ready successor${row.successors.length > 1 ? 's' : ''}` : 'no ready successor'}</>}</div></div>
        <div className="card kpi"><div className="kpi-label"><span className="kpi-icon"><Icon.up /></span>Exceeds role competencies</div>
          <div className="yesno">{!rated.length ? '–' : row.exceedsRole ? 'Yes' : row.exceeds ? 'Partly' : 'No'}</div>
          <div className="kpi-sub">{rated.length ? (row.exceeds ? `Above requirement in ${row.exceeds} ${row.exceeds === 1 ? 'competency' : 'competencies'}. ${row.exceedsRole ? 'Meets every other requirement.' : `Still below in ${row.gapCount}.`}` : 'Not above requirement anywhere') : 'Needs an assessment'}</div></div>
        <div className="card kpi"><div className="kpi-label">Did the training</div>
          <div className="kpi-ring mt8"><Ring value={t.rate} />{t.started
            ? <div><div style={{ fontSize: 13.5 }}><b>{t.allDone ? 'Yes' : t.done ? 'Partly' : 'No'}</b> · {t.done} of {t.started} started done</div><div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>{t.inProgress} in progress · {t.incomplete} incomplete · {t.upcoming} upcoming</div></div>
            : <div style={{ fontSize: 13.5 }}><b>No training started yet</b></div>}</div></div>
      </div>

      {rated.length > 0 && (
        <div className="grid g-2">
          <div className="card">
            <div className="card-head"><div><h3>Competency profile</h3><div className="card-sub">Assessed level against today's role{a.nextRole ? ' and the next one' : ''}</div></div></div>
            <Radar max={maxScale} axes={a.competencies.map((c: any) => ({ label: shortName(c.name), title: `${c.name} (${c.category})` }))} series={[
              { name: 'Required now', cls: 'r-req', values: a.competencies.map((c: any) => c.required ?? 0), dots: false },
              ...(a.nextRole ? [{ name: `Required as ${a.nextRole}`, cls: 'r-next', values: a.competencies.map((c: any) => c.next ?? c.required ?? 0), dots: false }] : []),
              { name: 'Assessed level', cls: 'r-level', values: a.competencies.map((c: any) => c.level ?? 0) },
            ]} />
            <div className="legend inline" style={{ justifyContent: 'center', marginTop: 8 }}><span className="legend-row"><span className="dot" style={{ background: 'var(--accent)' }} />Assessed level</span><span className="legend-row"><span className="swatch-line dashed" />Required now</span>{a.nextRole && <span className="legend-row"><span className="swatch-line warn" />Required as {a.nextRole}</span>}</div>
          </div>
          <div className="card">
            <div className="card-head"><div><h3>{a.nextRole ? `To become ${a.nextRole}` : 'Gaps in the current role'}</h3><div className="card-sub">{a.focus.length ? `${a.focus.length} ${a.focus.length === 1 ? 'competency' : 'competencies'} to grow, most important first. Open one to see what the target level looks like.` : ''}</div></div>
              {a.nextRole && <div style={{ minWidth: 120, textAlign: 'right' }}><div style={{ fontSize: 22, fontWeight: 800, color: 'var(--fg)' }}>{pctTxt(a.nextReadiness)}</div><Pline value={a.nextReadiness} /></div>}</div>
            <div style={{ maxHeight: 420, overflow: 'auto', marginRight: -8, paddingRight: 8 }}>
              {!a.focus.length ? <p className="empty">{a.nextRole ? 'Already meets every requirement of the next role.' : 'No gaps in the current role.'}</p> : a.focus.map((x: any) => (
                <div key={x.id} className="gap-item">
                  <div className="gi-top"><span className="gi-name">{x.name}</span><span className="row" style={{ gap: 8 }}>{x.priority === 'High' ? <span className="tag tag-bad">High</span> : x.priority ? <span className="tag">{x.priority}</span> : <span className="tag tag-muted">next role</span>}<span className="gi-levels">level {x.level} → {x.target}</span></span></div>
                  {x.behaviors.length > 0 && <details className="behaviors"><summary>What level {x.target} looks like</summary><ul>{x.behaviors.slice(0, 8).map((b: string, i: number) => <li key={i}>{b}</li>)}</ul></details>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="section" style={{ marginTop: 24 }}>
        <div className="section-head"><div><h2>Observed behaviours</h2><p>{a.days.length ? `${[...new Set(a.days.map((d: any) => d.course))].join(', ')}. Trainers scored ${a.parameters.length} behaviours on each day (1–5).` : 'Trainer scores from observed programmes.'}</p></div></div>
        {!a.days.length ? <div className="notice">{a.name} has not attended an observed programme yet, so there is no behaviour heatmap.</div> : (
          <div className="grid g-2-1">
            <div>
              <div className="heat-scroll" style={{ maxHeight: 'none' }}>
                <table className={`heat ${a.days.length <= 8 ? 'wide' : ''}`}>
                  <thead><tr><th className="rowhead">Behaviour · competency</th>{a.days.map((d: any) => <th key={d.id} title={`${d.course}${d.title ? ` · ${d.title}` : ''} · ${fmtDate(d.date)}${d.trainer ? ` · ${d.trainer}` : ''}`}><div className="vlabel">{short(d.date)} · D{d.dayNumber}</div></th>)}</tr></thead>
                  <tbody>{a.parameters.map((p: any) => (
                    <tr key={p.id}><th className="rowhead">{p.name}<span className="rh-sub">{p.competency ?? p.category}</span></th>
                      {a.days.map((d: any) => d.attendance === 'Absent' ? <td key={d.id} className="cell heat-none" title="Absent">–</td> : <td key={d.id} className={`cell ${scoreClass(d.scores[p.id])}`} title={`${p.name} · ${fmtDate(d.date)}: ${d.scores[p.id] ?? '–'}`}>{d.scores[p.id] ?? ''}</td>)}</tr>
                  ))}</tbody>
                </table>
              </div>
              <div className="heat-legend"><span><i className="score-5" />5</span><span><i className="score-4" />4</span><span><i className="score-3" />3</span><span><i className="score-2" />2</span><span><i className="score-1" />1</span><span><i className="heat-none" />Absent / not scored</span></div>
            </div>
            <div className="stack">
              <div className="grid g-3">
                <div className="stat"><div className="stat-value">{a.potential?.toFixed(1) ?? '–'}</div><div className="stat-label">Leadership + Agility</div></div>
                <div className="stat"><div className="stat-value">{a.coachability?.toFixed(1) ?? '–'}</div><div className="stat-label">Coachability</div></div>
                <div className="stat"><div className="stat-value">{a.growth != null ? `${a.growth >= 0 ? '+' : ''}${a.growth.toFixed(2)}` : '–'}</div><div className="stat-label">Growth in programme</div></div>
              </div>
              <div className="card"><h3>Day by day</h3><div className="card-sub" style={{ marginBottom: 10 }}>Average score per attended day</div>
                {present.length ? <LineChart labels={present.map((d: any) => short(d.date))} series={[{ name: 'Overall day average', cls: 'l-overall', values: present.map((d: any) => d.overall) }, { name: 'Leadership + Agility', cls: 'l-la', values: present.map((d: any) => d.leadershipAgility) }]} /> : <p className="empty">Absent on every day.</p>}
                <div className="legend inline" style={{ marginTop: 6 }}><span className="legend-row"><span className="swatch-line" />Overall</span><span className="legend-row"><span className="swatch-line dashed" />Leadership + Agility</span></div></div>
              <div className="card"><h3>Trainer notes</h3>
                <div className="timeline" style={{ marginTop: 6 }}>{present.filter((d: any) => d.note || d.notes).map((d: any) => (
                  <div key={d.id} className="tl-item"><div className="tl-cycle">{short(d.date)}<br />Day {d.dayNumber}</div><div><div className="tl-line"><span>{d.note ?? ''}</span><span className="muted" style={{ fontSize: 12 }}>{d.trainer ?? ''}</span></div>{d.notes && <div className="quote">{d.notes}</div>}</div></div>
                ))}{!present.some((d: any) => d.note || d.notes) && <p className="empty">No notes.</p>}</div>
                <p className="note"><b>Coachability</b> = average of openness to feedback, learning speed, applies feedback and reflection quality on the latest day.</p></div>
            </div>
          </div>
        )}
      </div>

      <div className="section" style={{ marginTop: 24 }}>
        <div className="section-head"><div><h2>Training</h2><p>{t.started ? `${t.allDone ? 'Finished everything started' : t.done ? 'Partly done' : 'Not done yet'}: ${t.done} of ${t.started} started trainings completed, ${nf(a.trainingHours, 1)} hours credited.` : 'No training started yet.'}</p></div></div>
        <div className="grid g-2-1" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,2.2fr)' }}>
          <div className="card"><div className="row" style={{ justifyContent: 'center' }}><Donut segments={segs} center={`${t.done}/${t.started}`} sub="started done" /></div><div className="mt16"><Legend rows={TRAINING_STATUSES.map((s, i) => ({ cls: s.cls, label: s.label, value: segs[i].value }))} /></div></div>
          <div className="table-wrap"><table className="table"><thead><tr><th>Training</th><th>Dates</th><th>Status</th><th className="num">Attendance</th><th className="num">Hours</th></tr></thead>
            <tbody>{a.training.length ? a.training.map((x: any) => (
              <tr key={x.id}><td><div style={{ fontWeight: 500 }}>{x.course}</div><div className="muted" style={{ fontSize: 12 }}>{x.type}{x.mode ? ` · ${x.mode}` : ''}{x.labs ? ` · labs ${x.labs}` : ''} · <span className="mono">{x.id}</span></div></td>
                <td className="muted nowrap">{fmtDate(x.start) || '–'}{x.end ? ` – ${fmtDate(x.end)}` : ''}</td><td><Status v={x.status} /></td>
                <td className="num muted">{x.attendancePct != null ? `${x.attendancePct}%` : '–'}</td><td className="num">{x.hours ? `${nf(x.hours, x.hours % 1 ? 1 : 0)} h` : <span className="muted">–</span>}</td></tr>
            )) : <tr><td colSpan={5} className="empty">No training records.</td></tr>}</tbody></table></div>
        </div>
      </div>

      <div className="section" style={{ marginTop: 24 }}>
        <div className="section-head"><div><h2>Development plan</h2><p>Certification goals and the learning plan segments with estimated time.</p></div></div>
        <div className="grid g-2">
          <div className="card"><div className="card-head"><div><h3>Certifications</h3><div className="card-sub">Professional and AI goals</div></div></div>
            {!a.certifications.length ? <p className="empty">No certifications in the plan.</p> : <div className="timeline">{a.certifications.map((c: any) => (
              <div key={c.id} className="tl-item"><div className="tl-cycle">{c.track ?? '–'}</div>
                <div><div className="tl-line"><span><b style={{ fontWeight: 600 }}>{c.name}</b>{c.provider && <span className="muted"> · {c.provider}</span>}</span><Status v={c.status} /></div>
                  <div className="tl-desc">{[c.completed && `Achieved ${fmtDate(c.completed)}`, c.exam && !c.completed && `Exam ${fmtDate(c.exam)}`, c.target && !c.completed && `Target ${fmtDate(c.target)}`, c.expiry && `Expires ${fmtDate(c.expiry)}`].filter(Boolean).join(' · ')}</div></div></div>
            ))}</div>}</div>
          <div className="card"><div className="card-head"><div><h3>Learning plan</h3><div className="card-sub">Plan actions with estimated time and progress</div></div></div>
            {!a.plan.length ? <p className="empty">No plan yet: it is agreed with the coach after the validation report.</p> : <>
              <BarList stacked items={a.plan.map((p: any) => ({ label: p.title, sub: p.segment ? p.segment.split(' ')[0] : p.type ?? '', value: (p.hours ?? 0) / planMax, marker: p.progress != null ? ((p.hours ?? 0) / planMax) * (p.progress / 100) : undefined, text: `${p.hours != null ? `${nf(p.hours, 1)} h` : '–'}${p.progress != null ? ` · ${p.progress}%` : ''}`, cls: p.status === 'Completed' ? 'accent' : '' }))} />
              <div className="grid g-2 mt16"><div className="stat"><div className="stat-value">{nf(a.plan.reduce((n: number, p: any) => n + (p.hours ?? 0), 0), 1)} h</div><div className="stat-label">planned</div></div><div className="stat"><div className="stat-value">{nf(a.trainingHours, 1)} h</div><div className="stat-label">training hours credited</div></div></div></>}
          </div>
        </div>
      </div>
    </div>
  )
}
