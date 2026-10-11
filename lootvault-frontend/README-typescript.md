# TypeScript in LootVault

The frontend uses an incremental TypeScript migration. New `.ts` and `.tsx`
modules are checked strictly; existing JavaScript remains supported with
`allowJs: true` and `checkJs: false`. The Spring backend is unchanged.

From this directory:

```sh
npm ci
npm run dev
npm run typecheck
npm run lint
npm run build
```

The build runs type checking before Vite. Vite already supports TypeScript;
no additional bundler plugin is required. The ESLint configuration checks TS
and TSX with typescript-eslint while preserving JavaScript linting.

Migrated modules: `main.tsx`, `vite.config.ts`, `api/client.ts`, `api/auth.ts`,
`api/wallet.ts`, `api/earn.ts`, `components/Button.tsx`,
`components/PlayingCard.tsx`, and `components/LoginShowcase.tsx`.

`src/types/game.ts` mirrors the current PlayerResponse, WalletResponse and
EarnResponse contracts. Keep it synchronized with backend changes.
`src/types/game.type-test.ts` verifies rejection of invalid cards, actions,
game names, and button variants and is not imported by the application.

API generics describe expected JSON; they do not perform runtime schema
validation. JavaScript callers are not fully type checked. Continue migrating
contexts and gameplay pages as they change, narrowing nullable state and
using explicit API response types instead of suppressing errors.

The project guide is in `../docs/LootVault-TypeScript-Guide.docx`.

## Blank page after renaming modules

When renaming `.jsx` files to `.tsx`, stop and restart any running Vite servers.
An older server can retain imports to a removed path such as `Button.jsx` even
though a fresh production build succeeds. Reload the browser after restarting.
Use the URL printed by the restarted server. If multiple servers run on the
same port through IPv4 and IPv6, check both `localhost` and `127.0.0.1` rather
than assuming they reach the same process.

To select an explicit port without silently moving to another one:

```sh
npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
```
