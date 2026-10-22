// The manager dashboard: the whole organisation on one page. Ported from the stand-alone skills dashboard;
// it now reads the live database (GET /api/dashboard) instead of a workbook.
import { Link, useSearchParams } from 'react-router-dom'
import { useApi } from '../api'
import { Icon, Kpi, Pline } from '../components/ui'
import { BANDS, BarList, Donut, Legend, StackBar, nf, pctTxt, readinessTone } from '../components/charts'

export const teamsHref = (p: Record<string, string | null | undefined> = {}) => {
  const q = Object.entries(p).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&')
  return `/teams${q ? `?${q}` : ''}`
}

export function ClientChips({ clients, client, onPick }: { clients: [string, string][]; client: string; onPick: (id: string) => void }) {
  if ((clients?.length ?? 0) < 2) return null
  return (
    <div className="filter-row"><div className="filter-label">Client</div><div className="chips">
      <button className={`chip-btn ${!client ? 'active' : ''}`} onClick={() => onPick('')}>All</button>
      {clients.map(([id, name]) => <button key={id} className={`chip-btn ${client === id ? 'active' : ''}`} onClick={() => onPick(id)}>{name}</button>)}
    </div></div>
  )
}

export default function Dashboard() {
  const [params, setParams] = useSearchParams()
  const client = params.get('clientId') ?? ''
  const { data, error } = useApi<any>(`/dashboard${client ? `?clientId=${client}` : ''}`)
  if (error && !data) return <div className="container page"><div className="alert">{error}</div></div>
  if (!data) return <div className="loading">Loading…</div>
  const s = data.summary
  const c = client ? { clientId: client } : {}
  const bandSegs = BANDS.map((b) => ({ value: s.bands[b.id], cls: `b-${b.id}`, label: b.label }))

  return (
    <div className="page">
      <section className="hero container">
        <div className="eyebrow">Dashboard{client ? ` · ${data.clients.find(([id]: string[]) => id === client)?.[1] ?? ''}` : ''}</div>
        <h1>Who is ready, what is missing,<br />and where to act next.</h1>
        <p className="sub">{nf(s.count)} people across {data.departments.length} {data.departments.length === 1 ? 'department' : 'departments'}. Every number is calculated from the records entered in this app, so it matches the person pages, the roadmaps and the Excel export.</p>
        <div className="actions">
          <Link className="btn btn-primary" to={teamsHref(c)}>Open teams <span className="arrow">→</span></Link>
          <Link className="btn btn-secondary" to={teamsHref({ ...c, band: 'ready' })}>Ready for promotion</Link>
          <Link className="btn btn-secondary" to="/value"><Icon.coin />Value &amp; ROI</Link>
        </div>
      </section>

      <div className="container">
        <div className="filters" style={{ display: data.clients.length > 1 ? undefined : 'none' }}>
          <ClientChips clients={data.clients} client={client} onPick={(id) => setParams(id ? { clientId: id } : {}, { replace: true })} />
        </div>

        <div className="grid g-4 mt16">
          <Link to={teamsHref({ ...c, band: 'unassessed' })} className="card-link-wrap"><Kpi label="People assessed" icon={<Icon.users />} value={<>{nf(s.assessedCount)}<small> / {nf(s.count)}</small></>}
            sub={`${pctTxt(s.count ? s.selfAssessed / s.count : null)} self-assessed · ${nf(s.validated)} validated by interview`}
            bar={<StackBar height={8} segments={[
              { value: s.reported, cls: 'b-ready', label: 'Report delivered' }, { value: s.validated - s.reported, cls: 'b-soon', label: 'Validated, report pending' },
              { value: s.selfAssessed - s.validated, cls: 'b-growing', label: 'Self-assessed only' }, { value: s.count - s.selfAssessed, cls: 'b-unassessed', label: 'Not assessed' }]} />} /></Link>
          <a href="#critical-positions" className="card-link-wrap"><Kpi label="Critical positions" icon={<Icon.crown />} tone={s.uncovered ? 'warn' : ''} value={nf(s.criticalPositions)} sub={`${s.uncovered} have no successor ready within 12 months`} /></a>
          <Link to={teamsHref({ ...c, sort: 'critical' })} className="card-link-wrap"><Kpi label="Critical gaps" icon={<Icon.alert />} tone="bad" value={nf(s.criticalGaps)} sub={`High-priority competencies below requirement, across ${nf(s.peopleWithCritical)} people`} /></Link>
          <Kpi label="Training completed" icon={<Icon.check />} value={pctTxt(s.training.rate)} sub={`${nf(s.training.done)} of ${nf(s.training.started)} started trainings · ${nf(s.training.allDone)} people fully up to date`} bar={<Pline value={s.training.rate} tone="" />} />
          <Link to={teamsHref({ ...c, band: 'ready' })} className="card-link-wrap"><Kpi label="Ready for promotion" icon={<Icon.up />} value={<>{nf(s.bands.ready)}<small> now · {nf(s.bands.soon)} in 6–12 months</small></>} sub="Based on readiness for the next role up" /></Link>
          <Link to={teamsHref({ ...c, view: 'risk' })} className="card-link-wrap"><Kpi label="Key-person risk" icon={<Icon.key />} tone="warn" value={<>{nf(data.singles.length)}<small> competencies</small></>} sub={`Held at expert level by only one person in their section · ${nf(s.keyPeople)} key people`} /></Link>
          <Kpi label="Average role readiness" icon={<Icon.target />} value={pctTxt(s.avgRoleReadiness)} sub={`${nf(s.exceedsRole)} people exceed every requirement of their role`} bar={<Pline value={s.avgRoleReadiness} />} />
          <Kpi label="Certifications" icon={<Icon.badge />} value={<>{pctTxt(s.certTotal ? s.certAchieved / s.certTotal : null)}<small> professional</small></>} sub={`${nf(s.certAchieved)} of ${nf(s.certTotal)} achieved · AI ${nf(s.aiAchieved)} of ${nf(s.aiTotal)}`} bar={<Pline value={s.certTotal ? s.certAchieved / s.certTotal : null} tone="" />} />
        </div>

        <div className="grid g-2 mt16">
          <div className="card">
            <div className="card-head"><div><h3>Assessment progress</h3><div className="card-sub">How far everyone is through self-assessment, validation and reports</div></div></div>
            <BarList items={[
              { label: 'In scope', value: 1, text: nf(s.count), cls: 'ink' },
              { label: 'Self-assessment completed', value: s.count ? s.selfAssessed / s.count : 0, text: `${nf(s.selfAssessed)} · ${pctTxt(s.count ? s.selfAssessed / s.count : null)}`, cls: 'accent' },
              { label: 'Validation interview done', value: s.count ? s.validated / s.count : 0, text: `${nf(s.validated)} · ${pctTxt(s.count ? s.validated / s.count : null)}`, cls: 'accent' },
              { label: 'Report delivered', value: s.count ? s.reported / s.count : 0, text: `${nf(s.reported)} · ${pctTxt(s.count ? s.reported / s.count : null)}`, cls: 'accent' },
            ]} />
            <p className="note">{nf(s.count - s.selfAssessed)} people have not finished their self-assessment, so they have no competency data yet.</p>
          </div>
          <div className="card">
            <div className="card-head"><div><h3>Promotion readiness</h3><div className="card-sub">Every person, by readiness for their next role</div></div></div>
            <div className="row wrap" style={{ gap: 28 }}>
              <Donut segments={bandSegs} center={nf(s.bands.ready + s.bands.soon)} sub="ready within 12 months" />
              <div style={{ flex: 1, minWidth: 220 }}><Legend rows={BANDS.map((b) => ({ cls: `b-${b.id}`, label: b.label, value: nf(s.bands[b.id]), href: teamsHref({ ...c, band: b.id }) }))} /></div>
            </div>
            <p className="note"><b>Ready now</b>: 92%+ ready for the next role and no critical gaps. <b>6–12 months</b>: 85%+ with at most one critical gap.</p>
          </div>
        </div>

        <div className="section">
          <div className="section-head"><div><h2>Departments</h2><p>Open a department to see its sections, gaps, key people, the 9-box and every person.</p></div><Link className="link-cta" to={teamsHref(c)}>All teams <span className="arrow">→</span></Link></div>
          <div className="grid g-4">
            {data.departments.map((d: any) => (
              <Link key={d.department} className="card card-link dept-card" to={teamsHref({ ...c, department: d.department })}>
                <div className="row between" style={{ alignItems: 'flex-start' }}><div style={{ minWidth: 0 }}><div className="dept-name">{d.department}</div><div className="dept-div">{d.division ?? `${d.sections.length} sections`}</div></div><span className="tag">{d.people} people</span></div>
                <div className="row between mt16"><span className="muted" style={{ fontSize: 12.5 }}>Role readiness</span><b>{pctTxt(d.summary.avgRoleReadiness)}</b></div>
                <div className="mt8"><Pline value={d.summary.avgRoleReadiness} tone={readinessTone(d.summary.avgRoleReadiness)} /></div>
                <div className="dept-stats">
                  <div><b>{d.summary.criticalGaps}</b>critical gaps</div>
                  <div><b>{d.summary.bands.ready + d.summary.bands.soon}</b>ready soon</div>
                  <div><b>{d.singles}</b>key-person risks</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <section className="dark-band" id="critical-positions">
          <div className="section-head">
            <div><h2>Critical positions and their bench</h2><p>{data.criticalPositions.length} lead, manager, head and executive roles. A successor is someone whose next role is this one and who is ready now or within 12 months.</p></div>
            <div className="row"><div className="stat"><div className="stat-value">{s.criticalPositions - s.uncovered}</div><div className="stat-label muted">covered</div></div>
              <div className="stat"><div className="stat-value bad-on-dark">{s.uncovered}</div><div className="stat-label muted">no successor</div></div></div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead><tr><th>Position</th><th>Held by</th><th className="num">Role readiness</th><th>Ready successors</th></tr></thead>
              <tbody>
                {data.criticalPositions.map((h: any) => (
                  <tr key={h.id}>
                    <td><div className="person-name">{h.role}</div><div className="muted" style={{ fontSize: 12.5 }}>{h.section} · {h.department}</div></td>
                    <td><Link to={`/people/${h.id}?tab=analysis`}>{h.name}</Link></td>
                    <td className="num">{h.assessed ? pctTxt(h.roleReadiness) : <span className="muted">not assessed</span>}</td>
                    <td>{h.successors.length ? <>{h.successors.slice(0, 3).map((x: any) => <Link key={x.id} to={`/people/${x.id}?tab=analysis`} className="tag tag-good" style={{ marginRight: 4 }} title={`Next-role readiness ${pctTxt(x.nextReadiness)}`}>{x.name} · {pctTxt(x.nextReadiness)}</Link>)}{h.successors.length > 3 && <span className="muted">+{h.successors.length - 3}</span>}</> : <span className="tag tag-bad">No ready successor</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
