package com.royal.grace.backend.model;
import java.math.BigDecimal;

public class ShippingSettings {
    private int freeShippingThreshold; // Number of cards for free shipping (default: 20)
    private BigDecimal standardShippingFee;

    // Constructors
    public ShippingSettings() {
        this.freeShippingThreshold = 20;
        this.standardShippingFee = BigDecimal.valueOf(5.00);
    }

    public ShippingSettings(int freeShippingThreshold, BigDecimal standardShippingFee) {
        this.freeShippingThreshold = freeShippingThreshold;
        this.standardShippingFee = standardShippingFee;
    }

    // Getters and Setters
    public int getFreeShippingThreshold() { return freeShippingThreshold; }
    public void setFreeShippingThreshold(int freeShippingThreshold) { 
        this.freeShippingThreshold = freeShippingThreshold; 
    }

    public BigDecimal getStandardShippingFee() { return standardShippingFee; }
    public void setStandardShippingFee(BigDecimal standardShippingFee) { 
        this.standardShippingFee = standardShippingFee; 
    }
}
