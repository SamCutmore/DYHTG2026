# Architecture

## AI Usage

| Component | AI usage |
|-----------|----------|
| Pipeline  |    1     |
| Backend   |    1     |
| Database  |    1     |
| Frontend  |    4     |

### Pipeline

GitHub actions, cron jobs, optools and management of secrets was directed by principles learned from Software Product Release Engineering (SPRE).

### Backend

Backend Spring Boot server was implemented using principles learned from Software Product Release Engineering (SPRE) and ExtremeStartup skills. GET/POST queries currently route through the same endpoint, logging redacts secrets, and queries are handled by dispatching them to solvers via matching Regular Expressions using interfaces, inheritance and annotation that allows for modular implementation.

### Database

Catalogue tables follow the EVE Online market relational model [via Fuzzwork SDE dumps](https://www.fuzzwork.co.uk/dump/) remodelled for this project. Order book, fills, auth, and sources were modelled within carefully selected slices of that relationship map.

This relational mapping is appropriate due to the tree structure allowing for sparse procedural queries that are efficient for both the Frontend and Backend services.

### Frontend

Frontend made heavy use of generative AI to quickly scaffold, experiment and create user interfaces excluding the `frontend/src/api/clients.ts` + `types.ts` API layers. This allowed participation from inexperienced and new team members where the tradeoff was considered acceptable due to the robust and secure implementation of the Spring Boot API layer. The React application is a thin UX/UI layer that performs requests that can be achieved using Curl or Postman.

## Overview

```
               ┌─────────────────┐      ┌──────────────────┐       ┌────────────────────┐
               │    Frontend     │      │      Backend     │       │      Database      │
  Browser ────▶│   React (Vite)  │─────▶│    Spring Boot   │─────▶ │   Postgres (prod)  │
               │                 │ /api │    API solvers   │ JDBC  │    H2 (local dev)  │
               └─────────────────┘      │                  │       └────────────────────┘
                                        └──────────────────┘
                                                  ▲
                                                  │    Docker images
                                                  │
                                       ┌──────────┴──────────┐
                                       │    Nexus registry   │
                                       │                     │
                                       └─────────────────────┘
```

Frontend and Backend services with one shared API contract (`GET|POST /api?q=...`) and a postgreSQL database.

Interfaces and API functionality is defined in `frontend/src/api/clients.ts` + `types.ts`.

Spring Boot API parses HTTP queries and dispatches them to solvers that perform CRUD operations on the database.

Images are built in CI on GitHub, stored in Nexus, and pulled onto the VPS by opstools or the deploy GitHub action.


## Runtime components

| Piece | Technology | Role |
|-------|------------|------|
| Frontend | React + Vite → static assets on **nginx** | UI; calls `/api` via axios |
| Backend | **Spring Boot 4**| Query API, auth, market solving, schema init |
| Database (prod) | **PostgreSQL** | Persistent storage |
| Database (dev) | **H2** | Dev profile |
| Registry | **Nexus** (`registry.negativeone.xyz`) | `negativeone-frontend` / `negativeone-backend` images |
| Host | VPS + **Docker Compose** | Bound to localhost (`8088` Frontend, `8080` Backend) |


## Environments

| | Local (`dev`) | Production (`prod`) |
|--|---------------|---------------------|
| How you run | `./mvnw spring-boot:run` + `npm run dev` | Docker Compose via opstools |
| Frontend | Vite; proxies `/api` → `localhost:8080` | nginx serves SPA; API reached via edge proxy to backend |
| Backend profile | `application-dev.properties` | `SPRING_PROFILES_ACTIVE=prod` + env from `.env` |
| DB | H2 mem | Postgres JDBC URL/user/password |
| Ingest token | `dev-ingest-token` | `NEGATIVEONE_INGEST_TOKEN` from `.env` |
| Schema | `schema.sql` | Same |


## Application layers (backend)

```
HTTP  GET|POST /api?q=...
        │
        ▼
  ClientController          ← parse params, JSON vs plain body, logging
        │
        ▼
  SolverDispatcher          ← parse "token: fields;...", pick ISolver
        │
        ├── Auth solvers        (register / login / logout)
        ├── Catalogue solvers   (groups, types, locations)
        ├── Market solvers      (order book, history, prices, user buys)
        └── Sell-ingest solvers (token-gated place/edit/cancel/stale)
                │
                ▼
        Repositories (JDBC)  +  MarketMaker  +  Session / IngestToken / Password services
                │
                ▼
             Database
```

### Query transport

All domain calls share one endpoint:

```
GET|POST /api?q={solverToken}: {field1};{field2};...
```

- Field separator is `;`.
- Read solvers use GET; mutations use POST (see `docs/openapi.yaml`).
- Health is separate: `GET /api/health`.

Solvers are small classes implementing `ISolver`, registered in `SolverDispatcher`. 
Sensitive fields (passwords, session tokens, ingest tokens) are redacted for logs via `ProtectedSolver` / `describeForLog`.

### Auth model

| Surface | Gate |
|---------|------|
| Browse, history, prices, locations | None |
| User buy place/cancel/edit, orders/transactions history | Session token from `login` |
| Sell order ingestion (place/edit/cancel/stale) | API `ingestionToken` (`NEGATIVEONE_INGEST_TOKEN`) |

Passwords use Argon2 via `PasswordCredentialService`. 
Sessions live in `sessions` with expiry.

### Market matching

`MarketMaker` runs inside buy/sell mutations:

- Highest open buy vs lowest open sell for `(typeId, locationId)`
- Trade while buy price ≥ sell price
- Fill price = **ask**; quantities reduced / orders closed
- Expired orders cancelled before matching

User buys are user-owned with `user_id` on the order. External sells are upserted by ingest and can be stale-cancelled by last-updated time.


## Frontend

- SPA under `frontend/`; typed clients in `frontend/src/api/clients.ts` + `types.ts`.
- Local: Vite proxy maps `/api` → Spring on `8080`.
- Site edge routes`/api` to the backend service.


## Data

Schema is owned by the backend: `backend/src/main/resources/schema.sql`.

Main domains:

- **Auth** | `users`, `sessions`
- **Catalogue** | `market_groups`, `inv_types`, `locations`, `sources`
- **Orders** | `market_orders` 
- **Fills / history / prices** | `market_fills`, history tables, `market_prices`


## Containers and networking

`docker-compose.yml`:

```
negativeone_frontend  →  127.0.0.1:8088→80   (nginx)
negativeone_backend   →  127.0.0.1:8080→8080 (Spring prod)
                              │
                              └── network postgres_default (external)
                                        → postgres:5432
```


## CI/CD path

```
push main
   → test (Maven verify)
   → build (jar + npm build)
   → publish (Docker → Nexus)

deploy (manual) or opstools on VPS
   → pull images
   → compose up
```


## Config and secrets

| Where | What |
|-------|------|
| `application.properties` | Port, SQL init mode |
| `application-dev.properties` | H2 + fixed dev ingest token |
| `application-prod.properties` | Datasource + ingest token from `.env` |
| VPS `.env` | Nexus login, image tag, DB, ingest token |
| GitHub Actions secrets | Nexus + SSH for publish/deploy |

Never commit `.env` or registry/SSH credentials.


## Related docs

- Setup runbooks: [README.md](../README.md), [PROCEDURES.md](PROCEDURES.md)
- HTTP contract: [openapi.yaml](openapi.yaml)