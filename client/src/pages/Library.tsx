import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ENTITY } from '@shared/entities'
import { useMeta } from '../api'
import { EntityList } from '../components/entity'

const GROUPS: { label: string; keys: string[] }[] = [
  { label: 'Organisation', keys: ['clients', 'programs', 'staff'] },
  { label: 'Competency framework', keys: ['competencies', 'behaviors', 'categories', 'frameworks', 'parameters'] },
  { label: 'Job roles', keys: ['roles', 'requirements'] },
  { label: 'Catalogue', keys: ['courses', 'certifications'] },
  { label: 'Dropdowns', keys: ['lookups'] },
]
const FILTERS: Record<string, string[]> = {
  behaviors: ['competencyId'], requirements: ['jobRoleId', 'priority'], competencies: ['categoryId'], courses: ['type'],
  certifications: ['track'], parameters: ['category'], programs: ['clientId'], roles: ['family'], categories: ['frameworkId'],
}

export default function Library() {
  const { key = 'competencies' } = useParams()
  const nav = useNavigate()
  const e = ENTITY[key] ?? ENTITY.competencies
  const meta = useMeta()
  return (
    <div className="page">
      <section className="hero compact container">
        <div className="eyebrow">Library</div>
        <h1>The reference data everything links to.</h1>
        <p className="sub">Competencies, level indicators, role profiles, courses, certifications, observed behaviours and every dropdown. Set up once and change rarely; everyone's forms use them.</p>
      </section>
      <div className="container lib-layout">
        <nav className="lib-nav">
          {GROUPS.map((g) => (
            <div key={g.label} style={{ display: 'contents' }}>
              <div className="grp">{g.label}</div>
              {g.keys.map((k) => <button key={k} className={k === e.key ? 'active' : ''} onClick={() => nav(`/library/${k}`)}>{ENTITY[k].plural}{meta.counts[k] != null && <span className="muted">{meta.counts[k]}</span>}</button>)}
            </div>
          ))}
        </nav>
        <div style={{ minWidth: 0 }}>
          <div className="warn-banner" style={{ marginBottom: 16 }}>Reference data: changes apply everywhere straight away. To retire something, set Active to No instead of deleting it, so older records keep their meaning.</div>
          {e.key === 'lookups' ? <Lists /> : <EntityList key={e.key} entityKey={e.key} title={e.plural} description={e.description} filterFields={FILTERS[e.key] ?? []} />}
        </div>
      </div>
    </div>
  )
}

function Lists() {
  const meta = useMeta()
  const keys = Object.keys(meta.listInfo)
  const [list, setList] = useState(keys[0])
  const info = meta.listInfo[list]
  return (
    <div>
      <div className="section-head" style={{ marginBottom: 12 }}><div><h2 style={{ fontSize: 20 }}>Dropdown lists</h2><p>Pick a list to see and edit its values. New values appear in the forms immediately.</p></div></div>
      <div className="chips" style={{ marginBottom: 16 }}>
        {keys.map((k) => <button key={k} className={`chip-btn ${k === list ? 'active' : ''}`} onClick={() => setList(k)}>{meta.listInfo[k].label}<span className="count">{meta.lists[k]?.length ?? 0}</span></button>)}
      </div>
      {info?.description && <p className="note" style={{ marginTop: 0, marginBottom: 12 }}>{info.description}</p>}
      <EntityList key={list} entityKey="lookups" filter={{ list }} addLabel="Add value" />
    </div>
  )
}
