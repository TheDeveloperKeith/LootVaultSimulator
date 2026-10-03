LootVault

LootVault is a loot-box style web game with a Spring Boot backend and a React (Vite) frontend. Users spin/open loot boxes, earn items, manage an inventory, and browse a shop — with lobby, daily loot box, modes, inventory, shop, and login screens.

⚠️ Status: early-stage / learning project. Backend endpoints and persistence are being built out; the frontend currently runs on placeholder data while the API is developed.

Table of contents
Tech stack
Project structure
Features
Getting started
Prerequisites
Backend setup
Frontend setup
Running with Docker
Configuration
Roadmap
Contributing
License
Tech stack

Backend

Java 21
Spring Boot 4.1 (spring-boot-starter-webmvc, spring-boot-starter-data-jpa, spring-boot-starter-validation, spring-boot-starter-flyway)
PostgreSQL (via flyway-database-postgresql + postgresql driver)
Maven (wrapper included — mvnw / mvnw.cmd)
Lombok (available, not yet used)
JUnit 5 / JUnit 4 for testing

Frontend

React + Vite (lootvault-frontend/)
React Router (react-router-dom) for navigation
CSS Modules for component styling

Infra

Docker (multi-stage build: Maven build → slim eclipse-temurin:21-jre-alpine runtime image)
Docker Compose (local PostgreSQL container)
Project structure
LootVaultSimulator/
├── src/main/              # Spring Boot application source
├── lootvault-frontend/    # React + Vite frontend
│   └── src/
├── .mvn/wrapper/          # Maven wrapper
├── Dockerfile             # Multi-stage build for the backend
├── docker-compose.yaml    # Local Postgres service
├── pom.xml                # Backend dependencies (Maven)
├── PROGRESSLOG            # Running dev log / notes
└── CHANGELOG.md
Features

Implemented / in progress (frontend shell)

Lobby / main menu
Daily loot box screen
Navigation shell with tabs: Lobby, Loot Boxes, Modes, Inventory, Shop
Login route

Planned

Backend REST API for loot box openings, drop tables, and item rarities
Persistent user accounts, inventory, and currency backed by PostgreSQL
Wiring the frontend up to the live API (currently placeholder data)
Shop purchases / economy
Multiple game "modes"
Getting started
Prerequisites
Java 21 (JDK)
Node.js + npm (for the frontend)
Docker & Docker Compose (for local PostgreSQL, optional if you run Postgres another way)
Backend setup
Start a local PostgreSQL instance (see Running with Docker) or point at your own.
Configure your database connection — see Configuration.
From the project root, run the backend:
bash
   ./mvnw spring-boot:run

Or build a jar and run it directly:

bash
   ./mvnw clean package -DskipTests
   java -jar target/*.jar

The API will start on http://localhost:8080 by default.

Frontend setup
bash
cd lootvault-frontend
npm install
npm run dev

This starts the Vite dev server (default http://localhost:5173).

Running with Docker

To spin up a local PostgreSQL container:

bash
docker compose up -d

This starts a postgres:16 container named lootvault-postgres, exposed on host port 5433 (mapped to the container's 5432), with a persistent lootvault-pgdata volume.

To build and run the backend as a container:

bash
docker build -t lootvault-backend .
docker run -p 8080:8080 lootvault-backend
Configuration

The backend connects to PostgreSQL via standard Spring application.properties / application.yml (or environment variables). At minimum you'll need:

properties
spring.datasource.url=jdbc:postgresql://localhost:5433/<your-db-name>
spring.datasource.username=<your-db-user>
spring.datasource.password=${DB_PASSWORD}
Roadmap
 Define loot box / item / rarity data model + Flyway migrations
 Build REST endpoints for opening loot boxes and returning results
 Connect frontend inventory/shop/loot box screens to real endpoints
 Add authentication (login screen currently exists in the frontend shell)
 Add more game modes
Contributing

This is currently a solo learning project. Issues and suggestions are welcome via GitHub Issues.

License

No license has been specified yet. Until one is added, all rights are reserved by the author.
