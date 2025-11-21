package com.example.weathertaskbackend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class WeatherController {

    @GetMapping("/api/weather")
    public Map<String, Object> getWeather() {
        return Map.of(
                "city", "Berlin",
                "temperature", 12,
                "description", "Leicht bewölkt"
        );
    }
}
