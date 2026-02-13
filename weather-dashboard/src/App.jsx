import { useEffect, useMemo, useState } from "react";
import {
  fetchTasks,
  createTask,
  deleteTask,
  updateTaskStatus,
} from "./api/tasksApi";
import { login as loginRequest } from "./api/authApi";
import "./App.css";

function App() {
  // ---------------- Auth ----------------
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // ---------------- Toasts (kleine Meldungen) ----------------
  const [toasts, setToasts] = useState([]);
  function pushToast(type, text) {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }

  // ---------------- Dark Mode ----------------
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  function toggleDarkMode() {
    const html = document.documentElement;
    html.classList.toggle("dark");
    setDark(html.classList.contains("dark"));
  }

  // ---------------- Wetter ----------------
  const [city, setCity] = useState("Berlin");
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState(null);

  // ---------------- Tasks ----------------
  const [tasks, setTasks] = useState([]);
  const [tasksError, setTasksError] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [tasksLoading, setTasksLoading] = useState(false);

  // ---------------- Filter ----------------
  const [filter, setFilter] = useState("ALL"); // ALL | NEW | IN_PROGRESS | DONE
  const [query, setQuery] = useState(""); // Suche

  const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

  // ---------------- Wetter laden ----------------
  async function loadWeather() {
    if (!city) return;
    try {
      setWeatherError(null);

      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
          city
        )}&appid=${API_KEY}&units=metric&lang=de`
      );

      if (!res.ok) throw new Error("Stadt nicht gefunden oder API-Fehler");

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
      // Wenn Backend 401 -> Session abgelaufen -> logout
      if (err?.code === 401 || String(err?.message || "").includes("401")) {
        pushToast("error", "Session abgelaufen. Bitte neu einloggen.");
        handleLogout();
        return;
      }
      setTasksError(err.message);
    } finally {
      setTasksLoading(false);
    }
  }

  // ---------------- Initial: Wetter immer, Tasks nur wenn eingeloggt ----------------
  useEffect(() => {
    loadWeather();
    if (token) loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ---------------- Login ----------------
  async function handleLogin(e) {
    e.preventDefault();
    if (!loginName.trim() || !loginPassword) return;

    try {
      setLoginLoading(true);
      setLoginError(null);

      const data = await loginRequest(loginName.trim(), loginPassword);
      localStorage.setItem("token", data.token);
      setToken(data.token);

      setLoginName("");
      setLoginPassword("");

      pushToast("success", "Eingeloggt");
    } catch (err) {
      setLoginError(err.message);
      pushToast("error", "Login fehlgeschlagen");
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setToken(null);

    setTasks([]);
    setTasksError(null);
    setFilter("ALL");
    setQuery("");

    pushToast("success", "Ausgeloggt");
  }

  // ---------------- Task anlegen ----------------
  async function handleAddTask(e) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const created = await createTask(newTaskTitle.trim());
      setTasks((prev) => [...prev, created]);
      setNewTaskTitle("");
      pushToast("success", "Task erstellt");
    } catch (err) {
      if (err?.code === 401 || String(err?.message || "").includes("401")) {
        pushToast("error", "Session abgelaufen. Bitte neu einloggen.");
        handleLogout();
        return;
      }
      setTasksError(err.message);
      pushToast("error", "Task konnte nicht erstellt werden");
    }
  }

  // ---------------- Task löschen ----------------
  async function handleDeleteTask(id) {
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      pushToast("success", "Task gelöscht");
    } catch (err) {
      if (err?.code === 401 || String(err?.message || "").includes("401")) {
        pushToast("error", "Session abgelaufen. Bitte neu einloggen.");
        handleLogout();
        return;
      }
      setTasksError(err.message);
      pushToast("error", "Task konnte nicht gelöscht werden");
    }
  }

  // ---------------- Status ändern ----------------
  async function handleStatusChange(id, newStatus) {
    try {
      const updated = await updateTaskStatus(id, newStatus);
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, status: updated.status } : task
        )
      );
      pushToast("success", "Status aktualisiert");
    } catch (err) {
      if (err?.code === 401 || String(err?.message || "").includes("401")) {
        pushToast("error", "Session abgelaufen. Bitte neu einloggen.");
        handleLogout();
        return;
      }
      setTasksError(err.message);
      pushToast("error", "Status konnte nicht geändert werden");
    }
  }

  // ---------------- Status-Farbe ----------------
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

  // ---------------- KPIs ----------------
  const total = tasks.length;
  const totalNew = tasks.filter((t) => (t.status || "NEW") === "NEW").length;
  const totalInProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const totalDone = tasks.filter((t) => t.status === "DONE").length;

  // ---------------- Filtered Tasks ----------------
  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return tasks
      .map((t) => ({ ...t, status: t.status || "NEW" }))
      .filter((t) => {
        if (filter !== "ALL" && t.status !== filter) return false;
        if (!normalizedQuery) return true;
        return (t.title || "").toLowerCase().includes(normalizedQuery);
      });
  }, [tasks, filter, query]);

  // ---------------- Render ----------------
  return (
    <div className="app">
      {/* Toasts */}
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              marginBottom: 10,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "var(--card)",
              color: "var(--text)",
              minWidth: 280,
              boxShadow: "0 10px 25px rgba(15, 23, 42, 0.12)",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ️"}{" "}
              {t.type === "success"
                ? "OK"
                : t.type === "error"
                ? "Fehler"
                : "Info"}
            </div>
            <div style={{ color: "var(--muted)" }}>{t.text}</div>
          </div>
        ))}
      </div>

      {/* Topbar */}
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>Weather &amp; Task Dashboard</h1>

        <div className="row" style={{ marginBottom: 0 }}>
          <button className="ghost" onClick={toggleDarkMode} title="Dark Mode">
            {dark ? "🌞" : "🌙"}
          </button>

          {token ? (
            <>
              <span className="muted">Eingeloggt</span>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <span className="muted">Nicht eingeloggt</span>
          )}
        </div>
      </div>

      {/* Login-Panel (nur wenn kein Token vorhanden) */}
      {!token && (
        <section className="card" style={{ marginTop: 18 }}>
          <h2 style={{ marginTop: 0 }}>Login</h2>
          <form onSubmit={handleLogin} className="row">
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
              {loginLoading ? "..." : "Login"}
            </button>
          </form>

          {loginError && <p className="error">Login-Fehler: {loginError}</p>}

          <p className="muted" style={{ marginTop: 8 }}>
            Hinweis: Tasks laden/ändern geht erst nach Login.
          </p>
        </section>
      )}

      {/* KPIs: nur sinnvoll wenn eingeloggt */}
      {token && (
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
      )}

      <div className="dashboard-grid">
        {/* Wetter */}
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Wetter</h2>

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
              <h3>{weather.name}</h3>
              <p className="weather-temp">{Math.round(weather.main.temp)}°C</p>
              <p className="weather-desc">{weather.weather[0].description}</p>
            </div>
          )}
        </section>

        {/* Tasks */}
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Aufgaben</h2>

          {!token ? (
            <p className="muted">Bitte einloggen, um Tasks zu sehen.</p>
          ) : (
            <>
              {/* Add Task */}
              <form onSubmit={handleAddTask} className="row">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Neue Aufgabe..."
                />
                <button type="submit">Hinzufügen</button>
              </form>

              {/* FILTER BAR */}
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div className="row" style={{ marginBottom: 0 }}>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => setFilter("ALL")}
                    style={{
                      borderColor:
                        filter === "ALL" ? "rgba(59,130,246,0.55)" : "var(--border)",
                    }}
                  >
                    Alle ({total})
                  </button>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => setFilter("NEW")}
                    style={{
                      borderColor:
                        filter === "NEW" ? "rgba(59,130,246,0.55)" : "var(--border)",
                    }}
                  >
                    New ({totalNew})
                  </button>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => setFilter("IN_PROGRESS")}
                    style={{
                      borderColor:
                        filter === "IN_PROGRESS"
                          ? "rgba(245,158,11,0.55)"
                          : "var(--border)",
                    }}
                  >
                    In Progress ({totalInProgress})
                  </button>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => setFilter("DONE")}
                    style={{
                      borderColor:
                        filter === "DONE" ? "rgba(34,197,94,0.55)" : "var(--border)",
                    }}
                  >
                    Done ({totalDone})
                  </button>
                </div>

                {/* Suche */}
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Suchen…"
                  style={{ maxWidth: 220, marginBottom: 0 }}
                />
              </div>

              {tasksLoading && <p>Lade Aufgaben...</p>}

              {tasksError && (
                <p className="error">Fehler bei Tasks: {tasksError}</p>
              )}

              {!tasksLoading && filteredTasks.length === 0 && (
                <p className="muted" style={{ marginTop: 10 }}>
                  Keine Tasks für diesen Filter.
                </p>
              )}

              <ul className="task-list">
                {filteredTasks.map((task) => {
                  const status = task.status || "NEW";
                  const color = getStatusColor(status);

                  return (
                    <li key={task.id} className="task-item">
                      <div className="task-main">
                        <span className="task-title">{task.title}</span>
                        <span
                          className="status-pill"
                          style={{
                            backgroundColor: `${color}1A`,
                            color,
                            border: `1px solid ${color}`,
                          }}
                        >
                          {status === "NEW"
                            ? "New"
                            : status === "IN_PROGRESS"
                            ? "In Progress"
                            : "Done"}
                        </span>
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

                        <button onClick={() => handleDeleteTask(task.id)}>
                          Löschen
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;
