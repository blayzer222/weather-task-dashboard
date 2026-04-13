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
            repo.findByEmail("demo@test.com").ifPresentOrElse(acc -> {
                if (!acc.getPassword().startsWith("$2")) {
                    acc.setPassword(encoder.encode("demo"));
                    repo.save(acc);
                }
            }, () -> {
                Account acc = new Account();
                acc.setLogin("demo@test.com");
                acc.setEmail("demo@test.com");
                acc.setPassword(encoder.encode("demo"));
                acc.setNickname("Demo");
                acc.setEnabled(true);
                acc.setEmailVerified(false);
                acc.setTimeOfCreation(java.time.LocalDateTime.now());
                repo.save(acc);
            });
        };
    }
}
