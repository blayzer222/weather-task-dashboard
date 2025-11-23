// src/api/weatherApi.js

// API-Key wird aus der .env-Datei geladen (Vite-Umgebung)
// Dadurch bleibt der Key NICHT im Code sichtbar → sicherer.
const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

// Basis-URL der OpenWeatherMap API.
// Wir hängen später Endpunkte wie /weather dran.
const BASE_URL = "https://api.openweathermap.org/data/2.5";

/*
  Ruft das Wetter einer bestimmten Stadt ab.

  Parameter:
    city → Name der Stadt, z.B. "Berlin"

  Ablauf:
    - Die Funktion baut die komplette URL zusammen
    - Schickt eine HTTP-GET-Anfrage
    - Wenn die API einen Fehler zurückgibt (z.B. Stadt existiert nicht),
      wird eine Fehlermeldung geworfen
    - Wenn alles klappt, wird der JSON-Body zurückgegeben
*/
export async function getWeather(city) {
  const response = await fetch(
    `${BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}`
  );

  // HTTP-Status prüfen (z.B. 404, 401, 500)
  if (!response.ok) {
    throw new Error("Fehler beim Abrufen der Wetterdaten");
  }

  // Antwort als JSON zurückgeben
  return await response.json();
}
