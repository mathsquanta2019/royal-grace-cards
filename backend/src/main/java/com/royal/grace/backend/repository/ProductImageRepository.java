package com.royal.grace.backend.repository;

import com.royal.grace.backend.model.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ProductImageRepository extends JpaRepository<ProductImage, UUID> {
    Optional<ProductImage> findByCardId(String cardId);
    long deleteByCardId(String cardId);
}
