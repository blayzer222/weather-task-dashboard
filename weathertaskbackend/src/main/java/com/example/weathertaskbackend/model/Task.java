package com.example.weathertaskbackend.model;

/*
 * Diese Klasse repräsentiert ein einzelnes Task-Objekt.
 * Sie wird sowohl vom Backend-Controller als auch vom Frontend genutzt.
 *
 * Felder:
 *  id      → eindeutige Nummer der Task
 *  title   → Beschreibung oder Titel der Aufgabe
 *  status  → Zustand der Aufgabe (NEW, IN_PROGRESS oder DONE)
 *
 * Dieses Modell wird automatisch durch Spring Boot in JSON konvertiert.
 */
public class Task {

    // Eindeutige ID der Task
    private int id;

    // Titel / Beschreibung der Aufgabe
    private String title;

    // Status der Aufgabe ("NEW", "IN_PROGRESS", "DONE")
    private String status;

    /*
     * Leerer Konstruktor:
     * Wird von Spring benötigt, um JSON automatisch in ein Java-Objekt umzuwandeln.
     */
    public Task() {}

    /*
     * Konstruktor für Fälle, in denen wir alle Werte manuell setzen wollen.
     */
    public Task(int id, String title, String status) {
        this.id = id;
        this.title = title;
        this.status = status;
    }

    // Getter & Setter Methoden
    // Werden von Spring und vom Serializer genutzt.

    public int getId() { 
        return id; 
    }

    public void setId(int id) { 
        this.id = id; 
    }

    public String getTitle() { 
        return title; 
    }

    public void setTitle(String title) { 
        this.title = title; 
    }

    public String getStatus() { 
        return status; 
    }

    public void setStatus(String status) { 
        this.status = status; 
    }
}
