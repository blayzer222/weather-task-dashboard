import { useEffect, useState } from "react";
import {
  fetchTasks,
  createTask,
  deleteTask,
  updateTaskStatus,
} from "./api/tasksApi";
import "./App.css";

function App() {
  const [city, setCity] = useState("Berlin");
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState(null);

  const [tasks, setTasks] = useState([]);
  const [tasksError, setTasksError] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [tasksLoading, setTasksLoading] = useState(false);

  const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

  async function loadWeather() {
    if (!city) return;
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

  useEffect(() => {
    loadTasks();
    loadWeather();
  }, []);

  async function handleAddTask(e) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    console.log("Task hinzufügen:", newTaskTitle); // 🔍 Debug

    try {
      const created = await createTask(newTaskTitle.trim());
      console.log("Task vom Backend zurück:", created); // 🔍 Debug
      setTasks((prev) => [...prev, created]);
      setNewTaskTitle("");
    } catch (err) {
      console.error(err);
      setTasksError(err.message);
    }
  }

  async function handleDeleteTask(id) {
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setTasksError(err.message);
    }
  }

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

  return (
    <div className="app">
      <h1>Weather &amp; Task Dashboard</h1>

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
            <p>
              {Math.round(weather.main.temp)}°C –{" "}
              {weather.weather[0].description}
            </p>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Aufgaben</h2>

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
          {tasks.map((task) => (
            <li key={task.id} className="task-item">
              <span>{task.title}</span>

              <select
                value={task.status || "NEW"}
                onChange={(e) =>
                  handleStatusChange(task.id, e.target.value)
                }
              >
                <option value="NEW">New</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>

              <button onClick={() => handleDeleteTask(task.id)}>Löschen</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default App;
