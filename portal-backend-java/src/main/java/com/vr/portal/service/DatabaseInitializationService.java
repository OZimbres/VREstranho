package com.vr.portal.service;

import com.vr.portal.entity.User;
import com.vr.portal.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class DatabaseInitializationService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    public DatabaseInitializationService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }
    
    @PostConstruct
    public void initializeDatabase() {
        createDefaultAdmin();
    }
    
    private void createDefaultAdmin() {
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User(
                    "admin",
                    passwordEncoder.encode("admin123"),
                    "admin@vr.com.br",
                    "admin"
            );
            
            userRepository.save(admin);
            System.out.println("✅ Default admin user created (username: admin, password: admin123)");
        } else {
            System.out.println("✅ Default admin user already exists");
        }
    }
}