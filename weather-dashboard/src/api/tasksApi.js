const BASE_URL = "http://localhost:8081";
const TASKS_PATH = "/api/tasks"; // <-- das ist sehr wahrscheinlich bei dir korrekt

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...authHeader(),
      "Content-Type": "application/json",
    },
  });

  if (res.status === 401) {
    const err = new Error("UNAUTHORIZED");
    err.code = 401;
    throw err;
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

export async function fetchTasks() {
  return request(`${TASKS_PATH}`, { method: "GET" });
}

export async function createTask(title) {
  return request(`${TASKS_PATH}`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export async function deleteTask(id) {
  return request(`${TASKS_PATH}/${id}`, { method: "DELETE" });
}

export async function updateTaskStatus(id, status) {
  return request(`${TASKS_PATH}/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}
