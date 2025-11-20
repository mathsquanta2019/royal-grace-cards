package com.royal.grace.backend.controller;

import com.royal.grace.backend.model.ShippingSettings;
import com.royal.grace.backend.service.ShippingSettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings/shipping")
public class ShippingSettingsController {

    private final ShippingSettingsService shippingSettingsService;

    @Autowired
    public ShippingSettingsController(ShippingSettingsService shippingSettingsService) {
        this.shippingSettingsService = shippingSettingsService;
    }

    @GetMapping
    public ShippingSettings getShippingSettings() {
        return shippingSettingsService.getSettings();
    }

    @PutMapping
    public ShippingSettings updateShippingSettings(@RequestBody ShippingSettings settings) {
        return shippingSettingsService.updateSettings(settings);
    }
}
