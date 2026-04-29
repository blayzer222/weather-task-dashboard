package com.example.weathertaskbackend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Tag(name = "Weather", description = "Weather data from OpenWeather API")
@RestController
@RequestMapping("/api/weather")
public class WeatherController {

    @Value("${openweather.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    @Operation(
            summary = "Get weather by city",
            description = "Returns current weather data for a given city using OpenWeather API"
    )
    @GetMapping
        public Map<String, Object> getWeather(@RequestParam(defaultValue = "Berlin") String city) {

        String url = "https://api.openweathermap.org/data/2.5/weather"
                + "?q=" + city
                + "&appid=" + apiKey
                + "&units=metric"
                + "&lang=de";

        Map response = restTemplate.getForObject(url, Map.class);

        // 🔹 Daten sauber extrahieren
        Map<?, ?> main = (Map<?, ?>) response.get("main");
        Map<?, ?> wind = (Map<?, ?>) response.get("wind");
        Map<?, ?> weather = (Map<?, ?>) ((java.util.List<?>) response.get("weather")).get(0);

        // 🔹 Saubere Antwort zurückgeben
        return Map.of(
                "city", response.get("name"),
                "temperature", main.get("temp"),
                "description", weather.get("description"),
                "humidity", main.get("humidity"),
                "windSpeed", wind.get("speed"),
                "icon", weather.get("icon")   // 🔥 WICHTIG
        );
        }
}