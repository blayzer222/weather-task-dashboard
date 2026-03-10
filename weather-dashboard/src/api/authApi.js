const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

export async function login(login, password) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password }),
  });

  if (!res.ok) throw new Error("Login fehlgeschlagen: " + res.status);
  return await res.json(); // { token }
}

export async function register(login, password) {
  const res = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password }),
  });

  if (res.status === 409) throw new Error("Login existiert bereits (409)");
  if (!res.ok) throw new Error("Registrierung fehlgeschlagen: " + res.status);

  // dein Backend gibt aktuell Text zurück ("registered"), kein JSON
  return await res.text();
}