ootVault

LootVault is a browser game about collecting gear, opening daily crates, and risking coins in short card games. The project pairs a React interface with a Spring Boot API and PostgreSQL database. Its current MVP focuses on a small set of complete, connected experiences rather than adding more modes.

## MVP scope

- **Earn your loot:** play Blackjack against the dealer or The River, a Texas Hold’em game against two AI opponents.
- **Crates and daily rewards:** claim daily coins and a limited number of daily boxes, then open earned crates to discover collectible items.
- **Shop and inventory:** spend coins on catalog items, equip or review owned items, and see collection progress.
- **Quests and introduction:** complete a small set of participation quests and take a short first-login tour. The River includes a no-wager demo that previews its visual effects.
- **Accessibility and comfort:** sound and motion controls, keyboard support for important interactions, and reduced-motion handling.

Unfinished modes such as banners and crafting are outside the main navigation while the MVP is stabilized. The sandbox is a secondary practice area. See [MVP readiness](docs/mvp-readiness.md) for remaining work and the proposed playtest plan.

## How the project fits together

The browser loads the React app from `lootvault-frontend`. Its API modules send requests to Spring Boot under `/api`. During local development, Vite proxies those requests to Spring Boot, so the browser uses the same origin for API calls and session cookies.

Spring Boot handles authentication, game rules, wallet changes, crate openings, shop purchases, quests, and inventory. Controllers expose HTTP endpoints, services enforce game and transaction rules, and repositories read and write JPA entities in PostgreSQL. Flyway applies the ordered SQL migrations in `src/main/resources/db/migration`; Hibernate checks the resulting schema at startup rather than creating tables automatically.

The longer guide, [Understanding LootVault](docs/understanding-lootvault.md), walks through the React-to-API request path, Spring and JPA responsibilities, Flyway, and project exercises. The [developer playground guide](docs/developer-playground.md) covers the isolated developer account.

## Technology

- Java 21 and Spring Boot 4.1
- Spring MVC, Spring Security, Spring Data JPA, and Flyway
- PostgreSQL 16
- React 19, Vite 8, React Router, and CSS Modules
- Maven wrapper for the backend; npm for the frontend
- Docker Compose for a local PostgreSQL service

## Repository layout

```text
src/main/java/                 Spring Boot controllers, services, entities, repositories, and config
src/main/resources/            Spring configuration and Flyway migrations
lootvault-frontend/src/        React pages, components, API clients, styles, and effects
docs/                          Architecture, economy, readiness, and developer guides
scripts/                        Local safety and verification utilities
Dockerfile                      Release build that packages the frontend with the backend
docker-compose.yaml             Local PostgreSQL service
pom.xml                         Maven backend build
```

## Run locally

### Prerequisites

- Java 21 JDK
- Node.js and npm
- Docker Desktop with Docker Compose, or a PostgreSQL 16 server

### 1. Configure a local database

The Compose file reads credentials from a root `.env` file. Start by copying `.env.example` to `.env`, then replace the placeholder password with a new local password. Keep `.env` private and out of Git.

```powershell
Copy-Item .env.example .env
docker compose up -d
```

The database is available at `localhost:5433`. For a database running elsewhere, set `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` in the environment used to launch the backend. Spring does not load the root `.env` file by itself; Docker Compose reads it for the database container. A private `application-local.properties` can also supply local Spring configuration and is intentionally excluded from Git.

### 2. Start the backend

From the repository root:

```powershell
./mvnw.cmd spring-boot:run
```

The local backend listens on `http://localhost:8081`. On macOS or Linux, use `./mvnw spring-boot:run`.

### 3. Start the frontend

In another terminal:

```powershell
cd lootvault-frontend
npm ci
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`. Vite forwards `/api` requests to the backend at port 8081. Keep the same hostname (`localhost` or `127.0.0.1`) throughout a login session so the browser sends the expected cookies.

Useful frontend commands:

```powershell
npm run lint
npm run build
```

## Database and configuration

Flyway migrations are applied automatically when Spring starts. Do not edit an already-applied migration; add a new numbered migration instead. The application uses `ddl-auto=validate` so schema changes remain explicit and reviewable.

For a production run, configure `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` in the hosting environment, then activate the `prod` Spring profile. Production settings require HTTPS cookies, turn off developer mode, and use the same origin for the frontend and API unless exact separate frontend origins are configured with `FRONTEND_ORIGINS`. Never put live passwords, tokens, or private config files in Git.

The phrase-based developer account is only enabled with the `dev` profile, explicit local configuration, and a non-production environment. Do not enable it in production. See [Safe publishing](docs/safe-publishing.md) before preparing a release.

## Release build

The release Maven profile builds the React frontend and packages it into the Spring Boot JAR:

```powershell
cd lootvault-frontend
npm ci
npm run lint
cd ..
./mvnw.cmd -Prelease clean verify
java -jar target/LootVaultProject-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

Provide production database variables through the deployment environment. Do not commit them or pass real secrets on a command line that may be saved in shell history.

## Project status and next steps

The main work now is reliability, balancing, deployment readiness, and a small guided playtest—not expanding the feature list. Important follow-ups include durable request IDs for purchases, login rate limiting, deployment-specific browser checks, and encrypted off-machine backups with a verified restore. Read [MVP readiness](docs/mvp-readiness.md) for the full checklist and open questions.

## License

No license has been specified. All rights are reserved by the author.
