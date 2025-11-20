package com.royal.grace.backend.model;
import java.math.BigDecimal;

public class OrderItem {
    private String cardId;
    private String name;
    private int quantity;
    private BigDecimal price;

    // Constructors
    public OrderItem() {}

    public OrderItem(String cardId, String name, int quantity, BigDecimal price) {
        this.cardId = cardId;
        this.name = name;
        this.quantity = quantity;
        this.price = price;
    }

    // Getters and Setters
    public String getCardId() { return cardId; }
    public void setCardId(String cardId) { this.cardId = cardId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
}
