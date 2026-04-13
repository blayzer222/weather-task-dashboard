package com.example.weathertaskbackend.controller;

import com.example.weathertaskbackend.dto.LoginRequest;
import com.example.weathertaskbackend.dto.LoginResponse;
import com.example.weathertaskbackend.model.Account;
import com.example.weathertaskbackend.model.VerificationToken;
import com.example.weathertaskbackend.repository.AccountRepository;
import com.example.weathertaskbackend.repository.VerificationTokenRepository;
import com.example.weathertaskbackend.security.JwtService;
import com.example.weathertaskbackend.service.MailService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
public class AuthController {

    private final AccountRepository accountRepo;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final VerificationTokenRepository verificationTokenRepository;
    private final MailService mailService;

    public AuthController(AccountRepository accountRepo,
                          PasswordEncoder encoder,
                          JwtService jwt,
                          VerificationTokenRepository verificationTokenRepository,
                          MailService mailService) {
        this.accountRepo = accountRepo;
        this.encoder = encoder;
        this.jwt = jwt;
        this.verificationTokenRepository = verificationTokenRepository;
        this.mailService = mailService;
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest req) {
        Account acc = accountRepo.findByEmail(req.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!encoder.matches(req.password(), acc.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        if (!acc.isEnabled()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please verify your email first"
            );
        }

        String token = jwt.createToken(acc.getId(), acc.getEmail());
        return new LoginResponse(token);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody LoginRequest req) {
        if (req.email() == null || req.email().isBlank() ||
                req.password() == null || req.password().isBlank()) {
            return ResponseEntity.badRequest().body("email/password required");
        }

        String email = req.email().trim();

        if (accountRepo.existsByEmail(email)) {
            return ResponseEntity.status(409).body("email already exists");
        }

        Account acc = new Account();
        acc.setLogin(email); // Übergangslösung, bis login komplett entfernt wird
        acc.setEmail(email);
        acc.setPassword(encoder.encode(req.password()));
        acc.setNickname("User");
        acc.setEnabled(false);
        acc.setEmailVerified(false);
        acc.setTimeOfCreation(LocalDateTime.now());

        accountRepo.save(acc);

        VerificationToken verificationToken = new VerificationToken();
        verificationToken.setToken(UUID.randomUUID().toString());
        verificationToken.setAccount(acc);
        verificationToken.setExpiresAt(LocalDateTime.now().plusHours(24));
        verificationToken.setUsed(false);

        verificationTokenRepository.save(verificationToken);

        mailService.sendVerificationEmail(acc.getEmail(), verificationToken.getToken());

        return ResponseEntity.status(201).body("registered - please verify your email");
    }

    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {

        VerificationToken verificationToken = verificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid token"));

        if (verificationToken.isUsed()) {
            return ResponseEntity.badRequest().body("Token already used");
        }

        if (verificationToken.getExpiresAt().isBefore(java.time.LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Token expired");
        }

        Account account = verificationToken.getAccount();

        account.setEnabled(true);
        account.setEmailVerified(true);
        accountRepo.save(account);

        verificationToken.setUsed(true);
        verificationTokenRepository.save(verificationToken);

        return ResponseEntity.ok("Email verified successfully");
    }
}