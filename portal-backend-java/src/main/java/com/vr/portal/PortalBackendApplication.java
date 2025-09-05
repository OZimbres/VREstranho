package com.vr.portal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class PortalBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(PortalBackendApplication.class, args);
    }
}