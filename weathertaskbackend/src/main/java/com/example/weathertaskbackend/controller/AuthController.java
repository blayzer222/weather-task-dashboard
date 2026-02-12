package com.example.weathertaskbackend.controller;

import com.example.weathertaskbackend.dto.LoginRequest;
import com.example.weathertaskbackend.dto.LoginResponse;
import com.example.weathertaskbackend.model.Account;
import com.example.weathertaskbackend.repository.AccountRepository;
import com.example.weathertaskbackend.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:4173"})
public class AuthController {

  private final AccountRepository accountRepo;
  private final PasswordEncoder encoder;
  private final JwtService jwt;

  public AuthController(AccountRepository accountRepo, PasswordEncoder encoder, JwtService jwt) {
    this.accountRepo = accountRepo;
    this.encoder = encoder;
    this.jwt = jwt;
  }

  @PostMapping("/login")
  public LoginResponse login(@RequestBody LoginRequest req) {
    Account acc = accountRepo.findByLogin(req.login())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

    if (!encoder.matches(req.password(), acc.getPassword())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
    }

    String token = jwt.createToken(acc.getId(), acc.getLogin());
    return new LoginResponse(token);
  }
}
