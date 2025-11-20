package com.royal.grace.backend.controller;

import com.royal.grace.backend.model.Card;
import com.royal.grace.backend.service.CardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/cards")
public class CardController {

    private final CardService cardService;

    @Autowired
    public CardController(CardService cardService) {
        this.cardService = cardService;
    }

    @GetMapping
    public List<Card> getAllCards() {
        return cardService.getAllCards();
    }

    @GetMapping("/{id}")
    public Card getCardById(@PathVariable("id") String id) {
        return cardService.getCardById(id);
    }

    @PostMapping
    public Card createCard(@RequestBody Card card) {
        return cardService.createCard(card);
    }

    @PatchMapping("/{id}")
    public Card updateCard(@PathVariable("id") String id, @RequestBody java.util.Map<String, Object> updates) {
        return cardService.updateCard(id, updates);
    }

    @DeleteMapping("/{id}")
    public void deleteCard(@PathVariable("id") String id) {
        cardService.deleteCard(id);
    }
}
