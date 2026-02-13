const BASE_URL = "http://localhost:8081";

async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Auth failed: ${res.status}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

export async function login(login, password) {
  return post("/login", { login, password }); // => { token }
}

export async function register(login, password) {
  // Backend gibt text "registered" zurück
  return post("/register", { login, password });
}
