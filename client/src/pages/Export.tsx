import { useState } from 'react'
import { getUser, useOptions } from '../api'
import { Combobox, Icon } from '../components/ui'

const SHEETS: [string, string, boolean?][] = [
  ['README', 'What is in the file, row counts, ID prefixes.', true],
  ['Employee_Summary', 'One row per person, every calculated value: readiness, gaps, plan progress, training, labs, IDP segments, certifications, coaching, baseline, observation summary and risk counts. The manager view.', true],
  ['Risk_Flags', 'Every risk and opportunity rule that fires, per person and per group (team, section, skill), with action and owner.', true],
  ['Roadmap', 'Each person\'s journey, stage by stage: status, progress, what is done and what is still open.', true],
  ['Observation_Profile', 'Each person\'s average per observed behaviour, with finding and action cue.', true],
  ['Activity_Log', 'Every interaction in one sheet, one row per data point: baseline surveys, ratings, validations, plan actions, training, each observation score, certifications, coaching, evidence.', true],
  ['Data_Dictionary', 'Every sheet and column: meaning, type, required, which list it uses and which sheet it links to.', true],
  ['Employee · Enrollment · BaselineSurvey · Assessment · AssessmentRating · ManagerValidation · IdpAction', 'Activity tables. One sheet per table, columns = database columns.'],
  ['CourseSession · TrainingRecord · ObservationDay · ObservationScore', 'Training and observations.'],
  ['CertificationRecord · CoachingSession · Evidence', 'Certifications, coaching and evidence.'],
  ['Client · Program · Staff · Framework · CompetencyCategory · Competency · CompetencyBehavior', 'Reference tables.'],
  ['JobRole · RoleRequirement · Course · CourseCompetency · Certification · CertificationCompetency · ObservationParameter · RiskRule · LookupValue', 'Role profiles, catalogues, risk rules, link tables and every dropdown list.'],
  ['ChangeLog', 'Who changed what and when (optional).'],
]

export default function ExportPage() {
  const clients = useOptions('clients')
  const people = useOptions('employees')
  const [scope, setScope] = useState<'all' | 'client' | 'person'>('all')
  const [clientId, setClientId] = useState<string | null>(null)
  const [employeeId, setEmployeeId] = useState<string | null>(null)
  const [log, setLog] = useState(true)
  const qs = new URLSearchParams({ user: getUser(), includeLog: log ? '1' : '0' })
  if (scope === 'client' && clientId) qs.set('clientId', clientId)
  if (scope === 'person' && employeeId) qs.set('employeeId', employeeId)
  const ready = scope === 'all' || (scope === 'client' && clientId) || (scope === 'person' && employeeId)
  return (
    <div className="page">
      <section className="hero compact container">
        <div className="eyebrow">Export</div>
        <h1>One Excel file, ready to become a database.</h1>
        <p className="sub">The workbook has a readable summary for people and one sheet per table with stable IDs for importing. Nothing is lost: every record and every link between records is in the file.</p>
      </section>
      <div className="container">
        <div className="grid g-2-1">
          <div className="card">
            <h3>What to export</h3>
            <div className="chips mt16">
              <button className={`chip-btn ${scope === 'all' ? 'active' : ''}`} onClick={() => setScope('all')}>Everything</button>
              <button className={`chip-btn ${scope === 'client' ? 'active' : ''}`} onClick={() => setScope('client')}>One client</button>
              <button className={`chip-btn ${scope === 'person' ? 'active' : ''}`} onClick={() => setScope('person')}>One person</button>
            </div>
            {scope === 'client' && <div className="field mt16"><label>Client</label><Combobox options={clients} value={clientId} onChange={setClientId} placeholder="Choose a client…" /><div className="help">Only this client's people and their records. Use this for the file you send to the client.</div></div>}
            {scope === 'person' && <div className="field mt16"><label>Person</label><Combobox options={people} value={employeeId} onChange={setEmployeeId} placeholder="Search people…" /></div>}
            <label className="check mt16"><input type="checkbox" checked={log} onChange={(e) => setLog(e.target.checked)} />Include the change log (who changed what)</label>
            <div className="help" style={{ fontSize: 12, color: 'var(--muted)' }}>Untick for files that leave the company: the log shows internal names and edits.</div>
            <div className="mt24">
              <a className={`btn btn-accent ${ready ? '' : 'disabled'}`} href={ready ? `/api/export?${qs}` : undefined} aria-disabled={!ready} onClick={(e) => { if (!ready) e.preventDefault() }}><Icon.download />Download .xlsx</a>
            </div>
          </div>
          <div className="card subtle">
            <h3>Building the database later</h3>
            <p className="card-sub" style={{ marginTop: 8, lineHeight: 1.55 }}>
              Each table sheet is one database table. The first column is the primary key (e.g. <span className="mono">EMP-0001</span>), and every column ending in <span className="mono">Id</span> is a foreign key to the sheet named in its header note and in Data_Dictionary.
              Many-to-many links have their own sheets (<span className="mono">CourseCompetency</span>, <span className="mono">CertificationCompetency</span>). Calculated values are only in Employee_Summary, Risk_Flags, Observation_Profile, Roadmap and Activity_Log, never in the table sheets, so importing never duplicates data.
            </p>
          </div>
        </div>
        <div className="section">
          <div className="section-head"><div><h2>What's in the file</h2><p>Highlighted sheets are for reading; the rest are the tables.</p></div></div>
          <div className="sheet-list">
            {SHEETS.map(([name, desc, key]) => <div key={name} className={`sheet ${key ? 'key' : ''}`}><b>{name}</b><span>{desc}</span></div>)}
          </div>
        </div>
      </div>
    </div>
  )
}
