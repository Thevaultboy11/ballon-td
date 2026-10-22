import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ENTITY } from '@shared/entities'
import { useApi, pct, ago, fmtDate } from '../api'
import { Avatar, Icon, Kpi, Pline, Status } from '../components/ui'
import { EntityForm } from '../components/entity'

const BANDS = ['Ready for next role', 'Ready in 6–12 months', 'Growing in role', 'Needs support', 'Not assessed']

export default function People() {
  const nav = useNavigate()
  const { data, loading, error } = useApi<any[]>('/people')
  const [q, setQ] = useState('')
  const [client, setClient] = useState('')
  const [dept, setDept] = useState('')
  const [band, setBand] = useState('')
  const [adding, setAdding] = useState(false)
  const [sort, setSort] = useState<{ k: string; d: 1 | -1 }>({ k: 'name', d: 1 })

  const people = data ?? []
  const clients = useMemo(() => [...new Map(people.map((p) => [p.clientId, p._ref.clientId])).entries()], [people])
  const depts = useMemo(() => [...new Set(people.filter((p) => !client || p.clientId === client).map((p) => p.department).filter(Boolean))].sort(), [people, client])
  const rows = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean)
    const r = people.filter((p) => (!client || p.clientId === client) && (!dept || p.department === dept) && (!band || p.summary.readinessBand === band)
      && words.every((w) => `${p.name} ${p.email ?? ''} ${p.jobTitle ?? ''} ${p.department ?? ''} ${p.id} ${p.summary.coach ?? ''}`.toLowerCase().includes(w)))
    const key = (p: any) => ({ name: p.name, role: p.jobTitle ?? '', ready: p.summary.roleReadiness ?? -1, gaps: p.summary.criticalGaps * 100 + p.summary.gaps, risk: p.summary.risksHigh * 100 + p.summary.risksMedium, plan: p.summary.idpProgress ?? -1, train: p.summary.trainingCompletion ?? -1, coach: p.summary.lastCoaching ?? '', last: p.summary.lastActivity ?? '' } as any)[sort.k]
    return [...r].sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0) * sort.d)
  }, [people, q, client, dept, band, sort])
  const scope = people.filter((p) => (!client || p.clientId === client) && (!dept || p.department === dept))
  const assessed = scope.filter((p) => p.summary.roleReadiness != null)
  const avgReady = assessed.length ? assessed.reduce((s, p) => s + p.summary.roleReadiness, 0) / assessed.length : null
  const th = (k: string, label: string, num = false) => (
    <th className={`sortable ${num ? 'num' : ''}`} onClick={() => setSort((s) => ({ k, d: s.k === k ? (s.d * -1 as 1 | -1) : 1 }))}>{label}{sort.k === k && <span className="sort-ind">{sort.d === 1 ? '▲' : '▼'}</span>}</th>
  )

  return (
    <div className="page">
      <section className="hero container">
        <div className="eyebrow">People</div>
        <h1>Every person, every interaction,<br />one record.</h1>
        <p className="sub">Pick a person to enter assessments, plan actions, training, certifications, coaching, validations and evidence. Everything you enter here goes into the Excel export.</p>
        <div className="actions">
          <button className="btn btn-primary" onClick={() => setAdding(true)}><Icon.plus />Add person</button>
          <button className="btn btn-secondary" onClick={() => nav('/export')}><Icon.download />Export to Excel</button>
        </div>
      </section>

      <div className="container">
        <div className="grid g-4">
          <Kpi label="People" icon={<Icon.users />} value={scope.length} sub={`${assessed.length} assessed`} />
          <Kpi label="Average role readiness" icon={<Icon.target />} value={pct(avgReady)} bar={<Pline value={avgReady} />} />
          <Kpi label="Critical gaps" icon={<Icon.alert />} tone="bad" value={scope.reduce((s, p) => s + p.summary.criticalGaps, 0)} sub={`${scope.filter((p) => p.summary.criticalGaps > 0).length} people with at least one`} />
          <Kpi label="Overdue plan actions" icon={<Icon.clock />} tone="warn" value={scope.reduce((s, p) => s + p.summary.idpOverdue, 0)} sub={`${scope.reduce((s, p) => s + p.summary.idpActions, 0)} actions in plans`} />
        </div>

        <div className="filters mt24">
          {clients.length > 1 && (
            <div className="filter-row"><div className="filter-label">Client</div><div className="chips">
              <button className={`chip-btn ${!client ? 'active' : ''}`} onClick={() => { setClient(''); setDept('') }}>All</button>
              {clients.map(([id, name]) => <button key={id} className={`chip-btn ${client === id ? 'active' : ''}`} onClick={() => { setClient(id); setDept('') }}>{name}</button>)}
            </div></div>
          )}
          <div className="filter-row"><div className="filter-label">Department</div><div className="chips">
            <button className={`chip-btn ${!dept ? 'active' : ''}`} onClick={() => setDept('')}>All</button>
            {depts.map((d) => <button key={d} className={`chip-btn ${dept === d ? 'active' : ''}`} onClick={() => setDept(d)}>{d}<span className="count">{people.filter((p) => p.department === d && (!client || p.clientId === client)).length}</span></button>)}
          </div></div>
          <div className="filter-row"><div className="filter-label">Readiness</div><div className="chips">
            <button className={`chip-btn ${!band ? 'active' : ''}`} onClick={() => setBand('')}>All</button>
            {BANDS.map((b) => <button key={b} className={`chip-btn ${band === b ? 'active' : ''}`} onClick={() => setBand(band === b ? '' : b)}>{b}<span className="count">{scope.filter((p) => p.summary.readinessBand === b).length}</span></button>)}
          </div></div>
        </div>

        <div className="table-tools mt16">
          <div className="search-wrap"><Icon.search /><input className="search" placeholder="Search name, email, role, coach…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <span className="muted" style={{ fontSize: 13 }}>{rows.length} of {people.length} people</span>
        </div>
        {error && <div className="alert">{error}</div>}
        {loading && !data ? <div className="loading">Loading…</div> : rows.length === 0 ? (
          <div className="card subtle empty-state"><h3>{people.length ? 'Nobody matches these filters' : 'No people yet'}</h3>{!people.length && 'Add a client on Library → Clients, then add people here. Or load the demo data: npm run db:demo'}</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr>
                {th('name', 'Person')}{th('role', 'Role · batch · coach')}<th>Assessment</th>{th('ready', 'Role readiness')}{th('gaps', 'Gaps', true)}{th('risk', 'Risks', true)}
                {th('plan', 'Plan', true)}{th('train', 'Training', true)}<th className="num">Certs</th>{th('coach', 'Last coaching')}{th('last', 'Changed')}
              </tr></thead>
              <tbody>
                {rows.map((p) => {
                  const s = p.summary
                  return (
                    <tr key={p.id} className="clickable" onClick={() => nav(`/people/${p.id}`)}>
                      <td><div className="person"><Avatar name={p.name} /><div style={{ minWidth: 0 }}><div className="person-name">{p.name}</div><div className="person-role">{p.department ?? p._ref.clientId}</div></div></div></td>
                      <td style={{ maxWidth: 220 }}><div className="clip" style={{ fontSize: 13.5 }} title={p.jobTitle ?? ''}>{p.jobTitle ?? '–'}</div><div className="person-role clip">{[s.batch, s.coach && `coach ${s.coach}`].filter(Boolean).join(' · ') || '–'}</div></td>
                      <td>{s.report === 'Delivered' ? <Status v="Delivered" /> : s.validationInterview === 'Completed' ? <span className="tag">Validated</span> : s.selfAssessment === 'Completed' ? <span className="tag">Self-assessed</span> : <Status v={s.selfAssessment} />}{s.potential && <div className="person-role clip" title="Leadership potential from the observed programme">{s.potential}</div>}</td>
                      <td className="next-cell">
                        <div className="next-top"><span className="next-role">{s.readinessBand}</span><span className="next-pct">{pct(s.roleReadiness)}</span></div>
                        <Pline value={s.roleReadiness} />
                      </td>
                      <td className="num">{s.competenciesRated ? <>{s.criticalGaps > 0 && <span className="tag tag-bad" title="High-priority gaps">{s.criticalGaps}</span>} <span className="muted">{s.gaps}</span></> : <span className="muted">–</span>}</td>
                      <td className="num nowrap" title={(s.riskCodes ?? []).join(', ')}>{s.risksHigh || s.risksMedium ? <>{s.risksHigh > 0 && <span className="tag tag-bad">{s.risksHigh}</span>} {s.risksMedium > 0 && <span className="tag tag-warn">{s.risksMedium}</span>}</> : <span className="muted">–</span>}</td>
                      <td className="num nowrap">{s.idpActions ? <>{pct(s.idpProgress == null ? null : s.idpProgress / 100)}{s.idpOverdue > 0 && <div className="warn-text" style={{ fontSize: 12 }}>{s.idpOverdue} overdue</div>}</> : <span className="muted">–</span>}</td>
                      <td className="num">{s.trainingAssigned ? `${s.trainingCompleted}/${s.trainingAssigned}` : <span className="muted">–</span>}</td>
                      <td className="num">{s.certsTotal ? `${s.certsCompleted}/${s.certsTotal}` : <span className="muted">–</span>}</td>
                      <td className="muted nowrap" style={{ fontSize: 13 }}>{s.lastCoaching ? fmtDate(s.lastCoaching) : '–'}</td>
                      <td className="muted nowrap" style={{ fontSize: 13 }}>{ago(s.lastActivity)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {adding && <EntityForm entity={ENTITY.employees} defaults={client ? { clientId: client } : {}} onClose={() => setAdding(false)} onSaved={(r) => nav(`/people/${r.id}`)} />}
    </div>
  )
}
