// Value & ROI for executives: what was invested, what came back (realised and projected), the value delivered
// that is not cash, and every KPI from the catalogue that today's data can measure. GET /api/value.
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ENTITY } from '@shared/entities'
import { useApi } from '../api'
import { Icon, Kpi } from '../components/ui'
import { EntityForm } from '../components/entity'
import { nf } from '../components/charts'
import { ClientChips } from './Dashboard'

const BASIS_TONE: Record<string, string> = { Fact: 'tag-good', Estimate: '', Assumption: 'tag-warn', 'Client data': 'tag-dark', Calculated: 'tag-good', 'Calculated + assumptions': '', Assumptions: 'tag-warn' }
const AUDIENCE_ORDER = ['Board/CEO', 'CFO', 'CISO', 'CHRO', 'L&D', 'Compliance', 'Line manager', 'Coach/consultant (internal)', 'Programme/account', 'Assessment quality', 'Individual', 'Predictive']

export default function Value() {
  const [params, setParams] = useSearchParams()
  const client = params.get('clientId') ?? ''
  const { data, error } = useApi<any>(`/value${client ? `?clientId=${client}` : ''}`)
  const [view, setView] = useState<'realised' | 'projected'>('realised')
  const [aud, setAud] = useState('Board/CEO')
  const [edit, setEdit] = useState<string | null>(null)

  const money = useMemo(() => {
    const rate = data?.currency.rate ?? 1, code = data?.currency.code ?? 'USD'
    const sym = code === 'USD' ? '$' : `${code} `
    return (v: number | null | undefined, signed = false) => {
      if (v == null) return '–'
      const x = v * rate, abs = Math.abs(x)
      const s = abs >= 1e6 ? `${(abs / 1e6).toFixed(2)}M` : abs >= 1e4 ? `${Math.round(abs / 1e3)}k` : Math.round(abs).toLocaleString('en-US')
      return `${x < 0 ? '−' : signed ? '+' : ''}${sym}${s}`
    }
  }, [data])

  if (error && !data) return <div className="container page"><div className="alert">{error}</div></div>
  if (!data) return <div className="loading">Loading…</div>
  const T = data[view]
  const audiences = AUDIENCE_ORDER.filter((a) => data.kpis.some((k: any) => k.audience === a))
  const kpis = data.kpis.filter((k: any) => k.audience === aud)
  const be = data.breakEven, dl = data.delivered

  return (
    <div className="page">
      <section className="hero container">
        <div className="eyebrow">Value &amp; ROI</div>
        <h1>What the programme delivered,<br />and what it is worth.</h1>
        <p className="sub">Investment, monetised return and every measurable KPI from the catalogue, calculated from the records in this app. Money follows the Phillips ROI method with conservative adjustments; every rate is listed with its source below and can be replaced with the client's own figures.</p>
        <div className="actions">
          <a className="btn btn-primary" href="#assumptions"><Icon.edit />Assumptions</a>
          <a className="btn btn-secondary" href="#kpis"><Icon.chart />KPI scorecard</a>
          <a className="btn btn-secondary" href={`/api/export${client ? `?clientId=${client}` : ''}`}><Icon.download />Export (Value_ROI sheet)</a>
        </div>
      </section>

      <div className="container">
        <div className="filters">
          <ClientChips clients={data.scope.clients} client={client} onPick={(id) => setParams(id ? { clientId: id } : {}, { replace: true })} />
          <div className="filter-row"><div className="filter-label">View</div><div className="chips">
            <button className={`chip-btn ${view === 'realised' ? 'active' : ''}`} onClick={() => setView('realised')}>Realised to date</button>
            <button className={`chip-btn ${view === 'projected' ? 'active' : ''}`} onClick={() => setView('projected')}>Projected (plan completed)</button>
          </div></div>
        </div>

        <div className="grid g-4 mt16">
          <Kpi label="Invested" icon={<Icon.coin />} value={money(T.cost)} sub={`${nf(data.scope.participants)} participants · ${money(T.cost / Math.max(1, data.scope.participants))} each`} />
          <Kpi label="Monetised benefit" icon={<Icon.up />} value={money(T.benefit)} sub="12 months, after attribution and confidence" />
          <Kpi label="Net value" icon={<Icon.target />} tone={T.net < 0 ? 'bad' : ''} value={money(T.net, true)} sub={`Benefit-cost ratio ${T.bcr == null ? '–' : T.bcr.toFixed(2)}`} />
          <Kpi label="Return on investment" icon={<Icon.chart />} tone={T.roi != null && T.roi < 0 ? 'bad' : ''} value={T.roi == null ? '–' : `${Math.round(T.roi * 100)}%`} sub={T.paybackMonths == null ? 'No monetised benefit yet' : `Pays back in ${T.paybackMonths < 24 ? `${Math.round(T.paybackMonths)} months` : `${(T.paybackMonths / 12).toFixed(1)} years`}`} />
        </div>

        <div className="grid g-2-1 mt16">
          <div className="card">
            <div className="card-head"><div><h3>From investment to net value</h3><div className="card-sub">{view === 'realised' ? 'Realised to date' : 'Projected when every planned action is done'} · benefits up, costs down</div></div></div>
            <Waterfall benefits={data.benefits.map((b: any) => ({ label: b.label, v: view === 'realised' ? b.amount : b.projected }))} costs={data.costs.map((c: any) => ({ label: c.label, v: view === 'realised' ? c.amount : c.projected }))} money={money} />
          </div>
          <div className="card">
            <div className="card-head"><div><h3>Break-even</h3><div className="card-sub">Readiness each person must gain for the programme to pay for itself in 12 months</div></div></div>
            <div className="kv">
              <span>Needed per person</span><b>{be.readinessPtsPerPerson == null ? '–' : `+${be.readinessPtsPerPerson.toFixed(1)} pts`}</b>
              <span>Measured so far</span><b>{be.currentPtsPerPerson == null ? '–' : `+${be.currentPtsPerPerson.toFixed(1)} pts`}</b>
              <span>When the plan is completed</span><b>{be.projectedPtsPerPerson == null ? '–' : `+${be.projectedPtsPerPerson.toFixed(1)} pts`}</b>
              <span>Room to grow (to 100% ready)</span><b>{be.headroomPtsPerPerson == null ? '–' : `${be.headroomPtsPerPerson.toFixed(1)} pts`}</b>
            </div>
            <div className="mt16"><div className="be-bar">
              <i className="be-now" style={{ width: `${Math.min(100, ((be.currentPtsPerPerson ?? 0) / Math.max(be.readinessPtsPerPerson ?? 1, be.projectedPtsPerPerson ?? 0, 1)) * 100)}%` }} />
              <i className="be-proj" style={{ width: `${Math.min(100, ((be.projectedPtsPerPerson ?? 0) / Math.max(be.readinessPtsPerPerson ?? 1, be.projectedPtsPerPerson ?? 0, 1)) * 100)}%` }} />
              <b className="be-mark" style={{ left: `${Math.min(100, ((be.readinessPtsPerPerson ?? 0) / Math.max(be.readinessPtsPerPerson ?? 1, be.projectedPtsPerPerson ?? 0, 1)) * 100)}%` }} />
            </div>
              <div className="legend inline mt8"><span className="legend-row"><span className="dot" style={{ background: 'var(--royal)' }} />Measured</span><span className="legend-row"><span className="dot" style={{ background: 'var(--band-soon)' }} />Projected</span><span className="legend-row"><span className="dot" style={{ background: 'var(--fg)', width: 3 }} />Break-even</span></div></div>
            {be.readinessPtsPerPerson != null && be.headroomPtsPerPerson != null && be.readinessPtsPerPerson > be.headroomPtsPerPerson && <p className="note"><b>More than the room left to grow</b>, so on these assumptions the programme pays back over more than one year (see "Over several years") or needs a lower cost base.</p>}
            <p className="note">Readiness points = role readiness percentage points. Measured gains come from re-assessments and from the gap closure line managers validated each month since the last assessment.</p>
          </div>
        </div>

        <div className="section">
          <div className="section-head"><div><h2>Value delivered so far</h2><p>What the investment has already produced, before any money is put on it.</p></div></div>
          <div className="grid g-4">
            <div className="stat"><div className="stat-value">{nf(dl.trainHours)} h</div><div className="stat-label">Training delivered</div></div>
            <div className="stat"><div className="stat-value">{nf(dl.coachHours)} h</div><div className="stat-label">Coaching (incl. preparation and reports)</div></div>
            <div className="stat"><div className="stat-value">{nf(dl.certsAchieved)}</div><div className="stat-label">Certifications achieved · {nf(dl.examsBooked)} exams taken or booked</div></div>
            <div className="stat"><div className="stat-value">{nf(dl.readyForNext)}</div><div className="stat-label">Ready for the next role now or in 6–12 months</div></div>
            <div className="stat"><div className="stat-value">{dl.readinessNow == null ? '–' : `${Math.round(dl.readinessNow * 100)}%`}</div><div className="stat-label">Average role readiness</div></div>
            <div className="stat"><div className="stat-value">{nf(dl.improvedPeople)}</div><div className="stat-label">People with measured gap closure · {nf(dl.validatedCompetencies)} competencies validated</div></div>
            <div className="stat"><div className="stat-value">{dl.behaviourDelta == null ? '–' : `${dl.behaviourDelta >= 0 ? '+' : ''}${dl.behaviourDelta.toFixed(2)}`}</div><div className="stat-label">Observed behaviour change, first to last day (1–5)</div></div>
            <div className="stat"><div className="stat-value">{nf(dl.labPeople)}</div><div className="stat-label">People on hands-on lab collections</div></div>
          </div>
        </div>

        <div className="section">
          <div className="section-head"><div><h2>Costs and benefits, line by line</h2><p>Quantity from the records × rate from the assumptions. Projected adds the training and exams already planned, and the gaps the plan targets.</p></div></div>
          <div className="table-wrap">
            <table className="table value-table">
              <thead><tr><th>Line</th><th className="num">Quantity</th><th className="num">Rate</th><th className="num">Realised</th><th className="num">Projected</th><th>Basis</th></tr></thead>
              <tbody>
                <tr className="group-row"><td colSpan={6}>Benefits</td></tr>
                {data.benefits.map((b: any) => (
                  <tr key={b.key}><td><b>{b.label}</b><div className="muted small">{b.formula}</div>{b.detail && <div className="muted small">{b.detail}</div>}</td>
                    <td className="num nowrap">{nf(b.quantity, 1)} <span className="muted small">{b.unit}</span></td><td className="num muted">–</td>
                    <td className="num good-text">{money(b.amount)}</td><td className="num">{money(b.projected)}</td><td><span className={`tag ${BASIS_TONE[b.basis] ?? ''}`}>{b.basis}</span></td></tr>
                ))}
                <tr className="total-row"><td>Total benefit</td><td /><td /><td className="num">{money(data.realised.benefit)}</td><td className="num">{money(data.projected.benefit)}</td><td /></tr>
                <tr className="group-row"><td colSpan={6}>Costs</td></tr>
                {data.costs.map((c: any) => (
                  <tr key={c.key}><td><b>{c.label}</b><div className="muted small">{c.formula}</div></td>
                    <td className="num nowrap">{nf(c.quantity, c.quantity % 1 ? 1 : 0)} <span className="muted small">{c.unit}</span></td><td className="num nowrap">{c.rate == null ? '–' : money(c.rate)} <span className="muted small">{c.rateUnit}</span></td>
                    <td className="num">{money(c.amount)}</td><td className="num">{money(c.projected)}</td><td><span className={`tag ${BASIS_TONE[c.basis] ?? ''}`}>{c.basis}</span></td></tr>
                ))}
                <tr className="total-row"><td>Total cost</td><td /><td /><td className="num">{money(data.realised.cost)}</td><td className="num">{money(data.projected.cost)}</td><td /></tr>
                <tr className="total-row net"><td>Net value</td><td /><td /><td className={`num ${data.realised.net < 0 ? 'bad-text' : 'good-text'}`}>{money(data.realised.net, true)}</td><td className={`num ${data.projected.net < 0 ? 'bad-text' : 'good-text'}`}>{money(data.projected.net, true)}</td><td /></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid g-2 mt24">
          <div className="card">
            <div className="card-head"><div><h3>Over several years</h3><div className="card-sub">Capability keeps paying while skills last (skills half-life about 5 years, Josh Bersin Co.). Platform and lab seats recur each year.</div></div></div>
            <table className="table"><thead><tr><th>Horizon</th><th className="num">Cost</th><th className="num">Benefit</th><th className="num">Net</th><th className="num">ROI</th></tr></thead>
              <tbody>{data.years.map((y: any) => <tr key={y.years}><td>{y.years} year{y.years > 1 ? 's' : ''}</td><td className="num">{money(y.cost)}</td><td className="num">{money(y.benefit)}</td><td className={`num ${y.net < 0 ? 'bad-text' : 'good-text'}`}>{money(y.net, true)}</td><td className="num">{y.roi == null ? '–' : `${Math.round(y.roi * 100)}%`}</td></tr>)}</tbody></table>
          </div>
          <div className="card">
            <div className="card-head"><div><h3>By department</h3><div className="card-sub">Cost shared by headcount; benefits from each department's own people</div></div></div>
            <table className="table"><thead><tr><th>Department</th><th className="num">People</th><th className="num">Readiness</th><th className="num">Net</th></tr></thead>
              <tbody>{data.departments.map((d: any) => <tr key={d.department}><td><Link to={`/teams?department=${encodeURIComponent(d.department)}${client ? `&clientId=${client}` : ''}`}>{d.department}</Link></td><td className="num">{d.people}</td><td className="num">{d.readiness == null ? '–' : `${Math.round(d.readiness * 100)}%`}<span className="muted small"> {d.readinessGain ? `+${(d.readinessGain * 100).toFixed(1)}` : ''}</span></td><td className={`num ${d.net < 0 ? 'bad-text' : 'good-text'}`}>{money(d.net, true)}</td></tr>)}</tbody></table>
          </div>
        </div>

        <div className="section" id="kpis">
          <div className="section-head"><div><h2>KPI scorecard</h2><p>{data.catalogue.measured} of the {data.catalogue.total} KPIs in the catalogue are measured from today's data. Pick an audience.</p></div></div>
          <div className="chips">{audiences.map((a) => <button key={a} className={`chip-btn ${aud === a ? 'active' : ''}`} onClick={() => setAud(a)}>{a}<span className="count">{data.kpis.filter((k: any) => k.audience === a).length}</span></button>)}</div>
          <div className="grid g-3 mt16">
            {kpis.map((k: any) => (
              <div key={k.id} className={`card kpi-card ${k.tone ?? ''}`} title={`${k.question}\nFormula: ${k.formula}\nBenchmark: ${k.benchmark}`}>
                <div className="row between"><span className="mono muted">{k.id}</span><span className="tag tag-muted">{k.leadingLagging}</span></div>
                <div className="kpi-card-name">{k.name}</div>
                <div className="kpi-card-value">{k.display}</div>
                <div className="kpi-card-unit">{k.unit}</div>
                {k.note && <div className="note" style={{ marginTop: 6 }}>{k.note}</div>}
                <div className="kpi-card-formula">{k.formula}</div>
              </div>
            ))}
          </div>
          <details className="mt24 card">
            <summary className="details-summary">Not measured yet: {data.catalogue.notMeasured.length} KPIs and the data they need</summary>
            <div className="table-wrap mt16" style={{ maxHeight: 460, overflow: 'auto' }}>
              <table className="table"><thead><tr><th>KPI</th><th>Audience</th><th>Data needed</th><th>Value</th></tr></thead>
                <tbody>{data.catalogue.notMeasured.map((k: any) => <tr key={k.id}><td><span className="mono muted">{k.id}</span> {k.name}</td><td className="muted small">{k.audience}</td><td className="small">{k.available}</td><td className="muted small">{k.commercialValue}</td></tr>)}</tbody></table>
            </div>
          </details>
        </div>

        <div className="section" id="assumptions">
          <div className="section-head"><div><h2>Assumptions and sources</h2><p>Every rate used above. <b>Fact</b> = sourced figure, <b>Estimate</b> = derived from sourced figures, <b>Assumption</b> = placeholder to replace with the client's number. Click a row to change it; the page recalculates.</p></div></div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Assumption</th><th className="num">Value</th><th>Group</th><th>Basis</th><th>Source</th></tr></thead>
              <tbody>{data.assumptions.map((a: any) => (
                <tr key={a.id} className="clickable" onClick={() => setEdit(a.id)}>
                  <td><b>{a.name}</b><div className="mono muted">{a.code}</div></td>
                  <td className="num nowrap">{a.code === 'CURRENCY' ? `${a.value} ${a.unit}` : a.unit?.startsWith('US$') ? `US$${Math.round(a.value).toLocaleString('en-US')}` : nf(a.value, a.value % 1 ? 2 : 0)} <span className="muted small">{a.code === 'CURRENCY' ? 'per US$' : a.unit?.replace(/^US\$ ?/, '')}</span></td>
                  <td className="muted">{a.group}</td><td><span className={`tag ${BASIS_TONE[a.basis] ?? ''}`}>{a.basis}</span></td><td className="small muted" style={{ maxWidth: 420 }}>{a.source}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <p className="note">Sources: the Ballon TD market research (Oct 2026), parts 1 and 6. Benchmarks older than 2023 are not used. Also editable on Library → Value assumptions.</p>
        </div>
      </div>
      {edit && <EntityForm entity={ENTITY.valueAssumptions} id={edit} onClose={() => setEdit(null)} />}
    </div>
  )
}

/** Benefits stack up from zero, costs step down, the last bar is the net value. */
function Waterfall({ benefits, costs, money }: { benefits: { label: string; v: number }[]; costs: { label: string; v: number }[]; money: (v: number, signed?: boolean) => string }) {
  const steps = [...benefits.map((b) => ({ ...b, kind: 'benefit' })), ...costs.filter((c) => c.v > 0).map((c) => ({ ...c, v: -c.v, kind: 'cost' }))]
  let run = 0
  const bars = steps.map((s) => { const from = run; run += s.v; return { ...s, from, to: run } })
  const total = bars.length ? bars[bars.length - 1].to : 0
  const lo = Math.min(0, ...bars.map((b) => Math.min(b.from, b.to))), hi = Math.max(0, ...bars.map((b) => Math.max(b.from, b.to)))
  const W = 760, H = 300, padL = 8, padR = 8, padT = 22, padB = 64
  const n = bars.length + 1, bw = (W - padL - padR) / n
  const Y = (v: number) => padT + ((hi - v) / (hi - lo || 1)) * (H - padT - padB)
  return (
    <div className="wf-scroll">
      <svg className="waterfall" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Waterfall from benefits and costs to net value">
        <line className="chart-grid" x1={padL} x2={W - padR} y1={Y(0)} y2={Y(0)} />
        {bars.map((b, i) => {
          const x = padL + i * bw + 6, y = Y(Math.max(b.from, b.to)), h = Math.max(1.5, Math.abs(Y(b.from) - Y(b.to)))
          return (
            <g key={b.label}>
              <rect className={`wf-bar ${b.kind}`} x={x} y={y} width={bw - 12} height={h} rx={2}><title>{`${b.label}: ${money(b.v, true)}`}</title></rect>
              {i < bars.length && <line className="wf-link" x1={x + bw - 12} x2={x + bw + 6} y1={Y(b.to)} y2={Y(b.to)} />}
              <text className="wf-val" x={x + (bw - 12) / 2} y={y - 6} textAnchor="middle">{money(b.v, true)}</text>
              <foreignObject x={x - 4} y={H - padB + 6} width={bw - 4} height={padB - 6}><div className="wf-label">{b.label}</div></foreignObject>
            </g>
          )
        })}
        {(() => {
          const x = padL + bars.length * bw + 6, y = Y(Math.max(0, total)), h = Math.max(1.5, Math.abs(Y(0) - Y(total)))
          return <g><rect className={`wf-bar net ${total < 0 ? 'neg' : ''}`} x={x} y={y} width={bw - 12} height={h} rx={2} /><text className="wf-val strong" x={x + (bw - 12) / 2} y={(total < 0 ? Y(0) : y) - 6} textAnchor="middle">{money(total, true)}</text>
            <foreignObject x={x - 4} y={H - padB + 6} width={bw - 4} height={padB - 6}><div className="wf-label"><b>Net value</b></div></foreignObject></g>
        })()}
      </svg>
      <div className="legend inline"><span className="legend-row"><span className="dot" style={{ background: 'var(--royal)' }} />Benefit</span><span className="legend-row"><span className="dot" style={{ background: 'var(--band-support)' }} />Cost</span><span className="legend-row"><span className="dot" style={{ background: 'var(--navy)' }} />Net</span></div>
    </div>
  )
}
