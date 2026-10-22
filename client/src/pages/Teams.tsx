// Teams: one department or section at a time (or everyone). Gaps, promotion overview, tasks done by assessment,
// key-person risk, the 9-box, competency and behaviour heatmaps and the full employee list.
// Ported from the stand-alone skills dashboard; data from GET /api/dashboard.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useApi } from '../api'
import { Avatar, Icon, Kpi } from '../components/ui'
import { BANDS, BandTag, BarList, Legend, StackBar, avgGapClass, gapClass, nf, pctTxt, readinessTone, scoreClass } from '../components/charts'
import { Pline } from '../components/ui'
import { ClientChips } from './Dashboard'

const PERF_CUTS = [0.86, 0.95] // role readiness
const POT_CUTS = [2.8, 3.4] // Leadership + Learning Agility average (1–5)
const NINE = [['Rough diamond', 'High potential', 'Star'], ['Inconsistent', 'Core player', 'High performer'], ['Under-performer', 'Effective', 'Trusted professional']]
const tier = (x: number, cuts: number[]) => (x < cuts[0] ? 0 : x < cuts[1] ? 1 : 2)
const BAND_ORDER = BANDS.map((b) => b.id as string)

type P = any
const COLUMNS: { key: string; label: string; num?: boolean; sort: (e: P) => any }[] = [
  { key: 'name', label: 'Person', sort: (e) => e.name },
  { key: 'team', label: 'Team', sort: (e) => `${e.department} ${e.section}` },
  { key: 'assessment', label: 'Assessment', sort: (e) => (e.report === 'Delivered' ? 0 : e.validation === 'Completed' ? 1 : e.selfAssessment === 'Completed' ? 2 : 3) },
  { key: 'ready', label: 'Role readiness', num: true, sort: (e) => e.roleReadiness ?? -1 },
  { key: 'critical', label: 'Critical gaps', num: true, sort: (e) => (e.assessed ? e.criticalGaps.length : -1) },
  { key: 'training', label: 'Training done', num: true, sort: (e) => e.training.rate ?? -1 },
  { key: 'next', label: 'Next role · progress', sort: (e) => e.nextReadiness ?? -1 },
  { key: 'band', label: 'Promotion', sort: (e) => BAND_ORDER.indexOf(e.band) },
]
const AssessTag = ({ e }: { e: P }) => e.report === 'Delivered' ? <span className="tag tag-good">Report delivered</span> : e.validation === 'Completed' ? <span className="tag">Validated</span> : e.selfAssessment === 'Completed' ? <span className="tag">Self-assessed</span> : <span className="tag tag-muted">Not started</span>

export default function Teams() {
  const [params, setParams] = useSearchParams()
  const nav = useNavigate()
  const client = params.get('clientId') ?? '', department = params.get('department') ?? '', section = params.get('section') ?? ''
  const q = new URLSearchParams(Object.entries({ clientId: client, department, section }).filter(([, v]) => v)).toString()
  const { data, error } = useApi<any>(`/dashboard${q ? `?${q}` : ''}`)
  const set = (p: Record<string, string | null>) => {
    const next = Object.fromEntries([...params.entries()])
    for (const [k, v] of Object.entries(p)) { if (v) next[k] = v; else delete next[k] }
    setParams(next, { replace: true })
  }
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(50)
  const band = params.get('band') ?? 'all'
  const sortKey = params.get('sort') ?? 'next'
  const [dir, setDir] = useState<1 | -1>(-1)
  const peopleRef = useRef<HTMLDivElement>(null)
  const riskRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!data) return
    if (params.get('view') === 'risk') riskRef.current?.scrollIntoView({ block: 'center' })
    else if (params.get('band') || params.get('sort')) peopleRef.current?.scrollIntoView({ block: 'start' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!data])

  const rows = useMemo(() => {
    if (!data) return []
    const words = search.toLowerCase().split(/\s+/).filter(Boolean)
    const col = COLUMNS.find((c) => c.key === sortKey) ?? COLUMNS[0]
    return data.people.filter((e: P) => (band === 'all' || e.band === band) && words.every((w) => `${e.name} ${e.role ?? ''} ${e.section} ${e.department} ${e.nextRole ?? ''}`.toLowerCase().includes(w)))
      .sort((a: P, b: P) => { const x = col.sort(a), y = col.sort(b); return ((x < y ? -1 : x > y ? 1 : 0) * dir) || a.name.localeCompare(b.name) })
  }, [data, search, band, sortKey, dir])

  if (error && !data) return <div className="container page"><div className="alert">{error}</div></div>
  if (!data) return <div className="loading">Loading…</div>
  const s = data.summary
  const dept = data.departments.find((d: any) => d.department === department)
  const scopeName = section || department || 'All departments'
  const assessed = data.people.filter((e: P) => e.assessed)
  const compById = new Map<string, any>(data.competencies.map((c: any) => [c.id, c]))
  const bandSegs = BANDS.map((b) => ({ value: s.bands[b.id], cls: `b-${b.id}`, label: b.label }))

  // tasks done by band / assessment stage
  const tasks = (grp: P[]) => { const done = grp.reduce((n, e) => n + e.training.done, 0), started = grp.reduce((n, e) => n + e.training.started, 0); return { done, started, rate: started ? done / started : null } }
  const byBand = BANDS.map((b) => ({ b, grp: data.people.filter((e: P) => e.band === b.id) })).filter((x) => x.grp.length).map(({ b, grp }) => { const t = tasks(grp); return { label: b.label, value: t.rate ?? 0, text: `${pctTxt(t.rate)} · ${t.done}/${t.started}`, cls: b.id === 'support' ? 'warn' : 'accent', title: `${grp.length} people in "${b.label}" completed ${t.done} of the ${t.started} trainings they started.` } })
  const STAGES: [string, (e: P) => boolean][] = [['Report delivered', (e) => e.report === 'Delivered'], ['Validated, no report yet', (e) => e.validation === 'Completed' && e.report !== 'Delivered'], ['Self-assessed only', (e) => e.selfAssessment === 'Completed' && e.validation !== 'Completed'], ['Not assessed', (e) => e.selfAssessment !== 'Completed']]
  const byStage = STAGES.map(([label, test]) => { const grp = data.people.filter(test), t = tasks(grp); return { label, sub: String(grp.length), value: t.rate ?? 0, text: t.started ? `${pctTxt(t.rate)} · ${t.done}/${t.started}` : '–', cls: 'accent' } }).filter((x) => x.sub !== '0')

  // 9-box
  const boxed = assessed.filter((e: P) => e.potential != null)
  const cells: P[][][] = [[[], [], []], [[], [], []], [[], [], []]]
  for (const e of boxed) cells[2 - tier(e.potential, POT_CUTS)][tier(e.roleReadiness, PERF_CUTS)].push(e)

  const heatPeople = [...assessed].sort((a: P, b: P) => a.roleReadiness - b.roleReadiness)
  const observed = data.people.filter((e: P) => e.behaviorAvg).sort((a: P, b: P) => (b.potential ?? 0) - (a.potential ?? 0))
  const teamQ = (p: Record<string, string>) => `/teams?${new URLSearchParams({ ...(client ? { clientId: client } : {}), ...p })}`

  return (
    <div className="page">
      <section className="hero compact container">
        <div className="crumbs"><Link to={`/dashboard${client ? `?clientId=${client}` : ''}`}>Dashboard</Link><span className="sep">/</span><Link to={teamQ({})}>Teams</Link>
          {department && <><span className="sep">/</span><Link to={teamQ({ department })}>{department}</Link></>}{section && <><span className="sep">/</span><span>{section}</span></>}</div>
        <h1 className="mt16">{scopeName}</h1>
        <p className="sub">{section ? `${department}` : dept ? `${dept.division ?? `${dept.sections.length} sections`}` : `${data.departments.length} ${data.departments.length === 1 ? 'department' : 'departments'}`} · {nf(s.count)} {s.count === 1 ? 'person' : 'people'}</p>
      </section>

      <div className="container">
        <div className="filters">
          <ClientChips clients={data.clients} client={client} onPick={(id) => set({ clientId: id || null, department: null, section: null })} />
          <div className="filter-row"><div className="filter-label">Department</div><div className="chips">
            <button className={`chip-btn ${!department ? 'active' : ''}`} onClick={() => set({ department: null, section: null })}>All</button>
            {data.departments.map((d: any) => <button key={d.department} className={`chip-btn ${department === d.department ? 'active' : ''}`} onClick={() => set({ department: d.department, section: null })}>{d.department}<span className="count">{d.people}</span></button>)}
          </div></div>
          {dept && <div className="filter-row"><div className="filter-label">Section</div><div className="chips">
            <button className={`chip-btn ${!section ? 'active' : ''}`} onClick={() => set({ section: null })}>All sections</button>
            {dept.sections.map((x: string) => <button key={x} className={`chip-btn ${section === x ? 'active' : ''}`} onClick={() => set({ section: x })}>{x}</button>)}
          </div></div>}
        </div>

        <div className="grid g-6 mt16">
          <Kpi label="People" value={<>{nf(s.count)}</>} sub={`${s.assessedCount} assessed · ${s.count - s.assessedCount} not yet`} />
          <Kpi label="Role readiness" value={pctTxt(s.avgRoleReadiness)} sub={`next role: ${pctTxt(s.avgNextReadiness)}`} />
          <Kpi label="Critical gaps" tone="bad" value={nf(s.criticalGaps)} sub={`${s.peopleWithCritical} people affected`} />
          <Kpi label="Key-person risk" tone="warn" value={nf(data.singles.length)} sub={`${s.keyPeople} key ${s.keyPeople === 1 ? 'person' : 'people'}`} />
          <Kpi label="Promotion" value={<>{s.bands.ready}<small> + {s.bands.soon}</small></>} sub="now + in 6–12 months" />
          <Kpi label="Training done" value={pctTxt(s.training.rate)} sub={`${s.training.done} of ${s.training.started} started`} />
        </div>

        <div className="grid g-2 mt16">
          <div className="card">
            <div className="card-head"><div><h3>Most common gaps</h3><div className="card-sub">Share of assessed people below the level their role requires</div></div></div>
            <BarList empty="No gaps in this scope." items={data.topGaps.slice(0, 10).map((g: any) => ({ label: g.name, value: g.withGap / g.assessed, part: g.critical / g.assessed, text: `${g.withGap} of ${g.assessed}`, cls: 'warn', title: `${g.name}: ${g.withGap} people below requirement (${g.critical} on a High-priority competency). Average gap ${(g.gapSum / g.withGap).toFixed(1)} levels.` }))} />
            <div className="legend inline mt16"><span className="legend-row"><span className="dot" style={{ background: 'var(--band-support)' }} />Below requirement</span><span className="legend-row"><span className="dot" style={{ background: 'var(--bad)' }} />…on a High-priority competency (critical)</span></div>
          </div>
          <div className="card">
            <div className="card-head"><div><h3>Promotion overview</h3><div className="card-sub">Readiness for the next role up. Click a group to filter the list.</div></div></div>
            <StackBar segments={bandSegs} height={14} />
            <div className="grid g-3" style={{ margin: '16px 0' }}>
              <div className="stat"><div className="stat-value">{s.bands.ready}</div><div className="stat-label">ready to promote now</div></div>
              <div className="stat"><div className="stat-value">{s.bands.soon}</div><div className="stat-label">ready in 6–12 months</div></div>
              <div className="stat"><div className="stat-value">{s.training.finishing}</div><div className="stat-label">finishing their training now</div></div>
            </div>
            <Legend rows={BANDS.map((b) => ({ key: b.id, cls: `b-${b.id}`, label: b.label, value: nf(s.bands[b.id]) }))} active={band} onPick={(k) => { set({ band: band === k ? null : k }); setLimit(50); peopleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }} />
          </div>
        </div>

        <div className="grid g-2 mt16">
          <div className="card">
            <div className="card-head"><div><h3>Training done, by assessment</h3><div className="card-sub">Completed ÷ started trainings for each group</div></div></div>
            <div className="eyebrow" style={{ fontSize: 11.5, marginBottom: 10 }}>By promotion band</div>
            <BarList items={byBand} />
            <div className="eyebrow" style={{ fontSize: 11.5, margin: '20px 0 10px' }}>By assessment stage</div>
            <BarList items={byStage} />
            <p className="note">{s.training.allDone} people have finished everything they started; {s.training.finishing} have only in-progress items left.</p>
          </div>
          <div className="card" ref={riskRef}>
            <div className="card-head"><div><h3>Key-person risk</h3><div className="card-sub">Competencies only one person in their section holds at expert level</div></div>
              <div className="row"><div className="stat"><div className="stat-value">{data.singles.length}</div><div className="stat-label">risks</div></div><div className="stat"><div className="stat-value">{s.keyPeople}</div><div className="stat-label">key people</div></div></div></div>
            {data.singles.length ? (
              <div className="table-wrap" style={{ maxHeight: 320, overflow: 'auto' }}>
                <table className="table"><thead><tr><th>Competency</th><th>Only expert</th><th>Section</th></tr></thead>
                  <tbody>{[...data.singles].sort((a: any, b: any) => b.holders - a.holders).map((r: any, i: number) => <tr key={i}><td>{r.name}</td><td><Link to={`/people/${r.personId}?tab=analysis`}>{r.person}</Link></td><td className="muted">{r.section} · 1 of {r.holders}</td></tr>)}</tbody></table>
              </div>
            ) : <p className="empty">No competency depends on a single expert here.</p>}
            {data.none.length > 0 && <p className="note"><b>No expert at all</b> in a High-priority competency: {data.none.map((r: any) => `${r.name} (${r.section})`).join(', ')}.</p>}
          </div>
        </div>

        <div className={`grid ${data.byGroup.length > 1 ? 'g-2' : ''} mt16`}>
          <div className="card">
            <div className="card-head"><div><h3>Performance × potential</h3><div className="card-sub">9-box of assessed people with observation scores</div></div></div>
            <div className="ninebox">
              {[0, 1, 2].map((r) => (
                <div key={r} style={{ display: 'contents' }}>
                  <div className="nb-axis y">{['High', 'Medium', 'Low'][r]}</div>
                  {[0, 1, 2].map((c) => {
                    const list = cells[r][c].sort((a, b) => b.roleReadiness - a.roleReadiness)
                    return (
                      <div key={c} className={`nb-cell ${(r === 0 && c >= 1) || (r === 1 && c === 2) ? 'hot' : ''} ${r === 2 && c === 0 ? 'cold' : ''}`}>
                        <div className="nb-title">{NINE[r][c]}</div><div className="nb-count">{list.length}</div>
                        <div className="nb-names">{list.slice(0, 4).map((e, i) => <span key={e.id}>{i ? ', ' : ''}<Link to={`/people/${e.id}?tab=analysis`}>{e.name}</Link></span>)}{list.length > 4 ? ` +${list.length - 4}` : ''}</div>
                      </div>
                    )
                  })}
                </div>
              ))}
              <div /><div className="nb-axis">Low</div><div className="nb-axis">Medium</div><div className="nb-axis">High</div>
            </div>
            <p className="note"><b>Across</b>: role readiness (below {pctTxt(PERF_CUTS[0])} · to {pctTxt(PERF_CUTS[1])} · above). <b>Up</b>: Leadership + Learning Agility average from the observed programme days (below {POT_CUTS[0]} · to {POT_CUTS[1]} · above). {boxed.length} of {assessed.length} assessed people have observation scores.</p>
          </div>
          {data.byGroup.length > 1 && (
            <div className="card">
              <div className="card-head"><div><h3>Readiness by {department ? 'section' : 'department'}</h3><div className="card-sub">Average role readiness of assessed people · click to drill in</div></div></div>
              <BarList items={data.byGroup.map((g: any) => ({ label: g.label, href: department ? teamQ({ department, section: g.label }) : teamQ({ department: g.label }), value: g.readiness, text: `${pctTxt(g.readiness)} · ${g.ready} ready`, cls: g.readiness >= 0.9 ? 'accent' : 'warn' }))} />
            </div>
          )}
        </div>

        <div className="section">
          <div className="section-head"><div><h2>Competency heatmap</h2><p>{data.sectionHeat ? 'Sections against every competency. Pick a department or section to see individual people.' : 'Every assessed person against every competency, weakest first.'}</p></div></div>
          {!assessed.length ? <p className="empty">Nobody in this scope has been assessed yet.</p> : (
            <>
              <div className="heat-scroll">
                <table className="heat">
                  <thead><tr><th className="rowhead">{data.sectionHeat ? 'Section · assessed people' : 'Person · role readiness'}</th>
                    {data.competencies.map((c: any, i: number) => <th key={c.id} className={i && data.competencies[i - 1].category !== c.category ? 'cat-start' : ''} title={`${c.name} · ${c.category} · ${c.framework}`}><div className="vlabel">{c.name}</div></th>)}</tr></thead>
                  <tbody>
                    {data.sectionHeat ? data.sectionHeat.map((g: any) => (
                      <tr key={g.label}><th className="rowhead">{g.label}<span className="rh-sub">{g.people}</span></th>
                        {data.competencies.map((c: any) => { const v = g.cells[c.id]; return <td key={c.id} className={`cell ${avgGapClass(v)}`} title={`${g.label} · ${c.name}: ${v == null ? 'not assessed' : `average ${v >= 0 ? '+' : ''}${v.toFixed(2)} vs requirement`}`}>{v == null ? '' : Math.abs(v) < 0.05 ? '0' : `${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}`}</td> })}</tr>
                    )) : heatPeople.map((e: P) => {
                      const by = new Map<string, any>(e.gaps.map((g: any) => [g.id, g]))
                      return (
                        <tr key={e.id}><th className="rowhead"><Link to={`/people/${e.id}?tab=analysis`}>{e.name}</Link><span className="rh-sub">{pctTxt(e.roleReadiness)}</span></th>
                          {data.competencies.map((c: any) => { const g = by.get(c.id); return g ? <td key={c.id} className={`cell ${gapClass(g.level, g.req)}`} title={`${e.name} · ${c.name}: level ${g.level}, required ${g.req} (${g.priority ?? '–'})`}>{g.level}</td> : <td key={c.id} className="cell heat-none" /> })}</tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="heat-legend">{data.sectionHeat ? 'Cell = average of (level − required). Colour:' : 'Cell = assessed level. Colour = level against the role requirement:'}
                <span><i className="heat-ex" />Above</span><span><i className="heat-ok" />Meets</span><span><i className="heat-g1" />{data.sectionHeat ? 'Slightly below' : '1 below'}</span><span><i className="heat-g2" />{data.sectionHeat ? 'Well below' : '2+ below'}</span><span><i className="heat-none" />Not assessed</span></div>
            </>
          )}
        </div>

        <div className="section">
          <div className="section-head"><div><h2>Observed behaviours</h2><p>The {data.parameters.length} behaviours trainers score on observed programme days, averaged per person. Sorted by Leadership + Learning Agility.</p></div></div>
          {!observed.length ? <p className="empty">Nobody in this scope has attended an observed programme yet.</p> : (
            <>
              <div className="heat-scroll">
                <table className="heat">
                  <thead><tr><th className="rowhead">Person · Leadership + Agility</th>{data.parameters.map((b: any) => <th key={b.id} title={`${b.name} → ${b.competency ?? b.category}`}><div className="vlabel">{b.name}</div></th>)}</tr></thead>
                  <tbody>{observed.map((e: P) => (
                    <tr key={e.id}><th className="rowhead"><Link to={`/people/${e.id}?tab=analysis`}>{e.name}</Link><span className="rh-sub">L+A {e.potential != null ? e.potential.toFixed(1) : '–'}</span></th>
                      {e.behaviorAvg.map((v: number | null, i: number) => <td key={i} className={`cell ${scoreClass(v)}`} title={`${e.name} · ${data.parameters[i]?.name}: ${v == null ? '–' : v.toFixed(1)}`}>{v == null ? '' : Math.round(v)}</td>)}</tr>
                  ))}</tbody>
                </table>
              </div>
              <div className="heat-legend">Trainer score, averaged over attended days (1–5): <span><i className="score-5" />5</span><span><i className="score-4" />4</span><span><i className="score-3" />3</span><span><i className="score-2" />2</span><span><i className="score-1" />1</span></div>
            </>
          )}
        </div>

        <div className="section" ref={peopleRef}>
          <div className="section-head"><div><h2>Employees</h2><p>The line under each next role shows how close the person is to it. Click anyone for their full analysis.</p></div></div>
          <div className="table-tools">
            <div className="search-wrap"><Icon.search /><input className="search" placeholder="Search name, role or team" value={search} onChange={(e) => { setSearch(e.target.value); setLimit(50) }} /></div>
            <div className="chips">{['all', ...BAND_ORDER].map((id) => <button key={id} className={`chip-btn ${band === id ? 'active' : ''}`} onClick={() => { set({ band: id === 'all' ? null : id }); setLimit(50) }}>{id === 'all' ? 'Everyone' : BANDS.find((b) => b.id === id)!.short}</button>)}</div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr>{COLUMNS.map((c) => <th key={c.key} className={`sortable ${c.num ? 'num' : ''}`} onClick={() => { if (sortKey === c.key) setDir((d) => (d === 1 ? -1 : 1)); else { set({ sort: c.key }); setDir(c.key === 'name' || c.key === 'team' ? 1 : -1) } }}>{c.label}{sortKey === c.key && <span className="sort-ind">{dir === 1 ? '↑' : '↓'}</span>}</th>)}</tr></thead>
              <tbody>
                {!rows.length && <tr><td colSpan={COLUMNS.length} className="empty" style={{ padding: 24 }}>Nobody matches.</td></tr>}
                {rows.slice(0, limit).map((e: P) => (
                  <tr key={e.id} className="clickable" onClick={() => nav(`/people/${e.id}?tab=analysis`)}>
                    <td><div className="person"><Avatar name={e.name} /><div style={{ minWidth: 0 }}><div className="person-name">{e.name}</div><div className="person-role">{e.role}</div></div></div>
                      {(e.criticalPosition || e.keyFor.length > 0) && <div className="row wrap" style={{ margin: '6px 0 0 40px', gap: 4 }}>{e.criticalPosition && <span className="tag tag-dark">Critical role</span>}{e.keyFor.length > 0 && <span className="tag" title={`Sole expert in ${e.keyFor.join(', ')}`}>Key person</span>}</div>}</td>
                    <td><div>{e.section}</div><div className="person-role">{e.department}</div></td>
                    <td><AssessTag e={e} /></td>
                    <td className="num">{e.assessed ? pctTxt(e.roleReadiness) : <span className="muted">–</span>}</td>
                    <td className="num">{e.assessed ? (e.criticalGaps.length ? <span className="tag tag-bad" title={e.criticalGaps.join(', ')}>{e.criticalGaps.length}</span> : <span className="muted">0</span>) : <span className="muted">–</span>}</td>
                    <td className="num nowrap">{e.training.started ? <>{pctTxt(e.training.rate)} <span className="muted">· {e.training.done}/{e.training.started}</span></> : <span className="muted">–</span>}</td>
                    <td className="next-cell">
                      <div className="next-top"><span className={`next-role ${e.nextRole ? '' : 'muted'}`} title={e.nextRole ?? ''}>{e.nextRole ? `→ ${e.nextRole}` : e.assessed ? 'Top of ladder' : 'Assess first'}</span><span className="next-pct">{pctTxt(e.nextReadiness)}</span></div>
                      <Pline value={e.nextReadiness} tone={readinessTone(e.nextReadiness)} />
                    </td>
                    <td><BandTag id={e.band} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > limit && <div className="more-row"><button className="btn btn-secondary" onClick={() => setLimit(limit + 50)}>Show {Math.min(50, rows.length - limit)} more</button></div>}
          <p className="note" style={{ textAlign: 'center' }}>Showing {Math.min(rows.length, limit)} of {rows.length} {rows.length !== data.people.length ? `matching people (${data.people.length} in scope)` : 'people'}.</p>
        </div>
      </div>
    </div>
  )
}
