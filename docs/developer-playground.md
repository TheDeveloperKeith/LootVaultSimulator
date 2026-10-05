# Developer playground

On the login page, expand **Developer playground**, enter your private phrase, and choose **Enter test vault**. Each entry creates a separate test player; log out to return to normal sign-in.

The server must explicitly enable testing, configure a phrase, and activate the `dev` Spring profile. Set these in the ignored root `application-local.properties`:

```properties
spring.profiles.active=dev
app.dev.enabled=true
app.dev.phrase=your-private-phrase
```

Alternatively use `SPRING_PROFILES_ACTIVE=dev`, `DEV_MODE_ENABLED=true`, and `DEV_MODE_PHRASE` environment variables. Restart the backend after changing these settings. The login section is hidden when the server reports testing disabled. Either `prod` or `production` profile disables entry even if `dev` is also active. Private local config is excluded from Git and Docker; a published build defaults to disabled.

The test wallet displays ∞. It keeps a 1,000,000-coin reference balance for stake sliders and normal per-hand limits; debits and credits are skipped only for the authenticated server-issued test identity. Quests, inventory, rounds, and results belong to the separate test player and remain in the development database. Ordinary accounts still debit and credit normally. There is no client-controlled role or balance override.

This mode is intended for a local development database. Each entry creates another test account. Keep production connected to its own database and use the production profile.
