// React-Hooks importieren: useState für Zustände, useEffect für Logik beim Laden der Seite
import { useEffect, useState } from "react";
// eigene API-Funktionen für das Task-Backend
import {
  fetchTasks,
  createTask,
  deleteTask,
  updateTaskStatus,
} from "./api/tasksApi";
// zentrales CSS der Anwendung
import "./App.css";

function App() {
  // ---------------- Wetter-Status (State) ----------------

  // aktuell ausgewählte Stadt für die Wetterabfrage
  const [city, setCity] = useState("Berlin");
  // Wetterdaten, die von der OpenWeatherMap-API geladen werden
  const [weather, setWeather] = useState(null);
  // Fehlermeldung, falls beim Laden des Wetters ein Fehler auftritt
  const [weatherError, setWeatherError] = useState(null);

  // ---------------- Aufgaben-Status (State) ----------------

  // Liste aller Tasks, die vom Backend geladen werden
  const [tasks, setTasks] = useState([]);
  // Fehlermeldung für Probleme mit der Task-API
  const [tasksError, setTasksError] = useState(null);
  // aktueller Text im Eingabefeld für eine neue Aufgabe
  const [newTaskTitle, setNewTaskTitle] = useState("");
  // gibt an, ob die Aufgaben im Moment geladen werden (Ladeanzeige)
  const [tasksLoading, setTasksLoading] = useState(false);

  // API-Key für OpenWeatherMap, aus der .env-Datei von Vite gelesen
  const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

  // ---------------- Wetter von externer API laden ----------------

  async function loadWeather() {
    // wenn keine Stadt eingetragen ist, nichts tun
    if (!city) return;
    try {
      // alte Fehlermeldung zurücksetzen
      setWeatherError(null);

      // HTTP-Request an OpenWeatherMap senden
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=de`
      );

      // wenn der Statuscode kein Erfolg ist (z. B. 404), Fehler werfen
      if (!res.ok) {
        throw new Error("Stadt nicht gefunden oder API-Fehler");
      }

      // Antwort als JSON einlesen
      const data = await res.json();
      // Wetterdaten im State speichern, damit React neu rendert
      setWeather(data);
    } catch (err) {
      // bei Fehler: Wetterdaten löschen und Fehlermeldung anzeigen
      setWeather(null);
      setWeatherError(err.message);
    }
  }

  // ---------------- Aufgabenliste aus dem Backend laden ----------------

  async function loadTasks() {
    try {
      // Ladeanzeige aktivieren und Fehlermeldung zurücksetzen
      setTasksLoading(true);
      setTasksError(null);

      // GET-Request an /api/tasks (siehe tasksApi.js)
      const data = await fetchTasks();
      // Aufgabenliste im State speichern
      setTasks(data);
    } catch (err) {
      // Fehlertext im UI anzeigen
      setTasksError(err.message);
    } finally {
      // Ladeanzeige immer deaktivieren, egal ob Erfolg oder Fehler
      setTasksLoading(false);
    }
  }

  // ---------------- Initiales Laden beim Start der Seite ----------------

  // useEffect ohne Abhängigkeiten-Array-Änderungen → wird genau einmal beim Mount ausgeführt
  useEffect(() => {
    loadTasks();   // Aufgaben aus dem internen Backend laden
    loadWeather(); // erstes Wetter (Standard-Stadt Berlin) laden
  }, []);

  // ---------------- Neue Aufgabe anlegen ----------------

  async function handleAddTask(e) {
    // verhindert, dass das Formular einen Seiten-Reload auslöst
    e.preventDefault();

    // leere Eingaben ignorieren
    if (!newTaskTitle.trim()) return;

    try {
      // POST-Request an /api/tasks, Backend legt Task an
      const created = await createTask(newTaskTitle.trim());

      // neue Aufgabe an bestehende Liste anhängen
      setTasks((prev) => [...prev, created]);

      // Eingabefeld leeren
      setNewTaskTitle("");
    } catch (err) {
      // Fehler bei der Kommunikation mit dem Backend anzeigen
      setTasksError(err.message);
    }
  }

  // ---------------- Aufgabe löschen ----------------

  async function handleDeleteTask(id) {
    try {
      // DELETE-Request an /api/tasks/{id}
      await deleteTask(id);

      // gelöschte Aufgabe aus dem State herausfiltern
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setTasksError(err.message);
    }
  }

  // ---------------- Status einer Aufgabe ändern ----------------

  async function handleStatusChange(id, newStatus) {
    try {
      // PUT-Request an /api/tasks/{id}/status
      const updated = await updateTaskStatus(id, newStatus);

      // lokale Liste aktualisieren: nur die betroffene Aufgabe bekommt den neuen Status
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, status: updated.status } : task
        )
      );
    } catch (err) {
      setTasksError(err.message);
    }
  }

  // ---------------- Farbe für den jeweiligen Status bestimmen ----------------

  function getStatusColor(status) {
    switch (status) {
      case "IN_PROGRESS":
        return "#f59e0b"; // orange für „in Bearbeitung“
      case "DONE":
        return "#22c55e"; // grün für „fertig“
      case "NEW":
      default:
        return "#3b82f6"; // blau für neue Aufgaben
    }
  }

  // ---------------- Kennzahlen fürs Dashboard berechnen ----------------

  // Anzahl aller Tasks
  const total = tasks.length;
  // Anzahl der neuen Tasks (Status NEW oder kein Status gesetzt)
  const totalNew = tasks.filter((t) => (t.status || "NEW") === "NEW").length;
  // Anzahl der Tasks mit Status IN_PROGRESS
  const totalInProgress = tasks.filter(
    (t) => t.status === "IN_PROGRESS"
  ).length;
  // Anzahl der abgeschlossenen Tasks
  const totalDone = tasks.filter((t) => t.status === "DONE").length;

  // ---------------- Render-Funktion: UI-Aufbau ----------------

  return (
    <div className="app">
      <h1>Weather &amp; Task Dashboard</h1>

      {/* Kennzahlen-Leiste mit Gesamtanzahl und Verteilung nach Status */}
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

      {/* Grid-Layout: Wetterkarte links, Aufgaben rechts (auf großen Screens) */}
      <div className="dashboard-grid">
        {/* Wetter-Bereich */}
        <section className="card">
          <h2>Wetter</h2>

          {/* Eingabefeld für die Stadt + Button zum Laden der Wetterdaten */}
          <div className="row">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Stadt eingeben..."
            />
            <button onClick={loadWeather}>Wetter laden</button>
          </div>

          {/* Fehlermeldung für die Wetter-API */}
          {weatherError && (
            <p className="error">Fehler beim Wetter: {weatherError}</p>
          )}

          {/* Wetterdaten werden angezeigt, wenn erfolgreich geladen */}
          {weather && (
            <div className="weather-info">
              <h3>{weather.name}</h3>
              <p className="weather-temp">
                {Math.round(weather.main.temp)}°C
              </p>
              <p className="weather-desc">
                {weather.weather[0].description}
              </p>
            </div>
          )}
        </section>

        {/* Aufgaben-Bereich */}
        <section className="card">
          <h2>Aufgaben</h2>

          {/* Formular zum Anlegen einer neuen Aufgabe */}
          <form onSubmit={handleAddTask} className="row">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Neue Aufgabe..."
            />
            <button type="submit">Hinzufügen</button>
          </form>

          {/* Anzeige, dass Tasks gerade geladen werden */}
          {tasksLoading && <p>Lade Aufgaben...</p>}

          {/* Fehlermeldung für Probleme mit dem Task-Backend */}
          {tasksError && (
            <p className="error">Fehler bei Tasks: {tasksError}</p>
          )}

          {/* Hinweis, falls noch keine Aufgaben existieren */}
          {tasks.length === 0 && !tasksLoading && (
            <p className="muted">Noch keine Aufgaben vorhanden.</p>
          )}

          {/* Liste der Aufgaben */}
          <ul className="task-list">
            {tasks.map((task) => {
              // Standardstatus ist NEW, falls keiner gesetzt ist
              const status = task.status || "NEW";
              const color = getStatusColor(status);

              return (
                <li key={task.id} className="task-item">
                  {/* Titel und Status-Pill */}
                  <div className="task-main">
                    <span className="task-title">{task.title}</span>
                    <span
                      className="status-pill"
                      style={{
                        // Hintergrund leicht transparent in Status-Farbe
                        backgroundColor: `${color}1A`,
                        color,
                        borderColor: color,
                      }}
                    >
                      {status === "NEW"
                        ? "New"
                        : status === "IN_PROGRESS"
                        ? "In Progress"
                        : "Done"}
                    </span>
                  </div>

                  {/* Aktionen pro Task: Status ändern und Löschen */}
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
        </section>
      </div>
    </div>
  );
}

export default App;
