const BASE_URL = "http://localhost:8081/api/tasks";

export async function fetchTasks() {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error("Fehler beim Abrufen der Tasks: " + res.status);
  return await res.json();
}

export async function createTask(title) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, status: "NEW" }),
  });

  if (!res.ok) throw new Error("Fehler beim Anlegen der Task: " + res.status);
  return await res.json();
}

export async function deleteTask(id) {
  const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Fehler beim Löschen der Task: " + res.status);
}

export async function updateTaskStatus(id, status) {
  const res = await fetch(`${BASE_URL}/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  if (!res.ok)
    throw new Error("Fehler beim Ändern des Status: " + res.status);
  return await res.json();
}
