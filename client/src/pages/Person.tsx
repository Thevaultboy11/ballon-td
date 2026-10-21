import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ENTITY } from '@shared/entities'
import { useApi, pct, dec, fmtDate, getUser } from '../api'
import { Avatar, Icon, Kpi, Pline, Spark } from '../components/ui'
import { EntityForm, EntityList } from '../components/entity'
import { RatingsGrid } from '../components/ratings'

const TABS: { key: string; label: string; entity?: string; hint?: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'assessments', label: 'Assessments', entity: 'assessments', hint: 'Each assessment keeps its own ratings, so progress over time is visible. Open "Ratings" to enter the level per competency.' },
  { key: 'idp', label: 'Development plan', entity: 'idp', hint: 'One row per planned action. Link it to the competency it should close, and to the course or certification when there is one.' },
  { key: 'training', label: 'Training', entity: 'training', hint: 'Scheduled courses are easier to record from the session page (whole class at once). Use this for self-paced courses or single corrections.' },
  { key: 'certs', label: 'Certifications', entity: 'certs' },
  { key: 'coaching', label: 'Coaching', entity: 'coaching' },
  { key: 'validations', label: 'Validations', entity: 'validations', hint: 'Manager validations usually arrive by email — set Source to "Email from client".' },
  { key: 'evidence', label: 'Evidence', entity: 'evidence' },
  { key: 'enrollments', label: 'Programmes', entity: 'enrollments' },
  { key: 'history', label: 'History' },
]

export default function Person() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') ?? 'overview'
  const { data, error } = useApi<any>(`/people/${id}`)
  const [edit, setEdit] = useState(false)
  const [ratings, setRatings] = useState<string | null>(null)
  const [quick, setQuick] = useState<string | null>(null)

  if (error && !data) return <div className="container page"><div className="hero compact"><h1>Person not found</h1><p className="sub">{error} <Link to="/" className="lime-text">Back to people</Link></p></div></div>
  if (!data) return <div className="loading">Loading…</div>
  const e = data.employee, s = data.summary
  const go = (k: string) => setParams(k === 'overview' ? {} : { tab: k }, { replace: true })
  const exportHref = `/api/export?employeeId=${e.id}&user=${encodeURIComponent(getUser())}`

  return (
    <div className="page">
      <section className="hero compact container">
        <div className="crumbs"><Link to="/">People</Link><span className="sep">/</span><span>{e._ref.clientId}</span>{e.department && <><span className="sep">/</span><span>{e.department}</span></>}</div>
        <div className="row between wrap mt16" style={{ alignItems: 'flex-start' }}>
          <div className="person-head">
            <Avatar name={e.name} lg />
            <div>
              <h1 style={{ marginTop: 0 }}>{e.name}</h1>
              <div className="muted">{e.jobTitle ?? 'No job title'}{e.section ? ` · ${e.section}` : ''} · <span className="mono">{e.id}</span></div>
            </div>
          </div>
          <div className="toolbar">
            <button className="btn btn-secondary btn-sm" onClick={() => setEdit(true)}><Icon.edit />Edit details</button>
            <a className="btn btn-secondary btn-sm" href={exportHref}><Icon.download />Export this person</a>
          </div>
        </div>
        <div className="profile-meta">
          <span>Role profile <b>{e._ref.jobRoleId ?? '—'}</b>{s.nextRole && <> → next <b>{s.nextRole}</b></>}</span>
          <span>Line manager <b>{e.lineManagerId ? <Link to={`/people/${e.lineManagerId}`}>{e._ref.lineManagerId}</Link> : e.lineManagerName ?? '—'}</b></span>
          <span>Programme <b>{s.program ?? '—'}</b>{s.batch && ` · ${s.batch}`}</span>
          <span>Coach <b>{s.coach ?? '—'}</b></span>
          <span>Consultant <b>{s.consultant ?? '—'}</b></span>
          {e.email && <span><a href={`mailto:${e.email}`}>{e.email}</a></span>}
        </div>
        <div className="toolbar mt16">
          <span className="muted" style={{ fontSize: 13 }}>Quick add:</span>
          <button className="chip-btn" onClick={() => setQuick('assessments')}>Assessment</button>
          <button className="chip-btn" onClick={() => setQuick('idp')}>Plan action</button>
          <button className="chip-btn" onClick={() => setQuick('training')}>Training</button>
          <button className="chip-btn" onClick={() => setQuick('certs')}>Certification</button>
          <button className="chip-btn" onClick={() => setQuick('coaching')}>Coaching session</button>
          <button className="chip-btn" onClick={() => setQuick('validations')}>Validation</button>
          <button className="chip-btn" onClick={() => setQuick('evidence')}>Evidence</button>
        </div>
      </section>

      <div className="container">
        <div className="grid g-4">
          <Kpi label="Role readiness" icon={<Icon.target />} value={pct(s.roleReadiness)} sub={s.readinessBand} bar={<Pline value={s.roleReadiness} />} />
          <Kpi label="Gaps" icon={<Icon.alert />} tone={s.criticalGaps ? 'bad' : ''} value={<>{s.gaps}<small> open</small></>} sub={`${s.criticalGaps} high priority · ${s.competenciesRated} of ${s.competenciesRequired} rated`} />
          <Kpi label="Development plan" icon={<Icon.check />} tone={s.idpOverdue ? 'warn' : ''} value={pct(s.idpProgress == null ? null : s.idpProgress / 100)} sub={`${s.idpCompleted} of ${s.idpActions} done${s.idpOverdue ? ` · ${s.idpOverdue} overdue` : ''}`} />
          <Kpi label="Next role readiness" icon={<Icon.badge />} value={pct(s.nextRoleReadiness)} sub={s.nextRole ?? 'No next role set'} bar={<Pline value={s.nextRoleReadiness} />} />
        </div>
        <div className="mini-stats mt16">
          <div className="stat"><div className="stat-value">{s.trainingCompleted}/{s.trainingAssigned}</div><div className="stat-label">Trainings completed · {dec(s.trainingHours, 0)} h</div></div>
          <div className="stat"><div className="stat-value">{s.certsCompleted}/{s.certsTotal}</div><div className="stat-label">Certifications achieved · {s.certsActive} in progress</div></div>
          <div className="stat"><div className="stat-value">{s.coachingSessions}</div><div className="stat-label">Coaching sessions · last {s.lastCoaching ? fmtDate(s.lastCoaching) : '—'}</div></div>
          <div className="stat"><div className="row between"><div className="stat-value">{dec(s.observedAvg, 2)}</div><Spark values={s.dayTrend} /></div><div className="stat-label">Observed behaviour average · {s.observedDays} days</div></div>
        </div>

        <div className="tabs" role="tablist">
          {TABS.map((t) => <button key={t.key} role="tab" className={tab === t.key ? 'active' : ''} onClick={() => go(t.key)}>{t.label}</button>)}
        </div>
        <div className="tab-body">
          {tab === 'overview' && <Overview data={data} />}
          {tab === 'history' && <History employeeId={e.id} />}
          {TABS.filter((t) => t.entity && t.key === tab).map((t) => (
            <div key={t.key}>
              {t.hint && <p className="note" style={{ marginTop: 0, marginBottom: 12 }}>{t.hint}</p>}
              <EntityList entityKey={t.entity!} filter={{ employeeId: e.id }}
                rowActions={t.key === 'assessments' ? (r) => <button className="btn btn-secondary btn-sm" onClick={() => setRatings(r.id)}><Icon.grid />Ratings</button> : undefined} />
            </div>
          ))}
        </div>
      </div>

      {edit && <EntityForm entity={ENTITY.employees} id={e.id} onClose={() => setEdit(false)} />}
      {quick && (
        <EntityForm entity={ENTITY[quick]} defaults={quickDefaults(quick, e, s)} lock={['employeeId']}
          title={`Add ${ENTITY[quick].label.toLowerCase()} for ${e.name}`} onClose={() => setQuick(null)}
          onSaved={(r) => { if (quick === 'assessments') setRatings(r.id); go(quick) }} />
      )}
      {ratings && <RatingsGrid assessmentId={ratings} onClose={() => setRatings(null)} />}
    </div>
  )
}

function quickDefaults(kind: string, e: any, s: any) {
  const today = new Date().toISOString().slice(0, 10)
  const d: Record<string, any> = { employeeId: e.id }
  if (s.enrollmentId && ['assessments', 'idp', 'certs', 'coaching'].includes(kind)) d.enrollmentId = s.enrollmentId
  if (kind === 'assessments') Object.assign(d, { jobRoleId: e.jobRoleId, date: today, assessorId: s.consultantId })
  if (kind === 'coaching') Object.assign(d, { date: today, coachId: s.coachId })
  if (kind === 'validations') Object.assign(d, { date: today, managerId: e.lineManagerId, managerName: e.lineManagerId ? null : e.lineManagerName })
  if (kind === 'evidence') Object.assign(d, { date: today, submittedBy: e.name })
  if (kind === 'training' || kind === 'certs') d.assignedDate = today
  return d
}

function Overview({ data }: { data: any }) {
  const s = data.summary
  const comps: any[] = s.competencies
  const [open, setOpen] = useState<string | null>(null)
  if (!comps.length) return <div className="notice">No competencies yet. Give {data.employee.name} a role profile (Edit details), then add an assessment and enter the ratings.</div>
  const byFw = new Map<string, any[]>()
  for (const c of comps) (byFw.get(c.framework) ?? byFw.set(c.framework, []).get(c.framework)!).push(c)
  return (
    <div className="stack">
      <div className="row wrap" style={{ gap: 8 }}>
        <span className="tag">Self-assessment: {s.selfAssessment}</span>
        <span className="tag">Validation interview: {s.validationInterview}</span>
        <span className="tag">Report: {s.report}</span>
        <span className="tag">Manager validation: {s.managerValidation ?? '—'}</span>
      </div>
      {[...byFw.entries()].map(([fw, rows]) => (
        <div key={fw}>
          <h3 style={{ fontSize: 15, fontWeight: 500, margin: '8px 0 10px' }}>{fw}</h3>
          <div className="table-wrap">
            <table className="table comp-table">
              <thead><tr><th>Competency</th><th>Priority</th><th>Level against requirement</th><th className="num">Level / req.{s.nextRole ? ' · next' : ''}</th><th className="num">Gap</th><th className="num">Self</th><th className="num">Observed</th><th>Source</th></tr></thead>
              <tbody>
                {rows.map((c) => {
                  const max = c.maxLevel || 5
                  const cls = c.gap == null || c.gap <= 0 ? '' : c.gap === 1 ? 'warn' : 'bad'
                  const ind = (data.behaviors[c.competencyId] ?? []) as { level: number; description: string }[]
                  return (
                    <tr key={c.competencyId} className="clickable" onClick={() => setOpen(open === c.competencyId ? null : c.competencyId)}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{c.name}</div><div className="muted" style={{ fontSize: 12 }}>{c.category}</div>
                        {open === c.competencyId && <ul style={{ margin: '8px 0 2px', paddingLeft: 18, color: 'var(--tertiary)', fontSize: 12.5 }}>{ind.map((b) => <li key={b.level} style={{ fontWeight: b.level === c.level ? 600 : 400 }}>L{b.level}: {b.description}</li>)}</ul>}
                      </td>
                      <td>{c.priority === 'High' ? <span className="tag tag-bad">High</span> : c.priority ? <span className="tag">{c.priority}</span> : '–'}</td>
                      <td style={{ minWidth: 170 }}>
                        <div className="levelbar" title={`Level ${c.level ?? '–'}, required ${c.required ?? '–'}${c.nextRequired != null ? `, next role ${c.nextRequired}` : ''}`}>
                          <div className={`lv ${cls}`} style={{ width: `${((c.level ?? 0) / max) * 100}%` }} />
                          {c.required != null && <div className="rq" style={{ left: `calc(${(c.required / max) * 100}% - 1px)` }} />}
                          {c.nextRequired != null && c.nextRequired !== c.required && <div className="nx" style={{ left: `calc(${(c.nextRequired / max) * 100}% - 1px)` }} />}
                        </div>
                      </td>
                      <td className="num">{c.level ?? '–'} / {c.required ?? '–'}{c.nextRequired != null && <span className="muted"> · {c.nextRequired}</span>}</td>
                      <td className="num">{c.gap == null ? <span className="muted">–</span> : c.gap > 0 ? <span className="tag tag-bad">−{c.gap}</span> : c.gap < 0 ? <span className="tag tag-lime">+{-c.gap}</span> : <span className="muted">0</span>}</td>
                      <td className="num muted">{c.selfLevel ?? '–'}</td>
                      <td className="num">{c.observedAvg != null ? dec(c.observedAvg) : <span className="muted">–</span>}</td>
                      <td className="muted" style={{ fontSize: 12.5 }}>{c.source ?? 'Not rated'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      <p className="note"><b>Bar</b>: current level (latest completed assessment that is not a self-assessment). <b>Dark tick</b>: required for the role. <b>Amber tick</b>: required in the next role. Click a row to see the level indicators. <b>Observed</b>: average trainer score of the behaviours linked to the competency.</p>
    </div>
  )
}

function History({ employeeId }: { employeeId: string }) {
  const { data } = useApi<any[]>(`/log?employeeId=${employeeId}&take=300`)
  if (!data) return <div className="loading">Loading…</div>
  if (!data.length) return <div className="notice">No changes recorded through the app yet. (Imported and demo data are not in the change log.)</div>
  return (
    <div className="card">
      {data.map((l) => {
        let changes = ''
        try { changes = l.changes ? Object.entries(JSON.parse(l.changes)).slice(0, 6).map(([k, [a, b]]: any) => `${k}: ${a ?? '—'} → ${b ?? '—'}`).join(' · ') : '' } catch { /* ignore */ }
        return (
          <div className="log-item" key={l.id}>
            <div className="when">{String(l.at).slice(0, 16).replace('T', ' ')}</div>
            <div className="what"><div><b style={{ fontWeight: 500 }}>{l.user ?? 'Unknown'}</b> · {l.summary} <span className="mono muted">{l.recordId}</span></div>{changes && <div className="chg">{changes}</div>}</div>
          </div>
        )
      })}
    </div>
  )
}

