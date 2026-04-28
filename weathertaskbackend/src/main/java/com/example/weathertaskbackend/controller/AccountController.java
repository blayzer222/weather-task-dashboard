package com.example.weathertaskbackend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import com.example.weathertaskbackend.dto.UpdateProfileRequest;
import com.example.weathertaskbackend.model.Account;
import com.example.weathertaskbackend.repository.AccountRepository;
import com.example.weathertaskbackend.security.JwtService;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Account", description = "Endpoints for user profile management")
@RestController
@RequestMapping("/api/account")
public class AccountController {

    private final AccountRepository accountRepository;
    private final JwtService jwtService;

    public AccountController(AccountRepository accountRepository, JwtService jwtService) {
        this.accountRepository = accountRepository;
        this.jwtService = jwtService;
    }

    @Operation(summary = "Get current user", description = "Returns the currently authenticated user profile")
    @GetMapping("/me")
    public Account getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String email = jwtService.extractEmail(token);

        return accountRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

     @Operation(summary = "Update current user", description = "Updates email, phone and avatar of the current user")
    @PutMapping("/me")
    public Account updateCurrentUser(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody UpdateProfileRequest request
    ) {
        String token = authHeader.substring(7);
        String email = jwtService.extractEmail(token);

        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        account.setEmail(request.getEmail());
        account.setPhone(request.getPhone());
        account.setAvatarUrl(request.getAvatarUrl());

        return accountRepository.save(account);
    }
}