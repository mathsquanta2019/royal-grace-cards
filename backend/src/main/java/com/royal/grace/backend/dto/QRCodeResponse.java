package com.royal.grace.backend.dto;
import java.math.BigDecimal;
import java.util.Map;

public class QRCodeResponse {
    private Map<String, String> qrCodes; // payment method -> base64 QR code image
    private BigDecimal amount;
    private String orderId;

    // Getters and Setters
    public Map<String, String> getQrCodes() { return qrCodes; }
    public void setQrCodes(Map<String, String> qrCodes) { this.qrCodes = qrCodes; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
}
