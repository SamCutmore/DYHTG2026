# DYHTG2026

React + Spring Boot. On `main`: `test` → `build` → `publish`.

## Local

```bash
cd backend && ./mvnw test && ./mvnw spring-boot:run
cd frontend && npm install && npm run dev
```

## Opstools

```bash
./opstools/setup.sh    # write .env
./opstools/fetch.sh    # pull images from Nexus
./opstools/up.sh       # start servers
./opstools/status.sh   # Get service status
./opstools/logs.sh     # show logs
./opstools/down.sh     # shutdown servers
```
