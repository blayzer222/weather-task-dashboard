import { useEffect, useMemo, useState } from "react";
import {
  fetchTasks,
  createTask,
  deleteTask,
  updateTaskStatus,
} from "./api/tasksApi";
import { login as loginRequest, register as registerRequest } from "./api/authApi";
import "./App.css";

// --- JWT Payload lesen (ohne Lib) ---
function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "===".slice((base64.length + 3) % 4);

    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );

    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getLoginFromToken(token) {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  return payload.login || payload.username || payload.user || payload.sub || null;
}

/** Simple Toast Hook */
function useToasts() {
  const [toasts, setToasts] = useState([]);

  function push(type, text) {
    const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  }

  return { toasts, push };
}

function App() {
  // ---------------- Toasts ----------------
  const { toasts, push } = useToasts();

  // ---------------- Auth ----------------
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authMode, setAuthMode] = useState("login"); // login | register
  const [authLoading, setAuthLoading] = useState(false);

  // ---------------- Dark Mode ----------------
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const displayLogin = useMemo(() => {
    if (!token) return null;
    return getLoginFromToken(token);
  }, [token]);

  // ---------------- Wetter ----------------
  const [city, setCity] = useState("Berlin");
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState(null);

  // ---------------- Tasks ----------------
  const [tasks, setTasks] = useState([]);
  const [tasksError, setTasksError] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [tasksLoading, setTasksLoading] = useState(false);

  const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

  // ---------------- Wetter laden ----------------
  async function loadWeather() {
    if (!city) return;
    try {
      setWeatherError(null);

      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=de`
      );
      if (!res.ok) throw new Error("Stadt nicht gefunden oder API-Fehler");

      const data = await res.json();
      setWeather(data);
    } catch (err) {
      setWeather(null);
      setWeatherError(err.message);
      push("error", err.message);
    }
  }

  // ---------------- Tasks laden (mit Auto-Logout bei 401) ----------------
  async function loadTasks() {
    try {
      setTasksLoading(true);
      setTasksError(null);

      const data = await fetchTasks();
      setTasks(data);
    } catch (err) {
      // Auto-Logout wenn Token ungültig/abgelaufen
      if (err?.code === 401 || err?.message === "UNAUTHORIZED") {
        handleLogout(true);
        return;
      }
      setTasksError(err.message);
      push("error", err.message);
    } finally {
      setTasksLoading(false);
    }
  }

  // Initial
  useEffect(() => {
    loadWeather();
  }, []);

  // Wenn Token gesetzt: Tasks automatisch laden
  useEffect(() => {
    if (token) loadTasks();
  }, [token]);

  // ---------------- Login/Register ----------------
  async function handleAuth(e) {
    e.preventDefault();
    if (!loginName.trim() || !loginPassword) return;

    try {
      setAuthLoading(true);

      if (authMode === "login") {
        const data = await loginRequest(loginName.trim(), loginPassword);
        localStorage.setItem("token", data.token);
        setToken(data.token);

        setLoginName("");
        setLoginPassword("");

        push("success", "Eingeloggt");
      } else {
        await registerRequest(loginName.trim(), loginPassword);
        setAuthMode("login");
        setLoginPassword("");

        push("success", "Registriert. Jetzt einloggen.");
      }
    } catch (err) {
      push("error", err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout(isAuto = false) {
    localStorage.removeItem("token");
    setToken(null);

    setTasks([]);
    setTasksError(null);

    if (isAuto) push("error", "Session abgelaufen. Bitte neu einloggen.");
    else push("info", "Logout");
  }

  // ---------------- Task anlegen ----------------
  async function handleAddTask(e) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const created = await createTask(newTaskTitle.trim());
      setTasks((prev) => [...prev, created]);
      setNewTaskTitle("");
      push("success", "Task erstellt");
    } catch (err) {
      if (err?.code === 401 || err?.message === "UNAUTHORIZED") {
        handleLogout(true);
        return;
      }
      setTasksError(err.message);
      push("error", err.message);
    }
  }

  // ---------------- Task löschen ----------------
  async function handleDeleteTask(id) {
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      push("info", "Task gelöscht");
    } catch (err) {
      if (err?.code === 401 || err?.message === "UNAUTHORIZED") {
        handleLogout(true);
        return;
      }
      setTasksError(err.message);
      push("error", err.message);
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
      push("success", "Status aktualisiert");
    } catch (err) {
      if (err?.code === 401 || err?.message === "UNAUTHORIZED") {
        handleLogout(true);
        return;
      }
      setTasksError(err.message);
      push("error", err.message);
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

  return (
    <div className="app">
      {/* Toasts */}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.text}
          </div>
        ))}
      </div>

      <div className="row topbar" style={{ justifyContent: "space-between" }}>
        <h1>Weather &amp; Task Dashboard</h1>

        <div className="row" style={{ gap: 10, alignItems: "center" }}>
          <button
            type="button"
            className="ghost"
            onClick={() => setDarkMode((v) => !v)}
            title="Dark Mode umschalten"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>

          {token ? (
            <>
              <span className="muted">
                Eingeloggt{displayLogin ? `: ${displayLogin}` : ""}
              </span>
              <button onClick={() => handleLogout(false)}>Logout</button>
            </>
          ) : (
            <span className="muted">Nicht eingeloggt</span>
          )}
        </div>
      </div>

      {/* Login/Register Panel */}
      {!token && (
        <section className="card" style={{ marginBottom: 16 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h2 style={{ margin: 0 }}>
              {authMode === "login" ? "Login" : "Registrieren"}
            </h2>

            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === "login" ? "register" : "login");
              }}
            >
              {authMode === "login" ? "Registrieren" : "Zum Login"}
            </button>
          </div>

          <form onSubmit={handleAuth} className="row" style={{ marginTop: 16 }}>
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
            <button type="submit" disabled={authLoading}>
              {authLoading
                ? "..."
                : authMode === "login"
                ? "Login"
                : "Registrieren"}
            </button>
          </form>

          <p className="muted" style={{ marginTop: 8 }}>
            Hinweis: Tasks laden/ändern geht erst nach Login.
          </p>
        </section>
      )}

      {/* KPIs: nur wenn eingeloggt */}
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
          <h2>Wetter</h2>

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
          <h2>Aufgaben</h2>

          {!token ? (
            <p className="muted">Bitte einloggen, um Tasks zu sehen.</p>
          ) : (
            <>
              <form onSubmit={handleAddTask} className="row">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Neue Aufgabe..."
                />
                <button type="submit">Hinzufügen</button>
              </form>

              {tasksLoading && <p className="muted">Lade Aufgaben...</p>}

              {tasksError && (
                <p className="error">Fehler bei Tasks: {tasksError}</p>
              )}

              {tasks.length === 0 && !tasksLoading && (
                <p className="muted">Noch keine Aufgaben vorhanden.</p>
              )}

              <ul className="task-list">
                {tasks.map((task) => {
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
                            borderColor: color,
                            borderWidth: 1,
                            borderStyle: "solid",
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
