package com.royal.grace.backend.repository;

import com.royal.grace.backend.model.AdminPasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface AdminPasswordResetTokenRepository extends JpaRepository<AdminPasswordResetToken, UUID> {
    Optional<AdminPasswordResetToken> findByToken(String token);
    long deleteByExpiresAtBefore(Instant cutoff);
}
