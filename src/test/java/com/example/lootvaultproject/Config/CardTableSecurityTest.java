package com.example.lootvaultproject.Config;

import com.example.lootvaultproject.VaultRepository.PlayerRepository;
import jakarta.servlet.DispatcherType;
import org.junit.jupiter.api.*;
import org.springframework.context.annotation.*;
import org.springframework.mock.web.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import java.lang.reflect.Proxy;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

class CardTableSecurityTest {
    private AnnotationConfigWebApplicationContext context;
    private MockMvc mvc;
    @Configuration @EnableWebMvc @Import({SecurityConfig.class, CorsConfig.class})
    static class TestConfig {
        @Bean PlayerRepository players() {
            return (PlayerRepository) Proxy.newProxyInstance(PlayerRepository.class.getClassLoader(),new Class[]{PlayerRepository.class},(proxy,method,args)->{
                if(method.getName().equals("toString")) return "TestPlayers";
                if(method.getName().equals("hashCode")) return System.identityHashCode(proxy);
                if(method.getName().equals("equals")) return proxy == args[0];
                if(method.getReturnType().equals(Optional.class)) return Optional.empty();
                return null;
            });
        }
        @Bean TableEndpoint tableEndpoint() { return new TableEndpoint(); }
        @Bean com.example.lootvaultproject.VaultException.GlobalExceptionHandler errors() {
            return new com.example.lootvaultproject.VaultException.GlobalExceptionHandler();
        }
    }
    @RestController static class TableEndpoint {
        @PostMapping("/api/earn/rounds") String start() { return "authenticated hand started"; }
        @GetMapping("/error") String error() { return "original error dispatch"; }
        @PostMapping("/api/auth/login") String login() {
            throw new org.springframework.security.authentication.BadCredentialsException("Internal diagnostic");
        }
    }
    static MockHttpSession csrfSession() {
        var session = new MockHttpSession();
        var request = new MockHttpServletRequest(); request.setSession(session);
        new org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository().saveToken(
            new org.springframework.security.web.csrf.DefaultCsrfToken("X-CSRF-TOKEN", "_csrf", "test-token"), request, new MockHttpServletResponse());
        return session;
    }
    @BeforeEach void setup() {
        context=new AnnotationConfigWebApplicationContext();
        context.setServletContext(new MockServletContext()); context.register(TestConfig.class); context.refresh();
        mvc=MockMvcBuilders.webAppContextSetup(context).addFilters(context.getBean(FilterChainProxy.class)).build();
    }
    @AfterEach void cleanup() { context.close(); SecurityContextHolder.clearContext(); }
    @Test void signedOutRoundStartReturns401WithSessionMessage() throws Exception {
        var response=mvc.perform(post("/api/earn/rounds").session(csrfSession()).header("X-CSRF-TOKEN","test-token")).andReturn().getResponse();
        assertEquals(401,response.getStatus()); assertTrue(response.getContentAsString().contains("Sign in again"));
    }
    @Test void invalidLoginReportsCredentialsRatherThanExpiredSession() throws Exception {
        var response=mvc.perform(post("/api/auth/login").session(csrfSession()).header("X-CSRF-TOKEN","test-token").header("Origin","http://localhost:5174")).andReturn().getResponse();
        assertEquals(401,response.getStatus());
        assertTrue(response.getContentAsString().contains("Incorrect username or password"));
        assertFalse(response.getContentAsString().contains("Internal diagnostic"));
    }
    @Test void authenticatedPlayerWithoutSpecialRolesCanStartHand() throws Exception {
        var security=SecurityContextHolder.createEmptyContext();
        security.setAuthentication(UsernamePasswordAuthenticationToken.authenticated("player","unused",List.of()));
        var session=csrfSession(); session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,security);
        var response=mvc.perform(post("/api/earn/rounds").session(session).header("X-CSRF-TOKEN","test-token")).andReturn().getResponse();
        assertEquals(200,response.getStatus()); assertTrue(response.getContentAsString().contains("hand started"));
    }
    @Test void authenticatedViteOriginsCanStartHand() throws Exception {
        for (String origin : List.of("http://localhost:5173", "http://127.0.0.1:5173",
                "http://localhost:5174", "http://127.0.0.1:5174")) {
            var security=SecurityContextHolder.createEmptyContext();
            security.setAuthentication(UsernamePasswordAuthenticationToken.authenticated("player","unused",List.of()));
            var session=csrfSession();
            session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,security);
            var response=mvc.perform(post("/api/earn/rounds").session(session).header("X-CSRF-TOKEN","test-token").header("Origin",origin)).andReturn().getResponse();
            assertEquals(200,response.getStatus(),origin + ": " + response.getContentAsString());
        }
    }
    @Test void internalErrorDispatchIsNotReplacedWithForbidden() throws Exception {
        var response=mvc.perform(get("/error").with(request->{request.setDispatcherType(DispatcherType.ERROR);return request;})).andReturn().getResponse();
        assertEquals(200,response.getStatus()); assertEquals("original error dispatch",response.getContentAsString());
    }
    @Test void unrelatedOriginIsStillRejected() throws Exception {
        var security=SecurityContextHolder.createEmptyContext();
        security.setAuthentication(UsernamePasswordAuthenticationToken.authenticated("player","unused",List.of()));
        var session=csrfSession();
        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,security);
        var response=mvc.perform(post("/api/earn/rounds").session(session).header("X-CSRF-TOKEN","test-token").header("Origin","https://unrelated.example")).andReturn().getResponse();
        assertEquals(403,response.getStatus());
        assertEquals("Invalid CORS request",response.getContentAsString());
    }
    @Test void directHttpRequestCannotUseInternalErrorPermission() throws Exception {
        assertEquals(401,mvc.perform(get("/error")).andReturn().getResponse().getStatus());
    }
    @Test void cookieAuthenticatedWriteWithoutCsrfIsRejected() throws Exception {
        var security=SecurityContextHolder.createEmptyContext();
        security.setAuthentication(UsernamePasswordAuthenticationToken.authenticated("player","unused",List.of()));
        var session=csrfSession(); session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,security);
        var response=mvc.perform(post("/api/earn/rounds").session(session)).andReturn().getResponse();
        assertEquals(403,response.getStatus()); assertTrue(response.getContentAsString().contains("CSRF_INVALID"));
    }
    @Test void regularPlayerCannotTopUpAnyWalletOrReadSomeoneElsesWallet() throws Exception {
        var security=SecurityContextHolder.createEmptyContext();
        security.setAuthentication(UsernamePasswordAuthenticationToken.authenticated("player","unused",List.of()));
        var session=csrfSession(); session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,security);
        assertEquals(403,mvc.perform(post("/api/wallets/123/credit").session(session).header("X-CSRF-TOKEN","test-token")).andReturn().getResponse().getStatus());
        assertEquals(403,mvc.perform(get("/api/wallets/123").session(session)).andReturn().getResponse().getStatus());
    }
    @Test void frontendNavigationIsPublicButPrivateApiStillNeedsSession() throws Exception {
        // No frontend controller in this isolated fixture: 404 confirms security allowed routing.
        assertEquals(404,mvc.perform(get("/login")).andReturn().getResponse().getStatus());
        assertEquals(401,mvc.perform(get("/api/inventory")).andReturn().getResponse().getStatus());
    }

}
