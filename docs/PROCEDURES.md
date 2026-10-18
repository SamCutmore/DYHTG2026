# Procedures

Day-to-day workflows for local work and production ops.


## Profiles

| Profile | When | Database |
|---------|------|----------|
| `dev` | Laptop / local work | In-memory H2 |
| `prod` | VPS Docker (`docker-compose`) | PostgreSQL (`postgres` container) |

Shared settings: `backend/src/main/resources/application.properties`.  
Profile-specific: `application-dev.properties`, `application-prod.properties`.

**Never put passwords in those property files.**


## Development cycle

1. Branch from `main` (or work on a feature branch).
2. Run locally.
3. Change code; keep tests green:

   ```bash
   cd backend && ./mvnw test
   ```

4. Format Java with Spotless **before you push**:

   ```bash
   cd backend && ./mvnw spotless:apply
   ```

   Optional check without writing files:

   ```bash
   cd backend && ./mvnw spotless:check
   ```

5. Commit, push or open a PR.
6. On push to `main`, CI runs **test → build → publish**.


## Local development (`dev`)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
./mvnw test
./mvnw spring-boot:run "-Dspring-boot.run.profiles=dev"
```

- API: `http://localhost:8080`
- Contract: `docs/openapi.yaml`


## Production ops (VPS)

### 1. Deploy `.env` (first time / rotate secrets)

```bash
./opstools/setup.sh
```

| Prompt | Typical value |
|--------|----------------|
| `NEXUS_REGISTRY` | `registry.negativeone.xyz` |
| `NEXUS_USERNAME` | Nexus docker user |
| `NEXUS_PASSWORD` | Nexus password |
| `IMAGE_TAG` | `latest` |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://postgres:5432/dyhtg` |
| `SPRING_DATASOURCE_USERNAME` | Postgres user |
| `SPRING_DATASOURCE_PASSWORD` | Postgres password |
| `NEGATIVEONE_INGEST_TOKEN` | Sell-ingest shared secret |

### 2. Start / refresh stack

```bash
./opstools/fetch.sh
./opstools/up.sh
./opstools/status.sh
```

Schema is applied by Spring on backend startup. Or use GitHub Actions **deploy** after secrets and `.env` exist.


## GitHub Actions secrets

| Secret | Used by | Purpose |
|--------|---------|---------|
| `NEXUS_REGISTRY` | publish, deploy | Docker registry host |
| `NEXUS_USERNAME` | publish, deploy | Registry login |
| `NEXUS_PASSWORD` | publish, deploy | Registry password |
| `SERVER_HOST` | deploy | VPS hostname/IP |
| `SERVER_USER` | deploy | SSH user |
| `SERVER_SSH_KEY` | deploy | Private key (PEM) for SSH |

See [README.md](../README.md) for the full pipeline table and [ARCHITECTURE.md](ARCHITECTURE.md) for stack layout.