package com.royal.grace.backend.config;

import com.royal.grace.backend.model.AdminUser;
import com.royal.grace.backend.repository.AdminUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Configuration
public class AdminDataInitializer {

    private static final Logger log = LoggerFactory.getLogger(AdminDataInitializer.class);

    @Value("${ADMIN_DEFAULT_USERNAME:admin}")
    private String defaultUsername;

    @Value("${ADMIN_DEFAULT_PASSWORD:change-me}")
    private String defaultPassword;

    @Value("${ADMIN_DEFAULT_EMAIL:}")
    private String defaultEmail;

    @Bean
    public CommandLineRunner seedDefaultAdmin(AdminUserRepository repo) {
        return args -> {
            if (repo.findByUsername(defaultUsername).isEmpty()) {
                BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
                AdminUser admin = new AdminUser();
                admin.setUsername(defaultUsername);
                admin.setPasswordHash(encoder.encode(defaultPassword));
                if (defaultEmail != null && !defaultEmail.isBlank()) {
                    admin.setEmail(defaultEmail);
                }
                repo.save(admin);
                log.warn("Seeded default admin user '{}' with provided default password. CHANGE IT ASAP.", defaultUsername);
            }
        };
    }
}
