import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from './api'
import AdminDashboard from './AdminDashboard'
import UserDashboard from './UserDashboard'
import { idEqual } from './utils'
import './App.css'

const STORAGE_KEY = 'ttm_auth'

function loadStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.token && parsed?.user) return parsed
  } catch {
    /* ignore */
  }
  return null
}

function saveAuth(token, user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }))
}

function clearAuth() {
  localStorage.removeItem(STORAGE_KEY)
}

function PublicLanding({ onShowAuth }) {
  return (
    <main className="public-shell">
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div>
            <span>
              <strong>Team Task Manager</strong>
            </span>
          </div>

          <div className="nav-actions">
            <button type="button" className="btn ghost" onClick={onShowAuth}>
              Log in
            </button>
            <button type="button" className="btn primary" onClick={onShowAuth}>
              Get started
            </button>
          </div>
        </div>
      </nav>

      <section className="landing-hero" id="workflow">
        <div className="hero-copy">
          <p className="pill">Teamwork. Organized.</p>
          <h1>
            Plan. Assign. Track. Deliver.
          </h1>
          <p className="hero-sub">
            Manage projects, assign tasks, and keep every teammate focused from
            one simple dashboard.
          </p>
          <div className="hero-actions">
            <button type="button" className="btn primary" onClick={onShowAuth}>
              Get started free
            </button>
            <button type="button" className="btn ghost" onClick={onShowAuth}>
              View demo
            </button>
          </div>
        </div>
      </section>

      

      <footer className="landing-footer">
        <div className="brand-mark">
          <span className="brand-icon">T</span>
          <span>
            <strong>TeamTask</strong>
            <small>Plan. Assign. Track. Deliver.</small>
          </span>
        </div>
        <div>
          <strong>Product</strong>
          <a href="#features">Features</a>
          <a href="#roles">Roles</a>
        </div>
        <div>
          <strong>Access</strong>
          <button type="button" onClick={onShowAuth}>Log in</button>
          <button type="button" onClick={onShowAuth}>Create account</button>
        </div>
        <p className="footer-note">Team Task Manager for focused project work.</p>
      </footer>
    </main>
  )
}

function AuthPage({
  authMode,
  setAuthMode,
  email,
  setEmail,
  password,
  setPassword,
  name,
  setName,
  error,
  loading,
  onLogin,
  onSignup,
  onBack,
}) {
  return (
    <main className="auth-page">
      <button type="button" className="back-link" onClick={onBack}>
        Back
      </button>
      <section className="auth-layout">
        <div className="auth-intro">
          <p className="eyebrow">Secure access</p>
          <h1>{authMode === 'login' ? 'Welcome back.' : 'Join your team.'}</h1>
          <p>
            Admins can create projects, assign tasks, and manage roles. Members
            get a clean task list with quick completion controls.
          </p>
          <p className="login-hint muted small">
            Demo administrator login:{' '}
            <strong>admin@teamtask.local</strong> / <strong>Admin@12345</strong>
          </p>
        </div>

        <div className="auth-card">
          <div className="auth-tabs">
            <button
              type="button"
              className={authMode === 'login' ? 'active' : ''}
              onClick={() => setAuthMode('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={authMode === 'signup' ? 'active' : ''}
              onClick={() => setAuthMode('signup')}
            >
              Sign up
            </button>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={onLogin} className="form">
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  required
                  autoComplete="email"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  required
                  autoComplete="current-password"
                />
              </label>
              {error ? <p className="form-error">{error}</p> : null}
              <button type="submit" className="btn primary" disabled={loading}>
                {loading ? 'Please wait...' : 'Login'}
              </button>
            </form>
          ) : (
            <form onSubmit={onSignup} className="form">
              <label>
                Name
                <input
                  value={name}
                  onChange={(ev) => setName(ev.target.value)}
                  required
                  autoComplete="name"
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  required
                  autoComplete="email"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </label>
              <p className="signup-note muted small">
                New accounts are <strong>team members only</strong>. Admin
                access is granted by an existing administrator.
              </p>
              {error ? <p className="form-error">{error}</p> : null}
              <button type="submit" className="btn primary" disabled={loading}>
                {loading ? 'Please wait...' : 'Create account'}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}

export default function App() {
  const initial = loadStoredAuth()
  const [token, setToken] = useState(initial?.token ?? null)
  const [user, setUser] = useState(initial?.user ?? null)

  const [publicView, setPublicView] = useState('landing')
  const [authMode, setAuthMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [taskFilter, setTaskFilter] = useState('all')

  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectMembers, setNewProjectMembers] = useState([])

  const [taskProjectId, setTaskProjectId] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskAssignee, setTaskAssignee] = useState('')
  const [taskDue, setTaskDue] = useState('')

  const [roleDraft, setRoleDraft] = useState({})

  const isAdmin = user?.role === 'admin'

  const refreshData = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const [p, t] = await Promise.all([
        api('/api/project', { token }),
        api('/api/task', { token }),
      ])
      setProjects(p)
      setTasks(t)
      if (user?.role === 'admin') {
        const u = await api('/api/users', { token })
        setUsers(u)
        const next = {}
        u.forEach((row) => {
          next[row._id] = row.role
        })
        setRoleDraft(next)
      } else {
        setUsers([])
        setRoleDraft({})
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [token, user])

  useEffect(() => {
    if (!token || !user) return undefined
    const timer = window.setTimeout(() => {
      void refreshData()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [token, user, refreshData])

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      const u = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      }
      setToken(data.token)
      setUser(u)
      saveAuth(data.token, u)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api('/api/auth/signup', {
        method: 'POST',
        body: { name, email, password },
      })
      setAuthMode('login')
      setError('')
      alert('Account created. Please sign in.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    clearAuth()
    setToken(null)
    setUser(null)
    setTasks([])
    setProjects([])
    setUsers([])
    setPublicView('landing')
  }

  async function handleCreateProject(e) {
    e.preventDefault()
    if (!isAdmin) return
    setError('')
    setLoading(true)
    try {
      await api('/api/project', {
        token,
        method: 'POST',
        body: { name: newProjectName, members: newProjectMembers },
      })
      setNewProjectName('')
      setNewProjectMembers([])
      await refreshData()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateTask(e) {
    e.preventDefault()
    if (!isAdmin) return
    setError('')
    setLoading(true)
    try {
      const body = {
        title: taskTitle,
        projectId: taskProjectId,
        assignedTo: taskAssignee,
      }
      if (taskDue) body.dueDate = taskDue
      await api('/api/task', { token, method: 'POST', body })
      setTaskTitle('')
      setTaskAssignee('')
      setTaskDue('')
      await refreshData()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateUserRole(userId) {
    if (!isAdmin) return
    const role = roleDraft[userId]
    if (!role || (role !== 'admin' && role !== 'member')) return
    setError('')
    setLoading(true)
    try {
      const data = await api(`/api/users/${userId}/role`, {
        token,
        method: 'PATCH',
        body: { role },
      })
      if (data.token && data.user) {
        const u = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
        }
        setToken(data.token)
        setUser(u)
        saveAuth(data.token, u)
      }
      await refreshData()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function toggleMemberTask(task, checked) {
    if (isAdmin) return
    setError('')
    try {
      await api(`/api/task/${task._id}`, {
        token,
        method: 'PUT',
        body: { status: checked ? 'done' : 'todo' },
      })
      await refreshData()
    } catch (err) {
      setError(err.message)
    }
  }

  const selectedProject = useMemo(
    () => projects.find((p) => p._id === taskProjectId),
    [projects, taskProjectId]
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!taskProjectId || !selectedProject?.members?.length) {
        setTaskAssignee('')
        return
      }
      const memberIds = selectedProject.members.map((m) => m._id || m)
      if (taskAssignee && !memberIds.some((id) => idEqual(id, taskAssignee))) {
        setTaskAssignee('')
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [taskProjectId, selectedProject, taskAssignee])

  const stats = useMemo(() => {
    const pending = tasks.filter((t) => t.status !== 'done').length
    const completed = tasks.filter((t) => t.status === 'done').length
    const assignedToMe = tasks.filter((t) =>
      idEqual(t.assignedTo?._id || t.assignedTo, user?.id)
    ).length
    const myOpen = tasks.filter(
      (t) =>
        idEqual(t.assignedTo?._id || t.assignedTo, user?.id) &&
        t.status !== 'done'
    ).length
    return { pending, completed, assignedToMe, myOpen }
  }, [tasks, user?.id])

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (taskFilter === 'all') return true
      if (taskFilter === 'pending') {
        return t.status === 'todo' || t.status === 'in_progress'
      }
      if (taskFilter === 'completed') return t.status === 'done'
      if (taskFilter === 'mine') {
        return idEqual(t.assignedTo?._id || t.assignedTo, user?.id)
      }
      return true
    })
  }, [tasks, taskFilter, user?.id])

  function toggleProjectMember(uid) {
    setNewProjectMembers((prev) => {
      const s = String(uid)
      if (prev.some((x) => String(x) === s)) {
        return prev.filter((x) => String(x) !== s)
      }
      return [...prev, uid]
    })
  }

  if (!token || !user) {
    if (publicView === 'landing') {
      return <PublicLanding onShowAuth={() => setPublicView('auth')} />
    }

    return (
      <AuthPage
        authMode={authMode}
        setAuthMode={setAuthMode}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        name={name}
        setName={setName}
        error={error}
        loading={loading}
        onLogin={handleLogin}
        onSignup={handleSignup}
        onBack={() => setPublicView('landing')}
      />
    )
  }

  const dashboardProps = {
    user,
    error,
    loading,
    stats,
    taskFilter,
    setTaskFilter,
    filteredTasks,
    onLogout: handleLogout,
  }

  if (isAdmin) {
    return (
      <AdminDashboard
        {...dashboardProps}
        projects={projects}
        users={users}
        newProjectName={newProjectName}
        setNewProjectName={setNewProjectName}
        newProjectMembers={newProjectMembers}
        toggleProjectMember={toggleProjectMember}
        taskProjectId={taskProjectId}
        setTaskProjectId={setTaskProjectId}
        taskAssignee={taskAssignee}
        setTaskAssignee={setTaskAssignee}
        taskTitle={taskTitle}
        setTaskTitle={setTaskTitle}
        taskDue={taskDue}
        setTaskDue={setTaskDue}
        selectedProject={selectedProject}
        roleDraft={roleDraft}
        setRoleDraft={setRoleDraft}
        onCreateProject={handleCreateProject}
        onCreateTask={handleCreateTask}
        onUpdateUserRole={handleUpdateUserRole}
      />
    )
  }

  return <UserDashboard {...dashboardProps} onToggleTask={toggleMemberTask} />
}
