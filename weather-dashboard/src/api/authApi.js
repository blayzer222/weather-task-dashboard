const AUTH_URL = "http://localhost:8081/api/auth/login";

export async function login(login, password) {
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password }),
  });

  if (!res.ok) throw new Error("Login fehlgeschlagen: " + res.status);
  return await res.json(); // { token }
}
