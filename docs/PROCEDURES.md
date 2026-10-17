# Procedures

## Profiles

| Profile | When | Database |
|---------|------|----------|
| `dev` | Laptop / local hackathon work | In-memory H2 |
| `prod` | VPS Docker (`docker-compose`) | PostgreSQL (`postgres` container) |

Shared settings live in `backend/src/main/resources/application.properties`.  
Profile-specific files: `application-dev.properties`, `application-prod.properties`.

**Never put passwords in those property files.**

---

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
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```
---

### 1. Deploy `.env` on the VPS

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

### 2. Start / refresh stack

```bash
./opstools/fetch.sh
./opstools/up.sh
./opstools/status.sh
```

### 3. Database table

```sql
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  body TEXT NOT NULL
);
```

---

## GitHub Actions (pipeline secrets)

Repo secrets used by workflows:

| Secret | Used by | Purpose |
|--------|---------|---------|
| `NEXUS_REGISTRY` | publish, deploy | Docker registry host |
| `NEXUS_USERNAME` | publish, deploy | Registry login |
| `NEXUS_PASSWORD` | publish, deploy | Registry password |
| `SERVER_HOST` | deploy | VPS hostname/IP |
| `SERVER_USER` | deploy | SSH user |
| `SERVER_SSH_KEY` | deploy | Private key (PEM) for SSH |