package com.example.weathertaskbackend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public MailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendVerificationEmail(String toEmail, String token) {
        String verifyLink = frontendUrl + "/verify-email?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Bitte bestätige deine E-Mail-Adresse");
        message.setText(
                "Hallo,\n\n" +
                "bitte bestätige deine E-Mail-Adresse über diesen Link:\n" +
                verifyLink + "\n\n" +
                "Falls du dich nicht registriert hast, kannst du diese Mail ignorieren."
        );

        mailSender.send(message);
    }

    public void sendResetPasswordEmail(String toEmail, String token) {
        String resetLink = frontendUrl + "/reset-password?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Passwort zurücksetzen");
        message.setText(
                "Hallo,\n\n" +
                "du kannst dein Passwort über diesen Link zurücksetzen:\n" +
                resetLink + "\n\n" +
                "Falls du das nicht warst, kannst du diese Mail ignorieren."
        );

        mailSender.send(message);
    }
}