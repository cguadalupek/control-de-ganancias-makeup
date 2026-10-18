# 🌸 Rodríguez Make Up - Control de Ganancias y Servicios

Sistema web integral y profesional diseñado para la gestión financiera, control de servicios de belleza y maquillaje, cálculo automatizado de comisiones y seguimiento de metas mensuales.

---

## 📌 Descripción

**Rodríguez Make Up - Control de Ganancias** permite registrar servicios, ingresos e inventario; calcular comisiones y consultar informes históricos desde cualquier dispositivo.

La interfaz está pensada **primero para el móvil** (se usa con el pulgar, en el salón) y se adapta a **escritorio** con menú lateral. Se instala como PWA desde el navegador.

---

## ✨ Características Principales

- 🔐 **Acceso con usuario y contraseña:** pantalla de ingreso con la identidad de la marca (mismo estilo que la app), sesión persistente de **30 días** y dos niveles de acceso: **maquilladora** (las secciones de siempre) y **administrador** (además ve **Configuración** para crear y administrar usuarios).
- ⚙️ **Sección Configuración (solo administrador):** alta de usuarios con nombre, usuario, contraseña y nivel de acceso; lista de usuarios con rol, estado y último ingreso; cambio de rol, restablecer contraseña, activar/desactivar y eliminar; además, cambio de la contraseña propia y cierre de sesión.
- ✨ **Marca y PWA Rodríguez:** monograma “R”, favicon e iconos propios, manifiesto, service worker y aviso de instalación cuando el navegador admite instalar la aplicación.
- 📱 **UI/UX refinada:** registro de servicio de un solo paso con etiquetas alineadas, modales centrados con scroll interno y cierre fijo, y acciones de inventario móvil de ancho completo en una paleta clara integrada con la app.

- 📊 **Dashboard Dinámico Mensual:**
  - Métricas clave en tiempo real: Mi Ganancia Neta, Total Facturado y Progreso de la Meta.
  - **Reinicio automático a cero:** al iniciar cada nuevo mes, el panel comienza limpio en `S/ 0.00` (0% de meta).
  - Selector de mes interactivo (`‹ Mes Año ›` con retorno al mes en curso) para consultar períodos históricos.

- 📈 **Rendimiento Semanal:**
  - Gráfico de barras por semanas (Semana 1 a 5) con semana promedio y total del mes.
  - Tarjetas de ganancia neta por salón (Vanidades y Maison Studio).
  - En móvil el gráfico semanal se oculta para no alargar el scroll; en escritorio ocupa el **ancho completo** del contenido.

- ✍️ **Registro y Edición de Servicios:**
  - Formulario de alta rápida con cálculo en vivo de ganancias según el precio y la comisión.
  - **Servicios extra en una sola transacción** (`POST /registro-lote`): varios servicios de la misma clienta con la misma fecha y salón se guardan juntos (rollback si algo falla).
  - **Edición completa:** modal interactivo para actualizar fecha, nombre del servicio, precio cobrado y comisión de cualquier registro previo.

- 📑 **Informes, Historial y Paginación:**
  - Filtros rápidos por período (Hoy, Esta semana, Este mes, Mes anterior, Este año, Todo el histórico, Rango personalizado).
  - Filtros por salón y búsqueda por nombre del servicio, con contador de servicios junto al filtro principal.
  - **Calendario propio** (no el del navegador) para elegir las fechas *Desde* / *Hasta*.
  - **Paginación:** 5 registros por página con Inicio / Último y páginas intermedias reducidas.
  - Exportar el historial filtrado a **CSV** y a **Excel** con la marca.

- 💄 **Inventario “Mis Productos”:** registro con caducidad automática (6/12 meses o personalizada), stock unitario, semáforo de vencimiento (🟢 vigente / 🟡 próximo / 🔴 caducado) y acciones de abrir hoy, terminar y reactivar.

- 🤖 **Bot de Telegram + IA local** para consultar y actualizar el inventario por chat.

- 🎨 **Diseño elegante y 100% responsivo:** identidad Rodríguez con berry, mauve, crema y champagne (`#B64A83`, `#EFD3E4`, `#F6E9DF`, `#C89B6B`), sin scroll horizontal de 320 px a 430 px en las tres vistas.

---

## 📱 Vista móvil

- **Barra superior fija:** logo + selector de mes (`‹ Octubre 2026 ›`, con “Volver a hoy” si no es el mes en curso) + botón **Registrar**.
- **Botón Registrar:** rosa sólido con degradado, resplandor pulsante y sin arrastre. Aparece **solo en la sección Resumen**; por debajo de 380 px se muestra únicamente con el icono `+` para que nunca haya scroll horizontal.
- **Barra inferior:** 3 pestañas — *Resumen · Productos · Informes*. **No hay botón flotante** ni elementos arrastrables.
- **Registrar Servicio / Registrar producto** se abren como ventanas modales superpuestas (fondo difuminado, cierre con la X, Escape o toque fuera).

## 🖥️ Vista escritorio

- **Menú lateral** con logo, distintivo “Control de Ganancias PRO” y cuatro secciones: *Resumen General*, *Registrar Servicio*, *Informes & Edición* y *Mis Productos*, más la tarjeta de Meta Mensual.
- **Rendimiento por Semanas** ocupa el 100% del ancho del contenido.
- Cabecera con el título del panel y el selector de mes.

## 🗓️ Selector de fechas (calendario propio)

Las fechas de los informes usan un calendario con el estilo de la aplicación en lugar del selector nativo del navegador:

- Cabecera en degradado rosa con `‹ Mes Año ›`.
- Fila de días `Lu Ma Mi Ju Vi Sá Do` (semana empezando en lunes).
- Día de hoy marcado en rosa claro y día seleccionado relleno con degradado rosa.
- Pie con **Hoy**, **Limpiar** y una pista de uso.
- Se cierra al elegir un día, al tocar fuera o con `Escape`.

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework:** [React 18](https://react.dev/) con [Vite 5](https://vitejs.dev/)
- **Estilos:** [Tailwind CSS 3](https://tailwindcss.com/) + CSS Vanilla (variables, gradientes y micro-animaciones)
- **Iconografía:** [Lucide React](https://lucide.dev/)
- **Tipografía:** Google Fonts (*Outfit*, *Montserrat*, *Playfair Display*, *Great Vibes*)
- **Servidor Web:** [NGINX](https://nginx.org/) (sirve el build estático y hace de proxy inverso hacia `/api`)

### Backend
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11)
- **Validación de Datos:** [Pydantic](https://docs.pydantic.dev/)
- **Servidor ASGI:** [Uvicorn](https://www.uvicorn.org/)
- **Bot:** hilo daemon de Telegram con LLM local (Ollama)

### Base de Datos & Persistencia
- **Base de Datos:** [SQLite3](https://www.sqlite.org/) con almacenamiento persistente en volumen (`./data/salon.db`).

### Despliegue & Contenedores
- **Contenedores:** [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
- **Publicación:** [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) (servicio `tunnel` del compose)

---

## 👥 Reglas de Negocio

- **Salones:** `1 = Vanidades`, `2 = Maison Studio` (IDs estables, precargados en la base de datos).
- **Comisiones:** Vanidades → Maquillaje 40 %, otros servicios 30 %. Maison Studio → solo Maquillaje 60 % (el campo servicio se fuerza a “Maquillaje”).
- **Meta mensual:** `S/ 480.00` por defecto (`DEFAULT_GOAL` en `App.jsx` y fallback `480.0` en `main.py`).
- **Cálculo:** ganancia personal = precio × %; el resto es ganancia del salón. El porcentaje se normaliza (`40` o `0.40` → 40 %).
- La semana de cada servicio se calcula automáticamente a partir de la fecha.

---

## 🔐 Acceso, Usuarios y Roles

La aplicación **exige iniciar sesión** para usarse: sin una sesión válida solo se ve la pantalla de ingreso.

| Rol | Qué ve |
| :--- | :--- |
| `usuario` (**Maquilladora**) | Resumen, Registrar Servicio, Informes & Edición y Mis Productos. |
| `admin` (**Administrador**) | Todo lo anterior **+ Configuración** (usuarios, accesos y contraseña propia). |

- **Contraseñas:** se guardan como hash **PBKDF2-HMAC-SHA256** con *salt* propio (200 000 iteraciones, `hashlib` de la librería estándar; nunca en texto plano y nunca se devuelven por la API).
- **Sesiones:** token aleatorio (`secrets.token_urlsafe`) guardado en la tabla `sesiones`, válido **30 días**. Al cerrar sesión se borra; al cambiar la contraseña o desactivar la cuenta se invalidan las sesiones abiertas de ese usuario.
- **El token se envía en la cabecera** `Authorization: Bearer <token>`. La interfaz lo guarda en el navegador, así que la sesión se mantiene al recargar o cerrar la app (PWA).
- **Protección de la API:** todo endpoint (menos `/health` y `/auth/login`) responde `401` sin sesión. El **bot de Telegram** es un cliente máquina a máquina: se identifica con la cabecera `X-Internal-Key` (`INTERNAL_API_KEY`).
- **Reglas de integridad:** no se puede eliminar ni desactivar el propio usuario, y siempre debe quedar **al menos un administrador activo**.
- **Administrador inicial:** se crea automáticamente en el primer arranque con el usuario `ADMIN_USERNAME` (por defecto `admin`) y la contraseña de `ADMIN_PASSWORD`. Si `ADMIN_PASSWORD` no está definida, se genera una aleatoria y se imprime **una sola vez** en el log del backend.

Variables en `backend/.env` (archivo **no versionado**, sobrevive a los despliegues):

    ADMIN_USERNAME=admin
    ADMIN_PASSWORD=<clave_del_administrador>
    INTERNAL_API_KEY=<clave_de_servicio_del_bot>

---

## 📂 Estructura del Repositorio

```text
salon-app/
├── backend/
│   ├── Dockerfile           # Imagen Docker para el backend FastAPI
│   ├── main.py              # API REST, endpoints, modelos Pydantic y lógica de SQLite
│   ├── .env                 # Bot, Ollama, ADMIN_PASSWORD e INTERNAL_API_KEY (NO se versiona)
│   └── requirements.txt     # Dependencias de Python (FastAPI, Uvicorn, Pydantic)
├── data/
│   └── salon.db             # Base de datos SQLite (persistida en volumen, datos reales)
├── frontend/
│   ├── Dockerfile           # Imagen Docker multi-stage (Node.js Build + NGINX)
│   ├── nginx.conf           # NGINX: HTML sin caché, /assets inmutable y proxy inverso a /api
│   ├── package.json         # Dependencias y scripts de Node.js
│   ├── tailwind.config.js   # Tokens de la marca (colors.brand.*)
│   ├── vite.config.js       # Configuración del bundler Vite
│   ├── index.html           # Plantilla principal, fuentes y registro del service worker
│   ├── public/
│   │   ├── manifest.json    # Manifiesto PWA
│   │   ├── sw.js            # Service worker (HTML red-primero, assets cache-first)
│   │   ├── favicon.svg
│   │   └── icons/           # icon-192.svg · icon-512.svg
│   └── src/
│       ├── App.jsx          # Aplicación completa: estado, vistas, modales y componentes
│       ├── main.jsx         # Punto de entrada de React
│       └── index.css        # Tokens de diseño, gradientes y animaciones (incl. .glow-rose)
├── .env                     # TUNNEL_TOKEN del túnel de Cloudflare (NO se versiona)
├── docker-compose.yml       # Orquestación: frontend + backend + túnel
├── Agent.md                 # Guía técnica para agentes/desarrollo (reglas y pitfalls)
└── README.md                # Documentación del proyecto
```

---

## 🚀 Instalación y Despliegue

### Opción 1: Despliegue con Docker Compose (Recomendado)

Asegúrate de tener instalados **Docker** y **Docker Compose**.

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/cguadalupek/control-de-ganancias-makeup.git
   cd control-de-ganancias-makeup
   ```

2. **Levantar los servicios:**
   ```bash
   docker compose up -d --build      # en hosts con Compose v1: docker-compose up -d --build
   ```

3. **Acceder a la aplicación:**
   - **Aplicación Web:** `http://localhost` (puerto 80)
   - **Documentación API (Swagger):** `http://localhost:8000/docs`

### Producción (LXC `salon-app`)

- **Host:** LXC `113` (`salon-app`) en Proxmox VE `192.168.1.210` → **`192.168.1.113`**, proyecto en `/opt/salon-app` (Debian 12, 2 vCPU / 2 GB / 20 GB, `nesting=1`).
- **Contenedores:** `salon_frontend` (nginx, puerto 80), `salon_backend` (FastAPI, puerto 8000) y `salon_tunnel` (Cloudflare → `https://makeup.kevincarmen.xyz`).
- **Acceso:** `http://192.168.1.113` en la LAN · `https://makeup.kevincarmen.xyz` desde cualquier lugar.
- **Host anterior (detenido, solo respaldo):** LXC `103` (`makeup-registros`, `192.168.1.103`) con una copia íntegra del proyecto y de la base de datos. No arrancar su stack mientras el 113 esté en producción: los dos túneles comparten token y Cloudflare repartiría el tráfico entre versiones distintas.
- **Actualizar solo la interfaz** (lo habitual al tocar `frontend/`):
  ```bash
  # desde el repo local, subir el archivo y reconstruir solo el frontend
  plink root@192.168.1.113 "cat > /opt/salon-app/frontend/src/App.jsx" < frontend/src/App.jsx
  plink root@192.168.1.113 "cd /opt/salon-app && docker-compose up -d --build frontend"
  ```
  El `frontend/Dockerfile` hace `npm install` + `npm run build` **dentro** del contenedor (el host no tiene Node).
- **Reconstruir todo:** `docker-compose up -d --build` en `/opt/salon-app`.
- `backend/.env` (bot, Ollama, `ADMIN_PASSWORD`, `INTERNAL_API_KEY`) y el `.env` de la raíz (`TUNNEL_TOKEN`) **no se versionan** y sobreviven a los despliegues; `data/` monta la base de datos real (no borrarla).
- **Al tocar el backend** (`main.py`) hay que reconstruir el contenedor: `docker-compose up -d --build backend`; el `init_db()` del arranque crea las tablas `usuarios`/`sesiones` y el administrador inicial si faltan (no borra ni migra datos existentes).
- **Caché:** `nginx` sirve el `index.html` con `no-cache` y los `/assets` (con hash) como inmutables; el service worker sirve el **documento con estrategia red-primero**, así que tras un despliegue basta **un** refresco (dos la primera vez si el navegador venía de la versión anterior del service worker). En el móvil instalado como PWA, ciérrala y ábrela de nuevo si no ves los cambios.

### Opción 2: Ejecución Local en Entorno de Desarrollo

#### 1. Iniciar el Backend (FastAPI):
```bash
cd backend
python -m venv venv
source venv/bin/activate   # En Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Iniciar el Frontend (Vite + React):
En otra terminal:
```bash
cd frontend
npm install
npm run dev
```
La aplicación se abrirá en `http://localhost:5173` (Vite consume la API en `http://localhost:8000`).

---

## 🔌 Endpoints de la API REST

Todos se sirven bajo el prefijo `/api` a través de NGINX (Swagger en `:8000/docs`).

**Salvo `/health` y `/auth/login`, todos exigen sesión** (`Authorization: Bearer <token>`) o la clave de servicio del bot (`X-Internal-Key`); sin ellas responden `401` y, si la sesión no es de un administrador, los endpoints de usuarios responden `403`.

### Autenticación

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/health` | Estado del servicio (público). |
| `POST` | `/auth/login` | Inicia sesión `{username, password}` y devuelve `{token, expira_en, usuario}`. |
| `POST` | `/auth/logout` | Cierra la sesión actual (borra el token). |
| `GET` | `/auth/me` | Usuario de la sesión actual. |
| `POST` | `/auth/cambiar-clave` | Cambia la contraseña propia `{password_actual, password_nueva}`. |

### Usuarios (solo administrador)

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/usuarios` | Lista los usuarios (sin hash ni salt). |
| `POST` | `/usuarios` | Crea un usuario `{username, nombre, password, rol}`; `rol` = `usuario` o `admin`. |
| `PATCH` | `/usuarios/{id}` | Actualiza nombre, rol, estado (`activo`) o contraseña. |
| `DELETE` | `/usuarios/{id}` | Elimina un usuario (no a uno mismo ni al último administrador). |

### Servicios

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/servicios` | Lista los servicios registrados (filtros opcionales `desde`, `hasta`, `salon_id`). |
| `POST` | `/registro` | Registra un servicio y calcula comisiones y semana. |
| `POST` | `/registro-lote` | Registra varios servicios en una sola transacción `{fecha, salon_id, items[]}`. |
| `PUT` | `/registro/{id}` | Actualiza un registro y recalcula montos y fecha. |
| `DELETE` | `/registro/{id}` | Elimina un servicio por su identificador. |
| `GET` | `/resumen/{anio}/{mes}` | Totales acumulados, meta y desglose semanal del mes. |

### Catálogos

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/catalogo` | Catálogo inicial de servicios sugeridos y precios. |
| `GET` | `/salones` | Salones disponibles (Vanidades · Maison Studio). |

### Inventario

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `POST` | `/products` | Registrar un nuevo producto. |
| `GET` | `/products` | Listar productos (acepta `?q=` para búsqueda). |
| `GET` | `/products/by-name/{name}` | Búsqueda por coincidencia parcial (bot). |
| `PUT` | `/products/{id}` | Actualizar producto. |
| `DELETE` | `/products/{id}` | Eliminar producto. |
| `PATCH` | `/products/{id}/open` | Marcar como abierto hoy. |
| `PATCH` | `/products/{id}/finish` | Marcar como terminado. |
| `PATCH` | `/products/{id}/reactivate` | Reactivar producto. |

---

## 🤖 Bot de Telegram + IA Local

El backend incluye un bot de Telegram que se ejecuta como hilo daemon dentro de
FastAPI y permite consultar y actualizar el inventario por chat,
interpretando el lenguaje natural con un LLM local (Ollama).

Configuración en `backend/.env`:

    TELEGRAM_BOT_TOKEN=<token_del_bot>
    BACKEND_URL=http://localhost:8000
    INTERNAL_API_KEY=<clave_de_servicio_del_bot>   # cabecera X-Internal-Key con la que el bot llama a la API
    OLLAMA_URL=http://172.17.0.1:11434
    OLLAMA_MODEL=hermes3
    OLLAMA_TIMEOUT=60

Ejemplos de uso desde Telegram:

- ¿Cómo está mi pestañina maybelline?
- Base Estée Lauder
- Hoy abrí la pestañina (actualiza start_date automáticamente)
- /productos (lista el inventario completo)
- /ayuda (muestra los comandos)

Si el LLM no responde, el bot usa reglas heurísticas en español como fallback.

---

## 📦 Módulo "Mis Productos" (Inventario)

Módulo con:

- Registro: nombre, cantidad (fija en 1), precio, fecha de compra, fecha de apertura (opcional) y fecha de caducidad.
- Listado en tarjetas con semáforo dinámico:
  - 🟢 Vigente (>15 días para vencer)
  - 🟡 Próximo a vencer (≤15 días)
  - 🔴 Caducado
- Caducidad automática: presets de 6 y 12 meses (`addMonthsYMD`, con ajuste de fin de mes) o fecha personalizada.
- Botón rápido "Abrir Hoy" (`PATCH /products/{id}/open`) para productos sin abrir.
- Terminar y reactivar producto desde la tarjeta.
- Edición completa desde un modal (`PUT /products/{id}`).
- Búsqueda por nombre con debounce.

---

## 🆕 Cambios recientes

**Acceso, roles y sección Configuración (nuevo)**

- **Pantalla de ingreso** con el estilo de la marca (fondo berry, tarjeta blanca, campos `field-uniform` y botón con degradado rosa). Sin sesión válida no se ve la aplicación.
- **Dos niveles de acceso:** la maquilladora conserva exactamente las secciones de siempre; el administrador ve además **Configuración** (barra lateral de escritorio y barra inferior del móvil, que pasa a 4 elementos).
- **Configuración:** crear usuario (nombre, usuario, contraseña y nivel de acceso), lista de usuarios con rol/estado/último ingreso, cambio de rol, restablecer contraseña, activar/desactivar y eliminar; cambio de la contraseña propia y cierre de sesión. Sobre la propia cuenta no se ofrecen desactivar ni eliminar.
- **Sesión persistente** de 30 días: se mantiene al recargar o al reabrir la PWA. En móvil, quien no es administrador tiene **Salir** en la barra inferior; el administrador lo tiene en Configuración y en el pie de la barra lateral.
- **La API queda cerrada** salvo `/health` y `/auth/login`; el bot de Telegram usa la cabecera `X-Internal-Key`.

**Seguridad del repositorio**

- El token del túnel de Cloudflare (`TUNNEL_TOKEN`) **ya no vive en `docker-compose.yml`**: se lee del archivo `.env` de la raíz, que está ignorado por git. Lo mismo para la contraseña del administrador y la clave del bot, que viven en `backend/.env`.
- **Ningún despliegue debe versionar credenciales**: `.gitignore` cubre `.env`, `*.db`, `backups/`, `node_modules/` y `dist/`. Antes de publicar, comprueba `git grep -iE 'token=|password=|secret=' -- $(git rev-list --all) | wc -l`.

**Interfaz móvil (barra superior y acciones)**

- El botón **Registrar** dejó de ser un botón flotante arrastrable: ahora vive en la barra superior fija, centrado con el selector de mes, con fondo rosa y un resplandor pulsante (`.glow-rose`), y **solo se muestra en la sección Resumen**.
- Se eliminaron los FAB flotantes/arrastrables y su hook `useDraggableFab`.
- Verificado sin scroll horizontal ni elementos desbordados en 320 / 360 / 390 / 430 px en las tres vistas.

**Informes**

- **Calendario con estilo propio** para *Desde* / *Hasta* (reemplaza al selector nativo plano).
- Corregido el orden de capas de los desplegables: el que está abierto se pinta **por delante** del resto (antes la lista de Salón tapaba la de Rango de fechas).
- La paginación ya no desborda en pantallas estrechas (envuelve y compacta los botones).

**Escritorio**

- “Rendimiento por Semanas” ocupa el 100 % del ancho del contenido.

**PWA**

- El service worker ahora sirve el documento con estrategia **red-primero** y cachea solo el shell y los assets con hash (caché `rodriguez-makeup-v2`), eliminando las cachés antiguas al activarse. Antes servía el `index.html` desde caché y podía mostrar la versión anterior de la app durante días.

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Puedes usarlo y modificarlo libremente.
