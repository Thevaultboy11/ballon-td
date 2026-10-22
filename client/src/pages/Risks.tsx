import { Fragment, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getUser, useApi } from '../api'
import { Icon, Kpi, Severity } from '../components/ui'

const SEVERITIES = ['High', 'Medium', 'Low', 'Opportunity']

/** Every risk and opportunity rule (Library → Risk rules) with the people and groups it fires for. Read-only: fix the records, the flags follow. */
export default function Risks() {
  const nav = useNavigate()
  const [client, setClient] = useState('')
  const [sev, setSev] = useState('')
  const [panel, setPanel] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const { data, loading, error } = useApi<any>(`/risks${client ? `?clientId=${client}` : ''}`)

  const rules: any[] = data?.rules ?? []
  const individual: any[] = data?.individual ?? []
  const group: any[] = data?.group ?? []
  const panels = useMemo(() => [...new Set(rules.map((r) => r.panel).filter(Boolean))] as string[], [rules])
  const byRule = useMemo(() => {
    const m = new Map<string, any[]>()
    for (const f of [...individual, ...group]) (m.get(f.code) ?? m.set(f.code, []).get(f.code)!).push(f)
    return m
  }, [individual, group])
  const shown = rules.filter((r) => r.active !== false && (!sev || r.severity === sev) && (!panel || r.panel === panel))
  const flagged = new Set(individual.map((f) => f.employeeId))
  const count = (s: string) => individual.filter((f) => f.severity === s).length

  return (
    <div className="page">
      <section className="hero container">
        <div className="eyebrow">Risks</div>
        <h1>What needs attention,<br />and where the upside is.</h1>
        <p className="sub">The {rules.length || 36} risk and opportunity rules are checked against everything entered for each person. Thresholds, severity and wording live in Library → Risk rules. Fix a record and its flag goes away.</p>
        <div className="actions">
          <button className="btn btn-secondary" onClick={() => nav('/library/riskRules')}><Icon.book />Edit the rules</button>
          <a className="btn btn-secondary" href={`/api/export?user=${encodeURIComponent(getUser())}`}><Icon.download />Export with Risk_Flags sheet</a>
        </div>
      </section>

      <div className="container">
        {error && <div className="alert">{error}</div>}
        <div className="grid g-4">
          <Kpi label="People flagged" icon={<Icon.users />} value={<>{flagged.size}<small> of {data?.people ?? '–'}</small></>} sub="At least one rule fires" />
          <Kpi label="High" icon={<Icon.alert />} tone="bad" value={count('High')} sub={`${group.filter((g) => g.severity === 'High').length} group flags`} />
          <Kpi label="Medium" icon={<Icon.clock />} tone="warn" value={count('Medium')} sub={`${count('Low')} low`} />
          <Kpi label="Opportunities" icon={<Icon.badge />} value={count('Opportunity')} sub="Strengths worth using" />
        </div>

        <div className="filters mt24">
          {(data?.clients?.length ?? 0) > 1 && (
            <div className="filter-row"><div className="filter-label">Client</div><div className="chips">
              <button className={`chip-btn ${!client ? 'active' : ''}`} onClick={() => setClient('')}>All</button>
              {data.clients.map(([id, name]: [string, string]) => <button key={id} className={`chip-btn ${client === id ? 'active' : ''}`} onClick={() => setClient(id)}>{name}</button>)}
            </div></div>
          )}
          <div className="filter-row"><div className="filter-label">Severity</div><div className="chips">
            <button className={`chip-btn ${!sev ? 'active' : ''}`} onClick={() => setSev('')}>All</button>
            {SEVERITIES.map((s) => <button key={s} className={`chip-btn ${sev === s ? 'active' : ''}`} onClick={() => setSev(sev === s ? '' : s)}>{s}<span className="count">{rules.filter((r) => r.severity === s).length}</span></button>)}
          </div></div>
          <div className="filter-row"><div className="filter-label">Panel</div><div className="chips">
            <button className={`chip-btn ${!panel ? 'active' : ''}`} onClick={() => setPanel('')}>All</button>
            {panels.map((p) => <button key={p} className={`chip-btn ${panel === p ? 'active' : ''}`} onClick={() => setPanel(panel === p ? '' : p)}>{p}</button>)}
          </div></div>
        </div>

        {loading && !data ? <div className="loading">Loading…</div> : (
          <div className="table-wrap mt16">
            <table className="table">
              <thead><tr><th>Rule</th><th>Severity</th><th>Panel · area</th><th>Threshold</th><th className="num">Fires for</th><th>Owner</th></tr></thead>
              <tbody>
                {shown.map((r) => {
                  const flags = byRule.get(r.code) ?? []
                  const isOpen = open === r.code
                  return (
                    <Fragment key={r.code}>
                      <tr className={flags.length ? 'clickable' : ''} onClick={() => flags.length && setOpen(isOpen ? null : r.code)}>
                        <td style={{ maxWidth: 420 }}>
                          <div className="row" style={{ gap: 8 }}><span className="mono muted">{r.code}</span><b style={{ fontWeight: 600 }}>{r.name}</b></div>
                          <div className="muted" style={{ fontSize: 12.5 }}>{r.rule}</div>
                        </td>
                        <td><Severity v={r.severity} /></td>
                        <td className="muted" style={{ fontSize: 13 }}>{r.panel}{r.area && <div>{r.area}</div>}</td>
                        <td className="nowrap" style={{ fontSize: 13 }}>{r.threshold != null ? `${r.threshold} ${r.thresholdUnit ?? ''}` : <span className="muted">yes / no</span>}</td>
                        <td className="num">{flags.length ? <span className={`tag ${r.severity === 'High' ? 'tag-bad' : r.severity === 'Medium' ? 'tag-warn' : r.severity === 'Opportunity' ? 'tag-good' : ''}`}>{flags.length}</span> : <span className="muted">0</span>}</td>
                        <td className="muted" style={{ fontSize: 13 }}>{r.owner ?? '–'}</td>
                      </tr>
                      {isOpen && (
                        <tr className="sub-row">
                          <td colSpan={6}>
                            {r.executiveAction && <p className="note" style={{ marginTop: 0 }}><b>Action.</b> {r.executiveAction}</p>}
                            <div className="flag-list">
                              {flags.map((f, i) => (
                                <div key={i} className="flag">
                                  <span className="mono muted">{f.scope === 'Group' ? 'Group' : f.employeeId}</span>
                                  <div>
                                    {f.scope === 'Group' ? <b>{f.subject}</b> : <Link to={`/people/${f.employeeId}`}><b>{f.employeeName}</b></Link>}
                                    <span className="muted"> · {f.scope === 'Group' ? `${f.employeeIds.length} people` : [f.department, f.jobTitle].filter(Boolean).join(' · ')}</span>
                                    <div className="muted">{f.detail}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="note">Rules R34–R36 look at groups (a team, a section, one skill across everyone) and only fire for groups of three people or more. People marked Out of Scope or Left Company are not checked. Observation thresholds use the 0–4 scale of the rule source (trainer score − 1).</p>
      </div>
    </div>
  )
}
