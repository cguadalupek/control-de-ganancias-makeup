# AGENT.md — Guía para agentes de IA en este proyecto

Sistema de registro de servicios y control de ganancias para **GUADALUPE MAKE UP Rodríguez**
(maquilladora profesional). Panel web + bot de Telegram + inventario de productos.

## Stack

- **Frontend:** React 18 + Vite 5 + Tailwind CSS 3 + lucide-react. SPA en un solo archivo
  `frontend/src/App.jsx` (~3.200 líneas) más `frontend/src/index.css` (~210 líneas de tokens y animaciones).
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

- **Salones:** `1 = Vanidades`, `2 = Maison Studio`, `3 = Rodriguez Makeup` (IDs estables, precargados en la DB).
- **Comisiones:** Vanidades → Maquillaje 40 %, otros servicios 30 %. Maison Studio → solo Maquillaje 60 %
  (el campo servicio se fuerza a "Maquillaje" y el porcentaje a 60, también en los servicios extra).
- **Entidad propia (`salones.propio = 1`, hoy `3 = Rodriguez Makeup`):** el servicio es 100 % de la
  maquilladora, **sin comisión**. Al elegirla en el registro el campo *Comisión* queda **bloqueado en 100 %**
  (y el de edición igual). El backend lo fuerza en `POST /registro`, `POST /registro-lote` y `PUT /registro/{id}`
  (`salon_es_propio()`), así que la ganancia del salón siempre es 0.00 aunque el cliente mande otro porcentaje.
  La fila del salón propio se crea/marca de forma idempotente en `init_db()`.
- **Criterio en la UI:** `esPropio(id)` en `App.jsx` (flag `propio` o nombre con "rodriguez").
- **Meta mensual** por defecto: S/ 480.00 (`DEFAULT_GOAL` en App.jsx y fallback `480.0` en main.py).
- El panel de Resumen se reinicia a 0.00 al cambiar de mes (filtra por `mes`/`anio`).
- La **semana** de cada servicio la calcula el backend a partir de la fecha.

## API (prefijo `/api` vía nginx)

- `GET /salones` (devuelve `{id, nombre, propio}`) · `GET /catalogo` · `GET /servicios?desde&hasta&salon_id`
  (devuelve un objeto `{cantidad, servicios:[...], total_personal, total_salon, total_facturado}`, **no** una lista)
- `POST /registro` · `POST /registro-lote` · `PUT /registro/{id}` · `DELETE /registro/{id}`
- `GET /resumen/{anio}/{mes}`
- `GET/POST/PUT/DELETE /products` · `GET /products/by-name/{name}`
  · `PATCH /products/{id}/open|finish|reactivate`

Campos de un servicio: `fecha, servicio_nombre, precio, porcentaje, salon_id`.
El porcentaje se normaliza (`40` o `0.40` → 40 %). Ganancia personal = precio × %; el resto es del salón.

## Estructura de la UI

- **Tres vistas:** `resumen` · `productos` · `informes`. En móvil son pestañas de la barra inferior; en
  escritorio, ítems del sidebar (más "Registrar Servicio", que abre el modal). El **sidebar (escritorio) y la
  barra inferior (móvil) van en degradado berry** (`from-[#b64a83] via-[#9d3f6f] to-[#6f2b4c]` en vertical,
  `from-[#b64a83] via-[#a3416f] to-[#8f3663]` en horizontal) con textos e iconos claros: el ítem activo es
  una píldora **blanca con texto berry** y los inactivos `text-white/90` (icono `bg-white/15`). El logo del
  sidebar usa `<BrandLogo onDark />` (wordmark en blanco). La **cabecera superior de móvil sigue clara**
  porque ahí vive el botón Registrar rosa.
- **Barra superior móvil (sticky, `md:hidden`):** logo + selector de mes `‹ Mes Año ›` + botón
  **Registrar** (rosa con degradado y resplandor `.glow-rose`). El botón **solo aparece en Resumen**
  (`activeTab === 'resumen' &&`), mide 44 px de alto y por debajo de 380 px se muestra solo con el icono `+`.
- **Ya no existe ningún FAB** ni elemento arrastrable: se eliminó `useDraggableFab` y los botones flotantes.
  Registrar servicio / producto se abren como **modales superpuestos** (`fixed inset-0` + backdrop blur,
  cierre con X, `Escape` o toque fuera, scroll bloqueado en `html` y `body`).
- **Resumen:** 3 métricas (Mi Ganancia Neta · Total Facturado · Meta) en
  `grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-3`; "Rendimiento por Semanas" **solo desktop**
  (`hidden lg:flex`, `lg:col-span-3` → ancho completo) y **tres botones `.gain-card`** de ganancia neta:
  Vanidades, Maison Studio y **"Ganancia Neta · Propia"** (entidad propia, 100 %). Los tres se iluminan y
  crecen al pasar el cursor y, al pulsarlos, abren Informes ya filtrado por ese salón.
- **Informes:** filtros en **dos columnas** (`lg:grid-cols-2`): a la izquierda la lista de rangos
  (histórico, hoy, esta semana…) y a la derecha la lista de salones (incluye la entidad propia); el botón
  *Limpiar* va alineado a la derecha. Debajo, `BrandDateField` Desde/Hasta + búsqueda por servicio, tarjetas
  de totales solo con `hasActiveFilters`, historial en **tabla `hidden md:block`**
  (`min-w-[750px]` dentro de `overflow-x-auto`) y en **tarjetas** en móvil (`md:hidden`),
  paginación de 5 registros con Inicio/Último.
- **Productos:** en móvil solo la caja de acciones (Registrar productos pulsante + Ver mis productos → modal
  con Abrir Hoy/Terminado/Reactivar/Editar/Eliminar en cada resultado). El inventario (`hidden md:block`) es
  **solo de escritorio**: rejilla **3×3** (`md:grid-cols-2 xl:grid-cols-3`) con **9 productos por página** y
  controles de paginación copiados de Informes (`productPage`/`productsPerPage`). Cada tarjeta lleva Abrir
  Hoy (si no está abierto) / Terminado / Reactivar / Editar / Eliminar.

## Componentes reutilizables (`App.jsx`)

- `BrandSelect` — desplegable de marca (botón + panel animado). Usado en Salón, Rango de fechas y Caducidad.
- `SalonSelect` — `BrandSelect` con la lista de salones (la entidad propia se describe como *Mi entidad propia - 100%*).
- `BrandDateField` — campo de fecha con **calendario propio** (cabecera degradada rosa, semana de lunes,
  hoy y día seleccionado resaltados, pie `Hoy`/`Limpiar`). Sustituye al `input[type=date]` nativo, cuyo
  popup no se puede estilar. **Se usa en los filtros de Informes y también en los modales de registro y
  edición de servicio** (mismo estilo y misma altura); el alta/edición de **producto** sigue con
  `input[type=date]` nativo.
- `AnimatedAmount` — contador animado (`0 → valor` en ~850 ms con frenada `ease-out`) que usan **todos los
  montos del Resumen** (Mi Ganancia Neta, Total Facturado, "Faltan S/ …" y las tres ganancias por salón).
  **Solo se anima al abrir la app**: `animate={animateCounters}`, que arranca en `true` y se apaga 1.5 s
  después del montaje de `App`; al volver de otra pestaña (o al cambiar de mes) el monto aparece directo.
  Con `prefers-reduced-motion` muestra el valor sin rampa.
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
  `text-gradient-gold`, `animate-modal`, `glow-gold`, `glow-rose` (resplandor pulsante del botón Registrar
  de la barra móvil), **`glow-pulse-strong`** (palpitación intensa de "Registrar productos") y
  **`gain-card`** (hover de los botones de ganancia neta: `scale(1.035)` + brillo, solo en
  `@media (hover: hover) and (pointer: fine)`); todas con variante para `prefers-reduced-motion`.
- **Ventana "Registrar Servicio":** en escritorio `max-w-2xl md:max-w-4xl xl:max-w-5xl`, rejilla de campos
  `sm:grid-cols-2 lg:grid-cols-4` (Salón · Fecha · Servicio ancho / Precio ancho · Comisión ancho). Todos
  los controles comparten **altura uniforme** (48 px en móvil, 52 px desde `sm`) gracias a
  `.field-uniform`; el campo Fecha usa el calendario de marca, no el `input[type=date]`.
- **Sin aviso de instalación PWA:** se eliminó el banner "Instala Rodríguez Make Up" junto con su estado
  (`deferredInstallPrompt`, `showInstallBanner`), el `beforeinstallprompt` y `installApp`. El `sw.js` sigue
  existiendo por si la app ya está instalada.
- **Prioridad de UX:** la app se usa sobre todo en **móvil** (pulgar, botones ≥44 px, tarjetas en vez de
  tablas con scroll) y en **desktop** (sidebar). Toda edición debe verse bien en ambos.

## Verificación visual

Playwright está instalado en el **LXC 103** (`/root/shot.py`, `/root/verify*.py`) y desde allí se puede
apuntar al host nuevo. **Si el 103 no responde** (su SSH no está accesible desde el 113/Windows), la
alternativa verificada es **Chrome headless + CDP desde Windows** con Node (no hace falta instalar nada):

```bash
# 1) chrome --headless=new --remote-debugging-port=9333 --user-data-dir=<tmp> about:blank
# 2) Node >= 21 (WebSocket global): fetch /json/list -> ws -> Page.navigate + Runtime.evaluate
#    (returnByValue) para medir geometría real y estilo calculado; Emulation.setDeviceMetricsOverride
#    para 1440x900 y 390x844.
cd /tmp && node verify.js   # imprime un JSON con todas las comprobaciones
```

Comprobaciones útiles: ancho de la ventana modal, `gridTemplateColumns` (3×3 del inventario), mitad/mitad
de los filtros de Informes, `paddingLeft` + hueco icono/texto, `animationName`/`iterationCount` del botón
pulsante, reglas `.gain-card:hover` en el CSSOM (recorrer también los `@media`) y
`documentElement.scrollWidth == window.innerWidth` en 390 px (sin desborde horizontal).

```bash
plink -pw PASSWORD -hostkey "SHA256:RhIW5IjWnstWLmh53Qrg51C3yg7EwKzcdE49RkI43HE" root@192.168.1.103 \
  "cd /root && python3 verify_mig.py"   # URL = http://192.168.1.113/
```

Medir siempre geometría real (`getBoundingClientRect`), no fiarse de una captura: comprobar
`documentElement.scrollWidth == window.innerWidth` en 320/360/390/430 px, que el botón/panel quepa en el
viewport y que la consola quede sin errores.

## Pitfalls conocidos

- **Cabecera sticky de móvil vs secciones:** la cabecera es `sticky top-0 z-30` y la sección de filtros de
  Informes era también `relative z-30`; con el mismo z-index gana **el que va después en el DOM**, así que al
  deslizar la tarjeta tapaba el logo y el título. La sección de filtros usa `z-10 md:z-30` (en móvil queda por
  debajo de la cabecera; en escritorio no hay cabecera sticky y sus desplegables deben ir por encima de la
  tabla). Comprobar con `document.elementFromPoint` en el centro de la cabecera tras `window.scrollTo`.
- **Tailwind: una variante pisa la utilidad base del mismo grupo.** `sm:p-3.5` se emite después de `pl-9`,
  así que en escritorio el `padding-left` acababa en 14 px y el texto del campo "Nombre del servicio"
  chocaba con el icono de la lupa. Regla: en inputs con icono superpuesto, el padding lateral va **con la
  misma variante** (`pl-11 pr-10 sm:pl-12 sm:pr-11`), nunca mezclando `p-*` con `pl-*`. Y para que **todos**
  los controles (listas, texto, calendario) midan lo mismo se usa la clase `.field-uniform` de `index.css`
  (fija `height` 48/52 px y anula el padding vertical con `!important`, porque las utilidades de Tailwind no
  se pueden sobrescribir de otra forma sin tocar cada cadena de clases). Comprobar midiendo
  `computedStyle.paddingLeft` / `getBoundingClientRect().height` y el hueco real
  (`input.left + paddingLeft - icon.right > 8`).
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
