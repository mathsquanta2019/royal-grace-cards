package com.royal.grace.backend.repository;

import com.royal.grace.backend.model.PaymentMethod;
import com.royal.grace.backend.model.PaymentQrCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PaymentQrCodeRepository extends JpaRepository<PaymentQrCode, UUID> {
    Optional<PaymentQrCode> findByMethod(PaymentMethod method);
    long deleteByMethod(PaymentMethod method);
}
