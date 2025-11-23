package com.example.weathertaskbackend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/*
 * Einfacher REST-Controller für Wetterdaten.
 * Dieser dient als "interne API", die das Frontend abrufen kann.
 *
 * In dieser Version sind die Werte statisch, also fest im Code definiert.
 * Später könnte dieser Controller echte Daten aus OpenWeatherMap holen.
 */
@RestController
public class WeatherController {

    /*
     * GET /api/weather
     * Gibt ein kleines JSON-Objekt mit Beispiel-Wetterdaten zurück.
     *
     * Rückgabewert:
     *  {
     *      "city": "Berlin",
     *      "temperature": 12,
     *      "description": "Leicht bewölkt"
     *  }
     *
     * Map.of(...) wird genutzt, um ein kleines unveränderliches JSON zu erstellen.
     */
    @GetMapping("/api/weather")
    public Map<String, Object> getWeather() {
        return Map.of(
                "city", "Berlin",
                "temperature", 12,
                "description", "Leicht bewölkt"
        );
    }
}
