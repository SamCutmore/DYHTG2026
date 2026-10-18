# Negativeone

React frontend + Spring Boot backend. Market API, Docker images published to Nexus, production stack on a VPS via opstools.

Pipeline on `main`: **test → build → publish**. 


## Requirements

| Tool | Notes |
|------|--------|
| **Nexus** | Docker registry for frontend/backend images |
| **PostgreSQL** | Production DB |
| **Docker** + Compose | Run/pull images |
| **Java 21** | Backend Temurin|
| **Node 22** | Frontend |
| **Git** | Clone repo |
| **SSH** | Access to the VPS |

Local backend uses in-memory **H2**.


## First-time production setup

### 1. GitHub Actions secrets

Repo → Settings → Secrets and variables → Actions:

| Secret | Used by | Purpose |
|--------|---------|---------|
| `NEXUS_REGISTRY` | publish, deploy | Registry host (e.g. `registry.negativeone.xyz`) |
| `NEXUS_USERNAME` | publish, deploy | Registry user |
| `NEXUS_PASSWORD` | publish, deploy | Registry password |
| `SERVER_HOST` | deploy | VPS hostname/IP |
| `SERVER_USER` | deploy | SSH user |
| `SERVER_SSH_KEY` | deploy | Private key (PEM) for SSH |

### 2. Publish images to Nexus

Push to `main`. The pipeline runs tests, builds artifacts, and publishes:

- `{NEXUS_REGISTRY}/negativeone-frontend:latest` (+ `:sha`)
- `{NEXUS_REGISTRY}/negativeone-backend:latest` (+ `:sha`)

### 3. Clone on the VPS

Ensure Postgres are already running and expose the Docker network `postgres_default`.

```bash
git clone <repo-url> /opt/negativeone
cd /opt/negativeone
```

### 4. Write `.env` with setup.sh

```bash
./opstools/setup.sh
```

Prompts (values written to `.env`, chmod `600`):

| Variable | Example value |
|----------|----------------|
| `NEXUS_REGISTRY` | `registry.negativeone.xyz` |
| `NEXUS_USERNAME` / `NEXUS_PASSWORD` | Nexus credentials |
| `IMAGE_TAG` | `latest` |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://postgres:5432/dyhtg` |
| `SPRING_DATASOURCE_USERNAME` / `PASSWORD` | Postgres app user |
| `NEGATIVEONE_INGEST_TOKEN` | Shared secret for sell-order ingest |

`.env` is gitignored and survives Actions deployment.


## Database and deploy

Schema/init is handled by Spring.

### Option A GitHub Actions deploy

Actions → **deploy** → Run workflow. SSHes to the VPS, syncs `/opt/negativeone` to `main`, then `fetch.sh` + `up.sh`.

Requires first-time `setup.sh` already done so `.env` exists to protect secrets

### Option B Manual on the VPS

```bash
cd /opt/negativeone
./opstools/fetch.sh   # docker login + compose pull
./opstools/up.sh      # start frontend + backend (prod profile)
./opstools/status.sh  # confirm containers are up
```

Useful companions: `./opstools/logs.sh`, `./opstools/down.sh`.


## Local development

### Backend

```bash
cd backend
./mvnw test
./mvnw spring-boot:run "-Dspring-boot.run.profiles=dev"
```

- Profile `dev` → H2 in-memory
- API default: `http://localhost:8080`
- Query surface: `GET /_q?q=...` (see `docs/openapi.yaml`)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Opstools

Scripts under `opstools/` for VPS / production Docker:

| Script | Role |
|--------|------|
| `setup.sh` | Interactive `.env` |
| `fetch.sh` | `docker login` + `docker compose pull` |
| `up.sh` | Start stack |
| `down.sh` | Shutdown stack |
| `status.sh` | Container status |
| `logs.sh` | Follow logs |

Compose (`docker-compose.yml`) runs:

- **frontend** → `127.0.0.1:8088`
- **backend** → `127.0.0.1:8080`, `SPRING_PROFILES_ACTIVE=prod`, joins `postgres_default`


## GitHub Actions pipeline

| Workflow | Trigger | What it does |
|----------|---------|----------------|
| **pipeline** | Push to `main` | `test` → `build` → `publish` |
| **test** | Called by pipeline | `./mvnw verify` JaCoCo artifact |
| **build** | After test | Package backend; `npm ci` + `npm run build` |
| **publish** | After build | push Docker images to Nexus (`latest` + commit SHA) |
| **deploy** | Manual | SSH → sync repo → `fetch.sh` → `up.sh` |
| **status** | Hourly cron + manual | Curl production API health check |

## Further reading

- Profiles and local vs prod DB: `docs/PROCEDURES.md`
- HTTP API: `docs/openapi.yaml`