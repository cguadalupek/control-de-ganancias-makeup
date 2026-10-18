import datetime
import hashlib
import hmac
import math
import os
import secrets
import sqlite3
from typing import List, Optional
from fastapi import Depends, FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI(title="Sistema Registro Salón")

# ============================================================
# CONTROL DE ACCESO
# ============================================================
# Todo endpoint exige una sesión de usuario válida (Authorization: Bearer <token>)
# o la clave de servicio del bot (X-Internal-Key). Solo quedan abiertos el login y /health.
RUTAS_PUBLICAS = {"/", "/health", "/auth/login"}

# Este middleware se registra ANTES que CORS a propósito: así CORS queda por fuera
# y las respuestas 401 también viajan con sus cabeceras.
@app.middleware("http")
async def control_acceso(request: Request, call_next):
    ruta = request.url.path.rstrip("/") or "/"
    if ruta in RUTAS_PUBLICAS or ruta.startswith("/docs") or ruta.startswith("/openapi"):
        return await call_next(request)
    if request.method == "OPTIONS":
        return await call_next(request)

    clave = request.headers.get("x-internal-key", "")
    if INTERNAL_API_KEY and clave and hmac.compare_digest(clave, INTERNAL_API_KEY):
        request.state.usuario = None
        request.state.token = ""
        request.state.cliente_interno = True
        return await call_next(request)

    cabecera = request.headers.get("authorization", "")
    token = cabecera[7:].strip() if cabecera.lower().startswith("bearer ") else ""
    fila = usuario_por_token(token)
    if fila is None:
        return JSONResponse(status_code=401, content={"detail": "Sesión no válida o expirada"})

    request.state.usuario = _row_usuario_publico(fila)
    request.state.token = token
    request.state.cliente_interno = False
    return await call_next(request)

def require_admin(request: Request) -> dict:
    """Dependencia: exige una sesión con rol administrador."""
    usuario = getattr(request.state, "usuario", None)
    if not usuario or usuario.get("rol") != ROL_ADMIN:
        raise HTTPException(status_code=403, detail="Requiere permisos de administrador")
    return usuario

# Configuración de CORS para permitir conexiones desde el Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Determinar la ruta de la base de datos de manera robusta
if os.path.exists("/app/data"):
    DB_PATH = "/app/data/salon.db"
elif os.path.exists("./data"):
    DB_PATH = "./data/salon.db"
else:
    os.makedirs("./data", exist_ok=True)
    DB_PATH = "./data/salon.db"

PROPIO_SALON_NOMBRE = "Rodriguez Makeup"  # entidad propia: sin comisión, 100% para la maquilladora

# ============================================================
# AUTENTICACIÓN, ROLES Y SESIONES
# ============================================================
# Roles:
#   'usuario' -> maquilladora: ve Resumen, Productos e Informes.
#   'admin'   -> además ve y administra la sección Configuración (usuarios).
ROL_ADMIN = "admin"
ROL_USUARIO = "usuario"
ROLES_VALIDOS = (ROL_ADMIN, ROL_USUARIO)

SESSION_DIAS = 30              # duración de la sesión (la app se usa a diario desde el móvil)
PBKDF2_ITERACIONES = 200_000   # PBKDF2-HMAC-SHA256, sin dependencias externas
MIN_PASSWORD = 6

# Bootstrap del administrador: la contraseña NUNCA vive en el repositorio, se toma de
# la variable de entorno ADMIN_PASSWORD (backend/.env, ignorado por git). Si no está
# definida se genera una aleatoria y se imprime UNA vez en el log de arranque.
ADMIN_USERNAME_INICIAL = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD_INICIAL = os.getenv("ADMIN_PASSWORD", "")

# Clave de servicio para clientes internos (bot de Telegram). Se envía en la cabecera
# X-Internal-Key y sustituye a la sesión de usuario en las llamadas máquina a máquina.
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def _hash_password(password: str, salt: Optional[str] = None):
    """Devuelve (salt, hash_hex) con PBKDF2-HMAC-SHA256. Sin dependencias externas."""
    if not salt:
        salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), PBKDF2_ITERACIONES)
    return salt, dk.hex()

def verificar_password(password: str, salt: str, hash_esperado: str) -> bool:
    """Comparación en tiempo constante del hash almacenado."""
    try:
        _, calculado = _hash_password(password, salt)
    except Exception:
        return False
    return hmac.compare_digest(calculado, hash_esperado or "")

def _ahora_iso() -> str:
    return datetime.datetime.now().replace(microsecond=0).isoformat(sep=" ")

def _row_usuario_publico(r) -> dict:
    """Vista pública de un usuario: nunca expone hash ni salt."""
    return {
        "id": r["id"],
        "username": r["username"],
        "nombre": r["nombre"] or "",
        "rol": r["rol"],
        "activo": bool(r["activo"]),
        "creado_en": r["creado_en"],
        "ultimo_acceso": r["ultimo_acceso"],
    }

def crear_sesion(usuario_id: int) -> dict:
    """Crea un token de sesión y limpia las expiradas."""
    token = secrets.token_urlsafe(32)
    ahora = datetime.datetime.now().replace(microsecond=0)
    expira = ahora + datetime.timedelta(days=SESSION_DIAS)
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM sesiones WHERE expira_en < ?", (_ahora_iso(),))
    cur.execute(
        "INSERT INTO sesiones (token, usuario_id, creado_en, expira_en) VALUES (?, ?, ?, ?)",
        (token, usuario_id, ahora.isoformat(sep=" "), expira.isoformat(sep=" ")),
    )
    conn.commit()
    conn.close()
    return {"token": token, "expira_en": expira.isoformat(sep=" ")}

def usuario_por_token(token: str) -> Optional[sqlite3.Row]:
    """Fila del usuario dueño de la sesión, o None si el token no es válido o caducó."""
    if not token:
        return None
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """SELECT u.* FROM sesiones s JOIN usuarios u ON u.id = s.usuario_id
           WHERE s.token = ? AND s.expira_en >= ? AND u.activo = 1""",
        (token, _ahora_iso()),
    )
    row = cur.fetchone()
    conn.close()
    return row

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Tabla de catálogo de servicios
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS catalogo_servicios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL UNIQUE,
            precio_defecto REAL NOT NULL,
            porcentaje_defecto REAL NOT NULL
        )
    """)
    
    # Tabla de salones / establecimientos donde trabaja la maquilladora
    # "propio" = 1 -> entidad propia (Rodriguez Makeup): el 100% de la ganancia es suyo.
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS salones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL UNIQUE,
            propio INTEGER NOT NULL DEFAULT 0
        )
    """)
    # Migración: agregar "propio" a tablas preexistentes (los salones antiguos no son propios)
    cursor.execute("PRAGMA table_info(salones)")
    salon_cols = [row[1] for row in cursor.fetchall()]
    if "propio" not in salon_cols:
        cursor.execute("ALTER TABLE salones ADD COLUMN propio INTEGER NOT NULL DEFAULT 0")

    # Precargar los salones con IDs estables (1=Vanidades, 2=Maison Studio, 3=Rodriguez Makeup)
    cursor.execute("SELECT COUNT(*) FROM salones")
    if cursor.fetchone()[0] == 0:
        cursor.executemany(
            "INSERT INTO salones (id, nombre, propio) VALUES (?, ?, ?)",
            [(1, "Vanidades", 0), (2, "Maison Studio", 0), (3, PROPIO_SALON_NOMBRE, 1)]
        )

    # La entidad propia existe siempre (idempotente) y queda marcada como propia
    cursor.execute("SELECT id FROM salones WHERE nombre = ?", (PROPIO_SALON_NOMBRE,))
    propio_row = cursor.fetchone()
    if propio_row:
        cursor.execute("UPDATE salones SET propio = 1 WHERE id = ?", (propio_row["id"],))
    else:
        cursor.execute("SELECT COUNT(*) FROM salones WHERE id = 3")
        if cursor.fetchone()[0]:
            cursor.execute("INSERT INTO salones (nombre, propio) VALUES (?, 1)", (PROPIO_SALON_NOMBRE,))
        else:
            cursor.execute("INSERT INTO salones (id, nombre, propio) VALUES (3, ?, 1)", (PROPIO_SALON_NOMBRE,))

    # Tabla de registros de servicios realizados
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS registro_servicios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha TEXT NOT NULL,
            servicio_nombre TEXT NOT NULL,
            precio REAL NOT NULL,
            porcentaje REAL NOT NULL,
            ganancia_personal REAL NOT NULL,
            ganancia_salon REAL NOT NULL,
            semana INTEGER NOT NULL,
            mes INTEGER NOT NULL,
            anio INTEGER NOT NULL,
            salon_id INTEGER NOT NULL DEFAULT 1
        )
    """)
    # Migración: agregar salon_id a tablas preexistentes (historial previo => Vanidades, id 1)
    cursor.execute("PRAGMA table_info(registro_servicios)")
    reg_cols = [row[1] for row in cursor.fetchall()]
    if "salon_id" not in reg_cols:
        cursor.execute("ALTER TABLE registro_servicios ADD COLUMN salon_id INTEGER NOT NULL DEFAULT 1")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_registro_salon ON registro_servicios(salon_id)")
    
    # Tabla de metas del mes
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS metas_mensuales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            anio INTEGER NOT NULL,
            mes INTEGER NOT NULL,
            monto_meta REAL NOT NULL,
            UNIQUE(anio, mes)
        )
    """)

    # Tabla de productos / insumos (inventario del salón)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            price REAL NOT NULL DEFAULT 0,
            purchase_date TEXT NOT NULL,
            start_date TEXT,
            expiration_date TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'activo',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    # Migración: si la columna status no existe aún (tabla preexistente), agregarla
    cursor.execute("PRAGMA table_info(products)")
    cols = [row[1] for row in cursor.fetchall()]
    if "status" not in cols:
        cursor.execute("ALTER TABLE products ADD COLUMN status TEXT NOT NULL DEFAULT 'activo'")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_products_expiration ON products(expiration_date)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)")

    # Precargar el catálogo inicial basado en los datos del salón si está vacío
    cursor.execute("SELECT COUNT(*) FROM catalogo_servicios")
    if cursor.fetchone()[0] == 0:
        servicios_iniciales = [
            ("Maquillaje", 120.0, 0.40),
            ("Pestañas", 35.0, 0.30),
            ("Planchado", 80.0, 0.30),
            ("Depilación ceja", 20.0, 0.30),
            ("Alisado Reconstructor", 350.0, 0.30),
            ("Lifting de pestaña", 60.0, 0.30),
            ("Cabello", 180.0, 0.30),
            ("Cejas", 15.0, 0.30),
            ("Henna", 75.0, 0.30),
            ("bozo", 10.0, 0.30),
            ("pack mirada", 100.0, 0.30)
        ]
        cursor.executemany(
            "INSERT INTO catalogo_servicios (nombre, precio_defecto, porcentaje_defecto) VALUES (?, ?, ?)",
            servicios_iniciales
        )
    
    # ------------------------------------------------------------
    # Usuarios y sesiones (login de la aplicación web)
    # ------------------------------------------------------------
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE COLLATE NOCASE,
            nombre TEXT NOT NULL DEFAULT '',
            rol TEXT NOT NULL DEFAULT 'usuario',
            password_hash TEXT NOT NULL,
            password_salt TEXT NOT NULL,
            activo INTEGER NOT NULL DEFAULT 1,
            creado_en TEXT NOT NULL,
            ultimo_acceso TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sesiones (
            token TEXT PRIMARY KEY,
            usuario_id INTEGER NOT NULL,
            creado_en TEXT NOT NULL,
            expira_en TEXT NOT NULL
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sesiones_usuario ON sesiones(usuario_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sesiones_expira ON sesiones(expira_en)")

    # Bootstrap del administrador: solo la primera vez (cuando aún no hay ningún usuario).
    cursor.execute("SELECT COUNT(*) FROM usuarios")
    if cursor.fetchone()[0] == 0:
        password_inicial = ADMIN_PASSWORD_INICIAL
        generada = not password_inicial
        if generada:
            password_inicial = secrets.token_urlsafe(12)
        salt, phash = _hash_password(password_inicial)
        cursor.execute(
            """INSERT INTO usuarios (username, nombre, rol, password_hash, password_salt, activo, creado_en)
               VALUES (?, ?, ?, ?, ?, 1, ?)""",
            (ADMIN_USERNAME_INICIAL, "Administradora", ROL_ADMIN, phash, salt, _ahora_iso()),
        )
        if generada:
            print("[auth] ADMIN_PASSWORD no definida: se generó la clave del administrador")
            print(f"[auth]   usuario: {ADMIN_USERNAME_INICIAL}")
            print(f"[auth]   clave:   {password_inicial}")
            print("[auth]   Guárdala ahora: solo se almacena su hash y no se vuelve a mostrar.")

    conn.commit()
    conn.close()

@app.on_event("startup")
def startup():
    init_db()
    # Arrancar el bot de Telegram como hilo daemon (no bloquea FastAPI)
    try:
        from bot.telegram_bot import start_background
        if start_background():
            print('[startup] Bot de Telegram iniciado en segundo plano')
        else:
            print('[startup] Bot de Telegram no inició (token faltante)')
    except Exception as e:
        print(f'[startup] Error arrancando bot: {e}')

# ============================================================
# ENDPOINTS: AUTENTICACIÓN
# ============================================================
class LoginIn(BaseModel):
    username: str
    password: str

class UsuarioCreate(BaseModel):
    username: str
    nombre: str = ""
    password: str
    rol: str = ROL_USUARIO

class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    rol: Optional[str] = None
    activo: Optional[bool] = None
    password: Optional[str] = None

class CambioClave(BaseModel):
    password_actual: str
    password_nueva: str

def _validar_username(username: str) -> str:
    username = (username or "").strip()
    if len(username) < 3 or len(username) > 32:
        raise HTTPException(status_code=400, detail="El usuario debe tener entre 3 y 32 caracteres")
    if not all(c.isalnum() or c in "._-" for c in username):
        raise HTTPException(status_code=400, detail="El usuario solo admite letras, números, punto, guion y guion bajo")
    return username

def _validar_password(password: str):
    if len(password or "") < MIN_PASSWORD:
        raise HTTPException(status_code=400, detail=f"La contraseña debe tener al menos {MIN_PASSWORD} caracteres")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/auth/login")
def login(data: LoginIn):
    username = (data.username or "").strip()
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM usuarios WHERE username = ?", (username,))
    fila = cur.fetchone()
    # Mismo mensaje para usuario inexistente y clave incorrecta (no se filtra qué falló)
    if fila is None or not verificar_password(data.password or "", fila["password_salt"], fila["password_hash"]):
        conn.close()
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    if not fila["activo"]:
        conn.close()
        raise HTTPException(status_code=403, detail="Este usuario está desactivado")
    ahora = _ahora_iso()
    cur.execute("UPDATE usuarios SET ultimo_acceso = ? WHERE id = ?", (ahora, fila["id"]))
    conn.commit()
    conn.close()
    sesion = crear_sesion(fila["id"])
    usuario = _row_usuario_publico(fila)
    usuario["ultimo_acceso"] = ahora
    return {"token": sesion["token"], "expira_en": sesion["expira_en"], "usuario": usuario}

@app.post("/auth/logout")
def logout(request: Request):
    token = getattr(request.state, "token", "")
    if token:
        conn = get_db()
        conn.execute("DELETE FROM sesiones WHERE token = ?", (token,))
        conn.commit()
        conn.close()
    return {"status": "ok"}

@app.get("/auth/me")
def me(request: Request):
    usuario = getattr(request.state, "usuario", None)
    if not usuario:
        raise HTTPException(status_code=403, detail="Esta llamada requiere una sesión de usuario")
    return {"usuario": usuario}

@app.post("/auth/cambiar-clave")
def cambiar_clave(data: CambioClave, request: Request):
    usuario = getattr(request.state, "usuario", None)
    if not usuario:
        raise HTTPException(status_code=403, detail="Esta llamada requiere una sesión de usuario")
    _validar_password(data.password_nueva)
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM usuarios WHERE id = ?", (usuario["id"],))
    fila = cur.fetchone()
    if fila is None or not verificar_password(data.password_actual or "", fila["password_salt"], fila["password_hash"]):
        conn.close()
        raise HTTPException(status_code=401, detail="La contraseña actual no es correcta")
    salt, phash = _hash_password(data.password_nueva)
    cur.execute("UPDATE usuarios SET password_hash = ?, password_salt = ? WHERE id = ?", (phash, salt, usuario["id"]))
    # Se cierran las demás sesiones de ese usuario (la actual sigue viva)
    cur.execute("DELETE FROM sesiones WHERE usuario_id = ? AND token <> ?", (usuario["id"], getattr(request.state, "token", "")))
    conn.commit()
    conn.close()
    return {"status": "ok", "message": "Contraseña actualizada"}

# ============================================================
# ENDPOINTS: GESTIÓN DE USUARIOS (solo administrador)
# ============================================================
@app.get("/usuarios")
def listar_usuarios(_admin: dict = Depends(require_admin)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM usuarios ORDER BY CASE rol WHEN 'admin' THEN 0 ELSE 1 END, username ASC")
    filas = cur.fetchall()
    conn.close()
    return [_row_usuario_publico(f) for f in filas]

@app.post("/usuarios")
def crear_usuario(data: UsuarioCreate, _admin: dict = Depends(require_admin)):
    username = _validar_username(data.username)
    _validar_password(data.password)
    if data.rol not in ROLES_VALIDOS:
        raise HTTPException(status_code=400, detail="Rol inválido")
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM usuarios WHERE username = ?", (username,))
    if cur.fetchone():
        conn.close()
        raise HTTPException(status_code=409, detail="Ese nombre de usuario ya existe")
    salt, phash = _hash_password(data.password)
    cur.execute(
        """INSERT INTO usuarios (username, nombre, rol, password_hash, password_salt, activo, creado_en)
           VALUES (?, ?, ?, ?, ?, 1, ?)""",
        (username, (data.nombre or "").strip(), data.rol, phash, salt, _ahora_iso()),
    )
    nuevo_id = cur.lastrowid
    conn.commit()
    cur.execute("SELECT * FROM usuarios WHERE id = ?", (nuevo_id,))
    fila = cur.fetchone()
    conn.close()
    return _row_usuario_publico(fila)

@app.patch("/usuarios/{usuario_id}")
def actualizar_usuario(usuario_id: int, data: UsuarioUpdate, admin: dict = Depends(require_admin)):
    if data.rol is not None and data.rol not in ROLES_VALIDOS:
        raise HTTPException(status_code=400, detail="Rol inválido")
    if data.password is not None:
        _validar_password(data.password)
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM usuarios WHERE id = ?", (usuario_id,))
    fila = cur.fetchone()
    if fila is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    pierde_admin = fila["rol"] == ROL_ADMIN and (
        (data.rol is not None and data.rol != ROL_ADMIN) or data.activo is False
    )
    if pierde_admin:
        cur.execute("SELECT COUNT(*) FROM usuarios WHERE rol = ? AND activo = 1", (ROL_ADMIN,))
        if cur.fetchone()[0] <= 1:
            conn.close()
            raise HTTPException(status_code=400, detail="Debe existir al menos un administrador activo")
    if usuario_id == admin["id"] and data.activo is False:
        conn.close()
        raise HTTPException(status_code=400, detail="No puedes desactivar tu propio usuario")

    sets, params = [], []
    if data.nombre is not None:
        sets.append("nombre = ?")
        params.append(data.nombre.strip())
    if data.rol is not None:
        sets.append("rol = ?")
        params.append(data.rol)
    if data.activo is not None:
        sets.append("activo = ?")
        params.append(1 if data.activo else 0)
    if data.password is not None:
        salt, phash = _hash_password(data.password)
        sets.extend(["password_hash = ?", "password_salt = ?"])
        params.extend([phash, salt])

    if sets:
        params.append(usuario_id)
        cur.execute(f"UPDATE usuarios SET {', '.join(sets)} WHERE id = ?", params)
        # Al cambiar la clave o desactivar la cuenta se invalidan sus sesiones abiertas
        if data.password is not None or data.activo is False:
            cur.execute("DELETE FROM sesiones WHERE usuario_id = ?", (usuario_id,))
        conn.commit()
    cur.execute("SELECT * FROM usuarios WHERE id = ?", (usuario_id,))
    fila = cur.fetchone()
    conn.close()
    return _row_usuario_publico(fila)

@app.delete("/usuarios/{usuario_id}")
def eliminar_usuario(usuario_id: int, admin: dict = Depends(require_admin)):
    if usuario_id == admin["id"]:
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propio usuario")
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM usuarios WHERE id = ?", (usuario_id,))
    fila = cur.fetchone()
    if fila is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if fila["rol"] == ROL_ADMIN:
        cur.execute("SELECT COUNT(*) FROM usuarios WHERE rol = ?", (ROL_ADMIN,))
        if cur.fetchone()[0] <= 1:
            conn.close()
            raise HTTPException(status_code=400, detail="Debe existir al menos un administrador")
    cur.execute("DELETE FROM sesiones WHERE usuario_id = ?", (usuario_id,))
    cur.execute("DELETE FROM usuarios WHERE id = ?", (usuario_id,))
    conn.commit()
    conn.close()
    return {"status": "ok", "message": "Usuario eliminado"}

# Modelos Pydantic
class ServicioCreate(BaseModel):
    fecha: str  # Formato YYYY-MM-DD
    servicio_nombre: str
    precio: float
    porcentaje: float  # e.g. 0.30 o 0.40 o 30 o 40
    salon_id: int

class ServicioLoteItem(BaseModel):
    servicio_nombre: str
    precio: float
    porcentaje: float  # e.g. 0.30 o 0.40 o 30 o 40

class ServicioLote(BaseModel):
    fecha: str  # Formato YYYY-MM-DD (compartida por todo el lote)
    salon_id: int
    items: List[ServicioLoteItem]

class MetaUpdate(BaseModel):
    anio: int
    mes: int
    monto_meta: float

# ============================================================
# MODELOS: PRODUCTOS / INSUMOS (INVENTARIO)
# ============================================================
class ProductCreate(BaseModel):
    name: str
    quantity: int = 1
    price: float = 0.0
    purchase_date: str  # YYYY-MM-DD
    start_date: Optional[str] = None
    expiration_date: str  # YYYY-MM-DD

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[int] = None
    price: Optional[float] = None
    purchase_date: Optional[str] = None
    start_date: Optional[str] = None
    expiration_date: Optional[str] = None
    status: Optional[str] = None  # 'activo' | 'terminado'

# Auxiliar para calcular el número de semana según el día del mes
def calcular_semana_mes(fecha_obj: datetime.date) -> int:
    primer_dia = fecha_obj.replace(day=1)
    dia_del_mes = fecha_obj.day
    semana = math.ceil((dia_del_mes + primer_dia.weekday()) / 7)
    return min(semana, 5)

def salon_nombre(salon_id: int) -> Optional[str]:
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT nombre FROM salones WHERE id = ?", (salon_id,))
    row = cur.fetchone()
    conn.close()
    return row["nombre"] if row else None

def salon_es_propio(salon_id: int) -> bool:
    """True si el salón es una entidad propia (Rodriguez Makeup): comisión 100%."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT nombre, COALESCE(propio, 0) AS propio FROM salones WHERE id = ?", (salon_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return False
    return bool(row["propio"]) or "rodriguez" in (row["nombre"] or "").lower()

# Endpoints API
@app.get("/catalogo")
def obtener_catalogo():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, nombre, precio_defecto, porcentaje_defecto FROM catalogo_servicios ORDER BY nombre ASC")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r["id"], "nombre": r["nombre"], "precio_defecto": r["precio_defecto"], "porcentaje_defecto": r["porcentaje_defecto"]} for r in rows]

@app.get("/salones")
def obtener_salones():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, nombre, COALESCE(propio, 0) AS propio FROM salones ORDER BY id ASC")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r["id"], "nombre": r["nombre"], "propio": bool(r["propio"])} for r in rows]

@app.get("/servicios")
def listar_servicios(desde: Optional[str] = Query(None), hasta: Optional[str] = Query(None),
                     salon_id: Optional[int] = Query(None)):
    conn = get_db()
    cursor = conn.cursor()
    
    query = """
        SELECT r.id, r.fecha, r.servicio_nombre, r.precio, r.porcentaje, r.ganancia_personal,
               r.ganancia_salon, r.semana, r.mes, r.anio, r.salon_id,
               COALESCE(s.nombre, 'Vanidades') AS salon_nombre
        FROM registro_servicios r
        LEFT JOIN salones s ON s.id = r.salon_id
    """
    conditions = []
    params = []
    if desde:
        conditions.append("r.fecha >= ?")
        params.append(desde)
    if hasta:
        conditions.append("r.fecha <= ?")
        params.append(hasta)
    if salon_id is not None:
        conditions.append("r.salon_id = ?")
        params.append(salon_id)
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    query += " ORDER BY r.fecha DESC, r.id DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    # Calcular totales del conjunto filtrado
    total_ganancia_personal = sum(r["ganancia_personal"] for r in rows)
    total_ganancia_salon = sum(r["ganancia_salon"] for r in rows)
    total_facturado = sum(r["precio"] for r in rows)
    
    conn.close()
    
    registros = []
    for r in rows:
        pct = r["porcentaje"]
        # Normalizar porcentaje a número entero 30 o 40 si viene en decimal
        pct_display = int(round(pct * 100)) if pct <= 1.0 else int(round(pct))
        registros.append({
            "id": r["id"],
            "date": r["fecha"],
            "week": f"Semana {r['semana']}",
            "service": r["servicio_nombre"],
            "price": r["precio"],
            "commission": pct_display,
            "myGain": r["ganancia_personal"],
            "salongain": r["ganancia_salon"],
            "salon_id": r["salon_id"],
            "salon_name": r["salon_nombre"],
            "month": r["mes"],
            "year": r["anio"]
        })
        
    return {
        "total_personal": total_ganancia_personal,
        "total_salon": total_ganancia_salon,
        "total_facturado": total_facturado,
        "cantidad": len(registros),
        "servicios": registros
    }

@app.post("/registro")
def registrar_servicio(data: ServicioCreate):
    try:
        fecha_obj = datetime.datetime.strptime(data.fecha, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido. Usar YYYY-MM-DD")
        
    semana = calcular_semana_mes(fecha_obj)
    
    # Normalizar porcentaje (ej: 40 o 0.40 -> 0.40)
    pct_decimal = data.porcentaje / 100.0 if data.porcentaje > 1.0 else data.porcentaje
    pct_display = int(round(pct_decimal * 100))
    
    ganancia_personal = round(data.precio * pct_decimal, 2)
    ganancia_salon = round(data.precio - ganancia_personal, 2)

    # Validar que el salón exista
    nombre_salon = salon_nombre(data.salon_id)
    if not nombre_salon:
        raise HTTPException(status_code=400, detail="Salón/estudio no válido")

    # Entidad propia (Rodriguez Makeup): sin comisión, el 100% es de la maquilladora.
    if salon_es_propio(data.salon_id):
        pct_decimal = 1.0
        pct_display = 100
        ganancia_personal = round(data.precio, 2)
        ganancia_salon = 0.0

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO registro_servicios 
        (fecha, servicio_nombre, precio, porcentaje, ganancia_personal, ganancia_salon, semana, mes, anio, salon_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (data.fecha, data.servicio_nombre.strip(), data.precio, pct_decimal, 
          ganancia_personal, ganancia_salon, semana, fecha_obj.month, fecha_obj.year, data.salon_id))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    new_entry = {
        "id": new_id,
        "date": data.fecha,
        "week": f"Semana {semana}",
        "service": data.servicio_nombre.strip(),
        "price": data.precio,
        "commission": pct_display,
        "myGain": ganancia_personal,
        "salongain": ganancia_salon,
        "salon_id": data.salon_id,
        "salon_name": nombre_salon,
        "month": fecha_obj.month,
        "year": fecha_obj.year
    }
    
    return {
        "status": "ok",
        "message": "Servicio registrado correctamente",
        "entry": new_entry
    }

@app.post("/registro-lote")
def registrar_servicios_lote(data: ServicioLote):
    """Registra varios servicios en una sola transacción (misma fecha y salón).

    Se usa cuando una misma clienta lleva más de un servicio en la misma visita:
    todos los items se guardan juntos o ninguno (rollback si algo falla).
    """
    try:
        fecha_obj = datetime.datetime.strptime(data.fecha, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido. Usar YYYY-MM-DD")

    if not data.items:
        raise HTTPException(status_code=400, detail="Debes enviar al menos un servicio")

    nombre_salon = salon_nombre(data.salon_id)
    if not nombre_salon:
        raise HTTPException(status_code=400, detail="Salón/estudio no válido")

    semana = calcular_semana_mes(fecha_obj)
    es_propio = salon_es_propio(data.salon_id)
    conn = get_db()
    cursor = conn.cursor()
    entries = []
    try:
        for item in data.items:
            pct_decimal = item.porcentaje / 100.0 if item.porcentaje > 1.0 else item.porcentaje
            pct_display = int(round(pct_decimal * 100))
            ganancia_personal = round(item.precio * pct_decimal, 2)
            ganancia_salon = round(item.precio - ganancia_personal, 2)

            # Entidad propia: sin comisión, el 100% es de la maquilladora.
            if es_propio:
                pct_decimal = 1.0
                pct_display = 100
                ganancia_personal = round(item.precio, 2)
                ganancia_salon = 0.0

            cursor.execute("""
                INSERT INTO registro_servicios
                (fecha, servicio_nombre, precio, porcentaje, ganancia_personal, ganancia_salon, semana, mes, anio, salon_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (data.fecha, item.servicio_nombre.strip(), item.precio, pct_decimal,
                  ganancia_personal, ganancia_salon, semana, fecha_obj.month, fecha_obj.year, data.salon_id))

            entries.append({
                "id": cursor.lastrowid,
                "date": data.fecha,
                "week": f"Semana {semana}",
                "service": item.servicio_nombre.strip(),
                "price": item.precio,
                "commission": pct_display,
                "myGain": ganancia_personal,
                "salongain": ganancia_salon,
                "salon_id": data.salon_id,
                "salon_name": nombre_salon,
                "month": fecha_obj.month,
                "year": fecha_obj.year,
            })
        conn.commit()
    except Exception as exc:  # noqa: BLE001
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=500, detail=f"No se pudo registrar el lote: {exc}")
    conn.close()

    return {
        "status": "ok",
        "message": f"{len(entries)} servicios registrados correctamente",
        "cantidad": len(entries),
        "total_facturado": round(sum(e["price"] for e in entries), 2),
        "total_personal": round(sum(e["myGain"] for e in entries), 2),
        "total_salon": round(sum(e["salongain"] for e in entries), 2),
        "entries": entries,
    }

@app.put("/registro/{id}")
def actualizar_servicio(id: int, data: ServicioCreate):
    try:
        fecha_obj = datetime.datetime.strptime(data.fecha, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido. Usar YYYY-MM-DD")
        
    semana = calcular_semana_mes(fecha_obj)
    
    # Normalizar porcentaje
    pct_decimal = data.porcentaje / 100.0 if data.porcentaje > 1.0 else data.porcentaje
    pct_display = int(round(pct_decimal * 100))
    
    ganancia_personal = round(data.precio * pct_decimal, 2)
    ganancia_salon = round(data.precio - ganancia_personal, 2)

    # Validar que el salón exista
    nombre_salon = salon_nombre(data.salon_id)
    if not nombre_salon:
        raise HTTPException(status_code=400, detail="Salón/estudio no válido")

    # Entidad propia (Rodriguez Makeup): sin comisión, el 100% es de la maquilladora.
    if salon_es_propio(data.salon_id):
        pct_decimal = 1.0
        pct_display = 100
        ganancia_personal = round(data.precio, 2)
        ganancia_salon = 0.0

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE registro_servicios 
        SET fecha = ?, servicio_nombre = ?, precio = ?, porcentaje = ?, 
            ganancia_personal = ?, ganancia_salon = ?, semana = ?, mes = ?, anio = ?, salon_id = ?
        WHERE id = ?
    """, (data.fecha, data.servicio_nombre.strip(), data.precio, pct_decimal, 
          ganancia_personal, ganancia_salon, semana, fecha_obj.month, fecha_obj.year, data.salon_id, id))
    updated = cursor.rowcount
    conn.commit()
    conn.close()
    
    if updated == 0:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
        
    updated_entry = {
        "id": id,
        "date": data.fecha,
        "week": f"Semana {semana}",
        "service": data.servicio_nombre.strip(),
        "price": data.precio,
        "commission": pct_display,
        "myGain": ganancia_personal,
        "salongain": ganancia_salon,
        "salon_id": data.salon_id,
        "salon_name": nombre_salon,
        "month": fecha_obj.month,
        "year": fecha_obj.year
    }
    
    return {
        "status": "ok",
        "message": "Servicio actualizado correctamente",
        "entry": updated_entry
    }

@app.delete("/registro/{id}")
def eliminar_servicio(id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM registro_servicios WHERE id = ?", (id,))
    deleted = cursor.rowcount
    conn.commit()
    conn.close()
    
    if deleted == 0:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return {"status": "ok", "message": f"Registro {id} eliminado correctamente"}

@app.get("/resumen/{anio}/{mes}")
def obtener_resumen_mes(anio: int, mes: int):
    conn = get_db()
    cursor = conn.cursor()

    # Totales del mes
    cursor.execute("""
        SELECT SUM(ganancia_personal), SUM(ganancia_salon), SUM(precio) 
        FROM registro_servicios 
        WHERE anio = ? AND mes = ?
    """, (anio, mes))
    totales = cursor.fetchone()
    ganancia_total = totales[0] or 0.0
    salon_total = totales[1] or 0.0
    total_facturado = totales[2] or 0.0

    # Meta mensual
    cursor.execute("SELECT monto_meta FROM metas_mensuales WHERE anio = ? AND mes = ?", (anio, mes))
    meta_row = cursor.fetchone()
    monto_meta = meta_row[0] if meta_row else 480.0

    # Resumen semanal
    cursor.execute("""
        SELECT semana, SUM(ganancia_personal) 
        FROM registro_servicios 
        WHERE anio = ? AND mes = ?
        GROUP BY semana
    """, (anio, mes))
    semanas_db = dict(cursor.fetchall())
    resumen_semanas = {f"Semana {i}": semanas_db.get(i, 0.0) for i in range(1, 6)}

    # Registros
    cursor.execute("""
        SELECT id, fecha, servicio_nombre, precio, porcentaje, ganancia_personal, ganancia_salon, semana
        FROM registro_servicios
        WHERE anio = ? AND mes = ?
        ORDER BY fecha DESC, id DESC
    """, (anio, mes))
    registros = cursor.fetchall()
    
    conn.close()

    falta_meta = max(0.0, monto_meta - ganancia_total)

    return {
        "mi_ganancia_total": ganancia_total,
        "total_ganancia_salon": salon_total,
        "total_facturado": total_facturado,
        "meta_mes": monto_meta,
        "falta_para_meta": falta_meta,
        "resumen_semanas": resumen_semanas,
        "registros": [
            {
                "id": r["id"],
                "date": r["fecha"],
                "service": r["servicio_nombre"], 
                "price": r["precio"],
                "commission": int(round(r["porcentaje"] * 100)) if r["porcentaje"] <= 1.0 else int(round(r["porcentaje"])), 
                "myGain": r["ganancia_personal"],
                "salongain": r["ganancia_salon"],
                "week": f"Semana {r['semana']}"
            } for r in registros
        ]
    }

# ============================================================
# ENDPOINTS: PRODUCTOS / INSUMOS
# ============================================================
def _validate_date(s: str, field: str):
    """Valida formato YYYY-MM-DD; lanza HTTPException si es inválido."""
    try:
        return datetime.datetime.strptime(s, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail=f"Formato de fecha inválido en '{field}'. Usar YYYY-MM-DD")

def _row_to_product(r):
    """Convierte una fila SQLite a dict con campos normalizados."""
    return {
        "id": r["id"],
        "name": r["name"],
        "quantity": r["quantity"],
        "price": r["price"],
        "purchase_date": r["purchase_date"],
        "start_date": r["start_date"],
        "expiration_date": r["expiration_date"],
        "status": r["status"],
        "created_at": r["created_at"],
        "updated_at": r["updated_at"],
    }

@app.post("/products")
def crear_producto(data: ProductCreate):
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="El nombre del producto es obligatorio")
    if data.quantity < 1:
        raise HTTPException(status_code=400, detail="La cantidad debe ser al menos 1")
    if data.price < 0:
        raise HTTPException(status_code=400, detail="El precio no puede ser negativo")

    _validate_date(data.purchase_date, "purchase_date")
    _validate_date(data.expiration_date, "expiration_date")
    if data.start_date:
        _validate_date(data.start_date, "start_date")

    now_iso = datetime.datetime.utcnow().isoformat(timespec="seconds")
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO products (name, quantity, price, purchase_date, start_date, expiration_date, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (data.name.strip(), data.quantity, data.price, data.purchase_date,
          data.start_date, data.expiration_date, "activo", now_iso, now_iso))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {
        "status": "ok",
        "message": "Producto registrado correctamente",
        "product": {
            "id": new_id, "name": data.name.strip(), "quantity": data.quantity,
            "price": data.price, "purchase_date": data.purchase_date,
            "start_date": data.start_date, "expiration_date": data.expiration_date,
            "status": "activo",
            "created_at": now_iso, "updated_at": now_iso,
        }
    }

@app.get("/products")
def listar_productos(q: Optional[str] = Query(None, description="Búsqueda por nombre (LIKE)"),
                     status: Optional[str] = Query(None, description="Filtrar por estado: activo|terminado")):
    conn = get_db()
    cursor = conn.cursor()
    if status and status.strip() not in ("activo", "terminado", "todos"):
        raise HTTPException(status_code=400, detail="status debe ser 'activo', 'terminado' o 'todos'")
    # Los productos sin status (legacy) se tratan como activos
    status_filter = ""
    params = []
    if status and status.strip() in ("activo", "terminado"):
        status_filter = " AND COALESCE(status, 'activo') = ?"
        params.append(status.strip())
    if q and q.strip():
        like = f"%{q.strip()}%"
        cursor.execute("""
            SELECT id, name, quantity, price, purchase_date, start_date, expiration_date, status, created_at, updated_at
            FROM products WHERE name LIKE ? %s ORDER BY expiration_date ASC, name ASC
        """ % status_filter, [like] + params)
    else:
        cursor.execute("""
            SELECT id, name, quantity, price, purchase_date, start_date, expiration_date, status, created_at, updated_at
            FROM products WHERE 1=1 %s ORDER BY expiration_date ASC, name ASC
        """ % status_filter, params)
    rows = cursor.fetchall()
    conn.close()
    return {"cantidad": len(rows), "products": [_row_to_product(r) for r in rows]}

@app.patch("/products/{product_id}/open")
def abrir_producto_hoy(product_id: int):
    """Marca el producto como abierto hoy (start_date = hoy)."""
    today = datetime.date.today().isoformat()
    now_iso = datetime.datetime.utcnow().isoformat(timespec="seconds")
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE products SET start_date = ?, updated_at = ? WHERE id = ?
    """, (today, now_iso, product_id))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    conn.commit()

    cursor.execute("""
        SELECT id, name, quantity, price, purchase_date, start_date, expiration_date, status, created_at, updated_at
        FROM products WHERE id = ?
    """, (product_id,))
    row = cursor.fetchone()
    conn.close()
    return {"status": "ok", "message": f"Producto abierto hoy ({today})", "product": _row_to_product(row)}

@app.patch("/products/{product_id}/finish")
def terminar_producto(product_id: int):
    """Marca un producto como terminado/agotado (status='terminado', cantidad=0)."""
    now_iso = datetime.datetime.utcnow().isoformat(timespec="seconds")
    conn = get_db()
    cursor = conn.cursor()
    # Primero verificar que exista
    cursor.execute("SELECT id FROM products WHERE id = ?", (product_id,))
    if cursor.fetchone() is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    cursor.execute("""
        UPDATE products SET status = 'terminado', quantity = 0, updated_at = ? WHERE id = ?
    """, (now_iso, product_id))
    conn.commit()

    cursor.execute("""
        SELECT id, name, quantity, price, purchase_date, start_date, expiration_date, status, created_at, updated_at
        FROM products WHERE id = ?
    """, (product_id,))
    row = cursor.fetchone()
    conn.close()
    return {"status": "ok", "message": f"Producto marcado como terminado", "product": _row_to_product(row)}

@app.patch("/products/{product_id}/reactivate")
def reactivar_producto(product_id: int):
    """Vuelve un producto terminado al estado activo (status='activo')."""
    now_iso = datetime.datetime.utcnow().isoformat(timespec="seconds")
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM products WHERE id = ?", (product_id,))
    if cursor.fetchone() is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    cursor.execute("""
        UPDATE products SET status = 'activo', updated_at = ? WHERE id = ?
    """, (now_iso, product_id))
    conn.commit()

    cursor.execute("""
        SELECT id, name, quantity, price, purchase_date, start_date, expiration_date, status, created_at, updated_at
        FROM products WHERE id = ?
    """, (product_id,))
    row = cursor.fetchone()
    conn.close()
    return {"status": "ok", "message": "Producto reactivado", "product": _row_to_product(row)}

@app.put("/products/{product_id}")
def actualizar_producto(product_id: int, data: ProductUpdate):
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No se proporcionaron campos a actualizar")

    # Validaciones
    if "purchase_date" in updates:
            _validate_date(updates["purchase_date"], "purchase_date")
    if "expiration_date" in updates:
            _validate_date(updates["expiration_date"], "expiration_date")
    if updates.get("start_date"):
            _validate_date(updates["start_date"], "start_date")
    if "quantity" in updates and updates["quantity"] < 0:
            raise HTTPException(status_code=400, detail="La cantidad no puede ser negativa")
    if "price" in updates and updates["price"] < 0:
            raise HTTPException(status_code=400, detail="El precio no puede ser negativo")
    if "name" in updates and not updates["name"].strip():
            raise HTTPException(status_code=400, detail="El nombre no puede estar vacío")
    if "status" in updates and updates["status"] not in ("activo", "terminado"):
            raise HTTPException(status_code=400, detail="status debe ser 'activo' o 'terminado'")

    updates["updated_at"] = datetime.datetime.utcnow().isoformat(timespec="seconds")

    set_clause = ", ".join(f"{k} = ?" for k in updates.keys())
    values = list(updates.values()) + [product_id]

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(f"UPDATE products SET {set_clause} WHERE id = ?", values)
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    conn.commit()

    cursor.execute("""
        SELECT id, name, quantity, price, purchase_date, start_date, expiration_date, status, created_at, updated_at
        FROM products WHERE id = ?
    """, (product_id,))
    row = cursor.fetchone()
    conn.close()
    return {"status": "ok", "message": "Producto actualizado", "product": _row_to_product(row)}

@app.delete("/products/{product_id}")
def eliminar_producto(product_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM products WHERE id = ?", (product_id,))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    conn.commit()
    conn.close()
    return {"status": "ok", "message": f"Producto {product_id} eliminado"}

@app.get("/products/by-name/{name}")
def buscar_producto_por_nombre(name: str):
    """Helper para el bot de Telegram: busca por coincidencia parcial."""
    conn = get_db()
    cursor = conn.cursor()
    like = f"%{name}%"
    cursor.execute("""
        SELECT id, name, quantity, price, purchase_date, start_date, expiration_date, status, created_at, updated_at
        FROM products WHERE name LIKE ? ORDER BY expiration_date ASC LIMIT 5
    """, (like,))
    rows = cursor.fetchall()
    conn.close()
    return {"cantidad": len(rows), "products": [_row_to_product(r) for r in rows]}