# KegTracker Frontend

Frontend de KegTracker: sistema de gestión de barriles y cervecerías.

## Tecnologías
- React + TypeScript
- Material UI (MUI)
- Axios
- React Router
- Docker

## Instalación local

```bash
cd Frontend
npm install
cp .env.example .env
# Edita .env con tus variables
npm run dev
```

## Docker

```bash
docker build -t kegtracker-frontend .
docker run --env-file .env -p 5173:5173 kegtracker-frontend
```

## Variables de entorno

- `VITE_API_BASE_URL` — URL base del backend

## Licencia

Este software se distribuye bajo la licencia AGPL-3.0 con una cláusula adicional de no competencia.  
Ver [LICENSE](../LICENSE) para más detalles.

---

**Autor:** mperez 