import { useState, useEffect } from "react";
import { getWeather } from "./weatherApi";

function App() {
  const [weather, setWeather] = useState(null);
  const [city, setCity] = useState("Berlin");
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getWeather(city);
        setWeather(data);
      } catch (err) {
        setError(err.message);
      }
    }

    fetchData();
  }, [city]); // Wird neu geladen, wenn city sich ändert

  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">🌤️ Wetter-App</h1>

      <input
        type="text"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="Stadt eingeben"
        className="border p-2 rounded"
      />

      {error && <p className="text-red-500 mt-4">Fehler: {error}</p>}

      {weather && (
        <div className="mt-6">
          <h2 className="text-xl">{weather.name}</h2>
          <p>{Math.round(weather.main.temp)}°C</p>
          <p>{weather.weather[0].description}</p>
        </div>
      )}
    </div>
  );
}

export default App;
