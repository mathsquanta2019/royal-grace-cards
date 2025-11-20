package com.royal.grace.backend.model;

public enum PaymentMethod {
    ZELLE,
    VENMO,
    CASHAPP,
    OTHER;

    public static PaymentMethod fromString(String value) {
        if (value == null) return OTHER;
        String v = value.trim().toUpperCase();
        return switch (v) {
            case "ZELLE" -> ZELLE;
            case "VENMO" -> VENMO;
            case "CASHAPP", "CASH_APP", "CASH-APP" -> CASHAPP;
            default -> OTHER;
        };
    }
}
