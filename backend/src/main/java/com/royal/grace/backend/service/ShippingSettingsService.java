package com.royal.grace.backend.service;

import com.royal.grace.backend.model.ShippingSettings;
import org.springframework.stereotype.Service;

@Service
public class ShippingSettingsService {
    
    private ShippingSettings currentSettings = new ShippingSettings();

    public ShippingSettings getSettings() {
        return currentSettings;
    }

    public ShippingSettings updateSettings(ShippingSettings settings) {
        this.currentSettings = settings;
        return currentSettings;
    }
}
