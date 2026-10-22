import { useSearchParams, Link } from 'react-router-dom'
import { useApi, getUser } from '../api'
import { Icon, Kpi, Pline } from '../components/ui'
import { MiniRail, NextSteps, StageRail, type Stage } from '../components/roadmap'

const GROUP_BY: [string, string][] = [['department', 'Department'], ['section', 'Section'], ['manager', 'Line manager team'], ['client', 'Client']]

/** Team roadmaps: where each department, section or manager's team is on the journey, and the report for the manager. */
export default function Roadmaps() {
  const [params, setParams] = useSearchParams()
  const groupBy = params.get('groupBy') ?? 'department'
  const key = params.get('key')
  const client = params.get('clientId') ?? ''
  const set = (p: Record<string, string | null>) => {
    const next = Object.fromEntries([...params.entries()])
    for (const [k, v] of Object.entries(p)) { if (v) next[k] = v; else delete next[k] }
    setParams(next, { replace: true })
  }
  const q = `groupBy=${groupBy}${client ? `&clientId=${client}` : ''}`
  const { data, loading, error } = useApi<any>(`/roadmaps?${q}`)
  const groups: any[] = data?.groups ?? []

  return (
    <div className="page">
      <section className="hero container no-print">
        <div className="eyebrow">Roadmaps</div>
        <h1>Every journey, from enrolment<br />to role readiness.</h1>
        <p className="sub">Once a person's data is reported, the roadmap shows the stages they go through, what they have done and what is still open. Here it is rolled up per department, section or line manager's team, with a report the manager can download or print. Each person's own roadmap is on their page (tab <b>Roadmap</b>).</p>
      </section>

      <div className="container">
        <div className="filters no-print">
          {(data?.clients?.length ?? 0) > 1 && (
            <div className="filter-row"><div className="filter-label">Client</div><div className="chips">
              <button className={`chip-btn ${!client ? 'active' : ''}`} onClick={() => set({ clientId: null, key: null })}>All</button>
              {data.clients.map(([id, name]: [string, string]) => <button key={id} className={`chip-btn ${client === id ? 'active' : ''}`} onClick={() => set({ clientId: id, key: null })}>{name}</button>)}
            </div></div>
          )}
          <div className="filter-row"><div className="filter-label">Group by</div><div className="chips">
            {GROUP_BY.map(([k, label]) => <button key={k} className={`chip-btn ${groupBy === k ? 'active' : ''}`} onClick={() => set({ groupBy: k, key: null })}>{label}</button>)}
          </div></div>
        </div>
        {error && <div className="alert">{error}</div>}

        {key ? <GroupRoadmap groupBy={groupBy} groupKey={key} client={client} onBack={() => set({ key: null })} /> : loading && !data ? <div className="loading">Loading…</div> : (
          <>
            {data?.total && (
              <div className="card mt24">
                <div className="card-head"><div><h3>Everyone in scope</h3><div className="card-sub">{data.people} people · share of people who finished each stage</div></div></div>
                <StageRail stages={teamStages(data.total, data.people)} sub={(s: any) => s.headline} />
              </div>
            )}
            <div className="grid g-3 mt24">
              {groups.map((g) => (
                <button key={g.key} type="button" className="card card-link group-card" onClick={() => set({ key: g.key })}>
                  <div className="row between" style={{ alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 0 }}><div className="group-name">{g.key}</div><div className="card-sub">{g.people} {g.people === 1 ? 'person' : 'people'}{g.atRisk ? ` · ${g.atRisk} at risk` : ''}{g.overdue ? ` · ${g.overdue} overdue` : ''}</div></div>
                    <div className="journey-pct sm"><b>{Math.round(g.progress * 100)}%</b></div>
                  </div>
                  <div className="mt16"><MiniRail stages={teamStages(g.stages, g.people)} /></div>
                  <div className="row between mt8 small muted"><span>Enrol</span><span>Ready</span></div>
                  <div className="mt8"><Pline value={g.progress} tone="" /></div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/** A team stage looks like a person's: done when everyone is done, at risk when anyone is. */
function teamStages(stages: any[], people: number): Stage[] {
  return stages.map((s) => ({
    key: s.key, label: s.label, short: s.short, progress: s.progress, open: [], flags: [],
    status: people && s.done === people ? 'done' : s.risk ? 'risk' : s.done + s.active ? 'active' : 'todo',
    headline: `${s.done}/${people} done${s.here ? ` · ${s.here} here now` : ''}${s.risk ? ` · ${s.risk} at risk` : ''}`,
  }))
}

function GroupRoadmap({ groupBy, groupKey, client, onBack }: { groupBy: string; groupKey: string; client: string; onBack: () => void }) {
  const q = `groupBy=${groupBy}&key=${encodeURIComponent(groupKey)}${client ? `&clientId=${client}` : ''}`
  const { data } = useApi<any>(`/roadmaps/group?${q}`)
  if (!data) return <div className="loading">Loading…</div>
  const label = GROUP_BY.find(([k]) => k === groupBy)?.[1] ?? 'Group'
  const stages = teamStages(data.stages, data.people)
  return (
    <div className="stack mt24 roadmap">
      <div className="row between wrap">
        <div>
          <div className="crumbs no-print"><button className="link-btn" onClick={onBack}>All {label.toLowerCase()}s</button><span className="sep">/</span><span>{groupKey}</span></div>
          <h2 className="group-title">{label}: {groupKey}</h2>
        </div>
        <div className="toolbar no-print">
          <a className="btn btn-primary btn-sm" href={`/api/roadmaps/report?${q}&user=${encodeURIComponent(getUser())}`}><Icon.download />Manager report (.xlsx)</a>
          <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>Print / PDF</button>
        </div>
      </div>

      <div className="grid g-4">
        <Kpi label="People" icon={<Icon.users />} value={data.people} sub={label} />
        <Kpi label="Journey complete" icon={<Icon.target />} value={`${Math.round(data.progress * 100)}%`} bar={<Pline value={data.progress} tone="" />} />
        <Kpi label="Ready for next role" icon={<Icon.badge />} value={data.finished} sub="Final stage done" />
        <Kpi label="With a stage at risk" icon={<Icon.alert />} tone={data.atRisk ? 'bad' : ''} value={data.atRisk} sub={`${data.upcoming.filter((u: any) => u.overdue).length} overdue items`} />
      </div>

      <div className="card">
        <div className="card-head"><div><h3>Team roadmap</h3><div className="card-sub">Share of people who finished each stage, and how many are on it now</div></div></div>
        <StageRail stages={stages} sub={(s) => s.headline} />
      </div>

      <div className="card">
        <div className="card-head"><div><h3>Each person's journey</h3><div className="card-sub">One row per person, stages left to right · solid = done, light = in progress (filled to its %), red = at risk, outlined = where they are now</div>
          <div className="stage-key">{stages.map((s, i) => <span key={s.key}><b>{i + 1}</b> {s.short}</span>)}</div></div></div>
        <div className="table-wrap">
          <table className="table journey-table">
            <thead><tr><th>Person</th><th>Now</th><th className="journey-col">{stages.map((s, i) => <span key={s.key} title={s.label}>{i + 1}</span>)}</th><th className="num">Journey</th><th>Next step</th></tr></thead>
            <tbody>
              {data.members.map((m: any) => {
                const cur = m.stages.find((s: any) => s.key === m.currentStage)
                return (
                  <tr key={m.employeeId}>
                    <td><Link to={`/people/${m.employeeId}?tab=roadmap`}><b>{m.name}</b></Link><div className="person-role clip">{m.jobTitle ?? '–'}</div></td>
                    <td className="nowrap">{cur ? <span className={`tag st-tag-${cur.status}`}>{cur.short}</span> : <span className="tag st-tag-done">Complete</span>}</td>
                    <td className="journey-col"><MiniRail stages={m.stages} current={m.currentStage} /></td>
                    <td className="num">{Math.round(m.progress * 100)}%</td>
                    <td style={{ maxWidth: 300, fontSize: 13 }}>{m.next[0] ? <>{m.next[0].text}{m.next[0].date && <span className={m.next[0].overdue ? 'bad-text' : 'muted'}> · {String(m.next[0].date).slice(0, 10)}</span>}</> : <span className="muted">–</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><div><h3>Overdue and next 60 days</h3><div className="card-sub">What the team still has to do, with dates</div></div></div>
        <NextSteps items={data.upcoming.slice(0, 40)} />
        {data.upcoming.length > 40 && <p className="note">{data.upcoming.length - 40} more in the manager report.</p>}
      </div>
    </div>
  )
}
