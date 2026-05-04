import { idEqual } from './utils'

function DashboardHeader({ user, onLogout }) {
  return (
    <header className="dash-header">
      <div>
        <h1 className="app-title">Admin dashboard</h1>
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
    </section>
  )
}

function TaskBoard({ loading, tasks, taskFilter, setTaskFilter }) {
  return (
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

      {loading && tasks.length === 0 ? (
        <p className="muted">Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p className="muted">No tasks match this filter.</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => {
            const assignee = task.assignedTo
            const project = task.projectId
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
                  <span
                    className={done ? 'admin-status done' : 'admin-status open'}
                  >
                    {done ? 'Completed' : 'Not completed'}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default function AdminDashboard({
  user,
  error,
  loading,
  stats,
  taskFilter,
  setTaskFilter,
  filteredTasks,
  projects,
  users,
  newProjectName,
  setNewProjectName,
  newProjectMembers,
  toggleProjectMember,
  taskProjectId,
  setTaskProjectId,
  taskAssignee,
  setTaskAssignee,
  taskTitle,
  setTaskTitle,
  taskDue,
  setTaskDue,
  selectedProject,
  roleDraft,
  setRoleDraft,
  onLogout,
  onCreateProject,
  onCreateTask,
  onUpdateUserRole,
}) {
  return (
    <div className="app dashboard">
      <DashboardHeader user={user} onLogout={onLogout} />
      {error ? <div className="banner error">{error}</div> : null}
      <Stats stats={stats} />

      <div className="admin-panels">
        <form className="panel form" onSubmit={onCreateProject}>
          <h2>New project</h2>
          <p className="muted small">
            Create a project and select team members who will receive tasks.
          </p>
          <label>
            Project name
            <input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              required
              placeholder="e.g. Website redesign"
            />
          </label>
          <fieldset className="member-pick">
            <legend>Team members</legend>
            {users.length === 0 ? (
              <p className="muted small">Loading users...</p>
            ) : (
              <ul className="checkbox-list">
                {users.map((teamUser) => (
                  <li key={teamUser._id}>
                    <label className="check-row">
                      <input
                        type="checkbox"
                        checked={newProjectMembers.some((x) =>
                          idEqual(x, teamUser._id)
                        )}
                        onChange={() => toggleProjectMember(teamUser._id)}
                      />
                      <span>
                        {teamUser.name}{' '}
                        <span className="muted">({teamUser.email})</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>
          <button type="submit" className="btn primary" disabled={loading}>
            Create project
          </button>
        </form>

        <form className="panel form" onSubmit={onCreateTask}>
          <h2>New task</h2>
          <p className="muted small">
            Creates a pending task and assigns it to a project member.
          </p>
          <label>
            Project
            <select
              value={taskProjectId}
              onChange={(e) => setTaskProjectId(e.target.value)}
              required
            >
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Assign to
            <select
              value={taskAssignee}
              onChange={(e) => setTaskAssignee(e.target.value)}
              required
              disabled={!selectedProject}
            >
              <option value="">Select member</option>
              {(selectedProject?.members || []).map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name} ({member.email})
                </option>
              ))}
            </select>
          </label>
          <label>
            Title
            <input
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              required
              placeholder="Task title"
            />
          </label>
          <label>
            Due date <span className="muted">(optional)</span>
            <input
              type="date"
              value={taskDue}
              onChange={(e) => setTaskDue(e.target.value)}
            />
          </label>
          <button type="submit" className="btn primary" disabled={loading}>
            Create task
          </button>
        </form>
      </div>

      <section className="panel admin-roles-panel">
        <h2>User roles</h2>
        <p className="muted small">
          Promote a member to <strong>admin</strong> or set them back to{' '}
          <strong>member</strong>.
        </p>
        <div className="roles-table-wrap">
          <table className="roles-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((teamUser) => (
                <tr key={teamUser._id}>
                  <td>{teamUser.name}</td>
                  <td>{teamUser.email}</td>
                  <td>
                    <select
                      className="role-select"
                      value={roleDraft[teamUser._id] ?? teamUser.role}
                      onChange={(e) =>
                        setRoleDraft((prev) => ({
                          ...prev,
                          [teamUser._id]: e.target.value,
                        }))
                      }
                    >
                      <option value="member">member</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn small"
                      disabled={
                        loading ||
                        (roleDraft[teamUser._id] ?? teamUser.role) ===
                          teamUser.role
                      }
                      onClick={() => onUpdateUserRole(teamUser._id)}
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <TaskBoard
        loading={loading}
        tasks={filteredTasks}
        taskFilter={taskFilter}
        setTaskFilter={setTaskFilter}
      />
    </div>
  )
}
