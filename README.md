# KegTracker Frontend

KegTracker Frontend: keg and brewery management system.

## Technologies
- React + TypeScript
- Material UI (MUI)
- Axios
- React Router
- Docker

## Local Installation

```bash
cd Frontend
npm install
cp .env.example .env
# Edit .env with your variables
npm run dev
```

## Initialization

Access http://localhost:8080/initialize

## Docker

```bash
docker build -t kegtracker-frontend .
docker run --env-file .env -p 5173:5173 kegtracker-frontend
```

## Environment Variables

- `FRONTEND_FQDN` — Frontend base URL

## Licencia

This software is distributed under the AGPL-3.0 license with an additional non-compete clause.
See [LICENSE](../LICENSE) for more details.

---

**Author:** tinouy 
