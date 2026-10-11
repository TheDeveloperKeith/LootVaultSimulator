# Frontend visual foundation

The login design now applies across the authenticated frontend: a #f5f6f8 canvas, #101114 primary text and actions, white surfaces, #626976 supporting text, and rounded panels. Card rooms invert the hierarchy with a black room, muted blue felt, white actions, and grey secondary controls. Switzer Medium headings and Satoshi body copy are self-hosted.

`src/styles/vault-theme.css` scopes the shared chrome to `data-ui="vault"` on AppShell. Explicit page styles handle dark feature panels and readable content. Icons, SVG definitions, rarity artwork, playing-card artwork, keyframes, animation timing, and gameplay logic are unchanged. Login retains its existing design. Source-only legacy pages receive the same foundation without adding new routes.

Active views: lobby, modes, earn selector, blackjack, poker, banners, crates, container contents, inventory, quests/collection, sandbox, and settings. Shared daily-reward and exclusive-shop dialogs follow the same surfaces.

Verification: production build, lint, API-fixture responsive checks at 1366×768, 390×844, and 320×568, collection switching, crate purchase, banner pool, and card-overlap checks including long blackjack hands and landscape phones. Screenshots are indexed in frontend-page-gallery.md.
