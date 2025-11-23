package com.example.weathertaskbackend.scheduler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/*
 * Diese Klasse ist ein geplanter Hintergrundjob ("Scheduler"), 
 * der automatisch in bestimmten Zeitabständen ausgeführt wird.
 *
 * Er dient dazu, zu prüfen, ob das Backend läuft,
 * und schreibt regelmäßig eine Statusmeldung in die Konsole.
 *
 * Scheduler müssen mit @EnableScheduling in der Hauptklasse aktiviert werden.
 */
@Component
public class MaintenanceScheduler {

    // Logger zum Schreiben von Nachrichten in die Konsole
    private static final Logger log = LoggerFactory.getLogger(MaintenanceScheduler.class);

    /*
     * @Scheduled(fixedRate = 60000)
     *
     * Bedeutet:
     * - Diese Methode wird automatisch alle 60 Sekunden ausgeführt.
     *
     * fixedRate = Zeitabstand zwischen den einzelnen Ausführungen,
     * gemessen ab dem Start des vorherigen Durchlaufs.
     *
     * Zweck:
     * - Dient als "Heartbeat", der zeigt, dass das Backend aktiv ist.
     */
    @Scheduled(fixedRate = 60_000)
    public void logHeartbeat() {
        log.info(
            "Automatischer Wartungsjob – Backend läuft. Timestamp: {}",
            LocalDateTime.now()
        );
    }
}
