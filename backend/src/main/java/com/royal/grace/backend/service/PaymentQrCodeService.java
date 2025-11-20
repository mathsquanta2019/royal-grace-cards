package com.royal.grace.backend.service;

import com.royal.grace.backend.model.PaymentMethod;
import com.royal.grace.backend.model.PaymentQrCode;
import com.royal.grace.backend.repository.PaymentQrCodeRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Optional;

@Service
public class PaymentQrCodeService {

    private final PaymentQrCodeRepository repository;

    public PaymentQrCodeService(PaymentQrCodeRepository repository) {
        this.repository = repository;
    }

    public PaymentQrCode saveOrReplace(String methodString, MultipartFile file) throws IOException {
        PaymentMethod method = normalizeMethod(methodString);
        validateFile(file);

        byte[] bytes = file.getBytes();

        PaymentQrCode entity = repository.findByMethod(method).orElseGet(PaymentQrCode::new);
        entity.setMethod(method);
        entity.setFilename(file.getOriginalFilename() != null ? file.getOriginalFilename() : (method.name().toLowerCase() + ".png"));
        entity.setContentType(file.getContentType() != null ? file.getContentType() : inferContentType(entity.getFilename()));
        entity.setSize(bytes.length);
        entity.setData(bytes);

        return repository.save(entity);
    }

    public Optional<PaymentQrCode> getByMethod(String methodString) {
        PaymentMethod method = normalizeMethod(methodString);
        return repository.findByMethod(method);
    }

    public boolean deleteByMethod(String methodString) {
        PaymentMethod method = normalizeMethod(methodString);
        long count = repository.deleteByMethod(method);
        return count > 0;
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }
        String ct = file.getContentType() != null ? file.getContentType() : "";
        // Accept common image types
        if (!(ct.startsWith("image/") || isAllowedExtension(file.getOriginalFilename()))) {
            throw new IllegalArgumentException("Only image files are allowed");
        }
        // Limit ~5MB (actual limit also enforced by multipart config)
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

    private PaymentMethod normalizeMethod(String methodString) {
        PaymentMethod method = PaymentMethod.fromString(methodString);
        if (method == PaymentMethod.OTHER) {
            throw new IllegalArgumentException("Unsupported payment method: " + methodString);
        }
        return method;
    }
}
