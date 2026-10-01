"""
Bot de Telegram para GUADALUPE MAKE UP - Control de Productos
==============================================================

Escucha mensajes de Telegram, los envía a un LLM local (Ollama) que decide
si la intención es:
  - "consultar": buscar uno o varios productos por nombre
  - "abrir":     marcar un producto como abierto hoy
  - "listar":    mostrar todos los productos (con paginación)
  - "otro":      responder con el LLM en modo conversacional

Pensado para correr como servicio independiente (proceso) o dentro del
backend FastAPI en un hilo daemon (start_background).
"""
from __future__ import annotations

import datetime
import json
import logging
import os
import re
import threading
from typing import Any, Dict, List, Optional, Tuple

import requests
import telebot
from telebot.types import Message

logger = logging.getLogger("telegram_bot")
if not logger.handlers:
    logging.basicConfig(
        level=os.getenv("TELEGRAM_BOT_LOG_LEVEL", "INFO"),
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )


# ============================================================
# CONFIGURACIÓN (por variables de entorno)
# ============================================================
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000").rstrip("/")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "hermes3")
OLLAMA_TIMEOUT = float(os.getenv("OLLAMA_TIMEOUT", "60"))


# ============================================================
# UTILIDADES DE PRODUCTOS
# ============================================================
def _days_until(date_str: Optional[str]) -> Optional[int]:
    if not date_str:
        return None
    try:
        target = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
        return (target - datetime.date.today()).days
    except (ValueError, TypeError):
        return None


def _format_product_for_chat(p: Dict[str, Any]) -> str:
    # Si el producto está terminado, se refleja y no se evalúa el semáforo de vencimiento
    if p.get("status") == "terminado":
        return (
            f"• *{p['name']}*\n"
            f"   ⚫ *TERMINADO / AGOTADO*\n"
            f"   Cantidad: {p.get('quantity', 0)}\n"
            f"   Caducidad: {p.get('expiration_date', '—')}\n"
            f"   Apertura: {p.get('start_date', '—')}"
        )

    days = _days_until(p.get("expiration_date"))
    if days is None:
        estado = "⚪️ Sin fecha de caducidad"
    elif days < 0:
        estado = f"🔴 Caducado hace {-days} días"
    elif days <= 15:
        estado = f"🟡 Próximo a vencer ({days} días)"
    else:
        estado = f"🟢 Vigente ({days} días)"

    if p.get("start_date"):
        abierto = f"Abierto desde {p['start_date']}"
    else:
        abierto = "📦 Sin abrir"

    return (
        f"• *{p['name']}*\n"
        f"   Cantidad: {p.get('quantity', 1)}\n"
        f"   Caducidad: {p.get('expiration_date', '—')} — {estado}\n"
        f"   {abierto}"
    )


def _format_product_list(products: List[Dict[str, Any]], header: str = "") -> str:
    if not products:
        return f"{header}No encontré productos registrados."
    lines = [header] if header else []
    lines.append(f"Encontré {len(products)} producto(s):\n")
    lines.extend(_format_product_for_chat(p) for p in products)
    return "\n\n".join(lines)


def api_list_products(q: Optional[str] = None) -> List[Dict[str, Any]]:
    try:
        url = f"{BACKEND_URL}/products"
        if q:
            url += f"?q={requests.utils.quote(q)}"
        r = requests.get(url, timeout=10)
        r.raise_for_status()
        return r.json().get("products", [])
    except Exception as e:
        logger.exception("api_list_products falló")
        return []


def api_open_product(product_id: int) -> Optional[Dict[str, Any]]:
    try:
        r = requests.patch(f"{BACKEND_URL}/products/{product_id}/open", timeout=10)
        r.raise_for_status()
        return r.json().get("product")
    except Exception as e:
        logger.exception("api_open_product falló")
        return None


def api_finish_product(product_id: int) -> Optional[Dict[str, Any]]:
    """Marca un producto como terminado/agotado."""
    try:
        r = requests.patch(f"{BACKEND_URL}/products/{product_id}/finish", timeout=10)
        r.raise_for_status()
        return r.json().get("product")
    except Exception as e:
        logger.exception("api_finish_product falló")
        return None


def api_find_product(query: str) -> List[Dict[str, Any]]:
    return api_list_products(q=query)


# ============================================================
# INTENCIÓN DETECTADA POR REGLAS + LLM
# ============================================================
SYSTEM_PROMPT = """Eres el asistente de inventario de un salón de maquillaje.
Tu trabajo es clasificar el mensaje del usuario en UNA de estas intenciones:

- "consultar":  cuando pide info de uno o varios productos
               (ej: "¿cómo está mi pestañina?", "base estée lauder",
                "qué productos tengo", "vencimientos", "lista de productos").
- "abrir":      cuando indica que abrió/va a abrir un producto HOY
               (ej: "hoy abrí la pestañina", "acabo de abrir la base").
- "terminar":   cuando indica que un producto se terminó/agotó o quiere marcarlo
               como terminado (ej: "se terminó la pestañina", "agotado la base",
               "marcar el sérum como terminado").
- "otro":       cualquier otra cosa (saludos, dudas generales, etc.).

Respondes SOLO un JSON estricto con esta forma:
{"intent": "consultar"|"abrir"|"terminar"|"otro", "product_query": "<texto>", "reply": "<texto>"}

Reglas:
- product_query: si menciona un producto, escribe solo el nombre clave
  (ej: "pestañina maybelline", "base estée lauder"). Si no menciona ninguno, "".
- reply: una respuesta corta y amable para el usuario en español.
- NO inventes información del producto; solo clasifica y extrae el nombre.
"""


def _heuristic_intent(text: str) -> Tuple[str, str, str]:
    """Fallback sin LLM: detecta intención por palabras clave."""
    t = text.lower()
    open_kw = ["hoy abrí", "hoy abri", "acabo de abrir", "ya abrí", "ya abri", "estoy abriendo", "abrí hoy", "abri hoy"]
    list_kw = ["qué tengo", "que tengo", "lista", "todos", "todos los productos", "vencimientos", "vencer", "caducar", "caducados"]
    finish_kw = ["terminó", "termino", "agotó", "agoto", "se terminó", "se termino", "se agotó", "se agoto",
                 "terminó de", "terminado", "agotado", "se acabó", "se acabo", "ya no tengo", "quedaron sin"]
    if any(k in t for k in open_kw):
        # extraer nombre del producto tras "abrí"/"abri"
        m = re.search(r"abr[ií]\s+(?:la|el|los|las)?\s*(.+)", text, re.IGNORECASE)
        query = m.group(1).strip().rstrip(".") if m else ""
        return ("abrir", query, "Entendido, marcando como abierto hoy.")
    if any(k in t for k in finish_kw):
        # Estrategia 1: frases "se terminó/agotó/acabó X"
        m = re.search(r"(?:se\s+termin[oó]|se\s+agot[oó]|se\s+acab[oó]|termin[oó]\s+el?\s*|agot[oó]\s+(?:el|la|los|las|del)?\s*)\s*(.+)", text, re.IGNORECASE)
        # Estrategia 2: "marcar X como terminado/agotado" / "X terminado/agotado"
        m2 = re.search(r"marcar\s+(?:el|la|los|las)?\s*(.+?)\s+como\s+(?:terminad[oa]|agotad[oa])", text, re.IGNORECASE)
        if m:
            query = m.group(1).strip().rstrip(".,")
        elif m2:
            query = m2.group(1).strip()
        else:
            # fallback: extraer "X terminado/agotado" o "X" sin keyword
            query = re.sub(r"\s+(?:terminad[oa]|agotad[oa])\s*$", "", text, flags=re.IGNORECASE)
            # quitar preludio genérico
            query = re.sub(r"^(?:marcar\s+(?:el|la|los|las)\s+|se\s+(?:termin[oó]|agot[oó]|acab[oó])\s+)", "", query, flags=re.IGNORECASE)
            query = query.replace("marcar como", "").replace("como terminado", "").replace("como agotado", "").strip()
        query = re.sub(r"\s+como\s+(?:terminad[oa]|agotad[oa])\s*$", "", query, flags=re.IGNORECASE)
        query = query.strip().strip(".,")
        # Limpiar artículos/palabras-clave iniciales en bucle hasta estabilizar
        prev = None
        while prev != query:
            prev = query
            query = re.sub(r"^(?:el\s+|la\s+|los\s+|las\s+|un\s+|una\s+|del\s+|terminad[oa]\s+|agotad[oa]\s+)", "", query, flags=re.IGNORECASE)
            query = query.strip().strip(".,")
        return ("terminar", query, "Entendido, marcando como terminado/agotado.")
    if any(k in t for k in list_kw):
        return ("consultar", "", "Aquí tienes el inventario:")
    # por defecto consultar con el texto completo como búsqueda
    return ("consultar", text.strip(), "")


def classify_intent(text: str) -> Dict[str, str]:
    """Usa Ollama para clasificar; cae a heurística si falla."""
    try:
        payload = {
            "model": OLLAMA_MODEL,
            "prompt": f"Sistema: {SYSTEM_PROMPT}\n\nUsuario: {text}\n\nAsistente:",
            "stream": False,
            "options": {"temperature": 0.1, "num_predict": 200},
        }
        r = requests.post(f"{OLLAMA_URL}/api/generate", json=payload, timeout=OLLAMA_TIMEOUT)
        r.raise_for_status()
        raw = r.json().get("response", "").strip()
        # Buscar primer {...}
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            data = json.loads(match.group(0))
            if "intent" in data:
                return {
                    "intent": str(data.get("intent", "otro")).lower(),
                    "product_query": str(data.get("product_query", "")).strip(),
                    "reply": str(data.get("reply", "")).strip(),
                }
    except Exception as e:
        logger.warning("LLM classify_intent falló, usando heurística: %s", e)

    intent, query, reply = _heuristic_intent(text)
    return {"intent": intent, "product_query": query, "reply": reply}


# ============================================================
# HANDLERS DE TELEGRAM
# ============================================================
def _build_bot() -> Optional[telebot.TeleBot]:
    if not TELEGRAM_BOT_TOKEN:
        logger.warning("TELEGRAM_BOT_TOKEN vacío: el bot NO se inicia.")
        return None
    return telebot.TeleBot(TELEGRAM_BOT_TOKEN, parse_mode=None, threaded=True)


def _register_handlers(bot: telebot.TeleBot) -> None:
    @bot.message_handler(commands=["start", "help"])
    def cmd_start(m: Message):
        bot.reply_to(
            m,
            "👋 Hola, soy el bot de inventario del salón.\n\n"
            "Puedes preguntarme cosas como:\n"
            "• *¿Cómo está mi pestañina maybelline?*\n"
            "• *¿Qué productos tengo por vencer?*\n"
            "• *Hoy abrí la base estée lauder*\n"
            "• *Se terminó el sérum revox*  → lo marca como agotado\n\n"
            "Comandos:\n"
            "/productos - lista todos\n"
            "/ayuda - este mensaje",
            parse_mode="Markdown",
        )

    @bot.message_handler(commands=["productos", "lista"])
    def cmd_list(m: Message):
        products = api_list_products()
        bot.reply_to(m, _format_product_list(products), parse_mode="Markdown")

    @bot.message_handler(func=lambda m: True)
    def handle_text(m: Message):
        text = (m.text or "").strip()
        if not text:
            return
        logger.info("Mensaje de %s: %s", m.from_user.id if m.from_user else "?", text)

        decision = classify_intent(text)
        intent = decision["intent"]
        query = decision["product_query"]

        if intent == "abrir":
            if not query:
                bot.reply_to(m, "¿Qué producto abriste hoy? Dime el nombre, por favor.")
                return
            matches = api_find_product(query)
            if not matches:
                bot.reply_to(
                    m,
                    f"🤔 No encontré un producto que coincida con *{query}*.\n"
                    f"¿Quieres que lo registre? Dime los datos (cantidad, fechas).",
                    parse_mode="Markdown",
                )
                return
            if len(matches) > 1:
                listado = "\n".join(f"• {p['name']} (id {p['id']})" for p in matches)
                bot.reply_to(
                    m,
                    f"Encontré varios productos. ¿Cuál abriste?\n{listado}",
                    parse_mode="Markdown",
                )
                return
            target = matches[0]
            updated = api_open_product(target["id"])
            if updated:
                bot.reply_to(
                    m,
                    f"✅ Listo, *{updated['name']}* marcado como abierto hoy.\n\n"
                    + _format_product_for_chat(updated),
                    parse_mode="Markdown",
                )
            else:
                bot.reply_to(m, "❌ No pude actualizar el producto, intenta más tarde.")
            return

        if intent == "terminar":
            if not query:
                bot.reply_to(m, "¿Qué producto se terminó/agotó? Dime el nombre, por favor.")
                return
            matches = api_find_product(query)
            if not matches:
                bot.reply_to(
                    m,
                    f"🤔 No encontré un producto que coincida con *{query}*.\n"
                    f"¿Quieres que lo registre? Dime los datos (cantidad, fechas).",
                    parse_mode="Markdown",
                )
                return
            if len(matches) > 1:
                listado = "\n".join(f"• {p['name']} (id {p['id']}, {p['status']})" for p in matches)
                bot.reply_to(
                    m,
                    f"Encontré varios productos. ¿Cuál quieres marcar como terminado?\n{listado}",
                    parse_mode="Markdown",
                )
                return
            target = matches[0]
            if target.get("status") == "terminado":
                bot.reply_to(
                    m,
                    f"ℹ️ *{target['name']}* ya estaba marcado como terminado.",
                    parse_mode="Markdown",
                )
                return
            updated = api_finish_product(target["id"])
            if updated:
                bot.reply_to(
                    m,
                    f"✅ Listo, *{updated['name']}* marcado como terminado/agotado.\n\n"
                    + _format_product_for_chat(updated),
                    parse_mode="Markdown",
                )
            else:
                bot.reply_to(m, "❌ No pude actualizar el producto, intenta más tarde.")
            return

        if intent == "consultar":
            if not query:
                products = api_list_products()
            else:
                products = api_find_product(query)
            bot.reply_to(m, _format_product_list(products), parse_mode="Markdown")
            return

        # "otro": respuesta libre corta
        fallback = decision.get("reply") or (
            "Soy el bot de inventario. Pregúntame por un producto "
            "(ej: *pestañina maybelline*) o dime que abriste uno hoy."
        )
        bot.reply_to(m, fallback, parse_mode="Markdown")


# ============================================================
# LANZAMIENTO COMO HILO (compatible con FastAPI)
# ============================================================
_bot_thread: Optional[threading.Thread] = None
_bot_instance: Optional[telebot.TeleBot] = None


def start_background() -> bool:
    """Arranca el bot en un hilo daemon. Devuelve True si arrancó."""
    global _bot_thread, _bot_instance
    if _bot_thread and _bot_thread.is_alive():
        logger.info("Bot ya estaba corriendo.")
        return True

    bot = _build_bot()
    if bot is None:
        return False
    _register_handlers(bot)
    _bot_instance = bot

    def _run():
        logger.info("Bot de Telegram iniciado (modelo: %s)", OLLAMA_MODEL)
        try:
            bot.infinity_polling(timeout=30, long_polling_timeout=30, skip_pending=True)
        except Exception as e:
            logger.exception("Bot detenido por error: %s", e)

    _bot_thread = threading.Thread(target=_run, name="telegram-bot", daemon=True)
    _bot_thread.start()
    return True


# ============================================================
# CLI: ejecución standalone
# ============================================================
def main() -> int:
    if not TELEGRAM_BOT_TOKEN:
        print("ERROR: define TELEGRAM_BOT_TOKEN en el entorno.")
        return 1
    bot = _build_bot()
    if bot is None:
        return 1
    _register_handlers(bot)
    print(f"Bot escuchando (modelo={OLLAMA_MODEL}, ollama={OLLAMA_URL})...")
    bot.infinity_polling(timeout=30, long_polling_timeout=30, skip_pending=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
