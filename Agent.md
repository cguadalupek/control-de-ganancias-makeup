# AGENT.md — Guía para agentes de IA en este proyecto

Sistema de registro de servicios y control de ganancias para **GUADALUPE MAKE UP Rodríguez**
(maquilladora profesional). Panel web + bot de Telegram + inventario de productos.

## Stack

- **Frontend:** React 18 + Vite 5 + Tailwind CSS 3 + lucide-react. SPA en un solo archivo
  `frontend/src/App.jsx` (~3.070 líneas) más `frontend/src/index.css` (~160 líneas de tokens y animaciones).
- **Backend:** FastAPI + SQLite (`backend/main.py`, ~790 líneas). Base de datos en `./data/salon.db`
  (volumen Docker, datos reales de producción).
- **Despliegue:** Docker Compose. `frontend` (nginx, puerto 80) sirve el build estático y proxya `/api/` →
  `backend:8000`; `tunnel` (cloudflared) publica el hostname **`makeup.kevincarmen.xyz`**.
- **Ubicación (producción):** LXC **113 `salon-app`** en Proxmox VE `192.168.1.210` → **192.168.1.113**.
  Debian 12, 2 vCPU / 2 GB RAM / 20 GB, `unprivileged` + `features: nesting=1,keyctl=1`, `onboot: 1`.
- **Host anterior (detenido, solo respaldo):** LXC `103` `makeup-registros` (`192.168.1.103`) con copia
  íntegra del proyecto y de la DB. **No levantar su stack mientras el 113 esté en producción**: comparten
  token de túnel y Cloudflare repartiría el tráfico entre versiones distintas.
- **No hay Node en el host:** **el build corre DENTRO del contenedor** (`node:18-alpine`).

## Reglas de negocio (NO cambiar sin pedirlo)

- **Salones:** `1 = Vanidades`, `2 = Maison Studio` (IDs estables, precargados en la DB).
- **Comisiones:** Vanidades → Maquillaje 40 %, otros servicios 30 %. Maison Studio → solo Maquillaje 60 %
  (el campo servicio se fuerza a "Maquillaje" y el porcentaje a 60, también en los servicios extra).
- **Meta mensual** por defecto: S/ 480.00 (`DEFAULT_GOAL` en App.jsx y fallback `480.0` en main.py).
- El panel de Resumen se reinicia a 0.00 al cambiar de mes (filtra por `mes`/`anio`).
- La **semana** de cada servicio la calcula el backend a partir de la fecha.

## API (prefijo `/api` vía nginx)

- `GET /salones` · `GET /catalogo` · `GET /servicios?desde&hasta&salon_id`
  (devuelve un objeto `{cantidad, servicios:[...], total_personal, total_salon, total_facturado}`, **no** una lista)
- `POST /registro` · `POST /registro-lote` · `PUT /registro/{id}` · `DELETE /registro/{id}`
- `GET /resumen/{anio}/{mes}`
- `GET/POST/PUT/DELETE /products` · `GET /products/by-name/{name}`
  · `PATCH /products/{id}/open|finish|reactivate`

Campos de un servicio: `fecha, servicio_nombre, precio, porcentaje, salon_id`.
El porcentaje se normaliza (`40` o `0.40` → 40 %). Ganancia personal = precio × %; el resto es del salón.

## Estructura de la UI

- **Tres vistas:** `resumen` · `productos` · `informes`. En móvil son pestañas de la barra inferior; en
  escritorio, ítems del sidebar (más "Registrar Servicio", que abre el modal).
- **Barra superior móvil (sticky, `md:hidden`):** logo + selector de mes `‹ Mes Año ›` + botón
  **Registrar** (rosa con degradado y resplandor `.glow-rose`). El botón **solo aparece en Resumen**
  (`activeTab === 'resumen' &&`), mide 44 px de alto y por debajo de 380 px se muestra solo con el icono `+`.
- **Ya no existe ningún FAB** ni elemento arrastrable: se eliminó `useDraggableFab` y los botones flotantes.
  Registrar servicio / producto se abren como **modales superpuestos** (`fixed inset-0` + backdrop blur,
  cierre con X, `Escape` o toque fuera, scroll bloqueado en `html` y `body`).
- **Resumen:** 3 métricas (Mi Ganancia Neta · Total Facturado · Meta) en
  `grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-3`; "Rendimiento por Semanas" **solo desktop**
  (`hidden lg:flex`, `lg:col-span-3` → ancho completo) y dos tarjetas de ganancia neta por salón.
- **Informes:** filtros (`BrandSelect` de rango + `SalonSelect` + `BrandDateField` Desde/Hasta + búsqueda),
  tarjetas de totales solo con `hasActiveFilters`, historial en **tabla `hidden md:block`**
  (`min-w-[750px]` dentro de `overflow-x-auto`) y en **tarjetas** en móvil (`md:hidden`, línea ~2016),
  paginación de 5 registros con Inicio/Último.
- **Productos:** en móvil una tarjeta de acciones con "Registrar productos" / "Ver mis productos";
  alta y listado en modales; tema negro & dorado en el listado.

## Componentes reutilizables (`App.jsx`)

- `BrandSelect` — desplegable de marca (botón + panel animado). Usado en Salón, Rango de fechas y Caducidad.
- `SalonSelect` — `BrandSelect` con la lista de salones.
- `BrandDateField` — campo de fecha con **calendario propio** (cabecera degradada rosa, semana de lunes,
  hoy y día seleccionado resaltados, pie `Hoy`/`Limpiar`). Sustituye al `input[type=date]` nativo, cuyo
  popup no se puede estilar.
- `BrandLogo` — monograma + wordmark (`compact` para la barra móvil).

## Despliegue (desde Windows con plink)

Host key del 113: `SHA256:1g1We0x6Lc338dLc1ShmkGfRNgOpuNu1ysxGnLmTusE`

```bash
# Un solo archivo (lo más habitual)
plink -ssh -pw PASSWORD -hostkey "SHA256:1g1We0..." root@192.168.1.113 \
  "cat > /opt/salon-app/frontend/src/App.jsx" < frontend/src/App.jsx
plink -ssh -pw PASSWORD -hostkey "SHA256:1g1We0..." root@192.168.1.113 \
  "cd /opt/salon-app && docker-compose up -d --build frontend"

# Varios archivos (tar; --no-same-owner es OBLIGATORIO en LXC unprivileged)
tar czf - . --exclude=data --exclude=node_modules | plink -ssh -pw PASSWORD -hostkey "SHA256:1g1We0..." \
  root@192.168.1.113 "cd /opt/salon-app && tar xzf - --no-same-owner --no-same-permissions"
```

- `frontend/Dockerfile` hace `npm install` + `npm run build` dentro del contenedor.
- `backend` monta `./data` como volumen; `backend/.env` no se versiona (sobrevive a los despliegues).
- Solo frontend: `docker-compose up -d --build frontend`. Todo: `docker-compose up -d --build`.
- Los LXCs 113 y 103 tienen una clave SSH entre ellos (`/root/.ssh/id_ed25519` en el 113), útil para copiar
  datos directamente con `scp`/`tar | ssh` sin pasar por Windows.

### Push a GitHub (desde el propio 113)

`origin` es SSH (`git@github.com:cguadalupek/control-de-ganancias-makeup.git`) y autentica con una
**deploy key** con permiso de escritura, así que el push se hace directamente desde el LXC:

```bash
cd /opt/salon-app && git add -A && git commit -m "tipo(scope): mensaje" && git push origin main
```

- El repo **no** versiona `node_modules/`, `frontend/dist/` ni `data/salon.db` (artefactos y datos reales):
  al tocar la interfaz solo aparece `frontend/src/*` en el commit, y la base de datos deja el árbol limpio.
- `/backups/` está ignorado (tarballs locales de seguridad).
- Verificar tras el push: `git ls-remote origin` debe mostrar el mismo SHA que `git rev-parse HEAD`.

## Caché y PWA

- nginx: `location = /index.html` → `no-cache`; `/assets/` (con hash) → `immutable, max-age=1y`.
- `frontend/public/sw.js`: el documento va **red-primero** y los assets cache-first; la caché
  `rodriguez-makeup-v2` borra las versiones anteriores al activarse. Nunca volver a una cache-first fija
  para `/`: servía el `index.html` viejo (y con él el bundle viejo) indefinidamente.
- Tras un despliegue basta **un** refresco; dos la primera vez si el navegador venía del SW v1. En PWA
  instalada, cerrar y reabrir.

## Sistema de diseño

- **Colores:** berry `#b64a83` (hover `#933a69`), rosa de acento `#ec71a8` / `#d95392`, mauve `#efd3e4` /
  blush `#f6e3f0`, crema `#f6e9df`, champagne/bronce `#eec9a3`/`#c89b6b`/`#8a5a3e`/`#7d4e32`,
  oscuro `#2a1a25`, fondo `#faf4f8`.
- **Tokens:** `tailwind.config.js` → `colors.brand.*` (berry, berry-hover, mauve, blush, cream, dark,
  champagne, bronze, bronze-deep).
- **Tipografías:** Outfit (UI y titulares), Playfair Display (`font-serif-luxury`), Great Vibes
  (`font-brand-script`).
- **Clases reutilizables (`index.css`):** `card-luxury`, `bg-gradient-rose`, `bg-gradient-gold`,
  `text-gradient-gold`, `animate-modal`, `glow-gold`, `glow-rose` (resplandor pulsante del botón Registrar,
  con variante para `prefers-reduced-motion`).
- **Prioridad de UX:** la app se usa sobre todo en **móvil** (pulgar, botones ≥44 px, tarjetas en vez de
  tablas con scroll) y en **desktop** (sidebar). Toda edición debe verse bien en ambos.

## Verificación visual

Playwright está instalado en el **LXC 103** (`/root/shot.py`, `/root/verify*.py`) y desde allí se puede
apuntar al host nuevo:

```bash
plink -pw PASSWORD -hostkey "SHA256:RhIW5IjWnstWLmh53Qrg51C3yg7EwKzcdE49RkI43HE" root@192.168.1.103 \
  "cd /root && python3 verify_mig.py"   # URL = http://192.168.1.113/
```

Medir siempre geometría real (`getBoundingClientRect`), no fiarse de una captura: comprobar
`documentElement.scrollWidth == window.innerWidth` en 320/360/390/430 px, que el botón/panel quepa en el
viewport y que la consola quede sin errores.

## Pitfalls conocidos

- **`frontend/src/App.jsx` usa finales de línea CRCRLF (`\r\r\n`).** Las herramientas `patch`/`write_file`
  los convierten en `\r\n\r\n` e insertan una línea en blanco tras **cada** línea (el archivo pasa de 3.068 a
  ~6.100 líneas sin dar ningún error). Editar con un script de Python: `raw.decode('utf-8').split('\r\r\n')`,
  reemplazar por índice de línea con `assert` del contenido viejo y re-unir con `'\r\r\n'`; verificar al final
  `count('\r\r\n') == count('\n')`.
- **Desplegables superpuestos:** todos los wrappers usan `relative z-[70]`, así que con dos abiertos gana el
  último del DOM. El wrapper debe subir cuando está abierto:
  `` className={`relative ${open ? 'z-[95]' : 'z-[70]'}`} ``. Comprobar con
  `document.elementFromPoint(centro del trigger de abajo)` + `panel.contains(el)`.
- **Stacking contexts que tapan los desplegables:** `.card-luxury:hover { transform }` (por eso el realce va
  dentro de `@media (hover: hover)`), `animate-modal` (deja `transform` permanente) y `backdrop-blur` crean
  contexto de apilamiento y confinan los `z-*` internos.
- **`node_modules/` y `frontend/dist/` están versionados** aunque figuran en `.gitignore`: un árbol que no los
  tenga muestra miles de `D` en `git status` (en el 113 pasa con `node_modules`). **No los restaures**: el
  build los genera dentro de la imagen.
- **No buildear en el host del LXC** (no hay Node): siempre `docker-compose up -d --build`.
- `localStorage['salon_services']` es una caché del backend; el backend es la fuente de verdad.
- **No borrar `data/salon.db`** (datos reales de producción). Antes de tocar nada que escriba en la DB,
  hacer copia: `cp data/salon.db data/salon.db.bak-$(date +%H%M%S)`.
- Los `<input type="date">` nativos siguen existiendo en los modales de registro/edición de servicio y de
  producto; solo los filtros de Informes usan `BrandDateField`.
