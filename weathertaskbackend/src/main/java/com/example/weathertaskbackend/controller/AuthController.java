package com.example.weathertaskbackend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
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

@Tag(name = "Authentication", description = "Authentication and account management")
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

    @Operation(summary = "Login", description = "Authenticate user and return JWT token")
    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest req) {
        Account acc = accountRepo.findByEmail(req.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!encoder.matches(req.password(), acc.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        if (!acc.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please verify your email first");
        }

        String token = jwt.createToken(acc.getId(), acc.getEmail());
        return new LoginResponse(token);
    }

    @Operation(summary = "Register", description = "Register a new user and send verification email")
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody LoginRequest req) {
        if (req.email() == null || req.email().isBlank() ||
                req.password() == null || req.password().isBlank()) {
            return ResponseEntity.badRequest().body("email/password required");
        }

        String email = req.email().trim().toLowerCase();

        if (accountRepo.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("email already exists");
        }

        Account acc = new Account();
        acc.setLogin(email);
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

        return ResponseEntity.status(HttpStatus.CREATED)
                .body("registered - please verify your email");
    }

    @Operation(summary = "Verify email", description = "Verify user email using token")
    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        VerificationToken verificationToken = verificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid token"));

        if (verificationToken.isUsed()) {
            return ResponseEntity.badRequest().body("Token already used");
        }

        if (verificationToken.getExpiresAt().isBefore(LocalDateTime.now())) {
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

    @Operation(summary = "Forgot password", description = "Send password reset email")
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody LoginRequest req) {
        if (req.email() == null || req.email().isBlank()) {
            return ResponseEntity.badRequest().body("email required");
        }

        String email = req.email().trim().toLowerCase();
        Account account = accountRepo.findByEmail(email).orElse(null);

        // absichtlich neutrale Antwort, damit man nicht erkennen kann,
        // ob die E-Mail existiert
        if (account == null) {
            return ResponseEntity.ok("If the email exists, a reset link has been sent");
        }

        VerificationToken resetToken = new VerificationToken();
        resetToken.setToken(UUID.randomUUID().toString());
        resetToken.setAccount(account);
        resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(30));
        resetToken.setUsed(false);

        verificationTokenRepository.save(resetToken);

        mailService.sendResetPasswordEmail(account.getEmail(), resetToken.getToken());

        return ResponseEntity.ok("If the email exists, a reset link has been sent");
    }

    @Operation(summary = "Reset password", description = "Reset password using token")
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestParam String token,
                                           @RequestParam String newPassword) {
        if (newPassword == null || newPassword.isBlank()) {
            return ResponseEntity.badRequest().body("new password required");
        }

        VerificationToken verificationToken = verificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid token"));

        if (verificationToken.isUsed()) {
            return ResponseEntity.badRequest().body("Token already used");
        }

        if (verificationToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Token expired");
        }

        Account account = verificationToken.getAccount();
        account.setPassword(encoder.encode(newPassword));
        accountRepo.save(account);

        verificationToken.setUsed(true);
        verificationTokenRepository.save(verificationToken);

        return ResponseEntity.ok("Password reset successfully");
    }
}