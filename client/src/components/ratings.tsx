// The ratings grid of one assessment: one row per competency, click a level.
import { useEffect, useMemo, useState } from 'react'
import { api, toast, useApi, useMeta } from '../api'
import { Drawer } from './ui'

type Row = {
  competencyId: string; code: string; name: string; category: string; framework: string; minLevel: number; maxLevel: number
  behaviors: { level: number; description: string }[]; level: number | null; requiredLevel: number | null; priority: string | null; comment: string | null; inRole: boolean
}

export function LevelButtons({ min, max, value, required, onChange, small }: { min: number; max: number; value: number | null; required: number | null; onChange: (v: number | null) => void; small?: boolean }) {
  const levels = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  return (
    <div className={`lvl-group ${small ? 'small' : ''}`} role="radiogroup">
      {levels.map((l) => {
        const on = value === l
        const gap = required != null && on ? required - l : 0
        return (
          <button type="button" key={l} role="radio" aria-checked={on} title={required === l ? 'Required level' : undefined}
            className={`${on ? 'on' : ''} ${required === l ? 'req' : ''} ${gap === 1 ? 'below' : gap >= 2 ? 'far' : ''}`}
            onClick={() => onChange(on ? null : l)}>{l}</button>
        )
      })}
    </div>
  )
}

export function RatingsGrid({ assessmentId, onClose }: { assessmentId: string; onClose: () => void }) {
  const meta = useMeta()
  const { data, error } = useApi<{ assessment: any; roleName: string | null; rows: Row[] }>(`/assessments/${assessmentId}/ratings`)
  const [rows, setRows] = useState<Row[]>([])
  const [dirty, setDirty] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [onlyGaps, setOnlyGaps] = useState(false)
  useEffect(() => { if (data && !dirty.size) setRows(data.rows) }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (id: string, patch: Partial<Row>) => {
    setRows((rs) => rs.map((r) => (r.competencyId === id ? { ...r, ...patch } : r)))
    setDirty((d) => new Set(d).add(id))
  }
  const grouped = useMemo(() => {
    const g = new Map<string, Row[]>()
    for (const r of rows) {
      if (onlyGaps && !(r.level != null && r.requiredLevel != null && r.level < r.requiredLevel)) continue
      const k = `${r.framework} · ${r.category}`
      ;(g.get(k) ?? g.set(k, []).get(k)!).push(r)
    }
    return [...g.entries()]
  }, [rows, onlyGaps])
  const rated = rows.filter((r) => r.level != null).length
  const gaps = rows.filter((r) => r.level != null && r.requiredLevel != null && r.level < r.requiredLevel).length

  async function save() {
    setSaving(true); setErr(null)
    try {
      const body = rows.filter((r) => dirty.has(r.competencyId)).map((r) => ({ competencyId: r.competencyId, level: r.level, requiredLevel: r.requiredLevel, priority: r.priority, comment: r.comment }))
      const res = await api(`/assessments/${assessmentId}/ratings`, { method: 'PUT', body: { rows: body } })
      toast(`Saved ${res.changed} rating${res.changed === 1 ? '' : 's'}`)
      setDirty(new Set())
    } catch (e: any) { setErr(e.message) } finally { setSaving(false) }
  }
  const close = () => { if (dirty.size && !confirm(`You have ${dirty.size} unsaved change(s). Close without saving?`)) return; onClose() }

  const a = data?.assessment
  return (
    <Drawer wide onClose={close}
      title={a ? `${a.type} · ${a._ref.employeeId}` : 'Assessment'}
      sub={a ? <>{a.date?.slice(0, 10) ?? 'No date'} · {data?.roleName ? `required levels from ${data.roleName}` : 'no role profile: type the required levels'} · <span className="mono">{a.id}</span></> : null}
      foot={<>
        <button className="btn btn-primary" onClick={save} disabled={saving || !dirty.size}>{saving ? 'Saving…' : dirty.size ? `Save ${dirty.size} change${dirty.size === 1 ? '' : 's'}` : 'Saved'}</button>
        <button className="btn btn-secondary" onClick={close}>Close</button>
        <span className="spacer" />
        <span className="muted" style={{ fontSize: 13 }}>{rated} of {rows.length} rated · {gaps} below required</span>
      </>}>
      {(error || err) && <div className="form-error">{error || err}</div>}
      {!data ? <div className="loading">Loading…</div> : !rows.length ? (
        <div className="notice">This person has no role profile, so there are no competencies to rate yet. Set "Assessed against role" on the assessment (or the person's role profile) and open the ratings again.</div>
      ) : (
        <>
          <div className="toolbar" style={{ marginBottom: 12 }}>
            <label className="check"><input type="checkbox" checked={onlyGaps} onChange={(e) => setOnlyGaps(e.target.checked)} />Only show gaps</label>
            <span className="spacer" />
            <span className="muted" style={{ fontSize: 12.5 }}>Click a level to set it, click again to clear. The underlined level is the required one.</span>
          </div>
          <div className="table-wrap">
            <table className="table dense">
              <thead><tr><th>Competency</th><th>Level</th><th className="num">Required</th><th>Priority</th><th className="num">Gap</th><th>Comment</th></tr></thead>
              <tbody>
                {grouped.map(([group, rs]) => [
                  <tr key={group} className="cat-row"><td colSpan={6}>{group}</td></tr>,
                  ...rs.map((r) => {
                    const gap = r.level != null && r.requiredLevel != null ? r.requiredLevel - r.level : null
                    const ind = r.behaviors.find((b) => b.level === (r.level ?? r.requiredLevel))
                    return (
                      <tr key={r.competencyId}>
                        <td style={{ minWidth: 260 }}>
                          <div style={{ fontWeight: 500 }}>{dirty.has(r.competencyId) && <span className="dirty-dot" />}{r.name} <span className="muted mono">{r.code}</span>{!r.inRole && <span className="tag tag-muted" style={{ marginLeft: 6 }}>not in role</span>}</div>
                          {ind && <div className="ind"><b>L{ind.level}:</b> {ind.description}</div>}
                        </td>
                        <td><LevelButtons min={r.minLevel} max={r.maxLevel} value={r.level} required={r.requiredLevel} onChange={(v) => set(r.competencyId, { level: v })} /></td>
                        <td className="num"><input className="input sm" style={{ width: 56 }} type="number" min={0} max={5} value={r.requiredLevel ?? ''} onChange={(e) => set(r.competencyId, { requiredLevel: e.target.value === '' ? null : Number(e.target.value) })} /></td>
                        <td>
                          <select className="select sm" style={{ width: 100 }} value={r.priority ?? ''} onChange={(e) => set(r.competencyId, { priority: e.target.value || null })}>
                            <option value="">—</option>{(meta.lists.priority ?? []).map((p) => <option key={p.value}>{p.value}</option>)}
                          </select>
                        </td>
                        <td className="num">{gap == null ? <span className="muted">–</span> : gap > 0 ? <span className="tag tag-bad">−{gap}</span> : gap < 0 ? <span className="tag tag-lime">+{-gap}</span> : <span className="muted">0</span>}</td>
                        <td><input className="input sm" style={{ minWidth: 160 }} value={r.comment ?? ''} onChange={(e) => set(r.competencyId, { comment: e.target.value })} /></td>
                      </tr>
                    )
                  }),
                ])}
              </tbody>
            </table>
          </div>
          <p className="note">Gap = required − level. Required levels are copied from the role profile when you first open the grid; change them here only when this person's target differs from the role.</p>
        </>
      )}
    </Drawer>
  )
}
