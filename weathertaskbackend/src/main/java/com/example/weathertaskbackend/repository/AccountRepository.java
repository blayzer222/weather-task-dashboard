package com.example.weathertaskbackend.repository;

import com.example.weathertaskbackend.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Integer> {
    Optional<Account> findByLogin(String login);
    boolean existsByLogin(String login);
}
