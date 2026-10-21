import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ENTITY } from '@shared/entities'
import { api, toast, useApi, useMeta, useOptions, fmtDate, dec } from '../api'
import { Drawer, Icon, MultiCombobox, Status } from '../components/ui'
import { EntityForm } from '../components/entity'

export default function Session() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') ?? 'participants'
  const { data, error } = useApi<any>(`/sessions/${id}/roster`)
  const [edit, setEdit] = useState(false)
  if (error && !data) return <div className="container page"><div className="hero compact"><h1>Session not found</h1><p className="sub">{error}</p></div></div>
  if (!data) return <div className="loading">Loading…</div>
  const s = data.session, c = data.course
  return (
    <div className="page">
      <section className="hero compact container">
        <div className="crumbs"><Link to="/sessions">Sessions</Link><span className="sep">/</span><span className="mono">{s.id}</span></div>
        <div className="row between wrap mt16" style={{ alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ marginTop: 0 }}>{c.name}</h1>
            <div className="profile-meta" style={{ marginTop: 10 }}>
              <span><b>{fmtDate(s.startDate) || 'No date'}</b>{s.endDate && s.endDate !== s.startDate && <> → <b>{fmtDate(s.endDate)}</b></>}</span>
              <span>{c.days ?? 1} day{(c.days ?? 1) === 1 ? '' : 's'} · {c.durationHours ?? '–'} h · {s.mode ?? c.deliveryMode ?? '–'}</span>
              <span>Trainer <b>{s._ref.trainerId ?? '—'}</b></span>
              {s.batch && <span>Batch <b>{s.batch}</b></span>}
              {s.location && <span>{s.location}</span>}
              <Status v={s.status} />
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setEdit(true)}><Icon.edit />Edit session</button>
        </div>
        <div className="tabs">
          <button className={tab === 'participants' ? 'active' : ''} onClick={() => setParams({}, { replace: true })}>Participants <span className="count">{data.records.length}</span></button>
          <button className={tab === 'observations' ? 'active' : ''} onClick={() => setParams({ tab: 'observations' }, { replace: true })}>Observation scores{!c.observed && <span className="count">not observed</span>}</button>
        </div>
      </section>
      <div className="container">
        {tab === 'participants' ? <Roster data={data} /> : <Observations sessionId={s.id} />}
      </div>
      {edit && <EntityForm entity={ENTITY.sessions} id={s.id} onClose={() => setEdit(false)} />}
    </div>
  )
}

// ------------------------------------------------------------------ roster with bulk editing
function Roster({ data }: { data: any }) {
  const meta = useMeta()
  const [rows, setRows] = useState<any[]>(data.records)
  const [dirty, setDirty] = useState<Set<string>>(new Set())
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [source, setSource] = useState('Trainer sheet')
  useEffect(() => { if (!dirty.size) setRows(data.records) }, [data]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (id: string, patch: any) => { setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r))); setDirty((d) => new Set(d).add(id)) }
  const setAll = (patch: any) => { setRows((rs) => rs.map((r) => ({ ...r, ...patch }))); setDirty(new Set(rows.map((r) => r.id))) }
  const s = data.session, c = data.course

  async function save() {
    setSaving(true)
    try {
      const body = rows.filter((r) => dirty.has(r.id)).map(({ id, status, attendancePct, score, hours, completionDate, comments }) => ({ id, status, attendancePct, score, hours, completionDate, comments }))
      const res = await api(`/sessions/${s.id}/records`, { method: 'PUT', body: { rows: body, source } })
      toast(`Saved ${res.changed} participant${res.changed === 1 ? '' : 's'}`)
      setDirty(new Set())
    } catch (e: any) { toast(e.message, true) } finally { setSaving(false) }
  }

  return (
    <div className="mt24">
      <div className="table-tools">
        <div className="toolbar">
          <span className="muted" style={{ fontSize: 13 }}>Set for everyone:</span>
          <button className="chip-btn" onClick={() => setAll({ status: 'Completed', attendancePct: 100, completionDate: fmtDate(s.endDate ?? s.startDate), hours: c.durationHours })}>Completed, 100% attendance</button>
          <button className="chip-btn" onClick={() => setAll({ status: 'In Progress' })}>In progress</button>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setAdding(true)}><Icon.plus />Add participants</button>
      </div>
      {!rows.length ? <div className="card subtle empty-state"><h3>No participants yet</h3>Add the people who attend this session.</div> : (
        <div className="table-wrap">
          <table className="table dense">
            <thead><tr><th>Participant</th><th>Status</th><th className="num">Attendance %</th><th className="num">Score</th><th className="num">Hours</th><th>Completed</th><th>Comments</th>{c.observed && <th>Days scored</th>}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><Link to={`/people/${r.employeeId}`} style={{ fontWeight: 500 }}>{dirty.has(r.id) && <span className="dirty-dot" />}{r.name}</Link><div className="person-role">{r.jobTitle}</div></td>
                  <td><select className="select sm" style={{ width: 130 }} value={r.status} onChange={(e) => set(r.id, { status: e.target.value })}>{(meta.lists.trainingStatus ?? []).map((v) => <option key={v.value}>{v.value}</option>)}</select></td>
                  <td className="num"><input className="input sm" style={{ width: 70 }} type="number" min={0} max={100} value={r.attendancePct ?? ''} onChange={(e) => set(r.id, { attendancePct: e.target.value === '' ? null : Number(e.target.value) })} /></td>
                  <td className="num"><input className="input sm" style={{ width: 70 }} type="number" value={r.score ?? ''} onChange={(e) => set(r.id, { score: e.target.value === '' ? null : Number(e.target.value) })} /></td>
                  <td className="num"><input className="input sm" style={{ width: 64 }} type="number" step="any" value={r.hours ?? ''} onChange={(e) => set(r.id, { hours: e.target.value === '' ? null : Number(e.target.value) })} /></td>
                  <td><input className="input sm" style={{ width: 140 }} type="date" value={fmtDate(r.completionDate)} onChange={(e) => set(r.id, { completionDate: e.target.value || null })} /></td>
                  <td><input className="input sm" style={{ minWidth: 160 }} value={r.comments ?? ''} onChange={(e) => set(r.id, { comments: e.target.value })} /></td>
                  {c.observed && <td className="muted" style={{ fontSize: 12.5 }}>{r.days.length ? r.days.map((d: any) => `D${d.dayNumber}${d.attendance === 'Absent' ? ' absent' : ''}`).join(', ') : '–'}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {dirty.size > 0 && (
        <div className="savebar">
          <span className="msg"><span className="dirty-dot" />{dirty.size} unsaved change{dirty.size === 1 ? '' : 's'}</span>
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 13 }}>Source</span>
          <select className="select sm" style={{ width: 170 }} value={source} onChange={(e) => setSource(e.target.value)}>{(meta.lists.source ?? []).map((v) => <option key={v.value}>{v.value}</option>)}</select>
          <button className="btn btn-secondary btn-sm" onClick={() => { setRows(data.records); setDirty(new Set()) }}>Discard</button>
          <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      )}
      {adding && <AddParticipants sessionId={s.id} existing={rows.map((r) => r.employeeId)} onClose={() => setAdding(false)} />}
    </div>
  )
}

function AddParticipants({ sessionId, existing, onClose }: { sessionId: string; existing: string[]; onClose: () => void }) {
  const opts = useOptions('employees')
  const [ids, setIds] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const available = (opts ?? []).filter((o) => !existing.includes(o.id))
  async function add() {
    setBusy(true)
    try { const r = await api(`/sessions/${sessionId}/participants`, { method: 'POST', body: { employeeIds: ids } }); toast(`Added ${r.added} participant${r.added === 1 ? '' : 's'}`); onClose() } catch (e: any) { toast(e.message, true) } finally { setBusy(false) }
  }
  return (
    <Drawer title="Add participants" sub="Each person gets a training record for this session (status Assigned)." onClose={onClose}
      foot={<><button className="btn btn-primary" onClick={add} disabled={!ids.length || busy}>Add {ids.length || ''}</button><button className="btn btn-secondary" onClick={onClose}>Cancel</button></>}>
      <div className="field"><label>People</label><MultiCombobox options={available} value={ids} onChange={setIds} placeholder="Search people by name, role or client…" /></div>
      <p className="note">Tip: type a department or job title to find a group, then pick them one by one.</p>
    </Drawer>
  )
}

// ------------------------------------------------------------------ observation grid
function Observations({ sessionId }: { sessionId: string }) {
  const meta = useMeta()
  const [day, setDay] = useState(1)
  const { data } = useApi<any>(`/sessions/${sessionId}/observations?day=${day}`)
  const [rows, setRows] = useState<any[]>([])
  const [dirty, setDirty] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [source, setSource] = useState('Trainer sheet')
  const table = useRef<HTMLTableElement>(null)
  useEffect(() => { if (data && data.day === day) { setRows(data.rows); setDirty(new Set()) } }, [data, day])
  const params: any[] = data?.parameters ?? []
  const cats = useMemo(() => { const out: { cat: string; start: number }[] = []; params.forEach((p, i) => { if (!out.length || out[out.length - 1].cat !== p.category) out.push({ cat: p.category, start: i }) }); return out }, [params])
  const set = (tid: string, patch: any) => { setRows((rs) => rs.map((r) => (r.trainingRecordId === tid ? { ...r, ...patch } : r))); setDirty((d) => new Set(d).add(tid)) }
  const setScore = (tid: string, pid: string, v: string) => {
    const n = v === '' ? null : Number(v.slice(-1))
    if (n != null && !(n >= 1 && n <= 5)) return
    setRows((rs) => rs.map((r) => (r.trainingRecordId === tid ? { ...r, scores: { ...r.scores, [pid]: n } } : r)))
    setDirty((d) => new Set(d).add(tid))
    return n
  }
  const focusNext = (el: HTMLInputElement) => {
    const all = [...(table.current?.querySelectorAll<HTMLInputElement>('input.score-in') ?? [])]
    const i = all.indexOf(el)
    all[i + 1]?.focus(); all[i + 1]?.select()
  }
  async function save() {
    setSaving(true)
    try {
      const body = rows.filter((r) => dirty.has(r.trainingRecordId)).map((r) => ({ trainingRecordId: r.trainingRecordId, name: r.name, attendance: r.attendance, potentialNote: r.potentialNote, notes: r.notes, scores: r.scores }))
      const res = await api(`/sessions/${sessionId}/observations`, { method: 'PUT', body: { day, rows: body, source } })
      toast(`Saved day ${day} for ${res.saved} participant${res.saved === 1 ? '' : 's'}`)
      setDirty(new Set())
    } catch (e: any) { toast(e.message, true) } finally { setSaving(false) }
  }
  const switchDay = (d: number) => { if (dirty.size && !confirm('You have unsaved scores for this day. Switch anyway?')) return; setDay(d) }

  if (!data) return <div className="loading">Loading…</div>
  return (
    <div className="mt24">
      {!data.observed && <div className="warn-banner" style={{ marginBottom: 12 }}>This course is not marked as observed. You can still score behaviours; tick "Behaviours observed" on the course (Library → Courses) if trainers score it every time.</div>}
      <div className="table-tools">
        <div className="toolbar">
          <span className="muted" style={{ fontSize: 13 }}>Day</span>
          <div className="chips">{Array.from({ length: Math.max(data.days, 1) }, (_, i) => i + 1).map((d) => <button key={d} className={`chip-btn ${d === day ? 'active' : ''}`} onClick={() => switchDay(d)}>Day {d}</button>)}</div>
        </div>
        <span className="muted" style={{ fontSize: 12.5 }}>Type 1–5 in a cell; the cursor jumps to the next one. Leave empty if not observed.</span>
      </div>
      {!rows.length ? <div className="card subtle empty-state"><h3>No participants</h3>Add participants on the first tab, then score them here.</div> : (
        <div className="obs-scroll">
          <table className="obs" ref={table}>
            <thead>
              <tr>
                <th className="who" style={{ verticalAlign: 'bottom' }}>Participant</th>
                <th className="meta-cell" style={{ verticalAlign: 'bottom', textAlign: 'left' }}><span className="muted" style={{ fontSize: 11.5 }}>Attendance</span></th>
                {params.map((p, i) => <th key={p.id} className={cats.some((c) => c.start === i && i > 0) ? 'cat-start' : ''} title={`${p.name} → ${p.competency ?? '—'}\n${p.category}${p.description ? `\n${p.description}` : ''}`}><div className="vlabel">{p.name}</div></th>)}
                <th style={{ verticalAlign: 'bottom' }}><span className="muted" style={{ fontSize: 11.5 }}>Avg</span></th>
                <th className="meta-cell" style={{ verticalAlign: 'bottom', textAlign: 'left' }}><span className="muted" style={{ fontSize: 11.5 }}>Potential / risk</span></th>
                <th className="notes-cell" style={{ verticalAlign: 'bottom', textAlign: 'left' }}><span className="muted" style={{ fontSize: 11.5 }}>Assessor notes</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const vals = Object.values(r.scores).filter((v) => v != null) as number[]
                const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
                return (
                  <tr key={r.trainingRecordId} className={r.attendance === 'Absent' ? 'absent' : ''}>
                    <td className="who"><div className="n">{dirty.has(r.trainingRecordId) && <span className="dirty-dot" />}{r.name}</div><div className="r">{r.jobTitle}</div></td>
                    <td className="meta-cell"><select className="select sm" value={r.attendance ?? ''} onChange={(e) => set(r.trainingRecordId, { attendance: e.target.value || null })}><option value="">—</option>{(meta.lists.attendance ?? []).map((v) => <option key={v.value}>{v.value}</option>)}</select></td>
                    {params.map((p, i) => {
                      const v = r.scores[p.id]
                      return (
                        <td key={p.id} className={cats.some((c) => c.start === i && i > 0) ? 'cat-start' : ''}>
                          <input className={`score-in ${v ? `s${v}` : ''}`} inputMode="numeric" value={v ?? ''} aria-label={`${r.name} · ${p.name}`}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => { const n = setScore(r.trainingRecordId, p.id, e.target.value); if (n != null) focusNext(e.target) }}
                            onKeyDown={(e) => { if (e.key === 'Backspace' && !e.currentTarget.value) { const all = [...(table.current?.querySelectorAll<HTMLInputElement>('input.score-in') ?? [])]; all[all.indexOf(e.currentTarget) - 1]?.focus() } }} />
                        </td>
                      )
                    })}
                    <td className="avg">{dec(avg, 1)}</td>
                    <td className="meta-cell"><select className="select sm" value={r.potentialNote ?? ''} onChange={(e) => set(r.trainingRecordId, { potentialNote: e.target.value || null })}><option value="">—</option>{(meta.lists.potentialNote ?? []).map((v) => <option key={v.value}>{v.value}</option>)}</select></td>
                    <td className="notes-cell"><input className="input sm" value={r.notes ?? ''} onChange={(e) => set(r.trainingRecordId, { notes: e.target.value })} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="heat-legend">Categories: {cats.map((c) => <span key={c.cat}>{c.cat}</span>)}</div>
      {dirty.size > 0 && (
        <div className="savebar">
          <span className="msg"><span className="dirty-dot" />Day {day}: {dirty.size} participant{dirty.size === 1 ? '' : 's'} changed</span>
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 13 }}>Source</span>
          <select className="select sm" style={{ width: 170 }} value={source} onChange={(e) => setSource(e.target.value)}>{(meta.lists.source ?? []).map((v) => <option key={v.value}>{v.value}</option>)}</select>
          <button className="btn btn-secondary btn-sm" onClick={() => { setRows(data.rows); setDirty(new Set()) }}>Discard</button>
          <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : `Save day ${day}`}</button>
        </div>
      )}
    </div>
  )
}
