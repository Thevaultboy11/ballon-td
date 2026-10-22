import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ENTITY } from '@shared/entities'
import { useApi, pct, dec, fmtDate, getUser } from '../api'
import { Avatar, Icon, Kpi, Pline, Severity, Spark, Status } from '../components/ui'
import { EntityForm, EntityList } from '../components/entity'
import { NextSteps, StageDetail, StageRail, Timeline, STATUS_WORD } from '../components/roadmap'
import { RatingsGrid } from '../components/ratings'
import { Analysis } from '../components/analysis'

const TABS: { key: string; label: string; entity?: string; hint?: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'analysis', label: 'Analysis' },
  { key: 'roadmap', label: 'Roadmap' },
  { key: 'baseline', label: 'Baseline', entity: 'baseline', hint: 'Short survey before day 1 of the observed programme: years of experience, six self-ratings (1–5) and personality type. The average of the six ratings is the self-assessed level in the observation summary.' },
  { key: 'assessments', label: 'Assessments', entity: 'assessments', hint: 'Each assessment keeps its own ratings, so progress over time is visible. Open "Ratings" to enter the level per competency.' },
  { key: 'idp', label: 'Development plan', entity: 'idp', hint: 'One row per planned action. Link it to the competency it should close, and to the course or certification when there is one.' },
  { key: 'training', label: 'Training', entity: 'training', hint: 'Scheduled courses are easier to record from the session page (whole class at once). Use this for self-paced courses, lab collections (labs completed of total) or single corrections.' },
  { key: 'certs', label: 'Certifications', entity: 'certs' },
  { key: 'coaching', label: 'Coaching', entity: 'coaching', hint: 'The coaching tracker: besides the session notes, record the progress per IDP segment (S1–S5 and the department training need) as it stands on the day.' },
  { key: 'validations', label: 'Validations', entity: 'validations', hint: 'Manager validations usually arrive by email — set Source to "Email from client".' },
  { key: 'evidence', label: 'Evidence', entity: 'evidence', hint: 'Coach validation of a single level indicator: pick the competency, then the behaviour descriptor, and record its progress (1–5).' },
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

  if (error && !data) return <div className="container page"><div className="hero compact"><h1>Person not found</h1><p className="sub">{error} <Link to="/" className="accent-text">Back to people</Link></p></div></div>
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
          <button className="chip-btn" onClick={() => setQuick('baseline')}>Baseline survey</button>
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
          {tab === 'analysis' && <Analysis employeeId={e.id} />}
          {tab === 'roadmap' && <PersonRoadmap employeeId={e.id} />}
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
  if (s.enrollmentId && kind === 'baseline') d.enrollmentId = s.enrollmentId
  if (kind === 'baseline') d.date = today
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
  const byFw = new Map<string, any[]>()
  for (const c of comps) (byFw.get(c.framework) ?? byFw.set(c.framework, []).get(c.framework)!).push(c)
  return (
    <div className="stack">
      <div className="grid g-2-1">
        <RisksCard risks={s.risks} />
        <ProgressCard s={s} />
      </div>
      {s.observation && <ObservationCard o={s.observation} />}
      {!comps.length && <div className="notice">No competencies yet. Give {data.employee.name} a role profile (Edit details), then add an assessment and enter the ratings.</div>}
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
                      <td className="num">{c.gap == null ? <span className="muted">–</span> : c.gap > 0 ? <span className="tag tag-bad">−{c.gap}</span> : c.gap < 0 ? <span className="tag tag-good">+{-c.gap}</span> : <span className="muted">0</span>}</td>
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
      {comps.length > 0 && <p className="note"><b>Bar</b>: current level (latest completed assessment that is not a self-assessment). <b>Dark tick</b>: required for the role. <b>Amber tick</b>: required in the next role. Click a row to see the level indicators. <b>Observed</b>: average trainer score of the behaviours linked to the competency.</p>}
    </div>
  )
}

function RisksCard({ risks }: { risks: any[] }) {
  const [all, setAll] = useState(false)
  const n = (sev: string) => risks.filter((r) => r.severity === sev).length
  const shown = all ? risks : risks.slice(0, 6)
  return (
    <div className="card">
      <div className="card-head">
        <div><h3>Risks &amp; opportunities</h3><div className="card-sub">Rules from Library → Risk rules, checked against this person's records</div></div>
        <div className="row wrap" style={{ gap: 6, justifyContent: 'flex-end' }}>
          {n('High') > 0 && <span className="tag tag-bad">{n('High')} high</span>}
          {n('Medium') > 0 && <span className="tag tag-warn">{n('Medium')} medium</span>}
          {n('Low') > 0 && <span className="tag">{n('Low')} low</span>}
          {n('Opportunity') > 0 && <span className="tag tag-good">{n('Opportunity')} opportunity</span>}
        </div>
      </div>
      {!risks.length ? <div className="muted" style={{ fontSize: 13.5 }}>No rule fires for this person.</div> : (
        <div className="flag-list">
          {shown.map((r) => (
            <div key={r.code} className="flag">
              <span className="mono muted">{r.code}</span>
              <div>
                <div className="row wrap" style={{ gap: 8 }}><b>{r.name}</b><Severity v={r.severity} /></div>
                <div className="muted">{r.detail}</div>
                {r.action && <div className="flag-action">{r.action}{r.owner && <span className="muted"> · {r.owner}</span>}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
      {risks.length > 6 && <button className="btn btn-secondary btn-sm mt16" onClick={() => setAll(!all)}>{all ? 'Show fewer' : `Show all ${risks.length}`}</button>}
    </div>
  )
}

const SEGMENTS: [string, string][] = [['S1', 'Professional certification'], ['S2', 'Hands-on labs'], ['S3', 'AI certification'], ['S4', 'LMS learning'], ['S5', 'Cross-functional'], ['DTN', 'Department training need']]

function ProgressCard({ s }: { s: any }) {
  const anySeg = SEGMENTS.some(([k]) => s.segmentProgress?.[k] != null)
  return (
    <div className="card">
      <div className="card-head"><div><h3>Programme progress</h3><div className="card-sub">Baseline, labs and the IDP segments from the coaching tracker</div></div></div>
      <div className="kv">
        <span>Baseline self-rating</span><b>{s.baselineScore != null ? `${dec(s.baselineScore, 2)} / 5` : '—'}{s.baselineDate && <span className="muted"> · {fmtDate(s.baselineDate)}</span>}</b>
        <span>Hands-on labs</span><b>{s.labsTotal ? `${s.labsCompleted} of ${s.labsTotal}` : '—'}{s.labsShare != null && <span className="muted"> · {pct(s.labsShare)}</span>}</b>
      </div>
      <div className="seg-list mt16">
        {SEGMENTS.map(([k, label]) => {
          const v = s.segmentProgress?.[k]
          return (
            <div key={k} className="seg">
              <span className="mono">{k}</span><span className="seg-label">{label}</span>
              <Pline value={v == null ? null : v / 100} tone={v == null ? 'muted' : v >= 75 ? '' : v >= 40 ? 'warn' : 'bad'} />
              <span className="num">{v == null ? '–' : `${v}%`}</span>
            </div>
          )
        })}
      </div>
      {!anySeg && <p className="note">No segment progress yet: add it on a coaching session.</p>}
    </div>
  )
}

function ObservationCard({ o }: { o: any }) {
  const tone = (v: number | null) => (v == null ? 'muted' : v >= 3.5 ? '' : v >= 2.5 ? 'warn' : 'bad')
  return (
    <div className="card">
      <div className="card-head">
        <div><h3>Observation summary</h3><div className="card-sub">Observed programme days, scored 1–5 by the trainer · {o.sessionsAssessed} of {Math.max(5, o.daysRecorded)} sessions assessed{o.absentDays ? ` · ${o.absentDays} absent` : ''}</div></div>
        <div className="row wrap" style={{ gap: 6, justifyContent: 'flex-end' }}>
          <Status v={o.leadershipPotential} /><Status v={o.classification} />
        </div>
      </div>
      <div className="grid g-2-1">
        <div>
          <div className="kv">
            <span>Evidence strength</span><b>{o.evidenceStrength}</b>
            <span>Overall average</span><b>{dec(o.overallAvg, 2)} / 5</b>
            <span>Improvement (last − first day)</span><b>{o.improvementDelta == null ? '–' : `${o.improvementDelta >= 0 ? '+' : ''}${dec(o.improvementDelta, 2)}`}</b>
            <span>Readiness timeframe</span><b>{o.timeframe}</b>
            <span>Self-assessed · validated · target</span><b>{dec(o.selfAssessedLevel, 2)} · {o.validatedLevel ?? '–'} · {o.targetLevel ?? '–'}</b>
            {o.alignmentStatus && <><span>Against target</span><b>{o.alignmentStatus}</b></>}
          </div>
          <p className="note"><b>Key findings.</b> {o.keyFindings}</p>
          <p className="note" style={{ marginTop: 6 }}><b>Recommended action.</b> {o.recommendedAction}</p>
        </div>
        <div className="seg-list">
          {Object.entries(o.domains as Record<string, number | null>).map(([k, v]) => (
            <div key={k} className="seg">
              <span className="seg-label">{k}{k === o.strongestDomain ? ' ★' : ''}</span>
              <Pline value={v == null ? null : v / 5} tone={tone(v)} />
              <span className="num">{dec(v, 2)}</span>
            </div>
          ))}
        </div>
      </div>
      {o.parameters?.length > 0 && (
        <details className="mt16">
          <summary className="muted" style={{ cursor: 'pointer', fontSize: 13 }}>Per behaviour ({o.parameters.length})</summary>
          <div className="table-wrap mt16">
            <table className="table">
              <thead><tr><th>Behaviour</th><th>Domain</th><th className="num">Average</th><th>Finding</th><th>Action cue</th></tr></thead>
              <tbody>{o.parameters.map((p: any) => <tr key={p.name}><td>{p.name}</td><td className="muted">{p.category}</td><td className="num">{dec(p.avg, 2)}</td><td><span className={`tag ${p.avg >= 3.5 ? 'tag-good' : p.avg >= 2.5 ? 'tag-warn' : 'tag-bad'}`}>{p.finding}</span></td><td className="muted">{p.actionCue}</td></tr>)}</tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  )
}

function PersonRoadmap({ employeeId }: { employeeId: string }) {
  const { data } = useApi<any>(`/people/${employeeId}/roadmap`)
  const [sel, setSel] = useState<string | null>(null)
  if (!data) return <div className="loading">Loading…</div>
  const stage = data.stages.find((x: any) => x.key === (sel ?? data.currentStage)) ?? data.stages[data.stages.length - 1]
  const cur = data.stages.find((x: any) => x.key === data.currentStage)
  const done = data.stages.filter((x: any) => x.status === 'done').length
  return (
    <div className="stack roadmap">
      <div className="card">
        <div className="card-head">
          <div>
            <h3>Journey</h3>
            <div className="card-sub">{data.goal} · {done} of {data.stages.length} stages done{cur ? ` · now: ${cur.label} (${STATUS_WORD[cur.status as keyof typeof STATUS_WORD].toLowerCase()})` : ' · journey complete'}</div>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <div className="journey-pct"><b>{Math.round(data.progress * 100)}%</b><span>complete</span></div>
            <button className="btn btn-secondary btn-sm no-print" onClick={() => window.print()}><Icon.download />Print</button>
          </div>
        </div>
        <Pline value={data.progress} tone="" />
        <div className="mt24"><StageRail stages={data.stages} current={data.currentStage} selected={stage.key} onSelect={setSel} /></div>
        <p className="note no-print">Click a stage to see what is done and what is still open. The stages follow the programme from enrolment to role readiness; a red stage has a High risk rule firing.</p>
      </div>
      <div className="grid g-2-1">
        <div className="card"><StageDetail stage={stage} /></div>
        <div className="card">
          <div className="card-head"><div><h3>Next steps</h3><div className="card-sub">Overdue first, then the next dates</div></div></div>
          <NextSteps items={data.next} />
        </div>
      </div>
      <div className="card">
        <div className="card-head"><div><h3>Timeline</h3><div className="card-sub">Every dated record, month by month · hover a mark for details</div></div></div>
        <Timeline events={data.events} window={data.window} />
      </div>
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

