package com.royal.grace.backend.controller;

import com.royal.grace.backend.model.PaymentQrCode;
import com.royal.grace.backend.service.PaymentQrCodeService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payment/qr-codes")
public class PaymentQrCodeController {

    private final PaymentQrCodeService service;

    public PaymentQrCodeController(PaymentQrCodeService service) {
        this.service = service;
    }

    @PostMapping(path = "/{method}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> upload(@PathVariable("method") String method,
                                    @RequestParam("file") MultipartFile file) {
        try {
            PaymentQrCode saved = service.saveOrReplace(method, file);
            Map<String, Object> resp = new HashMap<>();
            resp.put("id", saved.getId());
            resp.put("method", saved.getMethod());
            resp.put("filename", saved.getFilename());
            resp.put("contentType", saved.getContentType());
            resp.put("size", saved.getSize());
            resp.put("updatedAt", saved.getUpdatedAt());
            // A relative URL to fetch the image
            resp.put("url", "/api/payment/qr-codes/" + method);
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to read uploaded file"));
        }
    }

    @GetMapping(path = "/{method}")
    public ResponseEntity<byte[]> get(@PathVariable("method") String method) {
        return service.getByMethod(method)
                .map(entity -> {
                    HttpHeaders headers = new HttpHeaders();
                    headers.set(HttpHeaders.CONTENT_TYPE, entity.getContentType());
                    headers.set(HttpHeaders.CACHE_CONTROL, "public, max-age=600");
                    headers.set(HttpHeaders.LAST_MODIFIED, String.valueOf(entity.getUpdatedAt().toEpochMilli()));
                    return new ResponseEntity<>(entity.getData(), headers, HttpStatus.OK);
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(null));
    }

    @DeleteMapping(path = "/{method}")
    public ResponseEntity<?> delete(@PathVariable("method") String method) {
        try {
            boolean deleted = service.deleteByMethod(method);
            if (deleted) return ResponseEntity.noContent().build();
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "QR code not found"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
