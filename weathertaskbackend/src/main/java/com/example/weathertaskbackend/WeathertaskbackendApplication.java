package com.example.weathertaskbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/*
 * Dies ist die Hauptklasse der Spring-Boot-Anwendung.
 * 
 * Sie ist der Einstiegspunkt des Backends und wird ausgeführt,
 * sobald du den Server startest (z.B. über `mvn spring-boot:run`).
 *
 * Anmerkung:
 * - @SpringBootApplication kombiniert drei wichtige Spring-Annotationen:
 *      @Configuration      → definiert Beans / Einstellungen
 *      @EnableAutoConfiguration → aktiviert automatische Konfiguration
 *      @ComponentScan      → scannt alle Komponenten im Projekt
 *
 * - @EnableScheduling aktiviert alle Scheduler im Projekt,
 *   z. B. den MaintenanceScheduler, der alle 60 Sekunden läuft.
 */
@SpringBootApplication
@EnableScheduling
public class WeathertaskbackendApplication {

    /*
     * Die main()-Methode startet das Spring-Boot-Backend.
     *
     * SpringApplication.run(...) baut den Server auf,
     * initialisiert Controller, Services, Scheduler usw.
     *
     * Danach läuft das Backend als Webserver auf dem eingestellten Port
     * (standardmäßig 8080, bei dir 8081 durch deine Config).
     */
    public static void main(String[] args) {
        SpringApplication.run(WeathertaskbackendApplication.class, args);
    }
}
