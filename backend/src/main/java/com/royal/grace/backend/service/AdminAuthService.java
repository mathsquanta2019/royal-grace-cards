package com.royal.grace.backend.service;

import com.royal.grace.backend.model.AdminPasswordResetToken;
import com.royal.grace.backend.model.AdminUser;
import com.royal.grace.backend.repository.AdminPasswordResetTokenRepository;
import com.royal.grace.backend.repository.AdminUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;

@Service
public class AdminAuthService {

    private final AdminUserRepository users;
    private final AdminPasswordResetTokenRepository tokens;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private final SecureRandom random = new SecureRandom();

    public AdminAuthService(AdminUserRepository users, AdminPasswordResetTokenRepository tokens) {
        this.users = users;
        this.tokens = tokens;
    }

    public boolean verifyCredentials(String username, String rawPassword) {
        if (!StringUtils.hasText(username) || !StringUtils.hasText(rawPassword)) return false;
        return users.findByUsername(username)
                .map(u -> encoder.matches(rawPassword, u.getPasswordHash()))
                .orElse(false);
    }

    @Transactional
    public boolean changePassword(String username, String currentPassword, String newPassword) {
        Optional<AdminUser> opt = users.findByUsername(username);
        if (opt.isEmpty()) return false;
        AdminUser user = opt.get();
        if (!encoder.matches(currentPassword, user.getPasswordHash())) return false;
        validateNewPassword(newPassword);
        user.setPasswordHash(encoder.encode(newPassword));
        users.save(user);
        return true;
    }

    @Transactional
    public String createResetTokenFor(String usernameOrEmail, Duration ttl) {
        Optional<AdminUser> userOpt = StringUtils.hasText(usernameOrEmail) && usernameOrEmail.contains("@")
                ? users.findByEmail(usernameOrEmail)
                : users.findByUsername(usernameOrEmail);

        if (userOpt.isEmpty()) {
            // Do not leak existence
            return null;
        }
        AdminUser user = userOpt.get();
        byte[] buf = new byte[32];
        random.nextBytes(buf);
        String tokenString = Base64.getUrlEncoder().withoutPadding().encodeToString(buf);

        AdminPasswordResetToken token = new AdminPasswordResetToken();
        token.setToken(tokenString);
        token.setUser(user);
        token.setExpiresAt(Instant.now().plus(ttl != null ? ttl : Duration.ofHours(1)));
        tokens.save(token);
        return tokenString;
    }

    @Transactional
    public boolean resetPasswordWithToken(String tokenString, String newPassword) {
        if (!StringUtils.hasText(tokenString)) return false;
        Optional<AdminPasswordResetToken> opt = tokens.findByToken(tokenString);
        if (opt.isEmpty()) return false;
        AdminPasswordResetToken t = opt.get();
        if (t.isUsed() || t.getExpiresAt().isBefore(Instant.now())) return false;
        AdminUser user = t.getUser();
        validateNewPassword(newPassword);
        user.setPasswordHash(encoder.encode(newPassword));
        users.save(user);
        t.setUsed(true);
        tokens.save(t);
        return true;
    }

    private void validateNewPassword(String newPassword) {
        if (!StringUtils.hasText(newPassword) || newPassword.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long");
        }
        // Further complexity checks could be added here as needed.
    }
}
