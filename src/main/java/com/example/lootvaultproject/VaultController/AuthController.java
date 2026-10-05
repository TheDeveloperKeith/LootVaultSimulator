package com.example.lootvaultproject.VaultController;

import com.example.lootvaultproject.VaultDTO.LoginRequest;
import com.example.lootvaultproject.VaultDTO.PlayerResponse;
import com.example.lootvaultproject.VaultDTO.RegisterRequest;
import com.example.lootvaultproject.VaultEntity.Player;
import com.example.lootvaultproject.VaultService.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthenticationManager authenticationManager;
    private final com.example.lootvaultproject.Config.DevMode devMode;
    private final HttpSessionSecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

    public AuthController(AuthService authService, AuthenticationManager authenticationManager, com.example.lootvaultproject.Config.DevMode devMode) {
        this.authService = authService;
        this.authenticationManager = authenticationManager;
        this.devMode = devMode;
    }

    public record DevRequest(String phrase) {}
    @GetMapping("/dev-status") public java.util.Map<String, Boolean> devStatus() { return java.util.Map.of("enabled", devMode.enabled()); }
    @PostMapping("/dev") public ResponseEntity<PlayerResponse> devLogin(@RequestBody DevRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        if (!devMode.enabled()) throw new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND);
        if (!devMode.accepts(request.phrase())) throw new org.springframework.security.authentication.BadCredentialsException("Invalid developer phrase");
        Player player = authService.createTestPlayer();
        var identity = new com.example.lootvaultproject.Config.DevMode.TestIdentity(player.getId(), player.getUsername());
        var authentication = UsernamePasswordAuthenticationToken.authenticated(identity, null, java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_DEV")));
        var context = SecurityContextHolder.createEmptyContext(); context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        if (httpRequest.getSession(false) != null) httpRequest.changeSessionId();
        securityContextRepository.saveContext(context, httpRequest, httpResponse);
        new org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository().saveToken(null, httpRequest, httpResponse);
        return ResponseEntity.ok(new PlayerResponse(player.getId(), player.getUsername(), player.getEmail(), true));
    }

    @PostMapping("/register")
    public ResponseEntity<PlayerResponse> register(@Valid @RequestBody RegisterRequest request) {
        Player player = authService.registerPlayer(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new PlayerResponse(player.getId(), player.getUsername(), player.getEmail()));
    }

    @PostMapping("/login")
    public ResponseEntity<PlayerResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        UsernamePasswordAuthenticationToken token =
                new UsernamePasswordAuthenticationToken(request.username(), request.password());

        Authentication authentication = authenticationManager.authenticate(token);

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        if (httpRequest.getSession(false) != null) httpRequest.changeSessionId();
        securityContextRepository.saveContext(context, httpRequest, httpResponse);
        new org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository().saveToken(null, httpRequest, httpResponse);

        Player player = authService.getByUsername(request.username());
        return ResponseEntity.ok(new PlayerResponse(player.getId(), player.getUsername(), player.getEmail(), devMode.isTestPlayer(player.getId())));
    }

    @GetMapping("/csrf")
    public java.util.Map<String, String> csrf(org.springframework.security.web.csrf.CsrfToken token) {
        return java.util.Map.of("token", token.getToken(), "headerName", token.getHeaderName());
    }

    @GetMapping("/me")
    public ResponseEntity<PlayerResponse> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.noContent().build();
        }
        Player player = authService.getByUsername(authentication.getName());
        return ResponseEntity.ok(new PlayerResponse(player.getId(), player.getUsername(), player.getEmail(), devMode.isTestPlayer(player.getId())));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
        return ResponseEntity.noContent().build();
    }
}
