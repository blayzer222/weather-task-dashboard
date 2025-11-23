package com.example.weathertaskbackend.controller;

import com.example.weathertaskbackend.model.Task;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

/*
 * REST-Controller für alle Task-bezogenen Endpunkte.
 * Dieser Controller stellt eine einfache In-Memory-Liste bereit,
 * die wie eine kleine Datenbank funktioniert.
 */
@RestController
@RequestMapping("/api/tasks")

/*
 * CORS-Konfiguration:
 * Erlaubt Anfragen vom React-Frontend (localhost:5173 / localhost:4173)
 * sowie GET, POST, PUT, DELETE und OPTIONS Requests.
 *
 * Ohne diese Einstellungen würde das Frontend blockiert werden.
 */
@CrossOrigin(
        origins = {
            "http://localhost:5173",
            "http://localhost:4173"
        },
        methods = {
            RequestMethod.GET,
            RequestMethod.POST,
            RequestMethod.PUT,
            RequestMethod.DELETE,
            RequestMethod.OPTIONS
        }
)
public class TaskController {

    // Eine einfache Liste, die alle Aufgaben speichert (nur im RAM).
    // Beim Neustart des Backends gehen die Daten verloren.
    private final List<Task> tasks = new ArrayList<>();

    // Zähler für die automatische Vergabe von IDs.
    private int nextId = 1;

    /*
     * GET /api/tasks
     * Gibt alle gespeicherten Tasks als Liste zurück.
     */
    @GetMapping
    public List<Task> getTasks() {
        return tasks;
    }

    /*
     * POST /api/tasks
     * Fügt eine neue Task hinzu.
     *
     * - @RequestBody → JSON vom Frontend wird in ein Task-Objekt umgewandelt
     * - Backend weist Task automatisch die nächste ID zu
     * - Falls kein Status gesetzt wurde, standardmäßig "NEW"
     */
    @PostMapping
    public Task addTask(@RequestBody Task task) {
        task.setId(nextId++);

        if (task.getStatus() == null || task.getStatus().isBlank()) {
            task.setStatus("NEW");
        }

        tasks.add(task);
        return task;
    }

    /*
     * DELETE /api/tasks/{id}
     * Entfernt eine Task anhand ihrer ID.
     *
     * removeIf(...) löscht das Objekt aus der Liste, wenn die Bedingung erfüllt ist.
     */
    @DeleteMapping("/{id}")
    public void deleteTask(@PathVariable int id) {
        tasks.removeIf(t -> t.getId() == id);
    }

    /*
     * PUT /api/tasks/{id}/status
     * Aktualisiert nur den Status der Task.
     *
     * Erwartet ein JSON mit { "status": "IN_PROGRESS" } oder "DONE".
     */
    @PutMapping("/{id}/status")
    public Task updateStatus(@PathVariable int id, @RequestBody Task updated) {
        for (Task t : tasks) {
            if (t.getId() == id) {
                t.setStatus(updated.getStatus());
                return t;
            }
        }

        // Wenn keine Task mit der ID gefunden wurde → null zurück
        // (im echten Projekt sollte eine Fehlermeldung kommen)
        return null;
    }
}
