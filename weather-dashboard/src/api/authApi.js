const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (res.status === 401) {
    const text = await res.text();
    throw new Error(text || "Login fehlgeschlagen: 401");
  }

  if (!res.ok) {
    throw new Error("Login fehlgeschlagen: " + res.status);
  }

  return await res.json();
}

export async function register(email, password) {
  const res = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (res.status === 409) {
    throw new Error("E-Mail existiert bereits");
  }

  if (res.status === 400) {
    const text = await res.text();
    throw new Error(text || "Registrierung fehlgeschlagen: 400");
  }

  if (!res.ok) {
    throw new Error("Registrierung fehlgeschlagen: " + res.status);
  }

  return await res.text();
}