# AGENT.md — Guía para agentes de IA en este proyecto

Sistema de registro de servicios y control de ganancias para **GUADALUPE MAKE UP Rodriguez**
(maquilladora profesional). Panel web + bot de Telegram + inventario de productos.

## Stack

- **Frontend:** React 18 + Vite 5 + Tailwind CSS 3 + lucide-react (SPA de un solo archivo `frontend/src/App.jsx`, ~2600 líneas).
- **Backend:** FastAPI + SQLite (`backend/main.py`, ~700 líneas). Base de datos en `./data/salon.db` (volumen Docker).
- **Despliegue:** Docker Compose. `frontend` (nginx, puerto 80) sirve el build estático y proxya `/api/` → `backend:8000`.
- **Ubicación:** LXC `makeup-registros` (192.168.1.103). No hay node en el host: **el build corre DENTRO del contenedor** (`node:18-alpine`).

## Reglas de negocio (NO cambiar sin pedirlo)

- **Salones:** `1 = Vanidades`, `2 = Maison Studio` (IDs estables, precargados en la DB).
- **Comisiones:** Vanidades → Maquillaje 40%, otros servicios 30%. Maison Studio → solo Maquillaje 60% (el campo servicio se fuerza a "Maquillaje").
- **Meta mensual** por defecto: S/ 480.00 (`DEFAULT_GOAL` en App.jsx y fallback `480.0` en main.py).
- El panel de Resumen se reinicia a 0.00 al cambiar de mes (filtra por `month`/`year`).

## API (prefijo `/api` vía nginx)

- `GET /salones` · `GET /catalogo` · `GET /servicios?desde&hasta&salon_id`
- `POST /registro` · `PUT /registro/{id}` · `DELETE /registro/{id}`
- `GET /resumen/{anio}/{mes}`
- `GET/POST/PUT/DELETE /products` · `PATCH /products/{id}/open|finish|reactivate`

Campos de registro de servicio: `fecha, servicio_nombre, precio, porcentaje, salon_id`.
Porcentaje se normaliza: `40` o `0.40` → 40%. Ganancia personal = precio × %; salón = resto.

## Despliegue (desde Windows con plink)

```bash
# Subir cambios (tar con --no-same-owner es OBLIGATORIO en LXC unprivileged)
tar czf - . --exclude=data --exclude=node_modules | plink -ssh -pw PASSWORD \
  -hostkey "SHA256:RhIW5IjWnstWLmh53Qrg51C3yg7EwKzcdE49RkI43HE" root@192.168.1.103 \
  "cd /opt/salon-app && tar xzf - --no-same-owner --no-same-permissions"
# Rebuild + deploy
plink ... "cd /opt/salon-app && docker compose up -d --build"
```

- `frontend/Dockerfile` hace `npm install` + `npm run build` dentro del contenedor.
- `backend` monta `./data` como volumen; `backend/.env` no se versiona (sobrevive).
- Para solo-frontend: `docker compose up -d --build frontend`.

## Sistema de diseño

- **Colores:** rosa `#ec71a8` (hover `#d95392`), pastel `#f9cee3` / `#fce3ed`, crema `#fdebdd`,
  dorado `#ecc880`/`#d4af37`/`#aa7c11`, oscuro `#1e1e1c`, fondo `#faf5f8`.
- **Tipografías:** Outfit (UI/titulares), Playfair Display (`font-serif-luxury`), Great Vibes (`font-brand-script`).
- **Clases reutilizables:** `card-luxury`, `bg-gradient-rose`, `bg-gradient-gold`, `text-gradient-gold`, `animate-modal`, `glow-gold` (definidas en `index.css`).
- **Prioridad de UX:** la app se usa mucho en **móvil** (navegación con el pulgar, botones ≥44px, tarjetas en vez de tablas con scroll horizontal) y en **desktop** (sidebar lateral). Toda edición debe verse bien en ambos.

## Verificación visual (Playwright en el LXC)

```bash
# Capturas de pantalla móvil y desktop
python3 /root/shot.py <url> <width> <height> <salida.png>
```

## Pitfalls conocidos

- `npm install` no existe en el host del LXC; no intentes buildear en el host.
- Las tablas de historial usan `min-w-[650px]`/`min-w-[750px]` (scroll horizontal en móvil): para móvil prefiere tarjetas.
- `localStorage['salon_services']` es un cache del backend; el backend es la fuente de verdad.
- No borres `data/salon.db` (contiene datos reales de producción).
