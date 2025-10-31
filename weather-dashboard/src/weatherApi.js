// src/api/weatherApi.js

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY; // aus .env
const BASE_URL = "https://api.openweathermap.org/data/2.5";

export async function getWeather(city) {
  const response = await fetch(`${BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}`);
  if (!response.ok) throw new Error("Fehler beim Abrufen der Wetterdaten");
  return await response.json();
}
