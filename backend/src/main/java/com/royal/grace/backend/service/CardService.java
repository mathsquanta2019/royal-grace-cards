package com.royal.grace.backend.service;

import com.royal.grace.backend.model.Card;
import org.springframework.stereotype.Service;
import java.util.*;
import java.math.BigDecimal;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CardService {
    
    private final Map<String, Card> cardDatabase = new ConcurrentHashMap<>();

    public CardService() {
        // Initialize with some sample data (no test images)
        initializeSampleData();
    }

    private void initializeSampleData() {
        Card card1 = new Card(
            UUID.randomUUID().toString(),
            "Merry Christmas from Texas",
            "Festive Texas longhorn wearing Santa hat",
            BigDecimal.valueOf(4.99),
            null, // no test image
            "Christmas",
            true
        );
        
        Card card2 = new Card(
            UUID.randomUUID().toString(),
            "Texas Christmas Tree",
            "Christmas tree made of Texas state with ornaments",
            BigDecimal.valueOf(4.99),
            null, // no test image
            "Christmas",
            true
        );

        cardDatabase.put(card1.getId(), card1);
        cardDatabase.put(card2.getId(), card2);
    }

    public List<Card> getAllCards() {
        return new ArrayList<>(cardDatabase.values());
    }

    public Card getCardById(String id) {
        return cardDatabase.get(id);
    }

    public Card createCard(Card card) {
        if (card.getId() == null || card.getId().isEmpty()) {
            card.setId(UUID.randomUUID().toString());
        }
        cardDatabase.put(card.getId(), card);
        return card;
    }

    public Card updateCard(String id, Map<String, Object> updates) {
        Card existing = cardDatabase.get(id);
        if (existing == null) {
            throw new RuntimeException("Card not found");
        }

        if (updates.containsKey("name")) {
            existing.setName(Objects.toString(updates.get("name"), existing.getName()));
        }
        if (updates.containsKey("description")) {
            existing.setDescription(Objects.toString(updates.get("description"), existing.getDescription()));
        }
        if (updates.containsKey("price")) {
            Object v = updates.get("price");
            if (v != null) {
                if (v instanceof Number n) {
                    existing.setPrice(BigDecimal.valueOf(n.doubleValue()));
                } else {
                    try {
                        existing.setPrice(new BigDecimal(v.toString()));
                    } catch (NumberFormatException ignored) { /* keep old */ }
                }
            }
        }
        if (updates.containsKey("imageUrl")) {
            Object v = updates.get("imageUrl");
            if (v == null) {
                existing.setImageUrl(null);
            } else {
                existing.setImageUrl(v.toString());
            }
        }
        if (updates.containsKey("category")) {
            Object v = updates.get("category");
            if (v != null) existing.setCategory(v.toString());
        }
        if (updates.containsKey("inStock")) {
            Object v = updates.get("inStock");
            if (v instanceof Boolean b) {
                existing.setInStock(b);
            } else if (v != null) {
                existing.setInStock(Boolean.parseBoolean(v.toString()));
            }
        }

        cardDatabase.put(id, existing);
        return existing;
    }

    public void deleteCard(String id) {
        cardDatabase.remove(id);
    }
}
