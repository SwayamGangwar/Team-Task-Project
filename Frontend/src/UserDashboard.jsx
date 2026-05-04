import { idEqual } from './utils'

function DashboardHeader({ user, onLogout }) {
  return (
    <header className="dash-header">
      <div>
        <h1 className="app-title">Team member dashboard</h1>
        <p className="muted">
          Signed in as <strong>{user.name}</strong>{' '}
          <span className={`role-badge role-${user.role}`}>{user.role}</span>
        </p>
      </div>
      <button type="button" className="btn ghost" onClick={onLogout}>
        Log out
      </button>
    </header>
  )
}

function Stats({ stats }) {
  return (
    <section className="stats">
      <div className="stat-card">
        <span className="stat-label">Pending</span>
        <span className="stat-value">{stats.pending}</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Completed</span>
        <span className="stat-value">{stats.completed}</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Assigned to you</span>
        <span className="stat-value">{stats.assignedToMe}</span>
      </div>
      <div className="stat-card highlight">
        <span className="stat-label">Your open tasks</span>
        <span className="stat-value">{stats.myOpen}</span>
      </div>
    </section>
  )
}

export default function UserDashboard({
  user,
  error,
  loading,
  stats,
  taskFilter,
  setTaskFilter,
  filteredTasks,
  onLogout,
  onToggleTask,
}) {
  return (
    <div className="app dashboard">
      <DashboardHeader user={user} onLogout={onLogout} />
      {error ? <div className="banner error">{error}</div> : null}
      <Stats stats={stats} />

      <section className="task-board">
        <div className="task-board-head">
          <h2>Tasks</h2>
          <div className="filters">
            <span className="muted">Show:</span>
            {['all', 'pending', 'completed', 'mine'].map((f) => (
              <button
                key={f}
                type="button"
                className={`chip ${taskFilter === f ? 'active' : ''}`}
                onClick={() => setTaskFilter(f)}
              >
                {f === 'all'
                  ? 'All'
                  : f === 'pending'
                    ? 'Pending'
                    : f === 'completed'
                      ? 'Completed'
                      : 'Assigned to me'}
              </button>
            ))}
          </div>
        </div>

        {loading && filteredTasks.length === 0 ? (
          <p className="muted">Loading tasks...</p>
        ) : filteredTasks.length === 0 ? (
          <p className="muted">No tasks match this filter.</p>
        ) : (
          <ul className="task-list">
            {filteredTasks.map((task) => {
              const assignee = task.assignedTo
              const project = task.projectId
              const mine = idEqual(assignee?._id || assignee, user.id)
              const done = task.status === 'done'

              return (
                <li key={task._id} className="task-row">
                  <div className="task-main">
                    <div className="task-title">{task.title}</div>
                    <div className="task-meta">
                      <span>{project?.name || 'Project'}</span>
                      <span className="muted">
                        to {assignee?.name ? `${assignee.name}` : 'Unassigned'}
                      </span>
                    </div>
                  </div>

                  <div className="task-actions">
                    {mine ? (
                      <label className="todo-check">
                        <input
                          type="checkbox"
                          checked={done}
                          onChange={(ev) => onToggleTask(task, ev.target.checked)}
                        />
                        <span>{done ? 'Completed' : 'Mark complete'}</span>
                      </label>
                    ) : (
                      <span className="muted small read-only">
                        {done ? 'Completed' : 'Pending'}
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
