import { useEffect, useState } from "react";
import {
  fetchTasks,
  createTask,
  deleteTask,
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

  // NEW: Register Mode
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"

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
      setTasksError(err.message);
    } finally {
      setTasksLoading(false);
    }
  }

  // ---------------- Initial: Wetter immer, Tasks nur wenn eingeloggt ----------------
  useEffect(() => {
    loadWeather();
    if (token) loadTasks();
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
        // register
        await registerRequest(name, loginPassword);

        // Nach Registrierung direkt auf Login umschalten (kein Auto-Login)
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

  function handleLogout() {
    localStorage.removeItem("token");
    setToken(null);
    setTasks([]);
    setTasksError(null);
  }

  // ---------------- Task anlegen ----------------
  async function handleAddTask(e) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const created = await createTask(newTaskTitle.trim());
      setTasks((prev) => [...prev, created]);
      setNewTaskTitle("");
    } catch (err) {
      setTasksError(err.message);
    }
  }

  // ---------------- Task löschen ----------------
  async function handleDeleteTask(id) {
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setTasksError(err.message);
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
    } catch (err) {
      setTasksError(err.message);
    }
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

  // ---------------- KPIs ----------------
  const total = tasks.length;
  const totalNew = tasks.filter((t) => (t.status || "NEW") === "NEW").length;
  const totalInProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const totalDone = tasks.filter((t) => t.status === "DONE").length;

  // ---------------- Render ----------------
  return (
    <div className="app">
      <div className="row topbar" style={{ justifyContent: "space-between" }}>
        <h1>Weather &amp; Task Dashboard</h1>

        <div className="row" style={{ marginBottom: 0 }}>
          {/* Dark Mode Toggle */}
          <button
            type="button"
            className="ghost"
            onClick={() => setDarkMode((v) => !v)}
            title="Dark Mode umschalten"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>

          {token ? (
            <button onClick={handleLogout}>Logout</button>
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
              {loginLoading ? "..." : authMode === "login" ? "Login" : "Registrieren"}
            </button>
          </form>

          {loginError && <p className="error">{loginError}</p>}

          <p className="muted" style={{ marginTop: 8 }}>
            Hinweis: Tasks laden/ändern geht erst nach Login.
          </p>
        </section>
      )}

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

          {weatherError && <p className="error">Fehler beim Wetter: {weatherError}</p>}

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

              {tasksLoading && <p>Lade Aufgaben...</p>}

              {tasksError && <p className="error">Fehler bei Tasks: {tasksError}</p>}

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
                            borderStyle: "solid",
                            borderWidth: 1,
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
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
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