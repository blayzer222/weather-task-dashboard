const BASE_URL = "http://localhost:8081/api/tasks";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchTasks() {
  const res = await fetch(BASE_URL, { headers: authHeaders() });
  if (!res.ok) throw new Error("Fehler beim Abrufen der Tasks: " + res.status);
  return await res.json();
}

export async function createTask(title) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ title, status: "NEW" }),
  });
  if (!res.ok) throw new Error("Fehler beim Anlegen der Task: " + res.status);
  return await res.json();
}

export async function deleteTask(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Fehler beim Löschen der Task: " + res.status);
}

export async function updateTaskStatus(id, status) {
  const res = await fetch(`${BASE_URL}/${id}/status`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok)
    throw new Error("Fehler beim Ändern des Status: " + res.status);
  return await res.json();
}
