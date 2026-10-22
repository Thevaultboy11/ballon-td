import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, NavLink, Route, Routes, Link, useLocation } from 'react-router-dom'
import './styles.css'
import { MetaContext, useApi, getUser, setUser, useOptions, type Meta } from './api'
import { Icon, Modal, Toasts } from './components/ui'
import People from './pages/People'
import Person from './pages/Person'
import Sessions from './pages/Sessions'
import Session from './pages/Session'
import Library from './pages/Library'
import Risks from './pages/Risks'
import Roadmaps from './pages/Roadmaps'
import Dashboard from './pages/Dashboard'
import Teams from './pages/Teams'
import Value from './pages/Value'
import ExportPage from './pages/Export'

function ThemeToggle() {
  const [theme, setTheme] = useState(document.documentElement.dataset.theme || 'light')
  useEffect(() => { document.documentElement.dataset.theme = theme; try { localStorage.setItem('btd-theme', theme) } catch { /* ignore */ } }, [theme])
  return (
    <button className="icon-btn" type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
      {theme === 'dark' ? <Icon.sun /> : <Icon.moon />}
    </button>
  )
}

function UserModal({ onClose, first }: { onClose: () => void; first?: boolean }) {
  const [name, setName] = useState(getUser())
  const staff = useOptions('staff')
  const save = () => { if (!name.trim()) return; setUser(name.trim()); onClose(); window.dispatchEvent(new Event('btd-user')) }
  return (
    <Modal title={first ? 'Who is entering data?' : 'Change who is entering data'}
      text="There are no logins. Your name is saved in this browser and stored with everything you add or change, so the export shows who entered what."
      onClose={first ? undefined : onClose}
      actions={<>{!first && <button className="btn btn-secondary" onClick={onClose}>Cancel</button>}<button className="btn btn-primary" onClick={save} disabled={!name.trim()}>Continue</button></>}>
      <div className="field mt16">
        <label>Your name</label>
        <input className="input" autoFocus list="staff-names" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} placeholder="e.g. Amira Haddad" />
        <datalist id="staff-names">{(staff ?? []).map((s) => <option key={s.id} value={s.label} />)}</datalist>
      </div>
    </Modal>
  )
}

function Layout() {
  const [user, setU] = useState(getUser())
  const [editUser, setEditUser] = useState(false)
  const loc = useLocation()
  useEffect(() => { const f = () => setU(getUser()); window.addEventListener('btd-user', f); return () => window.removeEventListener('btd-user', f) }, [])
  useEffect(() => { window.scrollTo(0, 0) }, [loc.pathname])
  const active = (p: string) => (loc.pathname === p || (p !== '/' && loc.pathname.startsWith(p)) || (p === '/' && loc.pathname.startsWith('/people')) ? 'active' : '')
  return (
    <>
      <header className="header"><div className="container">
        <Link className="brand" to="/"><span className="brand-mark"><Icon.logo /></span><span className="brand-name">Ballon TD</span><span className="brand-sub">Development records</span></Link>
        <nav className="nav">
          <NavLink to="/dashboard" className={() => active('/dashboard')}>Dashboard</NavLink>
          <NavLink to="/teams" className={() => active('/teams')}>Teams</NavLink>
          <NavLink to="/" className={() => active('/')}>People</NavLink>
          <NavLink to="/sessions" className={() => active('/sessions')}>Sessions</NavLink>
          <NavLink to="/roadmaps" className={() => active('/roadmaps')}>Roadmaps</NavLink>
          <NavLink to="/risks" className={() => active('/risks')}>Risks</NavLink>
          <NavLink to="/value" className={() => active('/value')}>Value</NavLink>
          <NavLink to="/library" className={() => active('/library')}>Library</NavLink>
          <NavLink to="/export" className={() => active('/export')}>Export</NavLink>
        </nav>
        <div className="header-right">
          <button className="status-pill user-pill" onClick={() => setEditUser(true)} title="Change who is entering data">
            <span className="status-dot" /><span><span className="label">Entering as </span><span className="who">{user || '—'}</span></span>
          </button>
          <ThemeToggle />
        </div>
      </div></header>
      <main>
        <Routes>
          <Route path="/" element={<People />} />
          <Route path="/people/:id" element={<Person />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/sessions/:id" element={<Session />} />
          <Route path="/roadmaps" element={<Roadmaps />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/value" element={<Value />} />
          <Route path="/risks" element={<Risks />} />
          <Route path="/library" element={<Library />} />
          <Route path="/library/:key" element={<Library />} />
          <Route path="/export" element={<ExportPage />} />
          <Route path="*" element={<div className="container page"><div className="hero compact"><h1>Page not found</h1><p className="sub"><Link to="/" className="accent-text">Back to people</Link></p></div></div>} />
        </Routes>
      </main>
      <footer className="footer"><div className="container"><span><span className="footer-name">Ballon TD</span>Internal use only · every change is logged with the name above</span><span>Data stays on this server</span></div></footer>
      {(!user || editUser) && <UserModal first={!user} onClose={() => setEditUser(false)} />}
      <Toasts />
    </>
  )
}

function App() {
  const { data, error } = useApi<Meta>('/meta')
  if (error && !data) return <div className="container page"><div className="hero compact"><h1>Cannot reach the server</h1><p className="sub">{error}. Check that the server is running (npm start) and refresh.</p></div></div>
  if (!data) return <div className="loading">Loading…</div>
  return <MetaContext.Provider value={data}><BrowserRouter><Layout /></BrowserRouter></MetaContext.Provider>
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
