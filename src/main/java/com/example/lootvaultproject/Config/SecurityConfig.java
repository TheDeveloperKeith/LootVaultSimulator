package com.example.lootvaultproject.Config;

import com.example.lootvaultproject.VaultRepository.PlayerRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

import java.util.Collections;
import jakarta.servlet.DispatcherType;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final PlayerRepository playerRepository;

    public SecurityConfig(PlayerRepository playerRepository) {
        this.playerRepository = playerRepository;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> playerRepository.findByUsername(username)
                .map(player -> new User(
                        player.getUsername(),
                        player.getPasswordHash(),
                        Collections.emptyList()
                ))
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.csrfTokenRequestHandler(new org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler()))
                .authorizeHttpRequests(auth -> auth
                        // Container error dispatches must retain their original status,
                        // rather than turning a database/controller error into a 403.
                        .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                        .requestMatchers("/api/auth/register", "/api/auth/login", "/api/auth/dev", "/api/auth/dev-status", "/api/auth/me", "/api/auth/csrf").permitAll()
                        .requestMatchers("/api/wallets/*/credit").denyAll()
                        .requestMatchers(HttpMethod.GET, "/api/wallets/me").authenticated()
                        .requestMatchers("/api/wallets/**").denyAll()
                        .requestMatchers(HttpMethod.GET, "/", "/index.html", "/assets/**", "/audio-credits.html", "/favicon.ico", "/actuator/health", "/menu", "/login", "/earn", "/modes", "/crates", "/shop", "/inventory", "/progression", "/lootboxes", "/sandbox").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/shop/offers").permitAll()
                        .anyRequest().authenticated()
                )
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint((request, response, exception) -> {
                            response.setStatus(401);
                            response.setContentType("application/json");
                            response.getWriter().write("{\"error\":\"Your session expired. Sign in again to continue.\"}");
                        })
                        .accessDeniedHandler((request, response, exception) -> {
                            response.setStatus(403);
                            response.setContentType("application/json");
                            response.getWriter().write(exception instanceof org.springframework.security.web.csrf.CsrfException
                                    ? "{\"code\":\"CSRF_INVALID\",\"error\":\"Refresh this page before trying again.\"}"
                                    : "{\"error\":\"You do not have permission to perform this action.\"}");
                        })
                )
                .securityContext(context -> context
                        .securityContextRepository(securityContextRepository())
                );

        return http.build();
    }
}
