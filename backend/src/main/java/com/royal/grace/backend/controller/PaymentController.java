package com.royal.grace.backend.controller;

import com.royal.grace.backend.dto.StripeCheckoutRequest;
import com.royal.grace.backend.dto.StripeCheckoutResponse;
import com.royal.grace.backend.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    private final PaymentService paymentService;

    @Autowired
    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/stripe")
    public StripeCheckoutResponse createStripeCheckout(@RequestBody StripeCheckoutRequest request) {
        return paymentService.createStripeCheckout(request);
    }

    // Deprecated: we no longer generate QR codes server-side. Use the upload endpoints:
    // POST /api/payment/qr-codes/{method} (multipart) to upload; GET to retrieve
    @PostMapping("/qr-codes")
    public ResponseEntity<?> deprecatedGenerateQRCodes() {
        return ResponseEntity.status(HttpStatus.GONE)
                .body(java.util.Map.of(
                        "error", "Endpoint deprecated",
                        "message", "Upload your QR image via POST /api/payment/qr-codes/{method} (multipart/form-data)."
                ));
    }
}
