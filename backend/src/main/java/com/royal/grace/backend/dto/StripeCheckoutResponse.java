package com.royal.grace.backend.dto;

public class StripeCheckoutResponse {
    private String checkoutUrl;
    private String sessionId;

    // Getters and Setters
    public String getCheckoutUrl() { return checkoutUrl; }
    public void setCheckoutUrl(String checkoutUrl) { this.checkoutUrl = checkoutUrl; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
}
