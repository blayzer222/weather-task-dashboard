import { useEffect, useMemo, useState } from "react";
import {
  fetchTasks,
  createTask,
  deleteTask,
  updateTask,
  updateTaskStatus,
} from "./api/tasksApi";
import {
  login as loginRequest,
  register as registerRequest,
} from "./api/authApi";
import "./App.css";

function App() {
  // ---------------- Auth ----------------
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  // ---------------- Dark Mode ----------------
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // ---------------- Wetter ----------------
  const [city, setCity] = useState("Berlin");
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState(null);

  // ---------------- Tasks ----------------
  const [tasks, setTasks] = useState([]);
  const [tasksError, setTasksError] = useState(null);
  const [tasksLoading, setTasksLoading] = useState(false);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("MEDIUM");

  // ---------------- Filter / Sort / Search ----------------
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [sortMode, setSortMode] = useState("NEWEST");
  const [searchTerm, setSearchTerm] = useState("");

  // ---------------- Edit ----------------
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState("MEDIUM");

  const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

  // ---------------- Helpers ----------------
  function handleLogout() {
    localStorage.removeItem("token");
    setToken(null);
    setTasks([]);
    setTasksError(null);
    setLoginError(null);
  }

  function getStatusColor(status) {
    switch (status) {
      case "IN_PROGRESS":
        return "#f59e0b";
      case "DONE":
        return "#22c55e";
      case "NEW":
      default:
        return "#3b82f6";
    }
  }

  function getPriorityColor(priority) {
    switch (priority) {
      case "HIGH":
        return "#ef4444";
      case "MEDIUM":
        return "#f59e0b";
      case "LOW":
        return "#22c55e";
      default:
        return "#6b7280";
    }
  }

  function getPriorityLabel(priority) {
    switch (priority) {
      case "HIGH":
        return "High";
      case "LOW":
        return "Low";
      case "MEDIUM":
      default:
        return "Medium";
    }
  }

  function getStatusLabel(status) {
    switch (status) {
      case "IN_PROGRESS":
        return "In Progress";
      case "DONE":
        return "Done";
      case "NEW":
      default:
        return "New";
    }
  }

  function clearFilters() {
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setSortMode("NEWEST");
    setSearchTerm("");
  }

  // ---------------- Wetter laden ----------------
  async function loadWeather() {
    if (!city.trim()) return;

    try {
      setWeatherError(null);

      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=de`
      );

      if (!res.ok) {
        throw new Error("Stadt nicht gefunden oder API-Fehler");
      }

      const data = await res.json();
      setWeather(data);
    } catch (err) {
      setWeather(null);
      setWeatherError(err.message);
    }
  }

  // ---------------- Tasks laden ----------------
  async function loadTasks() {
    try {
      setTasksLoading(true);
      setTasksError(null);

      const data = await fetchTasks();
      setTasks(data);
    } catch (err) {
      if (err.code === 401) {
        handleLogout();
        return;
      }
      setTasksError(err.message);
    } finally {
      setTasksLoading(false);
    }
  }

  // ---------------- Initial Load ----------------
  useEffect(() => {
    loadWeather();
    if (token) {
      loadTasks();
    }
  }, [token]);

  // ---------------- Login / Register ----------------
  async function handleAuth(e) {
    e.preventDefault();
    if (!loginName.trim() || !loginPassword) return;

    try {
      setLoginLoading(true);
      setLoginError(null);

      const name = loginName.trim();

      if (authMode === "login") {
        const data = await loginRequest(name, loginPassword);
        localStorage.setItem("token", data.token);
        setToken(data.token);
      } else {
        await registerRequest(name, loginPassword);
        setAuthMode("login");
      }

      setLoginName("");
      setLoginPassword("");
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  }

  // ---------------- Task erstellen ----------------
  async function handleAddTask(e) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      setTasksError(null);

      const created = await createTask({
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim(),
        priority: newTaskPriority,
      });

      setTasks((prev) => [...prev, created]);
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskPriority("MEDIUM");
    } catch (err) {
      if (err.code === 401) {
        handleLogout();
        return;
      }
      setTasksError(err.message);
    }
  }

  // ---------------- Task löschen ----------------
  async function handleDeleteTask(id) {
    try {
      setTasksError(null);
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      if (err.code === 401) {
        handleLogout();
        return;
      }
      setTasksError(err.message);
    }
  }

  // ---------------- Status ändern ----------------
  async function handleStatusChange(id, newStatus) {
    try {
      setTasksError(null);
      const updated = await updateTaskStatus(id, newStatus);

      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, status: updated.status } : task
        )
      );
    } catch (err) {
      if (err.code === 401) {
        handleLogout();
        return;
      }
      setTasksError(err.message);
    }
  }

  // ---------------- Edit ----------------
  function startEdit(task) {
    setEditingTaskId(task.id);
    setEditTitle(task.title || "");
    setEditDescription(task.description || "");
    setEditPriority(task.priority || "MEDIUM");
  }

  function cancelEdit() {
    setEditingTaskId(null);
    setEditTitle("");
    setEditDescription("");
    setEditPriority("MEDIUM");
  }

  async function handleSaveEdit(task) {
    try {
      setTasksError(null);

      const updated = await updateTask(task.id, {
        id: task.id,
        title: editTitle.trim(),
        description: editDescription.trim(),
        priority: editPriority,
        status: task.status,
      });

      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      cancelEdit();
    } catch (err) {
      if (err.code === 401) {
        handleLogout();
        return;
      }
      setTasksError(err.message);
    }
  }

  // ---------------- Filter / Sort ----------------
  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks];

    if (statusFilter !== "ALL") {
      result = result.filter((task) => (task.status || "NEW") === statusFilter);
    }

    if (priorityFilter !== "ALL") {
      result = result.filter(
        (task) => (task.priority || "MEDIUM") === priorityFilter
      );
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (task) =>
          (task.title || "").toLowerCase().includes(q) ||
          (task.description || "").toLowerCase().includes(q)
      );
    }

    if (sortMode === "TITLE_ASC") {
      result.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (sortMode === "TITLE_DESC") {
      result.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
    } else if (sortMode === "PRIORITY") {
      const rank = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      result.sort(
        (a, b) =>
          (rank[b.priority || "MEDIUM"] || 0) -
          (rank[a.priority || "MEDIUM"] || 0)
      );
    } else {
      result.sort((a, b) => b.id - a.id);
    }

    return result;
  }, [tasks, statusFilter, priorityFilter, sortMode, searchTerm]);

  // ---------------- KPI ----------------
  const total = tasks.length;
  const totalNew = tasks.filter((t) => (t.status || "NEW") === "NEW").length;
  const totalInProgress = tasks.filter(
    (t) => (t.status || "NEW") === "IN_PROGRESS"
  ).length;
  const totalDone = tasks.filter((t) => (t.status || "NEW") === "DONE").length;
  const completionRate =
    total === 0 ? 0 : Math.round((totalDone / total) * 100);

  return (
    <div className="app-shell">
      <div className="app">
        {/* Header */}
        <header className="topbar">
          <div className="hero-copy">
            <span className="hero-badge">Productivity Dashboard</span>
            <h1>Weather &amp; Task Dashboard</h1>
            <p className="muted hero-text">
              Organisiere Aufgaben, tracke Prioritäten und behalte das Wetter im
              Blick.
            </p>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="ghost icon-btn"
              onClick={() => setDarkMode((v) => !v)}
              title="Dark Mode umschalten"
            >
              {darkMode ? "☀️ Light" : "🌙 Dark"}
            </button>

            {token ? (
              <button onClick={handleLogout}>Logout</button>
            ) : (
              <span className="muted auth-state">Nicht eingeloggt</span>
            )}
          </div>
        </header>

        {/* Login / Register */}
        {!token && (
          <section className="card auth-card">
            <div className="section-head">
              <div>
                <h2>{authMode === "login" ? "Login" : "Registrieren"}</h2>
                <p className="muted section-subtitle">
                  Melde dich an, um deine Aufgaben zu verwalten.
                </p>
              </div>

              <button
                type="button"
                className="ghost"
                onClick={() =>
                  setAuthMode((m) => (m === "login" ? "register" : "login"))
                }
              >
                {authMode === "login" ? "Registrieren" : "Zurück zu Login"}
              </button>
            </div>

            <form onSubmit={handleAuth} className="row">
              <input
                type="text"
                placeholder="Login"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
              />
              <input
                type="password"
                placeholder="Passwort"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
              <button type="submit" disabled={loginLoading}>
                {loginLoading
                  ? "Bitte warten..."
                  : authMode === "login"
                  ? "Login"
                  : "Registrieren"}
              </button>
            </form>

            {loginError && <p className="error">{loginError}</p>}
          </section>
        )}

        {/* KPI */}
        {token && (
          <>
            <div className="kpi-bar">
              <div className="kpi-card">
                <span className="kpi-label">Total Tasks</span>
                <span className="kpi-value">{total}</span>
              </div>
              <div className="kpi-card kpi-new">
                <span className="kpi-label">New</span>
                <span className="kpi-value">{totalNew}</span>
              </div>
              <div className="kpi-card kpi-progress">
                <span className="kpi-label">In Progress</span>
                <span className="kpi-value">{totalInProgress}</span>
              </div>
              <div className="kpi-card kpi-done">
                <span className="kpi-label">Done</span>
                <span className="kpi-value">{totalDone}</span>
              </div>
            </div>

            <section className="card progress-card">
              <div className="progress-head">
                <div>
                  <h2>Fortschritt</h2>
                  <p className="muted section-subtitle">
                    {completionRate}% deiner Tasks sind bereits erledigt.
                  </p>
                </div>
                <strong className="progress-percent">{completionRate}%</strong>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </section>
          </>
        )}

        {/* Main Grid */}
        <div className="dashboard-grid">
          {/* Wetter */}
          <section className="card weather-card">
            <div className="section-head">
              <div>
                <h2>Wetter</h2>
                <p className="muted section-subtitle">
                  Aktuelles Wetter für deine Stadt.
                </p>
              </div>
            </div>

            <div className="row">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Stadt eingeben..."
              />
              <button onClick={loadWeather}>Wetter laden</button>
            </div>

            {weatherError && (
              <p className="error">Fehler beim Wetter: {weatherError}</p>
            )}

            {weather && (
              <div className="weather-info">
                <div className="weather-icon-wrap">
                  <img
                    src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                    alt={weather.weather[0].description}
                    className="weather-icon"
                  />
                </div>

                <h3>{weather.name}</h3>
                <p className="weather-temp">{Math.round(weather.main.temp)}°C</p>
                <p className="weather-desc">{weather.weather[0].description}</p>

                <div className="weather-stats">
                  <div className="mini-stat">
                    <span className="mini-stat-label">Luftfeuchtigkeit</span>
                    <span className="mini-stat-value">
                      {weather.main.humidity}%
                    </span>
                  </div>
                  <div className="mini-stat">
                    <span className="mini-stat-label">Wind</span>
                    <span className="mini-stat-value">
                      {Math.round(weather.wind.speed)} m/s
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Aufgaben */}
          <section className="card">
            <div className="section-head">
              <div>
                <h2>Aufgaben</h2>
                <p className="muted section-subtitle">
                  Erstelle, filtere und bearbeite deine Tasks.
                </p>
              </div>
            </div>

            {!token ? (
              <div className="empty-state">
                <p className="muted">Bitte einloggen, um Tasks zu sehen.</p>
              </div>
            ) : (
              <>
                <form onSubmit={handleAddTask} className="task-create-grid">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Titel..."
                  />

                  <input
                    type="text"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="Beschreibung..."
                  />

                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>

                  <button type="submit">Hinzufügen</button>
                </form>

                <div className="toolbar-grid">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Task suchen..."
                  />

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">Alle Status</option>
                    <option value="NEW">Nur New</option>
                    <option value="IN_PROGRESS">Nur In Progress</option>
                    <option value="DONE">Nur Done</option>
                  </select>

                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    <option value="ALL">Alle Prioritäten</option>
                    <option value="HIGH">Nur High</option>
                    <option value="MEDIUM">Nur Medium</option>
                    <option value="LOW">Nur Low</option>
                  </select>

                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value)}
                  >
                    <option value="NEWEST">Neueste zuerst</option>
                    <option value="TITLE_ASC">Titel A-Z</option>
                    <option value="TITLE_DESC">Titel Z-A</option>
                    <option value="PRIORITY">Priorität High-Low</option>
                  </select>

                  <button
                    type="button"
                    className="ghost"
                    onClick={clearFilters}
                  >
                    Filter zurücksetzen
                  </button>
                </div>

                {tasksLoading && <p className="muted">Lade Aufgaben...</p>}
                {tasksError && (
                  <p className="error">Fehler bei Tasks: {tasksError}</p>
                )}

                {filteredAndSortedTasks.length === 0 && !tasksLoading && (
                  <div className="empty-state">
                    <p className="muted">
                      Keine Aufgaben für den aktuellen Filter.
                    </p>
                  </div>
                )}

                <ul className="task-list">
                  {filteredAndSortedTasks.map((task) => {
                    const status = task.status || "NEW";
                    const statusColor = getStatusColor(status);
                    const priorityColor = getPriorityColor(
                      task.priority || "MEDIUM"
                    );

                    return (
                      <li key={task.id} className="task-item">
                        {editingTaskId === task.id ? (
                          <>
                            <div className="task-edit-grid">
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                placeholder="Titel..."
                              />
                              <input
                                type="text"
                                value={editDescription}
                                onChange={(e) =>
                                  setEditDescription(e.target.value)
                                }
                                placeholder="Beschreibung..."
                              />
                              <select
                                value={editPriority}
                                onChange={(e) =>
                                  setEditPriority(e.target.value)
                                }
                              >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                              </select>
                            </div>

                            <div className="task-actions">
                              <button onClick={() => handleSaveEdit(task)}>
                                Speichern
                              </button>
                              <button className="ghost" onClick={cancelEdit}>
                                Abbrechen
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="task-main">
                              <div className="task-content">
                                <div className="task-topline">
                                  <span className="task-title">{task.title}</span>

                                  <span
                                    className="status-pill"
                                    style={{
                                      backgroundColor: `${statusColor}1A`,
                                      color: statusColor,
                                      borderColor: statusColor,
                                      borderStyle: "solid",
                                      borderWidth: 1,
                                    }}
                                  >
                                    {getStatusLabel(status)}
                                  </span>
                                </div>

                                <p className="task-desc">
                                  {task.description || "Keine Beschreibung"}
                                </p>

                                <div className="task-meta">
                                  <span
                                    className="priority-badge"
                                    style={{
                                      backgroundColor: `${priorityColor}1A`,
                                      color: priorityColor,
                                      border: `1px solid ${priorityColor}`,
                                    }}
                                  >
                                    {getPriorityLabel(task.priority || "MEDIUM")}
                                  </span>

                                  <span className="task-id">Task #{task.id}</span>
                                </div>
                              </div>
                            </div>

                            <div className="task-actions">
                              <select
                                value={status}
                                onChange={(e) =>
                                  handleStatusChange(task.id, e.target.value)
                                }
                              >
                                <option value="NEW">New</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="DONE">Done</option>
                              </select>

                              <button
                                className="ghost"
                                onClick={() => startEdit(task)}
                              >
                                Bearbeiten
                              </button>

                              <button
                                className="danger"
                                onClick={() => handleDeleteTask(task.id)}
                              >
                                Löschen
                              </button>
                            </div>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </section>
        </div>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-line">
            <strong>Weather &amp; Task Dashboard</strong>
            <span>React + Spring Boot</span>
          </div>
          <p>
            UI verbessert mit Fokus auf Übersicht, Interaktivität und modernes
            Layout.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;