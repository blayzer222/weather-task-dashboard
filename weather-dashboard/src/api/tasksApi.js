// Basis-URL des Task-Backends. Alle Requests gehen an diesen Endpunkt.
// /api/tasks → wird im Spring-Boot-Backend im TaskController verarbeitet.
const BASE_URL = "http://localhost:8081/api/tasks";

/*
 * Lädt alle Aufgaben aus dem Backend.
 * Macht einen GET-Request an /api/tasks und gibt die Liste der Tasks zurück.
 */
export async function fetchTasks() {
  const res = await fetch(BASE_URL);

  // wenn der Server eine Fehlerantwort sendet (z.B. 500), wird der Fehler weitergegeben
  if (!res.ok) throw new Error("Fehler beim Abrufen der Tasks: " + res.status);

  // JSON-Daten extrahieren und zurückgeben
  return await res.json();
}

/*
 * Legt eine neue Aufgabe im Backend an.
 * Sendet einen POST-Request an /api/tasks.
 * title → Text der Aufgabe
 * status → initial immer "NEW"
 */
export async function createTask(title) {
  const res = await fetch(BASE_URL, {
    method: "POST", // neue Ressource erstellen
    headers: { "Content-Type": "application/json" }, // JSON wird gesendet
    body: JSON.stringify({ title, status: "NEW" }), // Inhalt der neuen Aufgabe
  });

  if (!res.ok) throw new Error("Fehler beim Anlegen der Task: " + res.status);

  // das Backend gibt die neu angelegte Aufgabe als JSON zurück
  return await res.json();
}

/*
 * Löscht eine Aufgabe anhand ihrer ID.
 * Sendet DELETE-Request an /api/tasks/{id}
 */
export async function deleteTask(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });

  // das Backend gibt keinen Body zurück, aber der Statuscode muss ok sein
  if (!res.ok) throw new Error("Fehler beim Löschen der Task: " + res.status);
}

/*
 * Ändert den Status einer Aufgabe (NEW → IN_PROGRESS → DONE).
 * Sendet PUT-Request an /api/tasks/{id}/status.
 * Das Backend gibt die aktualisierte Aufgabe zurück.
 */
export async function updateTaskStatus(id, status) {
  const res = await fetch(`${BASE_URL}/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }), // nur der Status wird übertragen
  });

  if (!res.ok)
    throw new Error("Fehler beim Ändern des Status: " + res.status);

  // aktualisierte Aufgabe als JSON zurückgeben
  return await res.json();
}
