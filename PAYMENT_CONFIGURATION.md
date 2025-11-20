# Payment Configuration Guide

## Overview

Royal Grace Cards supports three payment methods:
1. **Stripe** - Credit/Debit card payments
2. **Zelle** - Bank-to-bank transfers with QR code
3. **Cash App** - Mobile payments with QR code

This guide explains how to configure payments from both the admin dashboard and the Micronaut backend.

---

## Admin Dashboard Configuration

### Accessing Payment Settings

1. Log in to the admin dashboard at `/admin/login`
2. Navigate to **Settings** → **Payments** tab
3. Configure each payment method as needed

### Payment Method Controls

Each payment method can be independently enabled or disabled:

#### Stripe Configuration
- **Toggle**: Enable/Disable Stripe payments
- **Backend Required**: Yes - requires Stripe API keys in Micronaut
- **When Disabled**: Credit/debit card option hidden from checkout

#### Zelle Configuration
- **Toggle**: Enable/Disable Zelle payments
- **Settings**:
  - Zelle Email: The email customers send payments to
  - Zelle Phone: The phone number customers send payments to
- **Backend Required**: No - QR code generated from email/phone
- **When Disabled**: Zelle option hidden from checkout

#### Cash App Configuration
- **Toggle**: Enable/Disable Cash App payments
- **Settings**:
  - Cash App Handle: Your $cashtag (e.g., $RoyalGraceCards)
- **Backend Required**: No - QR code generated from handle
- **When Disabled**: Cash App option hidden from checkout

---

## Frontend API Endpoints

The Next.js frontend provides these mock API endpoints that should be replaced with your Micronaut backend:

### Get Payment Settings
\`\`\`
GET /api/settings/payment
\`\`\`

**Response:**
\`\`\`json
{
  "stripeEnabled": true,
  "zelleEnabled": true,
  "cashappEnabled": true,
  "zelleEmail": "payments@royalgracecards.com",
  "zellePhone": "(555) 123-4567",
  "cashappHandle": "$RoyalGraceCards"
}
\`\`\`

### Update Payment Settings
\`\`\`
PUT /api/settings/payment
\`\`\`

**Request Body:**
\`\`\`json
{
  "stripeEnabled": false,
  "zelleEnabled": true,
  "cashappEnabled": true,
  "zelleEmail": "payments@example.com",
  "zellePhone": "(555) 987-6543",
  "cashappHandle": "$NewHandle"
}
\`\`\`

---

## Micronaut Backend Integration

### 1. Add Payment Settings Model

\`\`\`java
package com.royalgrace.cards.model;

import io.micronaut.core.annotation.Introspected;

@Introspected
public class PaymentSettings {
    private boolean stripeEnabled;
    private boolean zelleEnabled;
    private boolean cashappEnabled;
    private String zelleEmail;
    private String zellePhone;
    private String cashappHandle;

    // Constructors, getters, and setters
}
\`\`\`

### 2. Create Payment Settings Controller

\`\`\`java
package com.royalgrace.cards.controller;

import com.royalgrace.cards.model.PaymentSettings;
import com.royalgrace.cards.service.PaymentSettingsService;
import io.micronaut.http.annotation.*;

@Controller("/api/settings/payment")
public class PaymentSettingsController {
    
    private final PaymentSettingsService service;

    public PaymentSettingsController(PaymentSettingsService service) {
        this.service = service;
    }

    @Get
    public PaymentSettings getPaymentSettings() {
        return service.getPaymentSettings();
    }

    @Put
    public PaymentSettings updatePaymentSettings(@Body PaymentSettings settings) {
        return service.updatePaymentSettings(settings);
    }
}
\`\`\`

### 3. Implement Payment Settings Service

\`\`\`java
package com.royalgrace.cards.service;

import com.royalgrace.cards.model.PaymentSettings;
import jakarta.inject.Singleton;

@Singleton
public class PaymentSettingsService {
    
    // Store in database - example with in-memory storage
    private PaymentSettings currentSettings = new PaymentSettings(
        true,  // stripeEnabled
        true,  // zelleEnabled
        true,  // cashappEnabled
        "payments@royalgracecards.com",
        "(555) 123-4567",
        "$RoyalGraceCards"
    );

    public PaymentSettings getPaymentSettings() {
        return currentSettings;
    }

    public PaymentSettings updatePaymentSettings(PaymentSettings settings) {
        this.currentSettings = settings;
        // TODO: Persist to database
        return currentSettings;
    }
}
\`\`\`

### 4. Stripe Integration

For Stripe payments, you'll need to:

1. **Add Stripe Dependency** to `build.gradle` or `pom.xml`:
\`\`\`gradle
implementation 'com.stripe:stripe-java:24.1.0'
\`\`\`

2. **Configure API Key** in `application.yml`:
\`\`\`yaml
stripe:
  api-key: ${STRIPE_SECRET_KEY}
  publishable-key: ${STRIPE_PUBLISHABLE_KEY}
\`\`\`

3. **Update Payment Controller** with Stripe checkout:

\`\`\`java
@Controller("/api/payment")
public class PaymentController {
    
    @Value("${stripe.api-key}")
    private String stripeApiKey;
    
    @Post("/stripe")
    public StripeCheckoutResponse createStripeCheckout(@Body StripeCheckoutRequest request) {
        // Check if Stripe is enabled
        PaymentSettings settings = paymentSettingsService.getPaymentSettings();
        if (!settings.isStripeEnabled()) {
            throw new HttpStatusException(HttpStatus.BAD_REQUEST, "Stripe payments are disabled");
        }

        Stripe.apiKey = stripeApiKey;
        
        SessionCreateParams params = SessionCreateParams.builder()
            .setMode(SessionCreateParams.Mode.PAYMENT)
            .setSuccessUrl("https://yourdomain.com/order-confirmation?orderId=" + request.getOrderId())
            .setCancelUrl("https://yourdomain.com/checkout")
            .addLineItem(
                SessionCreateParams.LineItem.builder()
                    .setPriceData(
                        SessionCreateParams.LineItem.PriceData.builder()
                            .setCurrency("usd")
                            .setUnitAmount((long)(request.getAmount() * 100))
                            .setProductData(
                                SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                    .setName("Order #" + request.getOrderId())
                                    .build()
                            )
                            .build()
                    )
                    .setQuantity(1L)
                    .build()
            )
            .build();
            
        Session session = Session.create(params);
        return new StripeCheckoutResponse(session.getUrl());
    }
}
\`\`\`

---

## Payment Flow

### Customer Perspective

1. **Browse Products** → Add items to cart
2. **Proceed to Checkout** → Fill shipping information
3. **Select Payment Method** → Only enabled methods are shown
4. **Complete Payment**:
   - **Stripe**: Redirected to Stripe Checkout → Complete payment → Return to confirmation
   - **Zelle/Cash App**: View QR code → Scan with app → Manually complete payment → Confirmation

### Backend Processing

1. **Order Creation**:
   \`\`\`
   POST /api/orders
   - Creates order with "pending" payment status
   - Returns order ID
   \`\`\`

2. **Stripe Payment** (if enabled):
   \`\`\`
   POST /api/payment/stripe
   - Validates Stripe is enabled
   - Creates Stripe Checkout Session
   - Returns checkout URL
   - Frontend redirects user to Stripe
   \`\`\`

3. **Stripe Webhook** (handle payment completion):
   \`\`\`
   POST /api/webhooks/stripe
   - Verify webhook signature
   - Update order payment status to "completed"
   - Trigger fulfillment process
   \`\`\`

4. **QR Code Payments** (Zelle/Cash App):
   \`\`\`
   GET /api/payment/qr-codes?method=zelle&orderId=xxx
   - Validates payment method is enabled
   - Returns QR code data and payment info
   - Order remains "pending" until manually verified
   \`\`\`

---

## Testing Payment Methods

### Test Mode Setup

1. **Stripe Test Mode**:
   - Use Stripe test API keys
   - Test cards: `4242 4242 4242 4242`
   - Dashboard: `https://dashboard.stripe.com/test`

2. **Zelle/Cash App Test Mode**:
   - Use test email/phone/handle
   - Generate test QR codes
   - No real money transferred

### Enabling/Disabling in Production

To disable a payment method:
1. Admin logs in to dashboard
2. Goes to Settings → Payments
3. Toggles off the payment method
4. Clicks "Save Payment Settings"
5. Backend updates settings
6. Customers immediately see change at checkout

---

## Security Considerations

1. **API Keys**: Never expose Stripe secret key in frontend
2. **Webhook Verification**: Always verify Stripe webhook signatures
3. **Admin Authentication**: Protect payment settings endpoints
4. **HTTPS**: Use HTTPS in production for all payment flows
5. **PCI Compliance**: Stripe handles card data - never store card numbers

---

## Support & Troubleshooting

### Common Issues

**Payment method not showing at checkout**:
- Verify it's enabled in admin settings
- Check backend GET /api/settings/payment returns correct values
- Clear browser cache

**Stripe checkout fails**:
- Verify Stripe API keys are correct
- Check Stripe dashboard for errors
- Ensure success/cancel URLs are correct

**QR codes not generating**:
- Verify Zelle email/phone or Cash App handle is set
- Check backend logs for QR generation errors

---

## Summary

Payment configuration is a two-step process:
1. **Admin Dashboard**: Enable/disable methods and configure details
2. **Backend Integration**: Implement Micronaut endpoints and Stripe integration

When a payment method is disabled in the admin dashboard, it immediately becomes unavailable to customers at checkout, providing real-time control over accepted payment methods.
