package com.royal.grace.backend.service;

import com.royal.grace.backend.model.ProductImage;
import com.royal.grace.backend.repository.ProductImageRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Optional;

@Service
public class ProductImageService {

    private final ProductImageRepository repo;

    public ProductImageService(ProductImageRepository repo) {
        this.repo = repo;
    }

    public ProductImage saveOrReplace(String cardId, MultipartFile file) throws IOException {
        if (cardId == null || cardId.isBlank()) throw new IllegalArgumentException("cardId is required");
        validateFile(file);
        byte[] bytes = file.getBytes();

        ProductImage entity = repo.findByCardId(cardId).orElseGet(ProductImage::new);
        entity.setCardId(cardId);
        entity.setFilename(file.getOriginalFilename() != null ? file.getOriginalFilename() : cardId + ".png");
        entity.setContentType(file.getContentType() != null ? file.getContentType() : inferContentType(entity.getFilename()));
        entity.setSize(bytes.length);
        entity.setData(bytes);

        return repo.save(entity);
    }

    public Optional<ProductImage> getByCardId(String cardId) {
        return repo.findByCardId(cardId);
    }

    public boolean deleteByCardId(String cardId) {
        long count = repo.deleteByCardId(cardId);
        return count > 0;
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }
        String ct = file.getContentType() != null ? file.getContentType() : "";
        if (!(ct.startsWith("image/") || isAllowedExtension(file.getOriginalFilename()))) {
            throw new IllegalArgumentException("Only image files are allowed");
        }
        if (file.getSize() > 5L * 1024 * 1024) {
            throw new IllegalArgumentException("File too large. Max 5MB");
        }
    }

    private boolean isAllowedExtension(String name) {
        if (name == null) return false;
        String lower = name.toLowerCase();
        return lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".webp");
    }

    private String inferContentType(String filename) {
        if (filename == null) return "application/octet-stream";
        String lower = filename.toLowerCase();
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".webp")) return "image/webp";
        return "application/octet-stream";
    }
}
