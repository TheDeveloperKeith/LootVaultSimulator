# Login experience

The login screen uses a light neutral canvas, black text and pill actions, and a rounded black gameplay panel with a muted blue table. The visual hierarchy is inspired by the supplied Coinbase screenshots and its public product page (https://www.coinbase.com/en-sg). Switzer Medium headings and Satoshi body text are self-hosted. A desktop introduction becomes a compact brand mark on phones; the form stays in a single column and scrolls on short screens.

Sign in is the default. Account creation progressively reveals the email field and password guidance. The BJORK UI primitive-button-group is ported to CSS modules for the account-mode selector. Source: https://21st.dev/@isaiahbjork/components/primitive-button-group and https://ui.isaiahbjork.com/primitive-button-group.json. Its rounded shared surface groups native buttons with aria-pressed and clear selected styling.

Inputs have persistent labels, autocomplete and mobile-friendly 16px text. Show/Hide password preserves the value. Submission instantly shows a spinner and live status, locks credentials and mode switching, and guards duplicate requests. Errors are announced and receive focus; entered credentials remain available for retry. Registration still signs in automatically, and the original destination is preserved. Developer access appears only when the server enables it and opens in a separate dialog.

Validation: lint/build; browser fixture checks at 1366×768, 800×1024, 390×844, 320×568 and 844×390; login, registration, show/hide, Enter submission, duplicate prevention and error recovery.

## Gameplay showcase
The user's React Login Page Implementation Plan informed the 60/40 desktop layout, independent auth pane, separately loaded showcase and compact mobile entry. The showcase uses the actual PlayingCard, CrateIcon and ItemIcon components, avoiding external videos and their bandwidth costs. Visitors can preview a poker turn/river, a blackjack hit/stand and an example relic reveal. All previews are labeled demos and run locally without account, wallet or reward changes. Product copy describes the actual poker, blackjack, crate, banner and collection features. On phones the product summary and form come first; the fuller showcase is below them. Existing authentication and accessibility behaviors remain in place.
