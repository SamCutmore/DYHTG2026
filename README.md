# DYHTG2026

React + Spring Boot.

Pipeline on `main`: `test` → `build` → `publish`. Deploy is manual.


## Local

Frontend:

```bash
cd frontend && npm install && npm run dev
```

```bash
cd backend && ./mvnw test && ./mvnw spring-boot:run "-Dspring-boot.run.profiles=dev"
```

## Opstools (VPS / prod)

```bash
./opstools/setup.sh    # write .env (use SECRETS.local.txt as the source)
./opstools/fetch.sh    # pull images from Nexus
./opstools/up.sh       # start servers (backend uses prod profile)
./opstools/status.sh   # service status
./opstools/logs.sh     # logs
./opstools/down.sh     # stop servers
```