package com.example.weathertaskbackend.config;

import com.example.weathertaskbackend.model.Account;
import com.example.weathertaskbackend.repository.AccountRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DemoUserSeeder {

    @Bean
    CommandLineRunner seedDemoUser(AccountRepository repo, PasswordEncoder encoder) {
        return args -> {
            repo.findByLogin("demo").ifPresentOrElse(acc -> {
                if (!acc.getPassword().startsWith("$2")) {
                    acc.setPassword(encoder.encode("demo"));
                    repo.save(acc);
                }
            }, () -> {
                Account acc = new Account();
                acc.setLogin("demo");
                acc.setPassword(encoder.encode("demo"));
                repo.save(acc);
            });
        };
    }
}
