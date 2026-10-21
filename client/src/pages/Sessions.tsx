import { useNavigate } from 'react-router-dom'
import { EntityList } from '../components/entity'

export default function Sessions() {
  const nav = useNavigate()
  return (
    <div className="page">
      <section className="hero compact container">
        <div className="eyebrow">Sessions</div>
        <h1>Record a whole class at once.</h1>
        <p className="sub">A session is one run of a course. Open it to add participants, mark attendance and completion for everyone, and, for observed courses, score the behaviours day by day.</p>
      </section>
      <div className="container">
        <EntityList entityKey="sessions" addLabel="New session" filterFields={['courseId', 'status']} onRowClick={(r) => nav(`/sessions/${r.id}`)} />
      </div>
    </div>
  )
}
