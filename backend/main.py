import datetime
import math
import os
import sqlite3
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Sistema Registro Salón")

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

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

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
            anio INTEGER NOT NULL
        )
    """)
    
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
    
    conn.commit()
    conn.close()

@app.on_event("startup")
def startup():
    init_db()

# Modelos Pydantic
class ServicioCreate(BaseModel):
    fecha: str  # Formato YYYY-MM-DD
    servicio_nombre: str
    precio: float
    porcentaje: float  # e.g. 0.30 o 0.40 o 30 o 40

class MetaUpdate(BaseModel):
    anio: int
    mes: int
    monto_meta: float

# Auxiliar para calcular el número de semana según el día del mes
def calcular_semana_mes(fecha_obj: datetime.date) -> int:
    primer_dia = fecha_obj.replace(day=1)
    dia_del_mes = fecha_obj.day
    semana = math.ceil((dia_del_mes + primer_dia.weekday()) / 7)
    return min(semana, 5)

# Endpoints API
@app.get("/catalogo")
def obtener_catalogo():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, nombre, precio_defecto, porcentaje_defecto FROM catalogo_servicios ORDER BY nombre ASC")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r["id"], "nombre": r["nombre"], "precio_defecto": r["precio_defecto"], "porcentaje_defecto": r["porcentaje_defecto"]} for r in rows]

@app.get("/servicios")
def listar_servicios(desde: Optional[str] = Query(None), hasta: Optional[str] = Query(None)):
    conn = get_db()
    cursor = conn.cursor()
    
    query = "SELECT id, fecha, servicio_nombre, precio, porcentaje, ganancia_personal, ganancia_salon, semana, mes, anio FROM registro_servicios"
    params = []
    
    if desde and hasta:
        query += " WHERE fecha >= ? AND fecha <= ?"
        params.extend([desde, hasta])
    elif desde:
        query += " WHERE fecha >= ?"
        params.append(desde)
    elif hasta:
        query += " WHERE fecha <= ?"
        params.append(hasta)
        
    query += " ORDER BY fecha DESC, id DESC"
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

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO registro_servicios 
        (fecha, servicio_nombre, precio, porcentaje, ganancia_personal, ganancia_salon, semana, mes, anio)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (data.fecha, data.servicio_nombre.strip(), data.precio, pct_decimal, 
          ganancia_personal, ganancia_salon, semana, fecha_obj.month, fecha_obj.year))
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
        "month": fecha_obj.month,
        "year": fecha_obj.year
    }
    
    return {
        "status": "ok",
        "message": "Servicio registrado correctamente",
        "entry": new_entry
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

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE registro_servicios 
        SET fecha = ?, servicio_nombre = ?, precio = ?, porcentaje = ?, 
            ganancia_personal = ?, ganancia_salon = ?, semana = ?, mes = ?, anio = ?
        WHERE id = ?
    """, (data.fecha, data.servicio_nombre.strip(), data.precio, pct_decimal, 
          ganancia_personal, ganancia_salon, semana, fecha_obj.month, fecha_obj.year, id))
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