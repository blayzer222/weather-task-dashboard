package com.example.weathertaskbackend.scheduler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class MaintenanceScheduler {

    private static final Logger log = LoggerFactory.getLogger(MaintenanceScheduler.class);

    // führt den Job alle 60 Sekunden aus (zum Testen)
    @Scheduled(fixedRate = 60_000)
    public void logHeartbeat() {
        log.info("Automatischer Wartungsjob – Backend läuft. Timestamp: {}", LocalDateTime.now());
    }
}
