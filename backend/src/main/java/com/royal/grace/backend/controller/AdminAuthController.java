package com.royal.grace.backend.controller;

import com.royal.grace.backend.service.AdminAuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminAuthController {

    private static final Logger log = LoggerFactory.getLogger(AdminAuthController.class);
    private final AdminAuthService auth;

    public AdminAuthController(AdminAuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody Map<String, String> body) {
        String username = body.getOrDefault("username", "");
        String password = body.getOrDefault("password", "");
        boolean ok = auth.verifyCredentials(username, password);
        if (ok) return ResponseEntity.ok(Map.of("ok", true));
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("ok", false, "message", "Invalid credentials"));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body) {
        String username = body.getOrDefault("username", "");
        String current = body.getOrDefault("currentPassword", "");
        String newer = body.getOrDefault("newPassword", "");
        try {
            boolean ok = auth.changePassword(username, current, newer);
            if (!ok) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("success", false, "message", "Invalid current password or user"));
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String userOrEmail = body.getOrDefault("usernameOrEmail", "");
        String token = auth.createResetTokenFor(userOrEmail, Duration.ofHours(1));
        if (token != null) {
            // In absence of SMTP config, log the token for local testing.
            log.warn("Admin password reset token generated for '{}': {}", userOrEmail, token);
        }
        // Always return 200 to avoid user enumeration
        return ResponseEntity.ok(Map.of("success", true, "message", "If the account exists, a reset link has been sent.",
                // Expose token for local testing only; do not rely on this in production.
                "devToken", token == null ? "" : token));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.getOrDefault("token", "");
        String newer = body.getOrDefault("newPassword", "");
        try {
            boolean ok = auth.resetPasswordWithToken(token, newer);
            if (!ok) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "message", "Invalid or expired token"));
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
