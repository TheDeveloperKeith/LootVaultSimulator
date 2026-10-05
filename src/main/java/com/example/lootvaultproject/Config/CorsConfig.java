package com.example.lootvaultproject.Config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// Vite forwards the browser's Origin even when proxying /api.
// Both loopback hostnames are used to open the local frontend.
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @org.springframework.beans.factory.annotation.Value("${app.frontend.origins:http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174}")
    private String origins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(java.util.Arrays.stream(origins.split(",")).map(String::trim).filter(value -> !value.isBlank()).toArray(String[]::new))
                .allowCredentials(true)
                .allowedMethods("GET", "POST", "PUT", "DELETE")
                .allowedHeaders("*");
    }
}
