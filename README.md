# 🌸 GUADALUPE MAKE UP - Control de Ganancias y Servicios

Sistema web integral y profesional diseñado para la gestión financiera, control de servicios de belleza y maquillaje, cálculo automatizado de comisiones y seguimiento de metas mensuales.

---

## 📌 Descripción

**GUADALUPE MAKE UP - Control de Ganancias** es una aplicación diseñada para optimizar y transparentar el registro diario de servicios prestados en el salón o estudio. Permite desglosar de forma instantánea los ingresos entre **Ganancia Personal** y **Ganancia del Salón**, proyectar el cumplimiento de metas mensuales y analizar el rendimiento histórico a través de reportes con filtros avanzados y paginación.

---

## ✨ Características Principales

- 📊 **Dashboard Dinámico Mensual:**
  - Métricas clave en tiempo real: Mi Ganancia Neta, Ganancia del Salón, Total Facturado y Progreso de la Meta.
  - **Reinicio automático a cero:** Al iniciar cada nuevo mes, el panel comienza limpio en `S/ 0.00` (0% de meta).
  - Selector de mes interactivo (`← Mes Año →` con botón de retorno al mes en curso) para consultar períodos históricos.
  - Visualización del servicio más reciente registrado en el mes.

- 📈 **Rendimiento Semanal y Desglose de Comisiones:**
  - Gráfico dinámico de barras por semanas (Semana 1 a 5) con promedio semanal.
  - Comparativa de comisiones principales (40% regular vs. 30% salón) y cálculo del ticket promedio por servicio.

- ✍️ **Registro y Edición de Servicios:**
  - Formulario de alta rápida con cálculo en vivo de ganancias según el precio y porcentaje de comisión seleccionado.
  - **Edición completa:** Modal interactivo para actualizar fecha, nombre del servicio, precio cobrado y porcentaje de comisión en cualquier registro previo.

- 📑 **Informes, Historial y Paginación:**
  - Filtros rápidos por período (Hoy, Esta Semana, Este Mes, Mes Anterior, Todo el Histórico).
  - Selector interactivo mediante **Calendario Visual** con indicadores de días con servicios.
  - Buscador predictivo por nombre de servicio.
  - **Paginación inteligente:** Listado optimizado a 5 registros por página con controles de navegación previa/siguiente y acceso directo por número de página.

- 🎨 **Diseño Elegante y 100% Responsivo:**
  - Identidad visual exclusiva con paleta de colores de lujo (`#EC71A8`, `#F9CEE3`, `#FDEBD1`, `#1E1E1C` y degradados de oro satinado).
  - Adaptabilidad fluida para teléfonos móviles, tablets y computadoras de escritorio.

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework:** [React 18](https://react.dev/) con [Vite](https://vitejs.dev/)
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/) + CSS Vanilla (Variables personalizadas y micro-animaciones)
- **Iconografía:** [Lucide React](https://lucide.dev/)
- **Tipografía:** Google Fonts (*Outfit*, *Montserrat*, *Playfair Display*, *Great Vibes*)
- **Servidor Web:** [NGINX](https://nginx.org/) (Reverse Proxy y servidor de estáticos en producción)

### Backend
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11)
- **Validación de Datos:** [Pydantic](https://docs.pydantic.dev/)
- **Servidor ASGI:** [Uvicorn](https://www.uvicorn.org/)

### Base de Datos & Persistencia
- **Base de Datos:** [SQLite3](https://www.sqlite.org/) con almacenamiento persistente en volumen de datos.

### Despliegue & Contenedores
- **Contenedores:** [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)

---

## 📂 Estructura del Repositorio

```text
salon-app/
├── backend/
│   ├── Dockerfile           # Imagen Docker para el backend FastAPI
│   ├── main.py              # API REST, endpoints, modelos Pydantic y lógica de SQLite
│   └── requirements.txt     # Dependencias de Python (FastAPI, Uvicorn, Pydantic)
├── data/
│   └── salon.db             # Base de datos SQLite (persistida en volumen)
├── frontend/
│   ├── Dockerfile           # Imagen Docker multi-stage (Node.js Build + NGINX)
│   ├── nginx.conf           # Configuración de NGINX con proxy reverso a /api
│   ├── package.json         # Dependencias y scripts de Node.js
│   ├── tailwind.config.js   # Configuración de Tailwind CSS
│   ├── vite.config.js       # Configuración del bundler Vite
│   ├── index.html           # Plantilla principal y fuentes de Google Fonts
│   └── src/
│       ├── App.jsx          # Aplicación principal, estado, vistas y modales
│       ├── main.jsx         # Punto de entrada de React
│       └── index.css        # Tokens de diseño, gradientes y animaciones
├── docker-compose.yml       # Orquestación de contenedores (Frontend + Backend)
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
   docker compose up -d --build
   ```

3. **Acceder a la aplicación:**
   - **Aplicación Web:** `http://localhost` (Puerto 80)
   - **Documentación API (Swagger):** `http://localhost:8000/docs`

---

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
La aplicación se abrirá en `http://localhost:5173`.

---

## 🔌 Endpoints de la API REST

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/servicios` | Lista todos los servicios registrados (con filtros opcionales de fecha `desde` y `hasta`). |
| `POST` | `/registro` | Registra un nuevo servicio y calcula automáticamente comisiones y semana. |
| `PUT` | `/registro/{id}` | Actualiza un registro existente y recalcula los montos y fecha. |
| `DELETE` | `/registro/{id}` | Elimina un servicio registrado por su identificador. |
| `GET` | `/catalogo` | Retorna el catálogo inicial de servicios sugeridos y precios. |
| `GET` | `/resumen/{anio}/{mes}` | Obtiene los totales acumulados, meta y desglose semanal del mes solicitado. |

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Puedes usarlo y modificarlo libremente.

