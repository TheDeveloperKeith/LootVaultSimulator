package com.example.lootvaultproject.VaultController;

@org.springframework.stereotype.Controller
public class SpaController {
    @org.springframework.web.bind.annotation.GetMapping({"/login", "/menu", "/modes", "/earn", "/crates", "/shop", "/inventory", "/progression", "/lootboxes", "/sandbox"})
    public String frontend() { return "forward:/index.html"; }
}
