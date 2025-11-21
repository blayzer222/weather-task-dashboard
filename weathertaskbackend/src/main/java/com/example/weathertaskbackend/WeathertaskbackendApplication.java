package com.example.weathertaskbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class WeathertaskbackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(WeathertaskbackendApplication.class, args);
    }
}
