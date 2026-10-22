// Generic form, table and list for any table described in shared/entities.ts.
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ENTITY, type Entity, type Field } from '@shared/entities'
import { api, useApi, useMeta, useOptions, toast, fmtDate, ago } from '../api'
import { Combobox, Drawer, Icon, Modal, MultiCombobox, Status } from './ui'

// ------------------------------------------------------------------ field inputs
const STATUS_LISTS = new Set(['programStatus', 'employeeStatus', 'enrollmentStatus', 'assessmentStatus', 'reportStatus', 'validationStatus', 'idpStatus',
  'sessionStatus', 'trainingStatus', 'attendance', 'certStatus', 'examResult', 'coachingStatus', 'verificationStatus', 'potentialNote'])

function LookupSelect({ list, value, onChange, required, small }: { list: string; value: any; onChange: (v: any) => void; required?: boolean; small?: boolean }) {
  const meta = useMeta()
  const vals = (meta.lists[list] ?? []).filter((v) => v.active || v.value === value)
  return (
    <select className={`select ${small ? 'sm' : ''}`} value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
      {(!required || !value) && <option value="">{required ? 'Choose…' : '—'}</option>}
      {vals.map((v) => <option key={v.value} value={v.value} title={v.description ?? undefined}>{v.value}</option>)}
      {value && !vals.some((v) => v.value === value) && <option value={value}>{value} (not in list)</option>}
    </select>
  )
}

function MultiLookup({ list, value, onChange }: { list: string; value: string | null; onChange: (v: string | null) => void }) {
  const meta = useMeta()
  const set = new Set((value ?? '').split(/\s*;\s*/).filter(Boolean))
  return (
    <div className="chips">
      {(meta.lists[list] ?? []).filter((v) => v.active || set.has(v.value)).map((v) => (
        <button type="button" key={v.value} className={`chip-btn ${set.has(v.value) ? 'active' : ''}`}
          onClick={() => { set.has(v.value) ? set.delete(v.value) : set.add(v.value); onChange([...set].join('; ') || null) }}>{v.value}</button>
      ))}
    </div>
  )
}

/** Free text with the list's values offered as suggestions (org units, grades: names differ per client). */
function SuggestInput({ list, value, onChange, small }: { list: string; value: any; onChange: (v: any) => void; small?: boolean }) {
  const meta = useMeta()
  const id = `dl-${list}`
  return (
    <>
      <input className={`input ${small ? 'sm' : ''}`} list={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder="Type or pick…" />
      <datalist id={id}>{(meta.lists[list] ?? []).filter((v) => v.active).map((v) => <option key={v.value} value={v.value}>{v.description ?? undefined}</option>)}</datalist>
    </>
  )
}

function RefInput({ field, value, onChange, form, small }: { field: Field; value: any; onChange: (v: any) => void; form: Record<string, any>; small?: boolean }) {
  const filter = Object.fromEntries(Object.entries(field.dependsOn ?? {}).map(([optField, formField]) => [optField, form[formField]]))
  const opts = useOptions(field.ref, filter)
  return <Combobox options={opts} value={value ?? null} onChange={onChange} placeholder={`Search ${ENTITY[field.ref!].plural.toLowerCase()}…`} small={small} />
}

export function FieldInput({ field, value, onChange, form = {}, small }: { field: Field; value: any; onChange: (v: any) => void; form?: Record<string, any>; small?: boolean }) {
  const cls = `input ${small ? 'sm' : ''}`
  switch (field.type) {
    case 'longtext': return <textarea className="textarea" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    case 'bool': return <label className="check"><input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />{field.label}</label>
    case 'date': return <input className={cls} type="date" value={fmtDate(value)} onChange={(e) => onChange(e.target.value || null)} />
    case 'int': case 'level': case 'number': case 'percent':
      return <input className={cls} type="number" inputMode="decimal" step={field.type === 'number' ? 'any' : 1}
        min={field.type === 'percent' || field.type === 'level' ? 0 : field.min} max={field.type === 'percent' ? 100 : field.type === 'level' ? 5 : field.max}
        value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)} />
    case 'lookup': return <LookupSelect list={field.list!} value={value} onChange={onChange} required={field.required} small={small} />
    case 'multilookup': return <MultiLookup list={field.list!} value={value} onChange={onChange} />
    case 'suggest': return <SuggestInput list={field.list!} value={value} onChange={onChange} small={small} />
    case 'ref': return <RefInput field={field} value={value} onChange={onChange} form={form} small={small} />
    case 'email': return <input className={cls} type="email" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    case 'url': return <input className={cls} type="url" placeholder="https://" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    default: return <input className={cls} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
  }
}

// ------------------------------------------------------------------ form drawer
export function EntityForm({ entity, id, defaults = {}, lock = [], onClose, onSaved, title }: {
  entity: Entity; id?: string | null; defaults?: Record<string, any>; lock?: string[]; onClose: () => void; onSaved?: (row: any) => void; title?: string
}) {
  const [form, setForm] = useState<Record<string, any> | null>(id ? null : null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [original, setOriginal] = useState<any>(null)

  useEffect(() => {
    if (id) {
      api(`/${entity.key}/${id}`).then((r) => { setOriginal(r); setForm(r) }, (e) => setError(e.message))
    } else {
      const init: Record<string, any> = {}
      for (const f of entity.fields) if (f.default !== undefined) init[f.name] = f.default
      for (const j of entity.joins ?? []) init[j.name] = []
      setForm({ ...init, ...defaults })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity.key, id])

  const set = (k: string, v: any) => setForm((f) => ({ ...f!, [k]: v }))
  const visible = entity.fields.filter((f) => !f.hideInForm && !lock.includes(f.name) && !(id && f.createOnly))

  async function save() {
    if (!form) return
    setSaving(true); setError(null)
    try {
      const body: Record<string, any> = {}
      for (const f of entity.fields) if (f.name in form) body[f.name] = form[f.name]
      for (const j of entity.joins ?? []) body[j.name] = form[j.name] ?? []
      if (id) body._updatedAt = original?.updatedAt
      const row = id ? await api(`/${entity.key}/${id}`, { method: 'PUT', body }) : await api(`/${entity.key}`, { method: 'POST', body })
      toast(id ? `${entity.label} saved` : `${entity.label} added (${row.id})`)
      onSaved?.(row)
      onClose()
    } catch (e: any) { setError(e.message) } finally { setSaving(false) }
  }
  async function remove() {
    try { await api(`/${entity.key}/${id}`, { method: 'DELETE' }); toast(`${entity.label} deleted`); onClose() } catch (e: any) { setError(e.message); setConfirmDelete(false) }
  }

  return (
    <Drawer
      title={title ?? (id ? `Edit ${entity.label.toLowerCase()}` : `Add ${entity.label.toLowerCase()}`)}
      sub={id ? <span className="mono">{id}</span> : entity.description}
      onClose={onClose}
      foot={<>
        <button className="btn btn-primary" onClick={save} disabled={saving || !form}>{saving ? 'Saving…' : id ? 'Save changes' : 'Add'}</button>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <span className="spacer" />
        {id && <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>Delete</button>}
      </>}
    >
      {error && <div className="form-error">{error}</div>}
      {!form ? <div className="loading">Loading…</div> : (
        <div className="form-grid" onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save() }}>
          {visible.map((f) => (
            <div key={f.name} className={`field ${f.type === 'longtext' || f.type === 'multilookup' || f.name === 'source' ? 'full' : ''} ${f.type === 'bool' ? 'is-bool' : ''}`}>
              {f.type !== 'bool' && <label>{f.label}{f.required && <span className="req">*</span>}</label>}
              <FieldInput field={f} value={form[f.name]} onChange={(v) => set(f.name, v)} form={form} />
              {f.help && <div className="help">{f.help}</div>}
            </div>
          ))}
          {(entity.joins ?? []).map((j) => (
            <div key={j.name} className="field full">
              <label>{j.label}</label>
              <JoinInput refKey={j.ref} value={form[j.name] ?? []} onChange={(v) => set(j.name, v)} />
            </div>
          ))}
          {id && original && entity.audit && (
            <div className="full note">Added {original.createdBy ? `by ${original.createdBy} ` : ''}on {fmtDate(original.createdAt)}
              {original.updatedAt !== original.createdAt && <> · last changed {original.updatedBy ? `by ${original.updatedBy} ` : ''}{ago(original.updatedAt)}</>}
            </div>
          )}
        </div>
      )}
      {confirmDelete && (
        <Modal title={`Delete this ${entity.label.toLowerCase()}?`} text="This cannot be undone. Records that belong to it (for example the ratings of an assessment) are deleted too. The deletion is kept in the change log."
          onClose={() => setConfirmDelete(false)}
          actions={<><button className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>Keep it</button><button className="btn btn-danger" onClick={remove}>Delete</button></>} />
      )}
    </Drawer>
  )
}

function JoinInput({ refKey, value, onChange }: { refKey: string; value: string[]; onChange: (v: string[]) => void }) {
  const opts = useOptions(refKey)
  return <MultiCombobox options={opts} value={value} onChange={onChange} />
}

// ------------------------------------------------------------------ table
export function cellValue(f: Field, row: any): ReactNode {
  const v = row[f.name]
  if (v == null || v === '') return <span className="muted">–</span>
  switch (f.type) {
    case 'ref': return row._ref?.[f.name] ?? v
    case 'date': return <span className="nowrap">{fmtDate(v)}</span>
    case 'bool': return v ? 'Yes' : 'No'
    case 'percent': return `${v}%`
    case 'lookup': return STATUS_LISTS.has(f.list!) ? <Status v={v} /> : v
    case 'longtext': return <span className="clip" title={v}>{v}</span>
    case 'url': return <a href={v} target="_blank" rel="noreferrer" className="accent-text">Open</a>
    default: return <span className="clip" title={String(v)}>{String(v)}</span>
  }
}

type Col = { key: string; label: string; render: (row: any) => ReactNode; sort: (row: any) => any; num?: boolean }

export function EntityTable({ entity, rows, onOpen, hide = [], extraCols = [], rowActions, showId = true, dense }: {
  entity: Entity; rows: any[]; onOpen?: (row: any) => void; hide?: string[]; extraCols?: Col[]; rowActions?: (row: any) => ReactNode; showId?: boolean; dense?: boolean
}) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null)
  const cols: Col[] = useMemo(() => [
    ...(showId ? [{ key: 'id', label: 'ID', render: (r: any) => <span className="id-cell">{r.id}</span>, sort: (r: any) => r.id }] : []),
    ...entity.fields.filter((f) => !f.hideInTable && !hide.includes(f.name)).map((f) => ({
      key: f.name, label: f.label, render: (r: any) => cellValue(f, r),
      sort: (r: any) => (f.type === 'ref' ? r._ref?.[f.name] ?? '' : r[f.name] ?? ''), num: ['int', 'number', 'percent', 'level'].includes(f.type),
    })),
    ...extraCols,
  ], [entity, hide.join(), extraCols, showId])
  const sorted = useMemo(() => {
    if (!sort) return rows
    const c = cols.find((x) => x.key === sort.key)
    if (!c) return rows
    return [...rows].sort((a, b) => { const x = c.sort(a), y = c.sort(b); return (x < y ? -1 : x > y ? 1 : 0) * sort.dir })
  }, [rows, sort, cols])
  if (!rows.length) return null
  return (
    <div className="table-wrap">
      <table className={`table ${dense ? 'dense' : ''}`}>
        <thead><tr>
          {cols.map((c) => (
            <th key={c.key} className={`sortable ${c.num ? 'num' : ''}`} onClick={() => setSort((s) => (s?.key === c.key ? { key: c.key, dir: (s.dir * -1) as 1 | -1 } : { key: c.key, dir: 1 }))}>
              {c.label}{sort?.key === c.key && <span className="sort-ind">{sort.dir === 1 ? '▲' : '▼'}</span>}
            </th>
          ))}
          <th />
        </tr></thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.id} className={onOpen ? 'clickable' : ''} onClick={() => onOpen?.(r)}>
              {cols.map((c) => <td key={c.key} className={c.num ? 'num' : ''}>{c.render(r)}</td>)}
              <td className="actions" onClick={(e) => e.stopPropagation()}>
                {rowActions?.(r)}
                {onOpen && <button className="btn btn-ghost btn-sm row-btn" onClick={() => onOpen(r)} aria-label="Edit"><Icon.edit /></button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ------------------------------------------------------------------ list = fetch + search + table + add
export function EntityList({ entityKey, filter = {}, lock, hide, title, description, addLabel, toolbar, rowActions, onRowClick, extraCols, emptyText, filterFields = [] }: {
  entityKey: string; filter?: Record<string, string>; lock?: string[]; hide?: string[]; title?: ReactNode; description?: ReactNode; addLabel?: string
  toolbar?: ReactNode; rowActions?: (row: any) => ReactNode; onRowClick?: (row: any) => void; extraCols?: Col[]; emptyText?: string; filterFields?: string[]
}) {
  const e = ENTITY[entityKey]
  const [extra, setExtra] = useState<Record<string, string>>({})
  const all = { ...filter, ...Object.fromEntries(Object.entries(extra).filter(([, v]) => v)) }
  const qs = new URLSearchParams(all).toString()
  const { data, error, loading } = useApi<any[]>(`/${entityKey}${qs ? `?${qs}` : ''}`)
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<string | null | undefined>(undefined)
  const locked = lock ?? Object.keys(filter)
  const rows = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean)
    if (!words.length) return data ?? []
    return (data ?? []).filter((r) => {
      const hay = `${r.id} ${Object.values(r).filter((v) => typeof v === 'string').join(' ')} ${Object.values(r._ref ?? {}).join(' ')}`.toLowerCase()
      return words.every((w) => hay.includes(w))
    })
  }, [data, q])
  return (
    <div>
      {(title || description) && <div className="section-head" style={{ marginBottom: 12 }}><div>{title && <h2 style={{ fontSize: 20 }}>{title}</h2>}{description && <p>{description}</p>}</div></div>}
      <div className="table-tools">
        <div className="toolbar">
          <div className="search-wrap"><Icon.search /><input className="search" placeholder={`Search ${e.plural.toLowerCase()}…`} value={q} onChange={(ev) => setQ(ev.target.value)} /></div>
          {filterFields.map((name) => <FilterField key={name} field={e.fields.find((f) => f.name === name)!} value={extra[name] ?? ''} onChange={(v) => setExtra((x) => ({ ...x, [name]: v ?? '' }))} />)}
          <span className="muted" style={{ fontSize: 13 }}>{data ? `${rows.length}${rows.length !== data.length ? ` of ${data.length}` : ''} ${rows.length === 1 ? e.label.toLowerCase() : e.plural.toLowerCase()}` : ''}</span>
        </div>
        <div className="toolbar">
          {toolbar}
          <button className="btn btn-primary btn-sm" onClick={() => setEditing(null)}><Icon.plus />{addLabel ?? `Add ${e.label.toLowerCase()}`}</button>
        </div>
      </div>
      {error && <div className="alert">{error}</div>}
      {loading && !data ? <div className="loading">Loading…</div>
        : rows.length ? <EntityTable entity={e} rows={rows} hide={[...(hide ?? []), ...locked]} onOpen={onRowClick ?? ((r) => setEditing(r.id))} rowActions={rowActions} extraCols={extraCols} />
          : <div className="card subtle empty-state"><h3>{q ? 'Nothing matches the search' : `No ${e.plural.toLowerCase()} yet`}</h3>{!q && (emptyText ?? e.description)}</div>}
      {editing !== undefined && <EntityForm entity={e} id={editing} defaults={{ ...filter, ...extra }} lock={locked} onClose={() => setEditing(undefined)} />}
    </div>
  )
}

function FilterField({ field, value, onChange }: { field: Field; value: string; onChange: (v: string | null) => void }) {
  const opts = useOptions(field.type === 'ref' ? field.ref : undefined)
  const meta = useMeta()
  if (field.type === 'lookup') {
    return (
      <select className="select sm" style={{ width: 'auto', minWidth: 150 }} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All {field.label.toLowerCase()}</option>
        {(meta.lists[field.list!] ?? []).map((v) => <option key={v.value}>{v.value}</option>)}
      </select>
    )
  }
  return <div style={{ width: 260 }}><Combobox small options={opts} value={value || null} onChange={onChange} placeholder={`All ${ENTITY[field.ref!].plural.toLowerCase()}`} /></div>
}
