package com.example.weathertaskbackend.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {
  // Für Entwicklung ok. Später als ENV/Secret.
  private static final String SECRET = "CHANGE_ME_TO_A_LONG_RANDOM_SECRET_32+CHARS_MIN!!!";

  private Key key() {
    return Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
  }

  public String createToken(Integer accountId, String login) {
    Instant now = Instant.now();
    return Jwts.builder()
        .subject(login)
        .claim("accountId", accountId)
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plusSeconds(60 * 60 * 6))) // 6h
        .signWith(key())
        .compact();
  }

  public Integer extractAccountId(String token) {
    Object v = Jwts.parser().verifyWith((javax.crypto.SecretKey) key()).build()
        .parseSignedClaims(token).getPayload().get("accountId");
    return (v instanceof Integer i) ? i : Integer.valueOf(v.toString());
  }

  public String extractLogin(String token) {
    return Jwts.parser().verifyWith((javax.crypto.SecretKey) key()).build()
        .parseSignedClaims(token).getPayload().getSubject();
  }
}
