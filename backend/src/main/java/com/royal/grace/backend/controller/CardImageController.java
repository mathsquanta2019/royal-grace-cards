package com.royal.grace.backend.controller;

import com.royal.grace.backend.model.ProductImage;
import com.royal.grace.backend.service.CardService;
import com.royal.grace.backend.service.ProductImageService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/cards")
public class CardImageController {

    private final ProductImageService images;
    private final CardService cards;

    public CardImageController(ProductImageService images, CardService cards) {
        this.images = images;
        this.cards = cards;
    }

    @PostMapping(path = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> upload(@PathVariable("id") String cardId,
                                    @RequestParam("file") MultipartFile file) {
        try {
            // Save/replace binary image
            ProductImage saved = images.saveOrReplace(cardId, file);

            // Update the card's imageUrl to point at this resource (relative URL via frontend/backends)
            Map<String, Object> updates = new HashMap<>();
            updates.put("imageUrl", "/api/cards/" + cardId + "/image");
            try { cards.updateCard(cardId, updates); } catch (RuntimeException ignored) { /* card may not exist */ }

            Map<String, Object> resp = new HashMap<>();
            resp.put("id", saved.getId());
            resp.put("cardId", saved.getCardId());
            resp.put("filename", saved.getFilename());
            resp.put("contentType", saved.getContentType());
            resp.put("size", saved.getSize());
            resp.put("url", "/api/cards/" + cardId + "/image");
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to read uploaded file"));
        }
    }

    @GetMapping(path = "/{id}/image")
    public ResponseEntity<byte[]> get(@PathVariable("id") String cardId) {
        return images.getByCardId(cardId)
                .map(entity -> {
                    HttpHeaders headers = new HttpHeaders();
                    headers.set(HttpHeaders.CONTENT_TYPE, entity.getContentType());
                    headers.set(HttpHeaders.CACHE_CONTROL, "public, max-age=600");
                    return new ResponseEntity<>(entity.getData(), headers, HttpStatus.OK);
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(null));
    }

    @DeleteMapping(path = "/{id}/image")
    public ResponseEntity<?> delete(@PathVariable("id") String cardId) {
        boolean deleted = images.deleteByCardId(cardId);
        if (deleted) {
            // Clear the card imageUrl if card exists
            try { cards.updateCard(cardId, Map.of("imageUrl", null)); } catch (RuntimeException ignored) {}
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Image not found"));
    }
}
