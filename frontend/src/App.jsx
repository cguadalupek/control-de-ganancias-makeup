import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Calendar as CalendarIcon, 
  CalendarRange,
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Trash2, 
  Pencil,
  Sparkles, 
  DollarSign, 
  TrendingUp, 
  Target, 
  Store, 
  Percent, 
  CheckCircle2, 
  Filter, 
  RotateCcw, 
  Search, 
  Check,
  AlertCircle,
  LayoutDashboard,
  FileText,
  PlusCircle,
  Menu,
  X,
  ArrowRight,
  Clock,
  Award,
  BarChart3,
  CalendarDays,
  SlidersHorizontal,
  Flame,
  Package,
  CalendarCheck,
  AlertTriangle,
  Tag,
  ShoppingBag,
  Edit3,
  Save,
  Lock,
  LogOut,
  Settings,
  User,
  UserPlus,
  Users,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound
} from 'lucide-react';

const API_BASE_URL = typeof window !== 'undefined' && window.location.port === '5173'
  ? 'http://localhost:8000'
  : '/api';

// Claves de almacenamiento local de la sesión
const TOKEN_KEY = 'salon_token';
const USER_KEY = 'salon_usuario';

// Rol con acceso a la sección Configuración
const ROL_ADMIN = 'admin';

// Mensaje legible de un error de la API (FastAPI puede devolver detail como lista)
const apiErrorMsg = (data, fallback) => {
  const d = data && data.detail;
  if (Array.isArray(d)) return d[0] && d[0].msg ? d[0].msg : fallback;
  return typeof d === 'string' && d ? d : fallback;
};

// Fecha/hora legible para la lista de usuarios ("2026-10-18 23:27:07" -> "18/10/2026 23:27")
const fechaCorta = (iso) => {
  if (!iso) return '';
  const [fecha, hora] = String(iso).split(' ');
  const [y, m, d] = (fecha || '').split('-');
  if (!y || !m || !d) return String(iso);
  return `${d}/${m}/${y}${hora ? ' ' + hora.slice(0, 5) : ''}`;
};

const DEFAULT_GOAL = 480.00;

const pad2 = (n) => String(n).padStart(2, '0');

// Suma meses a una fecha YYYY-MM-DD cuidando el fin de mes (31-ene + 6m => 31-jul)
const addMonthsYMD = (ymd, months) => {
  const parts = String(ymd || '').split('-').map(Number);
  const hoy = new Date();
  const [y, m, d] = (parts.length === 3 && parts.every((n) => !isNaN(n)))
    ? parts
    : [hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate()];
  const target = new Date(y, m - 1 + Number(months), 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return `${target.getFullYear()}-${pad2(target.getMonth() + 1)}-${pad2(Math.min(d, lastDay))}`;
};

// Monograma de Rodríguez: una R limpia y reconocible incluso en tamaños pequeños.
function BrandLogo({ compact = false, onDark = false }) {
  return (
    <div className="flex items-center gap-3 select-none">
      <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#b64a83] via-[#933a69] to-[#7d4e32] p-0.5 shadow-md flex items-center justify-center shrink-0 border border-[#eec9a3]/70 group">
        <div className="w-full h-full rounded-[14px] bg-[#fff9fc] flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#efd3e4] via-white to-[#f6e9df] opacity-90"></div>
          <svg className="w-8 h-8 relative z-10 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M27 80V20H52C69 20 78 29 78 42C78 51 73 57 64 60L80 80H64L50 63H41V80H27ZM41 51H51C59 51 64 48 64 42C64 36 59 32 51 32H41V51Z" fill="#933a69" />
            <path d="M58 20C71 20 79 28 79 40" stroke="#c89b6b" strokeWidth="4" strokeLinecap="round" />
            <circle cx="79" cy="20" r="3" fill="#c89b6b" />
          </svg>
        </div>
      </div>

      {!compact && (
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <span className={`font-extrabold text-lg sm:text-xl tracking-[0.18em] uppercase leading-none ${onDark ? 'text-white' : 'text-[#1e1e1c]'}`}>
              Rodríguez
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`text-[10px] font-bold tracking-[0.25em] uppercase ${onDark ? 'text-white/75' : 'text-[#6b6764]'}`}>
              MAKE UP
            </span>
            <span className={`font-brand-script text-base sm:text-lg leading-none transform -rotate-3 ${onDark ? 'text-[#fce3ed]' : 'text-[#ec71a8]'}`}>
              Estudio
            </span>
          </div>
        </div>
      )}




    </div>
  );
}

// Contador animado: los montos del Resumen suben de 0 al valor real al entrar
// (rápido, con frenada suave; se salta la animación con prefers-reduced-motion).
function AnimatedAmount({ value = 0, className = '', duration = 850, animate = true }) {
  const target = Number(value) || 0;
  const [shown, setShown] = useState(() => (animate ? 0 : target));
  const frameRef = useRef(0);

  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
    // animate=false (ya pasó la primera carga): el monto se muestra directo
    if (!animate || reduce || duration <= 0) {
      cancelAnimationFrame(frameRef.current);
      setShown(target);
      return undefined;
    }
    setShown(0);
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(target * eased);
      if (p < 1) frameRef.current = requestAnimationFrame(tick);
      else setShown(target);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, animate]);

  return <span className={className}>S/ {shown.toFixed(2)}</span>;
}

// Dropdown de marca reutilizable: mismo estilo del selector de Salón
// (botón con chevron + panel animado). Se usa en Salón, Rango de fechas y Caducidad.
function BrandSelect({ value, onChange, options = [], placeholder = 'Selecciona...', icon: Icon = Store, buttonClass = '', panelClass = '', trailing = null, dark = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = options.find((o) => String(o.value) === String(value));

  return (
    <div ref={ref} className={`relative ${open ? 'z-[95]' : 'z-[70]'}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 field-uniform p-3 sm:p-3.5 border rounded-2xl text-sm font-semibold outline-none transition-all text-left cursor-pointer ${
          open
            ? (dark ? 'border-[#ecc880] ring-3 ring-[#ecc880]/20 bg-[#1e1e1c]' : 'border-[#ec71a8] ring-3 ring-[#ec71a8]/15 bg-white')
            : (dark ? 'border-[#ecc880]/30 bg-[#1e1e1c] hover:border-[#ecc880]/70' : 'border-[#f9cee3] bg-[#faf5f8] hover:border-[#ec71a8]/50')
        } ${buttonClass}`}
      >
        <span className={`flex items-center gap-2 min-w-0 ${selected ? (dark ? 'text-white' : 'text-[#1e1e1c]') : 'text-[#8c8884]'}`}>
          <Icon className={`w-4 h-4 shrink-0 ${dark ? 'text-[#ecc880]' : 'text-[#ec71a8]'}`} />
          <span className="truncate">{selected ? selected.label : placeholder}</span>
        </span>
        <span className="ml-auto flex items-center gap-2 shrink-0">{trailing}<ChevronDown className={`w-4 h-4 transition-transform duration-200 shrink-0 ${dark ? 'text-[#ecc880]' : 'text-[#b64a83]'} ${open ? 'rotate-180' : ''}`} /></span>
      </button>

      {open && (
        <div className={`absolute z-50 mt-2 w-full rounded-2xl border shadow-xl overflow-hidden ${
          dark ? 'bg-[#151513] border-[#ecc880]/30 shadow-black/50' : 'bg-white border-[#f9cee3] shadow-[#ec71a8]/10'
        } ${panelClass}`}>
          {options.map((o) => {
            const active = String(o.value) === String(value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(String(o.value)); setOpen(false); }}
                className={`w-full flex items-center justify-between gap-2 px-4 py-3 text-left transition-colors cursor-pointer border-b last:border-b-0 ${
                  dark ? 'border-[#ecc880]/15' : 'border-[#fce3ed]'
                } ${
                  active
                    ? (dark ? 'bg-[#ecc880]/15' : 'bg-[#fce3ed]')
                    : (dark ? 'bg-[#151513] hover:bg-[#232320]' : 'bg-white hover:bg-[#fff5f8]')
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    dark
                      ? (active ? 'bg-[#ecc880] text-[#151513]' : 'bg-[#ecc880]/15 text-[#ecc880]')
                      : (active ? 'bg-[#ec71a8] text-white' : 'bg-[#fce3ed] text-[#ec71a8]')
                  }`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="flex flex-col min-w-0">
                    <span className={`text-sm font-bold ${
                      dark ? (active ? 'text-[#ecc880]' : 'text-white') : (active ? 'text-[#ec71a8]' : 'text-[#1e1e1c]')
                    }`}>{o.label}</span>
                    {o.desc && <span className="text-[10px] font-semibold text-[#8c8884]">{o.desc}</span>}
                  </span>
                </span>
                {active && <Check className={`w-4 h-4 shrink-0 ${dark ? 'text-[#ecc880]' : 'text-[#ec71a8]'}`} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Selector de salón / estudio (envoltura de BrandSelect para mantener la API previa)
function SalonSelect({ value, onChange, salones, placeholder = 'Salón', allowAll = false }) {
  const descSalon = (s) => {
    if (!s || !s.nombre) return '';
    if (s.propio || /rodriguez/i.test(s.nombre)) return 'Mi entidad propia - 100%';
    return /maison/i.test(s.nombre) ? 'Solo Maquillaje · 60%' : 'Maquillaje 40% · otros 30%';
  };

  const base = allowAll ? [{ value: 'todos', label: 'Todos', desc: 'Todos los salones / estudios' }] : [];
  const options = base.concat(
    (salones || []).map((s) => ({
      value: String(s.id),
      label: s.nombre,
      desc: s.desc || descSalon(s),
    }))
  );

  return <BrandSelect value={value} onChange={onChange} options={options} placeholder={placeholder} icon={Store} />;
}


// ================= CALENDARIO CON ESTILO DE MARCA =================
// Sustituye al picker nativo (plano): cabecera en degradado rosa, dia de hoy
// y dia seleccionado resaltados, y un pie con "Hoy" / "Limpiar".
const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
const MONTH_SHORT_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const WEEKDAY_SHORT_ES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

const dateToYMD = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const ymdToDate = (ymd) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || ''));
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
};

const formatYMDPretty = (ymd) => {
  const d = ymdToDate(ymd);
  if (!d) return '';
  return `${d.getDate()} ${MONTH_SHORT_ES[d.getMonth()]} ${d.getFullYear()}`;
};

function BrandDateField({ ariaLabel = 'Elegir fecha', align = 'left', value, onChange, icon: Icon = CalendarDays, placeholder = 'Elegir fecha' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const today = new Date();
  const todayYMD = dateToYMD(today);
  const selected = ymdToDate(value);
  const [viewYear, setViewYear] = useState((selected || today).getFullYear());
  const [viewMonth, setViewMonth] = useState((selected || today).getMonth());

  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const openCalendar = () => {
    const base = selected || today;
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setOpen(true);
  };

  const shiftMonth = (delta) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  // Rejilla con la semana empezando en lunes
  const firstWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
  const selectedYMD = selected ? dateToYMD(selected) : '';

  return (
    <div ref={ref} className={`relative ${open ? 'z-[95]' : 'z-[70]'}`}>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openCalendar())}
        aria-label={ariaLabel}
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-2 field-uniform p-2.5 sm:p-3 border rounded-2xl text-sm font-semibold outline-none transition-all text-left cursor-pointer ${
          open
            ? 'border-[#d94691] bg-white ring-2 ring-[#d94691]/20 shadow-[0_0_18px_rgba(217,70,145,0.22)]'
            : 'border-[#e8a1c6] bg-gradient-to-br from-[#fff6fb] to-white shadow-[0_0_14px_rgba(217,70,145,0.10)] hover:border-[#d94691]/70'
        }`}
      >
        <span className={`flex items-center gap-2 min-w-0 ${value ? 'text-[#2a1a25]' : 'text-[#8c8884]'}`}>
          <Icon className="w-4 h-4 shrink-0 text-[#d94691]" />
          <span className="truncate">{value ? formatYMDPretty(value) : placeholder}</span>
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-[#b64a83] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className={`absolute mt-2 z-[95] w-[min(84vw,18rem)] rounded-3xl border border-[#f9cee3] bg-white shadow-[0_22px_45px_-15px_rgba(182,74,131,0.55)] overflow-hidden animate-modal ${align === 'right' ? 'right-0' : 'left-0'}`}>
          <div className="relative bg-gradient-to-r from-[#ec71a8] via-[#d95392] to-[#b64a83] px-2.5 py-2.5 flex items-center justify-between gap-2">
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_top_right,white,transparent_60%)]"></div>
            <button type="button" onClick={() => shiftMonth(-1)} aria-label="Mes anterior" className="relative z-10 w-8 h-8 rounded-xl bg-white/25 hover:bg-white/40 text-white flex items-center justify-center cursor-pointer transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="relative z-10 text-center">
              <div className="text-white text-sm font-extrabold capitalize leading-none">{MONTH_NAMES_ES[viewMonth]} {viewYear}</div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-white/80 mt-1">Elegir día</div>
            </div>
            <button type="button" onClick={() => shiftMonth(1)} aria-label="Mes siguiente" className="relative z-10 w-8 h-8 rounded-xl bg-white/25 hover:bg-white/40 text-white flex items-center justify-center cursor-pointer transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 px-2.5 pt-3">
            {WEEKDAY_SHORT_ES.map((d) => (
              <span key={d} className="text-center text-[10px] font-black uppercase tracking-wide text-[#b64a83]">{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 px-2.5 pb-2.5 pt-1.5">
            {cells.map((day, index) => {
              if (day === null) return <span key={`empty-${index}`} />;
              const cellYMD = `${viewYear}-${pad2(viewMonth + 1)}-${pad2(day)}`;
              const isSelected = cellYMD === selectedYMD;
              const isToday = cellYMD === todayYMD;
              return (
                <button
                  key={cellYMD}
                  type="button"
                  onClick={() => { onChange(cellYMD); setOpen(false); }}
                  className={`h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-tr from-[#ec71a8] to-[#d95392] text-white shadow-md shadow-[#ec71a8]/40 scale-105'
                      : isToday
                        ? 'border border-[#ec71a8] text-[#ec71a8] bg-[#fce3ed]'
                        : 'text-[#4a4744] hover:bg-[#fce3ed] hover:text-[#1e1e1c]'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-[#fce3ed] bg-[#fff9fc] px-2.5 py-2.5">
            <button type="button" onClick={() => { onChange(todayYMD); setOpen(false); }} className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#ec71a8] to-[#d95392] text-white text-[11px] font-extrabold cursor-pointer shadow-sm">
              Hoy
            </button>
            {value ? (
              <button type="button" onClick={() => { onChange(''); setOpen(false); }} className="px-3 py-1.5 rounded-xl border border-[#f9cee3] bg-white text-[#8c8884] text-[11px] font-extrabold cursor-pointer hover:text-[#1e1e1c]">
                Limpiar
              </button>
            ) : (
              <span className="text-[10px] font-semibold text-[#8c8884]">Toca un día del calendario</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ================= PANTALLA DE INGRESO =================
// Mismo lenguaje visual de la app: fondo berry, tarjeta blanca de marca y campos
// con la altura uniforme del resto de formularios (field-uniform).
function LoginScreen({ onLogin, checking }) {
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    if (enviando) return;
    setError('');
    setEnviando(true);
    const res = await onLogin(usuario.trim(), clave);
    if (res && res.error) setError(res.error);
    setEnviando(false);
  };

  const inputBase = 'field-uniform w-full border border-[#f9cee3] rounded-2xl text-sm font-semibold outline-none focus:border-[#ec71a8] focus:ring-2 focus:ring-[#ec71a8]/15 bg-[#faf5f8]';
  const labelBase = 'text-xs font-bold uppercase tracking-wider text-[#4a4744] flex items-center gap-1.5';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#b64a83] via-[#9d3f6f] to-[#6f2b4c] relative overflow-hidden antialiased">
      <div className="pointer-events-none absolute -top-24 -right-16 w-72 h-72 rounded-full bg-[#ec71a8]/35 blur-3xl"></div>
      <div className="pointer-events-none absolute -bottom-28 -left-20 w-80 h-80 rounded-full bg-[#eec9a3]/25 blur-3xl"></div>

      <div className="relative w-full max-w-sm">
        <div className="flex justify-center mb-5">
          <BrandLogo onDark />
        </div>

        <div className="bg-white rounded-3xl border border-[#f9cee3] shadow-2xl shadow-black/25 p-6 sm:p-7 animate-modal">
          <div className="flex items-center gap-3 pb-5 mb-5 border-b border-[#fce3ed]">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#ec71a8] to-[#d95392] text-white flex items-center justify-center shadow-md shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-[#1e1e1c] leading-tight">Iniciar sesión</h1>
              <p className="text-[11px] font-semibold text-[#8c8884]">Control de Ganancias y Servicios</p>
            </div>
          </div>

          {checking ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <span className="w-8 h-8 rounded-full border-2 border-[#fce3ed] border-t-[#ec71a8] animate-spin"></span>
              <span className="text-xs font-bold text-[#8c8884]">Verificando sesión…</span>
            </div>
          ) : (
            <form onSubmit={enviar} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="login-usuario" className={labelBase}>
                  <User className="w-3.5 h-3.5 text-[#ec71a8]" />
                  Usuario
                </label>
                <input
                  id="login-usuario"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={usuario}
                  onChange={(e) => { setUsuario(e.target.value); setError(''); }}
                  placeholder="Tu usuario"
                  className={`${inputBase} px-3.5`}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="login-clave" className={labelBase}>
                  <Lock className="w-3.5 h-3.5 text-[#ec71a8]" />
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="login-clave"
                    type={verClave ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={clave}
                    onChange={(e) => { setClave(e.target.value); setError(''); }}
                    placeholder="Tu contraseña"
                    className={`${inputBase} pl-3.5 pr-12`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setVerClave(!verClave)}
                    aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl text-[#8c8884] hover:bg-[#fce3ed] hover:text-[#b64a83] cursor-pointer"
                  >
                    {verClave ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div role="alert" className="flex items-start gap-2 px-3.5 py-3 rounded-2xl bg-[#fdeef4] border border-[#ec71a8]/35 text-[#933a69]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="text-xs font-bold leading-snug">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={enviando}
                className="mt-1 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-[#ec71a8] to-[#d95392] text-white font-extrabold text-sm shadow-md shadow-[#ec71a8]/30 hover:opacity-95 active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {enviando ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin"></span>
                    Ingresando…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Ingresar
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-[11px] font-semibold text-white/70">
          Rodríguez Make Up · Estudio
        </p>
      </div>
    </div>
  );
}

// ================= SECCIÓN CONFIGURACIÓN (solo administrador) =================
// Alta de usuarios (maquilladora / administrador), control de accesos, cambio de
// contraseña propia y cierre de sesión. Mismo lenguaje visual que el resto de la app.
function ConfiguracionPanel({
  usuario, usuarios, cargando, onCrear, onActualizar, onEliminar, onRecargar, onCerrarSesion, onCambiarClave
}) {
  const [nombre, setNombre] = useState('');
  const [username, setUsername] = useState('');
  const [clave, setClave] = useState('');
  const [rol, setRol] = useState('usuario');
  const [verClave, setVerClave] = useState(false);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState('');

  const [resetUsuario, setResetUsuario] = useState(null);
  const [resetClave, setResetClave] = useState('');
  const [verReset, setVerReset] = useState(false);
  const [guardandoReset, setGuardandoReset] = useState(false);
  const [errorReset, setErrorReset] = useState('');

  const [claveActual, setClaveActual] = useState('');
  const [claveNueva, setClaveNueva] = useState('');
  const [verClaveActual, setVerClaveActual] = useState(false);
  const [verClaveNueva, setVerClaveNueva] = useState(false);
  const [guardandoMiClave, setGuardandoMiClave] = useState(false);
  const [errorMiClave, setErrorMiClave] = useState('');

  const rolOptions = [
    { value: 'usuario', label: 'Maquilladora', desc: 'Resumen, Productos e Informes' },
    { value: 'admin', label: 'Administrador', desc: 'Todo lo anterior + Configuración' },
  ];
  const etiquetaRol = (r) => (r === 'admin' ? 'Administrador' : 'Maquilladora');

  const inputBase = 'field-uniform w-full border border-[#f9cee3] rounded-2xl text-sm font-semibold outline-none focus:border-[#ec71a8] focus:ring-2 focus:ring-[#ec71a8]/15 bg-[#faf5f8]';
  const labelBase = 'text-xs font-bold uppercase tracking-wider text-[#4a4744] flex items-center gap-1.5';
  const btnMini = 'px-3 py-2 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors';
  const alerta = 'flex items-start gap-2 px-3.5 py-3 rounded-2xl bg-[#fdeef4] border border-[#ec71a8]/35 text-[#933a69]';

  const enviarAlta = async (e) => {
    e.preventDefault();
    setError('');
    setCreando(true);
    const res = await onCrear({ username: username.trim(), nombre: nombre.trim(), password: clave, rol });
    setCreando(false);
    if (res && res.error) { setError(res.error); return; }
    setNombre(''); setUsername(''); setClave(''); setRol('usuario');
  };

  const abrirReset = (u) => {
    setResetUsuario(u); setResetClave(''); setErrorReset(''); setVerReset(false);
  };

  const enviarReset = async (e) => {
    e.preventDefault();
    if (!resetUsuario) return;
    setErrorReset('');
    setGuardandoReset(true);
    const res = await onActualizar(resetUsuario.id, { password: resetClave });
    setGuardandoReset(false);
    if (res && res.error) { setErrorReset(res.error); return; }
    setResetUsuario(null); setResetClave('');
  };

  const enviarMiClave = async (e) => {
    e.preventDefault();
    setErrorMiClave('');
    setGuardandoMiClave(true);
    const res = await onCambiarClave({ actual: claveActual, nueva: claveNueva });
    setGuardandoMiClave(false);
    if (res && res.error) { setErrorMiClave(res.error); return; }
    setClaveActual(''); setClaveNueva('');
  };

  const ojo = (visible, toggle, etiqueta) => (
    <button
      type="button"
      onClick={toggle}
      aria-label={etiqueta}
      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl text-[#8c8884] hover:bg-[#fce3ed] hover:text-[#b64a83] cursor-pointer"
    >
      {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-in fade-in duration-300">

      {/* ---------- ALTA DE USUARIO ---------- */}
      <section className="card-luxury rounded-3xl p-5 sm:p-6">
        <div className="flex items-center gap-3 pb-4 mb-5 border-b border-[#fce3ed]">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#ec71a8] to-[#d95392] text-white flex items-center justify-center shadow-md shrink-0">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-[#1e1e1c] leading-tight">Crear usuario</h3>
            <p className="text-[11px] font-semibold text-[#8c8884]">
              La maquilladora mantiene las secciones habituales; el administrador ve además Configuración
            </p>
          </div>
        </div>

        <form onSubmit={enviarAlta} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cfg-nombre" className={labelBase}>
              <User className="w-3.5 h-3.5 text-[#ec71a8]" />
              Nombre completo
            </label>
            <input
              id="cfg-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Guadalupe Rodríguez"
              className={`${inputBase} px-3.5`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="cfg-usuario" className={labelBase}>
              <Users className="w-3.5 h-3.5 text-[#ec71a8]" />
              Usuario
            </label>
            <input
              id="cfg-usuario"
              type="text"
              autoCapitalize="none"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej. guadalupe"
              className={`${inputBase} px-3.5`}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="cfg-clave" className={labelBase}>
              <KeyRound className="w-3.5 h-3.5 text-[#ec71a8]" />
              Contraseña
            </label>
            <div className="relative">
              <input
                id="cfg-clave"
                type={verClave ? 'text' : 'password'}
                autoComplete="new-password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className={`${inputBase} pl-3.5 pr-12`}
                required
                minLength={6}
              />
              {ojo(verClave, () => setVerClave(!verClave), verClave ? 'Ocultar contraseña' : 'Mostrar contraseña')}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelBase}>
              <ShieldCheck className="w-3.5 h-3.5 text-[#ec71a8]" />
              Nivel de acceso
            </label>
            <BrandSelect value={rol} onChange={setRol} options={rolOptions} placeholder="Elige el nivel" icon={ShieldCheck} />
          </div>

          {error && (
            <div role="alert" className={`${alerta} sm:col-span-2`}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="text-xs font-bold leading-snug">{error}</span>
            </div>
          )}

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={creando}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#ec71a8] to-[#d95392] text-white font-extrabold text-sm shadow-md shadow-[#ec71a8]/25 hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {creando
                ? <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin"></span>
                : <UserPlus className="w-4 h-4" />}
              {creando ? 'Creando…' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </section>

      {/* ---------- USUARIOS REGISTRADOS ---------- */}
      <section className="card-luxury rounded-3xl p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 pb-4 mb-5 border-b border-[#fce3ed]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[#fce3ed] text-[#b64a83] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-extrabold text-[#1e1e1c] leading-tight">Usuarios registrados</h3>
              <p className="text-[11px] font-semibold text-[#8c8884]">
                {usuarios.length} {usuarios.length === 1 ? 'usuario' : 'usuarios'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRecargar}
            disabled={cargando}
            className="shrink-0 px-3.5 py-2.5 rounded-2xl border border-[#f9cee3] bg-[#faf5f8] text-[#b64a83] text-[11px] font-bold flex items-center gap-1.5 hover:bg-[#fce3ed] disabled:opacity-60 cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {cargando && usuarios.length === 0 ? (
          <div className="flex items-center justify-center gap-3 py-8 text-xs font-bold text-[#8c8884]">
            <span className="w-6 h-6 rounded-full border-2 border-[#fce3ed] border-t-[#ec71a8] animate-spin"></span>
            Cargando usuarios…
          </div>
        ) : usuarios.length === 0 ? (
          <p className="text-xs font-semibold text-[#8c8884] py-6 text-center">Todavía no hay usuarios registrados.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {usuarios.map((u) => (
              <article
                key={u.id}
                className="rounded-2xl border border-[#fce3ed] bg-white p-3.5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    u.rol === 'admin' ? 'bg-gradient-to-tr from-[#ec71a8] to-[#d95392] text-white' : 'bg-[#fce3ed] text-[#b64a83]'
                  }`}>
                    {u.rol === 'admin' ? <ShieldCheck className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-[#1e1e1c] truncate">{u.nombre || u.username}</span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        u.rol === 'admin'
                          ? 'bg-[#fce3ed] text-[#933a69] border-[#ec71a8]/30'
                          : 'bg-[#faf5f8] text-[#6b6764] border-[#e5e1da]'
                      }`}>
                        {etiquetaRol(u.rol)}
                      </span>
                      {!u.activo && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#fdeef4] text-[#933a69] border border-[#ec71a8]/30">
                          Desactivado
                        </span>
                      )}
                      {usuario && u.id === usuario.id && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#ecc880]/20 text-[#8a5a3e] border border-[#ecc880]/40">
                          Tú
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-[#8c8884] block truncate">
                      @{u.username}{u.ultimo_acceso ? ` · último ingreso ${fechaCorta(u.ultimo_acceso)}` : ' · sin ingresos'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 lg:flex-row lg:items-center shrink-0">
                  <div className="w-full lg:w-44">
                    <BrandSelect
                      value={u.rol}
                      onChange={(v) => onActualizar(u.id, { rol: v })}
                      options={rolOptions}
                      placeholder="Nivel"
                      icon={ShieldCheck}
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => abrirReset(u)}
                      className={`${btnMini} border-[#f9cee3] bg-[#faf5f8] text-[#b64a83] hover:bg-[#fce3ed]`}
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Clave
                    </button>
                    {/* Sobre tu propia cuenta no se ofrecen desactivar ni eliminar */}
                    {!(usuario && u.id === usuario.id) && (
                      <>
                        <button
                          type="button"
                          onClick={() => onActualizar(u.id, { activo: !u.activo })}
                          className={`${btnMini} ${
                            u.activo
                              ? 'border-[#e5e1da] bg-white text-[#6b6764] hover:bg-[#faf5f8]'
                              : 'border-[#ec71a8]/40 bg-[#fdeef4] text-[#933a69] hover:bg-[#fce3ed]'
                          }`}
                        >
                          {u.activo ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          {u.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onEliminar(u)}
                          className={`${btnMini} border-[#ec71a8]/40 bg-[#fdeef4] text-[#933a69] hover:bg-[#fce3ed]`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ---------- MI CUENTA ---------- */}
      <section className="card-luxury rounded-3xl p-5 sm:p-6">
        <div className="flex items-center gap-3 pb-4 mb-5 border-b border-[#fce3ed]">
          <div className="w-11 h-11 rounded-2xl bg-[#2a1a25] text-[#ecc880] flex items-center justify-center shadow-md shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-[#1e1e1c] leading-tight">Mi cuenta</h3>
            <p className="text-[11px] font-semibold text-[#8c8884]">Contraseña propia y cierre de sesión</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-2xl border border-[#fce3ed] bg-[#faf5f8] p-3.5">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ec71a8] to-[#d95392] text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <span className="block font-extrabold text-sm text-[#1e1e1c] truncate">
                {usuario ? (usuario.nombre || usuario.username) : ''}
              </span>
              <span className="block text-[11px] font-semibold text-[#8c8884] truncate">
                @{usuario ? usuario.username : ''} · Administrador
              </span>
            </div>
          </div>

          <form onSubmit={enviarMiClave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cfg-actual" className={labelBase}>
                <Lock className="w-3.5 h-3.5 text-[#ec71a8]" />
                Contraseña actual
              </label>
              <div className="relative">
                <input
                  id="cfg-actual"
                  type={verClaveActual ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={claveActual}
                  onChange={(e) => setClaveActual(e.target.value)}
                  placeholder="Tu contraseña actual"
                  className={`${inputBase} pl-3.5 pr-12`}
                  required
                />
                {ojo(verClaveActual, () => setVerClaveActual(!verClaveActual), verClaveActual ? 'Ocultar contraseña' : 'Mostrar contraseña')}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="cfg-nueva" className={labelBase}>
                <KeyRound className="w-3.5 h-3.5 text-[#ec71a8]" />
                Contraseña nueva
              </label>
              <div className="relative">
                <input
                  id="cfg-nueva"
                  type={verClaveNueva ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={claveNueva}
                  onChange={(e) => setClaveNueva(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className={`${inputBase} pl-3.5 pr-12`}
                  required
                  minLength={6}
                />
                {ojo(verClaveNueva, () => setVerClaveNueva(!verClaveNueva), verClaveNueva ? 'Ocultar contraseña' : 'Mostrar contraseña')}
              </div>
            </div>

            {errorMiClave && (
              <div role="alert" className={`${alerta} sm:col-span-2`}>
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="text-xs font-bold leading-snug">{errorMiClave}</span>
              </div>
            )}

            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={guardandoMiClave}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#ec71a8] to-[#d95392] text-white font-extrabold text-sm shadow-md shadow-[#ec71a8]/25 hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {guardandoMiClave ? 'Guardando…' : 'Cambiar contraseña'}
              </button>
            </div>
          </form>

          <div className="pt-4 border-t border-[#fce3ed]">
            <button
              type="button"
              onClick={onCerrarSesion}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-[#ec71a8]/45 bg-[#fdeef4] text-[#933a69] font-extrabold text-sm hover:bg-[#fce3ed] cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </section>

      {/* ---------- MODAL: RESTABLECER CONTRASEÑA ---------- */}
      {resetUsuario && (
        <div className="fixed inset-0 z-[85] bg-[#1e1e1c]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#f9cee3] animate-modal">
            <div className="flex items-center justify-between border-b border-[#fce3ed] pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ec71a8] to-[#d95392] text-white flex items-center justify-center shadow-md shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1e1e1c]">Restablecer contraseña</h3>
                  <p className="text-[11px] font-semibold text-[#8c8884]">
                    @{resetUsuario.username} · {etiquetaRol(resetUsuario.rol)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetUsuario(null)}
                className="p-2 rounded-xl text-[#8c8884] hover:bg-[#fce3ed] hover:text-[#1e1e1c] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={enviarReset} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="cfg-reset" className={labelBase}>
                  <KeyRound className="w-3.5 h-3.5 text-[#ec71a8]" />
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    id="cfg-reset"
                    type={verReset ? 'text' : 'password'}
                    value={resetClave}
                    onChange={(e) => setResetClave(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className={`${inputBase} pl-3.5 pr-12`}
                    required
                    minLength={6}
                  />
                  {ojo(verReset, () => setVerReset(!verReset), verReset ? 'Ocultar contraseña' : 'Mostrar contraseña')}
                </div>
                <span className="text-[10px] font-semibold text-[#8c8884]">
                  Al cambiarla se cerrarán las sesiones abiertas de ese usuario.
                </span>
              </div>

              {errorReset && (
                <div role="alert" className={alerta}>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="text-xs font-bold leading-snug">{errorReset}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-[#fce3ed]">
                <button
                  type="button"
                  onClick={() => setResetUsuario(null)}
                  className="px-5 py-2.5 rounded-2xl border border-[#e5e1da] bg-white hover:bg-[#faf5f8] font-bold text-xs text-[#6b6764] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoReset}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#ec71a8] to-[#d95392] text-white font-extrabold text-xs shadow-md shadow-[#ec71a8]/25 hover:opacity-95 disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {guardandoReset ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  // Navegación por pestañas ('resumen' | 'productos' | 'informes' | 'configuracion')
  // El registro de servicio y el de producto se abren como ventanas modales superpuestas
  const [activeTab, setActiveTab] = useState('resumen');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ============================================================
  // SESIÓN / AUTENTICACIÓN
  // ============================================================
  const [authToken, setAuthToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    } catch (e) {
      return null;
    }
  });
  const [authChecking, setAuthChecking] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosCargando, setUsuariosCargando] = useState(false);

  const esAdmin = Boolean(currentUser && currentUser.rol === ROL_ADMIN);

  // Cierra la sesión solo en el cliente (sin llamar al backend)
  const limpiarSesionLocal = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setAuthToken('');
    setCurrentUser(null);
    setUsuarios([]);
  };

  // fetch con la cabecera de sesión; si el token caduca se vuelve al login
  const apiFetch = React.useCallback(async (url, options = {}) => {
    const headers = { ...(options.headers || {}) };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401 && authToken && !String(url).includes('/auth/login')) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setAuthToken('');
      setCurrentUser(null);
      setUsuarios([]);
    }
    return res;
  }, [authToken]);

  const handleLogin = async (username, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { error: apiErrorMsg(data, 'No se pudo iniciar sesión') };
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.usuario));
      setAuthToken(data.token);
      setCurrentUser(data.usuario);
      setActiveTab('resumen');
      // Los montos del Resumen vuelven a animarse al entrar
      setAnimateCounters(true);
      setTimeout(() => setAnimateCounters(false), 1500);
      return { ok: true };
    } catch (e) {
      return { error: 'No hay conexión con el servidor. Inténtalo de nuevo.' };
    }
  };

  const handleLogout = async () => {
    if (!window.confirm('¿Cerrar sesión?')) return;
    try {
      await apiFetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' });
    } catch (e) {
      // aunque falle la llamada, la sesión local se cierra igual
    }
    limpiarSesionLocal();
    setActiveTab('resumen');
    setMobileMenuOpen(false);
  };

  // Validar el token guardado al abrir la app (mantiene la sesión entre visitas)
  useEffect(() => {
    if (!authToken) {
      setAuthChecking(false);
      return undefined;
    }
    let cancelado = false;
    (async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/auth/me`);
        if (!cancelado && res.ok) {
          const data = await res.json();
          setCurrentUser(data.usuario);
          localStorage.setItem(USER_KEY, JSON.stringify(data.usuario));
        }
      } catch (e) {
        // sin conexión: se mantiene el usuario cacheado en localStorage
      }
      if (!cancelado) setAuthChecking(false);
    })();
    return () => { cancelado = true; };
  }, [authToken]);

  // Un usuario sin rol admin nunca puede quedarse en la sección Configuración
  useEffect(() => {
    if (!esAdmin && activeTab === 'configuracion') setActiveTab('resumen');
  }, [esAdmin, activeTab]);

  // ============================================================
  // GESTIÓN DE USUARIOS (sección Configuración)
  // ============================================================
  const cargarUsuarios = async () => {
    if (!esAdmin) return;
    setUsuariosCargando(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/usuarios`);
      if (res.ok) {
        const data = await res.json();
        setUsuarios(Array.isArray(data) ? data : []);
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(apiErrorMsg(data, 'No se pudo cargar la lista de usuarios'), 'error');
      }
    } catch (e) {
      showToast('No hay conexión con el servidor', 'error');
    }
    setUsuariosCargando(false);
  };

  useEffect(() => {
    if (esAdmin && activeTab === 'configuracion') cargarUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esAdmin, activeTab]);

  const crearUsuario = async (datos) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { error: apiErrorMsg(data, 'No se pudo crear el usuario') };
      showToast(`Usuario @${data.username} creado`);
      await cargarUsuarios();
      return { ok: true };
    } catch (e) {
      return { error: 'No hay conexión con el servidor' };
    }
  };

  const actualizarUsuario = async (id, cambios) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/usuarios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cambios),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = apiErrorMsg(data, 'No se pudo actualizar el usuario');
        showToast(msg, 'error');
        return { error: msg };
      }
      showToast('Usuario actualizado');
      await cargarUsuarios();
      return { ok: true };
    } catch (e) {
      return { error: 'No hay conexión con el servidor' };
    }
  };

  const eliminarUsuario = async (u) => {
    if (!u) return { error: '' };
    if (!window.confirm(`¿Eliminar definitivamente al usuario @${u.username}?`)) return { error: '' };
    try {
      const res = await apiFetch(`${API_BASE_URL}/usuarios/${u.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = apiErrorMsg(data, 'No se pudo eliminar el usuario');
        showToast(msg, 'error');
        return { error: msg };
      }
      showToast(`Usuario @${u.username} eliminado`);
      await cargarUsuarios();
      return { ok: true };
    } catch (e) {
      return { error: 'No hay conexión con el servidor' };
    }
  };

  const cambiarClavePropia = async ({ actual, nueva }) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/auth/cambiar-clave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password_actual: actual, password_nueva: nueva }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { error: apiErrorMsg(data, 'No se pudo cambiar la contraseña') };
      showToast('Contraseña actualizada');
      return { ok: true };
    } catch (e) {
      return { error: 'No hay conexión con el servidor' };
    }
  };

  // Lista de servicios registrados
  const [services, setServices] = useState(() => {
    const saved = localStorage.getItem('salon_services');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing localStorage', e);
      }
    }
    // Estado inicial de demostración
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    return [
      {
        id: 1,
        date: todayStr,
        week: 'Semana 1',
        service: 'Maquillaje Profesional',
        price: 120.00,
        commission: 40,
        myGain: 48.00,
        salongain: 72.00,
        salon_id: 1,
        salon_name: 'Vanidades',
        month: now.getMonth() + 1,
        year: now.getFullYear()
      }
    ];
  });

  // Meta mensual
  const [goalAmount, setGoalAmount] = useState(DEFAULT_GOAL);

  // Gestión de mes en curso para el Dashboard General (Reinicio automático cada nuevo mes)
  const now = new Date();
  const [selectedDashboardYear, setSelectedDashboardYear] = useState(now.getFullYear());
  const [selectedDashboardMonth, setSelectedDashboardMonth] = useState(now.getMonth() + 1); // 1-12

  // Formulario nuevo registro
  const pad = (n) => String(n).padStart(2, '0');
  const todayYMD = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const [regDate, setRegDate] = useState(todayYMD);
  const [regService, setRegService] = useState('');
  const [regPrice, setRegPrice] = useState('');
  const [regCommission, setRegCommission] = useState(40); // % autocompletado (ajustable)
  const [showRegistroModal, setShowRegistroModal] = useState(false); // modal superpuesto de registro de servicio

  // Salones / estudios disponibles
  const [salones, setSalones] = useState([]);
  const [regSalonId, setRegSalonId] = useState(''); // obligatorio, sin selección por defecto

  // Estado para Modal de Edición
  const [editingService, setEditingService] = useState(null); // Objeto a editar
  const [editDate, setEditDate] = useState('');
  const [editService, setEditService] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCommission, setEditCommission] = useState(40);
  const [editSalonId, setEditSalonId] = useState('');

  // ============================================================
  // ESTADOS: MÓDULO DE PRODUCTOS / INVENTARIO
  // ============================================================
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState('activo'); // 'activo' | 'terminado' | 'todos'
  const [productLoading, setProductLoading] = useState(false);
  const [productPage, setProductPage] = useState(1); // paginación del inventario (9 por página)
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false); // modal superpuesto de registro de producto
  const [showProductsListModal, setShowProductsListModal] = useState(false);

  // Formulario de nuevo producto
  const todayYMDProduct = todayYMD; // reutilizamos el todayYMD ya definido arriba
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodPurchaseDate, setProdPurchaseDate] = useState(todayYMDProduct);
  const [prodStartDate, setProdStartDate] = useState('');
  const [prodExpirationDate, setProdExpirationDate] = useState(() => addMonthsYMD(todayYMDProduct, 6));
  const [prodExpiryPreset, setProdExpiryPreset] = useState('6'); // '6' | '12' | '' (personalizada)

  // Modal de edición de producto
  const [editProdName, setEditProdName] = useState('');
  const [editProdQuantity, setEditProdQuantity] = useState(1);
  const [editProdPrice, setEditProdPrice] = useState('');
  const [editProdPurchaseDate, setEditProdPurchaseDate] = useState('');
  const [editProdStartDate, setEditProdStartDate] = useState('');
  const [editProdExpirationDate, setEditProdExpirationDate] = useState('');
  const [editProdStatus, setEditProdStatus] = useState('activo');

  // Toast de notificación
  // El contador de montos solo corre en la primera carga de la app: al volver de otra
  // pestaña los montos aparecen ya con su valor.
  const [animateCounters, setAnimateCounters] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setAnimateCounters(false), 1500);
    return () => clearTimeout(t);
  }, []);

  const [toastMsg, setToastMsg] = useState(null);
  const showToast = (text, type = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Filtros de fecha y búsqueda (Informes)
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSalon, setFilterSalon] = useState('todos'); // 'todos' | id del salón
  const [quickRange, setQuickRange] = useState('all'); // preselección del dropdown de rango

  // Cargar servicios desde backend (solo con sesión iniciada)
  useEffect(() => {
    if (!authToken) return undefined;
    const fetchServices = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/servicios`);
        if (res.ok) {
          const data = await res.json();
          if (data.servicios && data.servicios.length > 0) {
            setServices(data.servicios);
            localStorage.setItem('salon_services', JSON.stringify(data.servicios));
          }
        }
      } catch (err) {
        console.log('Backend offline o usando fallback local');
      }
    };
    fetchServices();
  }, [authToken]);

  // Cargar salones / estudios (solo con sesión iniciada)
  useEffect(() => {
    if (!authToken) return undefined;
    apiFetch(`${API_BASE_URL}/salones`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setSalones(Array.isArray(data) ? data : []))
      .catch(() => console.log('No se pudieron cargar los salones'));
  }, [authToken]);

  // Cargar productos cuando se activa la pestaña "productos"
  useEffect(() => {
    if (authToken && activeTab === 'productos') {
      fetchProducts(productSearch, productStatusFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, activeTab, productStatusFilter]);

  // Guardar en localStorage
  useEffect(() => {
    localStorage.setItem('salon_services', JSON.stringify(services));
  }, [services]);

  // Auxiliar semana
  const getWeekOfMonth = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    return `Semana ${Math.ceil((date.getDate() + dayOfWeek) / 7)}`;
  };

  // Auxiliares de salones y comisión sugerida
  const salonById = (id) => salones.find((s) => s.id === Number(id));
  const salonNombre = (id) => {
    const s = salonById(id);
    return s ? s.nombre : (id ? `Salón ${id}` : '—');
  };
  const esMaison = (id) => {
    const s = salonById(id);
    return s ? /maison/i.test(s.nombre) : Number(id) === 2;
  };
  // Entidad propia (Rodriguez Makeup): el servicio es 100% mío, sin comisión del salón.
  const esPropio = (id) => {
    if (id === '' || id === null || id === undefined) return false;
    const s = salonById(id);
    return s ? Boolean(s.propio) || /rodriguez/i.test(s.nombre || '') : false;
  };
  const comisionSugerida = (salonId, servicio) => {
    if (esPropio(salonId)) return 100; // mi entidad propia: sin comisión
    if (esMaison(salonId)) return 60; // Maison Studio: solo Maquillaje
    return /maquillaje/i.test((servicio || '').trim()) ? 40 : 30; // Vanidades
  };

  // Cálculos en vivo (Nuevo Registro)
  const livePrice = parseFloat(regPrice) || 0;
  const liveMyGain = livePrice * (regCommission / 100);

  // Cálculos en vivo (Modal de Edición)
  const editLivePrice = parseFloat(editPrice) || 0;
  const editLiveMyGain = editLivePrice * (editCommission / 100);
  const editLiveSalonGain = editLivePrice - editLiveMyGain;

  // Cambio de salón en el formulario: recalcula comisión y, en Maison, fuerza Maquillaje
  const handleRegSalonChange = (val) => {
    setRegSalonId(val);
    if (esPropio(val)) {
      setRegCommission(100); // comisión bloqueada: todo es mío
    } else if (esMaison(val)) {
      setRegService('Maquillaje');
      setRegCommission(60);
    } else {
      setRegCommission(comisionSugerida(val, regService));
    }
  };
  const handleRegServiceChange = (val) => {
    setRegService(val);
    if (esPropio(regSalonId)) {
      setRegCommission(100);
    } else if (!esMaison(regSalonId)) {
      setRegCommission(comisionSugerida(regSalonId, val));
    }
  };

  // Cambio de salón / servicio en el modal de edición
  const handleEditSalonChange = (val) => {
    setEditSalonId(val);
    if (esPropio(val)) {
      setEditCommission(100); // entidad propia: sin comisión
    } else if (esMaison(val)) {
      setEditService('Maquillaje');
      setEditCommission(60);
    } else {
      setEditCommission(comisionSugerida(val, editService));
    }
  };
  const handleEditServiceChange = (val) => {
    setEditService(val);
    if (esPropio(editSalonId)) {
      setEditCommission(100);
    } else if (!esMaison(editSalonId)) {
      setEditCommission(comisionSugerida(editSalonId, val));
    }
  };

  // Envío de un servicio por registro: flujo claro en desktop y móvil.
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!regSalonId) { showToast('Selecciona el salón/estudio', 'error'); return; }
    if (!regService.trim()) { showToast('Indica el servicio realizado', 'error'); return; }
    const priceNum = parseFloat(regPrice);
    if (isNaN(priceNum) || priceNum <= 0) { showToast('Ingresa un precio válido', 'error'); return; }

    const item = { service: regService.trim(), price: priceNum, commission: Number(regCommission) };

    const dateObj = new Date(regDate + 'T00:00:00');
    const sMonth = dateObj.getMonth() + 1;
    const sYear = dateObj.getFullYear();

    const buildLocal = (item, id) => {
      const myGain = Math.round(item.price * (item.commission / 100) * 100) / 100;
      return {
        id: id ?? `local-${Date.now()}-${Math.random()}`,
        date: regDate,
        week: getWeekOfMonth(regDate),
        service: item.service,
        price: item.price,
        commission: item.commission,
        myGain: myGain,
        salongain: Math.round((item.price - myGain) * 100) / 100,
        salon_id: Number(regSalonId),
        salon_name: salonNombre(regSalonId),
        month: sMonth,
        year: sYear,
      };
    };

    let creado = buildLocal(item);

    try {
      const res = await apiFetch(`${API_BASE_URL}/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha: regDate,
          salon_id: Number(regSalonId),
          servicio_nombre: item.service,
          precio: item.price,
          porcentaje: item.commission,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.entry) creado = data.entry;
      }
    } catch (err) {
      console.log('Guardado local activado');
    }

    setServices((prev) => [creado, ...prev]);
    setRegService('');
    setRegPrice('');
    setShowRegistroModal(false);
    showToast(
      '¡Servicio registrado con éxito!',
      'success'
    );
  };

  // Abrir modal de edición
  const handleOpenEdit = (item) => {
    setEditingService(item);
    setEditDate(item.date);
    setEditService(item.service);
    setEditPrice(item.price.toString());
    setEditCommission(item.commission || 40);
    setEditSalonId(item.salon_id ?? '');
  };

  // Guardar edición de servicio
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingService || !editService.trim()) return;
    if (!editSalonId) { showToast('Selecciona el salón/estudio', 'error'); return; }
    const priceNum = parseFloat(editPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;

    const commNum = Number(editCommission);
    const myGain = Math.round(priceNum * (commNum / 100) * 100) / 100;
    const salongain = Math.round((priceNum - myGain) * 100) / 100;

    const dateObj = new Date(editDate + 'T00:00:00');
    const sMonth = dateObj.getMonth() + 1;
    const sYear = dateObj.getFullYear();

    const updatedEntry = {
      ...editingService,
      date: editDate,
      week: getWeekOfMonth(editDate),
      service: editService.trim(),
      price: priceNum,
      commission: commNum,
      myGain: myGain,
      salongain: salongain,
      salon_id: Number(editSalonId),
      salon_name: salonNombre(editSalonId),
      month: sMonth,
      year: sYear
    };

    try {
      await apiFetch(`${API_BASE_URL}/registro/${editingService.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha: editDate,
          servicio_nombre: editService.trim(),
          precio: priceNum,
          porcentaje: commNum,
          salon_id: Number(editSalonId)
        })
      });
    } catch (err) {
      console.log('Actualizado localmente');
    }

    setServices((prev) => prev.map((s) => (s.id === editingService.id ? updatedEntry : s)));
    setEditingService(null);
    showToast('¡Servicio modificado correctamente!', 'info');
  };

  // Eliminar un servicio
  const handleDeleteService = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro de servicio?')) return;

    try {
      await apiFetch(`${API_BASE_URL}/registro/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.log('Eliminando localmente');
    }

    setServices((prev) => prev.filter((item) => item.id !== id));
    showToast('Servicio eliminado', 'warning');
  };

  // ============================================================
  // FUNCIONES: MÓDULO DE PRODUCTOS
  // ============================================================
  const fetchProducts = async (q = '', status = '') => {
    setProductLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (status && status !== 'todos') params.set('status', status);
      const qs = params.toString();
      const url = qs ? `${API_BASE_URL}/products?${qs}` : `${API_BASE_URL}/products`;
      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('fetchProducts falló', err);
      showToast('No se pudo conectar con el servidor', 'error');
    } finally {
      setProductLoading(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!prodName.trim()) {
      showToast('El nombre del producto es obligatorio', 'error');
      return;
    }
    const payload = {
      name: prodName.trim(),
      quantity: 1, // stock unitario: cada producto es 1 unidad (campo bloqueado en el formulario)
      price: Number(prodPrice) || 0,
      purchase_date: prodPurchaseDate,
      start_date: prodStartDate || null,
      expiration_date: prodExpirationDate,
    };
    try {
      const res = await apiFetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Error al registrar producto');
      }
      showToast('¡Producto registrado!', 'success');
      setShowProductModal(false);
      setProdName('');
      setProdPrice('');
      setProdStartDate('');
      setProdPurchaseDate(todayYMD);
      setProdExpiryPreset('6');
      setProdExpirationDate(addMonthsYMD(todayYMD, 6));
      await fetchProducts(productSearch, productStatusFilter);
    } catch (err) {
      showToast(err.message || 'Error al registrar', 'error');
    }
  };

  // Caducidad automática: 6 o 12 meses desde la fecha de compra
  const handlePurchaseDateChange = (val) => {
    setProdPurchaseDate(val);
    if (prodExpiryPreset === '6' || prodExpiryPreset === '12') {
      setProdExpirationDate(addMonthsYMD(val, Number(prodExpiryPreset)));
    }
  };

  const handleExpiryPresetChange = (val) => {
    setProdExpiryPreset(val);
    if (val === '6' || val === '12') {
      setProdExpirationDate(addMonthsYMD(prodPurchaseDate || todayYMD, Number(val)));
    }
  };

  const handleOpenToday = async (id) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/products/${id}/open`, { method: 'PATCH' });
      if (!res.ok) throw new Error('No se pudo abrir');
      const data = await res.json();
      showToast(data.message || 'Producto abierto hoy', 'success');
      await fetchProducts(productSearch, productStatusFilter);
    } catch (err) {
      showToast(err.message || 'Error', 'error');
    }
  };

  const handleFinishProduct = async (id) => {
    if (!window.confirm('¿Marcar este producto como terminado/agotado?')) return;
    try {
      const res = await apiFetch(`${API_BASE_URL}/products/${id}/finish`, { method: 'PATCH' });
      if (!res.ok) throw new Error('No se pudo marcar como terminado');
      showToast('Producto marcado como terminado', 'success');
      await fetchProducts(productSearch, productStatusFilter);
    } catch (err) {
      showToast(err.message || 'Error', 'error');
    }
  };

  const handleReactivateProduct = async (id) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/products/${id}/reactivate`, { method: 'PATCH' });
      if (!res.ok) throw new Error('No se pudo reactivar');
      showToast('Producto reactivado', 'success');
      await fetchProducts(productSearch, productStatusFilter);
    } catch (err) {
      showToast(err.message || 'Error', 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('¿Eliminar este producto del inventario?')) return;
    try {
      const res = await apiFetch(`${API_BASE_URL}/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo eliminar');
      showToast('Producto eliminado', 'warning');
      await fetchProducts(productSearch, productStatusFilter);
    } catch (err) {
      showToast(err.message || 'Error', 'error');
    }
  };

  const openEditProduct = (p) => {
    setEditingProduct(p);
    setEditProdName(p.name);
    setEditProdQuantity(p.quantity);
    setEditProdPrice(String(p.price ?? ''));
    setEditProdPurchaseDate(p.purchase_date);
    setEditProdStartDate(p.start_date || '');
    setEditProdExpirationDate(p.expiration_date);
    setEditProdStatus(p.status || 'activo');
  };

  const handleSaveEditProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    const payload = {
      name: editProdName.trim(),
      quantity: Number(editProdQuantity) || 1,
      price: Number(editProdPrice) || 0,
      purchase_date: editProdPurchaseDate,
      start_date: editProdStartDate || null,
      expiration_date: editProdExpirationDate,
      status: editProdStatus,
    };
    try {
      const res = await apiFetch(`${API_BASE_URL}/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Error al actualizar');
      }
      showToast('Producto actualizado', 'success');
      setEditingProduct(null);
      await fetchProducts(productSearch, productStatusFilter);
    } catch (err) {
      showToast(err.message || 'Error', 'error');
    }
  };

  // Lógica del semáforo de vencimiento
  const getExpirationState = (expirationDate) => {
    if (!expirationDate) return { color: 'gray', label: 'Sin fecha', days: null };
    const exp = new Date(expirationDate + 'T00:00:00');
    const t = new Date(todayYMD + 'T00:00:00');
    const diffDays = Math.round((exp - t) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { color: 'red', label: `Caducado hace ${-diffDays} días`, days: diffDays };
    if (diffDays <= 15) return { color: 'yellow', label: `Vence en ${diffDays} días`, days: diffDays };
    return { color: 'green', label: `Vigente (${diffDays} días)`, days: diffDays };
  };

  // Nombres de meses en español
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Navegar entre meses en el Dashboard
  const handlePrevDashboardMonth = () => {
    if (selectedDashboardMonth === 1) {
      setSelectedDashboardMonth(12);
      setSelectedDashboardYear(selectedDashboardYear - 1);
    } else {
      setSelectedDashboardMonth(selectedDashboardMonth - 1);
    }
  };

  const handleNextDashboardMonth = () => {
    if (selectedDashboardMonth === 12) {
      setSelectedDashboardMonth(1);
      setSelectedDashboardYear(selectedDashboardYear + 1);
    } else {
      setSelectedDashboardMonth(selectedDashboardMonth + 1);
    }
  };

  const handleCurrentDashboardMonth = () => {
    const cur = new Date();
    setSelectedDashboardYear(cur.getFullYear());
    setSelectedDashboardMonth(cur.getMonth() + 1);
  };

  // Modales superpuestos: registro de servicio y registro de producto
  const openRegistro = () => {
    setShowRegistroModal(true);
    setMobileMenuOpen(false);
  };
  const closeRegistro = () => setShowRegistroModal(false);

  const openProducto = () => {
    setShowProductModal(true);
    setMobileMenuOpen(false);
  };
  const closeProducto = () => setShowProductModal(false);
  const openProductsList = () => setShowProductsListModal(true);


  const anyModalOpen = showRegistroModal || showProductModal || showProductsListModal;

  // Con una ventana modal abierta el fondo no se desplaza: el scroll ocurre solo dentro del modal.
  // Se bloquean html y body (en algunos navegadores el overflow de body no propaga al viewport).
  useEffect(() => {
    if (!anyModalOpen) return undefined;
    const html = document.documentElement;
    const prevBody = document.body.style.overflow;
    const prevHtml = html.style.overflow;
    document.body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBody;
      html.style.overflow = prevHtml;
    };
  }, [anyModalOpen]);

  useEffect(() => {
    if (!anyModalOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') { setShowRegistroModal(false); setShowProductModal(false); setShowProductsListModal(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [anyModalOpen]);

  // ==========================================
  // DATOS FILTRADOS PARA EL DASHBOARD MENSUAL
  // ==========================================
  // Al cambiar de mes o iniciar un nuevo mes, los datos se calculan estrictamente para ese mes
  // Si no hay registros aún en ese mes, arranca automáticamente en 0.00
  const monthlyServices = useMemo(() => {
    return services.filter((item) => {
      // Comparar por mes y año
      if (item.month && item.year) {
        return item.month === selectedDashboardMonth && item.year === selectedDashboardYear;
      }
      // Fallback con parsing de fecha YYYY-MM-DD
      const parts = item.date.split('-');
      if (parts.length === 3) {
        const itemYear = parseInt(parts[0], 10);
        const itemMonth = parseInt(parts[1], 10);
        return itemYear === selectedDashboardYear && itemMonth === selectedDashboardMonth;
      }
      return false;
    });
  }, [services, selectedDashboardMonth, selectedDashboardYear]);

  // Totales del Dashboard Mensual
  const monthMyGain = monthlyServices.reduce((acc, curr) => acc + curr.myGain, 0);
  const monthSalonGain = monthlyServices.reduce((acc, curr) => acc + curr.salongain, 0);
  const monthFacturado = monthlyServices.reduce((acc, curr) => acc + curr.price, 0);
  const monthRemainingGoal = Math.max(0, goalAmount - monthMyGain);
  const monthGoalProgressPct = Math.min(100, Math.round((monthMyGain / goalAmount) * 100));

  // Desglose semanal del mes (Semana 1 a 5)
  const weeklyEarnings = useMemo(() => {
    const weeks = { 'Semana 1': 0, 'Semana 2': 0, 'Semana 3': 0, 'Semana 4': 0, 'Semana 5': 0 };
    monthlyServices.forEach((s) => {
      const w = s.week || getWeekOfMonth(s.date);
      if (weeks[w] !== undefined) {
        weeks[w] += s.myGain;
      }
    });
    return weeks;
  }, [monthlyServices]);

  const salonNetGain = (salonName) => monthlyServices
    .filter((service) => salonNombre(service.salon_id) === salonName)
    .reduce((total, service) => total + service.myGain, 0);
  const vanidadesNetGain = salonNetGain('Vanidades');
  const maisonNetGain = salonNetGain('Maison Studio');

  // Mi entidad propia (Rodriguez Makeup): ganancias independientes del mes, sin comisión.
  const salonPropio = salones.find((s) => s.propio || /rodriguez/i.test(s.nombre || '')) || null;
  const propioSalonIds = salones
    .filter((s) => s.propio || /rodriguez/i.test(s.nombre || ''))
    .map((s) => Number(s.id));
  if (propioSalonIds.length === 0) propioSalonIds.push(3); // id estable de la entidad propia
  const independienteNombre = (salonPropio && salonPropio.nombre) || 'Rodriguez Makeup';
  const independienteServicios = monthlyServices.filter((s) => propioSalonIds.includes(Number(s.salon_id)));
  const independienteNetGain = independienteServicios.reduce((total, s) => total + s.myGain, 0);

  const isViewingCurrentMonth = (now.getMonth() + 1 === selectedDashboardMonth) && (now.getFullYear() === selectedDashboardYear);

  // ==========================================
  // FILTRADO PARA LA PESTAÑA INFORMES
  // ==========================================
  const filteredServices = useMemo(() => {
    return services.filter((item) => {
      const matchFrom = filterFrom ? item.date >= filterFrom : true;
      const matchTo = filterTo ? item.date <= filterTo : true;
      const matchSearch = searchTerm.trim() 
        ? item.service.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      const matchSalon = filterSalon === 'todos' || Number(item.salon_id) === Number(filterSalon);
      return matchFrom && matchTo && matchSearch && matchSalon;
    });
  }, [services, filterFrom, filterTo, searchTerm, filterSalon]);

  // Paginación en la sección de Informes e Historial (5 registros por página)
  const [reportPage, setReportPage] = useState(1);
  const itemsPerPage = 5;

  // Reiniciar a la primera página cuando cambian los filtros de búsqueda o fecha
  useEffect(() => {
    setReportPage(1);
  }, [filterFrom, filterTo, searchTerm, filterSalon]);

  const totalReportPages = Math.max(1, Math.ceil(filteredServices.length / itemsPerPage));
  const visibleReportPages = useMemo(() => {
    if (totalReportPages <= 5) return Array.from({ length: totalReportPages }, (_, i) => i + 1);
    const nearby = [reportPage - 1, reportPage, reportPage + 1].filter((page) => page > 1 && page < totalReportPages);
    return [1, ...(nearby[0] > 2 ? ['…'] : []), ...nearby, ...(nearby.at(-1) < totalReportPages - 1 ? ['…'] : []), totalReportPages];
  }, [reportPage, totalReportPages]);
  const paginatedServices = useMemo(() => {
    const start = (reportPage - 1) * itemsPerPage;
    return filteredServices.slice(start, start + itemsPerPage);
  }, [filteredServices, reportPage, itemsPerPage]);

  // Paginación del inventario: 3x3 en escritorio => 9 productos por página.
  // Reutiliza el mismo modelo de controles que la sección Informes.
  const productsPerPage = 9;
  const totalProductPages = Math.max(1, Math.ceil(products.length / productsPerPage));
  const visibleProductPages = useMemo(() => {
    if (totalProductPages <= 5) return Array.from({ length: totalProductPages }, (_, i) => i + 1);
    const nearby = [productPage - 1, productPage, productPage + 1].filter((page) => page > 1 && page < totalProductPages);
    return [1, ...(nearby[0] > 2 ? ['…'] : []), ...nearby, ...(nearby.at(-1) < totalProductPages - 1 ? ['…'] : []), totalProductPages];
  }, [productPage, totalProductPages]);
  const paginatedProducts = useMemo(() => {
    const start = (productPage - 1) * productsPerPage;
    return products.slice(start, start + productsPerPage);
  }, [products, productPage]);

  // Volver a la primera página al cambiar de búsqueda o de filtro de estado
  useEffect(() => {
    setProductPage(1);
  }, [productSearch, productStatusFilter]);

  // Las métricas filtradas solo se muestran cuando el usuario aplica un filtro explícito
  const hasActiveFilters = Boolean(
    filterFrom || filterTo || searchTerm.trim() || filterSalon !== 'todos' || quickRange !== 'all'
  );

  const reportTotalMyGain = filteredServices.reduce((acc, curr) => acc + curr.myGain, 0);
  const reportTotalSalonGain = filteredServices.reduce((acc, curr) => acc + curr.salongain, 0);
  const reportTotalFacturado = filteredServices.reduce((acc, curr) => acc + curr.price, 0);

  // Opciones del dropdown "Rango de fechas" (mismo estilo del selector de Salón)
  const rangeOptions = [
    { value: 'all', label: 'Todo el histórico', desc: 'Sin filtro de fechas' },
    { value: 'today', label: 'Hoy', desc: 'Solo los servicios de hoy' },
    { value: 'week', label: 'Esta semana', desc: 'Semana actual (lunes a domingo)' },
    { value: 'month', label: 'Este mes', desc: 'Mes calendario en curso' },
    { value: 'last_month', label: 'Mes anterior', desc: 'Mes calendario anterior' },
    { value: 'year', label: 'Este año', desc: 'Año en curso' },
    { value: 'custom', label: 'Rango personalizado', desc: 'Elige las fechas abajo' },
  ];

  // Atajos rápidos de filtro
  const handleQuickFilter = (type) => {
    const today = new Date();
    const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (type === 'today') {
      const todayStr = toYMD(today);
      setFilterFrom(todayStr);
      setFilterTo(todayStr);
    } else if (type === 'week') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(today.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      setFilterFrom(toYMD(monday));
      setFilterTo(toYMD(sunday));
    } else if (type === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setFilterFrom(toYMD(firstDay));
      setFilterTo(toYMD(lastDay));
    } else if (type === 'last_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      setFilterFrom(toYMD(firstDay));
      setFilterTo(toYMD(lastDay));
    } else if (type === 'year') {
      const firstDay = new Date(today.getFullYear(), 0, 1);
      const lastDay = new Date(today.getFullYear(), 11, 31);
      setFilterFrom(toYMD(firstDay));
      setFilterTo(toYMD(lastDay));
    } else if (type === 'all') {
      setFilterFrom('');
      setFilterTo('');
    }
    setQuickRange(type);
  };

  // Exportar el conjunto filtrado a CSV (liquidación limpia por salón)
  const handleExportCSV = () => {
    if (filteredServices.length === 0) return;
    const rows = [['Fecha', 'Semana', 'Servicio', 'Salón', 'Cobrado (S/)', 'Comisión (%)', 'Mi Ganancia', 'Ganancia Salón']];
    filteredServices.forEach((item) => {
      rows.push([
        item.date,
        item.week || getWeekOfMonth(item.date),
        item.service,
        salonNombre(item.salon_id),
        item.price.toFixed(2),
        String(item.commission),
        item.myGain.toFixed(2),
        item.salongain.toFixed(2)
      ]);
    });
    const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const salonLabel = filterSalon === 'todos' ? 'Todos' : salonNombre(filterSalon);
    a.download = `servicios_${salonLabel.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exportado con el filtro actual', 'info');
  };

  // Exportar a Excel (.xls HTML) con la marca GUADALUPE MAKE UP
  const handleExportExcel = () => {
    if (filteredServices.length === 0) return;
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const salonLabel = filterSalon === 'todos' ? 'Todos' : salonNombre(filterSalon);

    const dataRows = filteredServices.map((item) => `
      <tr>
        <td style="text-align:center;border:1px solid #e5e1da;">${item.date}</td>
        <td style="text-align:center;border:1px solid #e5e1da;">${item.week || getWeekOfMonth(item.date)}</td>
        <td style="border:1px solid #e5e1da;">${esc(item.service)}</td>
        <td style="border:1px solid #e5e1da;">${esc(salonNombre(item.salon_id))}</td>
        <td style="text-align:right;border:1px solid #e5e1da;">${item.price.toFixed(2)}</td>
        <td style="text-align:center;border:1px solid #e5e1da;">${item.commission}%</td>
        <td style="text-align:right;border:1px solid #e5e1da;color:#ec71a8;font-weight:bold;">${item.myGain.toFixed(2)}</td>
        <td style="text-align:right;border:1px solid #e5e1da;">${item.salongain.toFixed(2)}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
<table border="0" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:Calibri,Arial,sans-serif;font-size:11pt;">
  <tr>
    <td colspan="8" style="background:#1e1e1c;color:#ffffff;font-size:16pt;font-weight:bold;padding:12px;">
      GUADALUPE MAKE UP <span style="color:#ec71a8;">Rodriguez</span>
    </td>
  </tr>
  <tr>
    <td colspan="8" style="background:#fce3ed;color:#1e1e1c;font-size:11pt;padding:8px;">
      <b>Informe de Servicios</b> &nbsp;·&nbsp; Salón: <b>${esc(salonLabel)}</b> &nbsp;·&nbsp; ${filteredServices.length} servicios &nbsp;·&nbsp; Facturado: <b>S/ ${reportTotalFacturado.toFixed(2)}</b>
    </td>
  </tr>
  <tr>
    <th style="background:#d4af37;color:#1e1e1c;border:1px solid #aa7c11;text-align:center;">Fecha</th>
    <th style="background:#d4af37;color:#1e1e1c;border:1px solid #aa7c11;text-align:center;">Semana</th>
    <th style="background:#d4af37;color:#1e1e1c;border:1px solid #aa7c11;">Servicio</th>
    <th style="background:#d4af37;color:#1e1e1c;border:1px solid #aa7c11;">Salón</th>
    <th style="background:#d4af37;color:#1e1e1c;border:1px solid #aa7c11;text-align:right;">Cobrado (S/)</th>
    <th style="background:#d4af37;color:#1e1e1c;border:1px solid #aa7c11;text-align:center;">Comisión</th>
    <th style="background:#d4af37;color:#1e1e1c;border:1px solid #aa7c11;text-align:right;">Mi Ganancia</th>
    <th style="background:#d4af37;color:#1e1e1c;border:1px solid #aa7c11;text-align:right;">Ganancia Salón</th>
  </tr>
  ${dataRows}
  <tr>
    <td colspan="4" style="background:#f5f3ef;font-weight:bold;text-align:right;border:1px solid #e5e1da;">TOTALES</td>
    <td style="background:#f5f3ef;font-weight:bold;text-align:right;border:1px solid #e5e1da;">S/ ${reportTotalFacturado.toFixed(2)}</td>
    <td style="background:#f5f3ef;border:1px solid #e5e1da;"></td>
    <td style="background:#f5f3ef;font-weight:bold;text-align:right;border:1px solid #e5e1da;color:#ec71a8;">S/ ${reportTotalMyGain.toFixed(2)}</td>
    <td style="background:#f5f3ef;font-weight:bold;text-align:right;border:1px solid #e5e1da;">S/ ${reportTotalSalonGain.toFixed(2)}</td>
  </tr>
</table>
</body>
</html>`;

    const blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `informe_${salonLabel.replace(/\s+/g, '_')}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Excel exportado con el filtro actual', 'info');
  };

  // Mini Calendario

  // Sin sesión válida se muestra la pantalla de ingreso (mismo estilo de la app)
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} checking={authChecking} />;
  }

  return (
    <div className="min-h-screen bg-[#faf5f8] text-[#1e1e1c] flex flex-col md:flex-row antialiased">
      
      {/* TOAST FLOTANTE DE NOTIFICACIONES */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-[60] animate-modal flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl shadow-xl border border-white/60 backdrop-blur-md bg-[#1e1e1c] text-white font-bold text-xs sm:text-sm max-w-[calc(100vw-2.5rem)]">
          <Sparkles className="w-5 h-5 text-[#ecc880] animate-pulse" />
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* ================= PANEL LATERAL (SIDEBAR) ================= */}
      <aside className="hidden md:flex md:w-80 bg-gradient-to-b from-[#b64a83] via-[#9d3f6f] to-[#6f2b4c] border-r border-white/15 p-6 flex-col justify-between shrink-0 shadow-xl shadow-[#933a69]/25 z-20">
        <div>
          {/* CABECERA CON LOGO PRINCIPAL */}
          <div className="flex items-center justify-between md:justify-start pb-6 border-b border-white/20">
            <BrandLogo onDark />
            {/* BOTÓN MENÚ MÓVIL */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl border border-[#ec71a8]/30 bg-[#fce3ed]/50 text-[#1e1e1c]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* INSIGNIA DE ESTILO */}
          <div className="mt-4 px-3.5 py-2 rounded-xl bg-white/15 border border-white/25 flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider uppercase text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#fce3ed]" />
              Control de Ganancias
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white text-[#933a69] shadow-xs">
              PRO
            </span>
          </div>

          {/* MENÚ DE NAVEGACIÓN */}
          <nav className={`mt-6 flex-col gap-2.5 ${mobileMenuOpen ? 'flex' : 'hidden md:flex'}`}>
            
            {/* 1. RESUMEN */}
            <button
              onClick={() => { setActiveTab('resumen'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                activeTab === 'resumen'
                  ? 'bg-white text-[#933a69] shadow-lg shadow-black/25 translate-x-1'
                  : 'text-white/90 hover:bg-white/15 hover:text-white'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeTab === 'resumen' ? 'bg-[#fce3ed] text-[#b64a83]' : 'bg-white/15 text-white'}`}>
                <LayoutDashboard className="w-4 h-4" />
              </div>
              <div className="text-left flex-1">
                <span className="block font-extrabold">Resumen General</span>
                <span className={`text-[11px] block font-medium ${activeTab === 'resumen' ? 'text-[#933a69]/80' : 'text-white/70'}`}>
                  Métricas del mes en curso
                </span>
              </div>
            </button>

            {/* 2. NUEVO REGISTRO (abre la ventana modal superpuesta) */}
            <button
              onClick={openRegistro}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                showRegistroModal
                  ? 'bg-white text-[#933a69] shadow-lg shadow-black/25 translate-x-1'
                  : 'text-white/90 hover:bg-white/15 hover:text-white'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${showRegistroModal ? 'bg-[#fce3ed] text-[#b64a83]' : 'bg-white/15 text-white'}`}>
                <PlusCircle className="w-4 h-4" />
              </div>
              <div className="text-left flex-1">
                <span className="block font-extrabold">Registrar Servicio</span>
                <span className={`text-[11px] block font-medium ${showRegistroModal ? 'text-[#933a69]/80' : 'text-white/70'}`}>
                  Ingreso rápido & cálculo
                </span>
              </div>
            </button>

            {/* 3. INFORMES */}
            <button
              onClick={() => { setActiveTab('informes'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                activeTab === 'informes'
                  ? 'bg-white text-[#933a69] shadow-lg shadow-black/25 translate-x-1'
                  : 'text-white/90 hover:bg-white/15 hover:text-white'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeTab === 'informes' ? 'bg-[#fce3ed] text-[#b64a83]' : 'bg-white/15 text-white'}`}>
                <FileText className="w-4 h-4" />
              </div>
              <div className="text-left flex-1">
                <span className="block font-extrabold">Informes & Edición</span>
                <span className={`text-[11px] block font-medium ${activeTab === 'informes' ? 'text-[#933a69]/80' : 'text-white/70'}`}>
                  Historial, filtros y cambios
                </span>
              </div>
            </button>

            {/* 4. PRODUCTOS (INVENTARIO) */}
            <button
              onClick={() => { setActiveTab('productos'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                activeTab === 'productos'
                  ? 'bg-white text-[#933a69] shadow-lg shadow-black/25 translate-x-1'
                  : 'text-white/90 hover:bg-white/15 hover:text-white'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeTab === 'productos' ? 'bg-[#fce3ed] text-[#b64a83]' : 'bg-white/15 text-white'}`}>
                <Package className="w-4 h-4" />
              </div>
              <div className="text-left flex-1">
                <span className="block font-extrabold">Mis Productos</span>
                <span className={`text-[11px] block font-medium ${activeTab === 'productos' ? 'text-[#933a69]/80' : 'text-white/70'}`}>
                  Inventario y vencimientos
                </span>
              </div>
            </button>

            {/* 5. CONFIGURACIÓN (solo administrador) */}
            {esAdmin && (
              <button
                onClick={() => { setActiveTab('configuracion'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                  activeTab === 'configuracion'
                    ? 'bg-white text-[#933a69] shadow-lg shadow-black/25 translate-x-1'
                    : 'text-white/90 hover:bg-white/15 hover:text-white'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeTab === 'configuracion' ? 'bg-[#fce3ed] text-[#b64a83]' : 'bg-white/15 text-white'}`}>
                  <Settings className="w-4 h-4" />
                </div>
                <div className="text-left flex-1">
                  <span className="block font-extrabold">Configuración</span>
                  <span className={`text-[11px] block font-medium ${activeTab === 'configuracion' ? 'text-[#933a69]/80' : 'text-white/70'}`}>
                    Usuarios y accesos
                  </span>
                </div>
              </button>
            )}

          </nav>
        </div>

        {/* PIE DEL PANEL LATERAL */}
        <div className="hidden md:block pt-6 border-t border-white/20 mt-6">
          {/* Usuario con sesión iniciada + cierre de sesión */}
          <div className="flex items-center gap-3 pb-4">
            <span className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 text-white flex items-center justify-center shrink-0">
              {esAdmin ? <ShieldCheck className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </span>
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold text-white truncate">
                {currentUser ? (currentUser.nombre || currentUser.username) : ''}
              </span>
              <span className="block text-[11px] font-semibold text-white/70 truncate">
                @{currentUser ? currentUser.username : ''} · {esAdmin ? 'Administrador' : 'Maquilladora'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="p-2.5 rounded-xl bg-white/15 border border-white/25 text-white hover:bg-white/25 cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-[#2a1a25]/85 border border-white/10 text-white relative overflow-hidden shadow-md">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#ec71a8]/30 rounded-full blur-xl"></div>
            <div className="flex items-center gap-2 text-[#ecc880] mb-1">
              <Award className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Meta Mensual</span>
            </div>
            <div className="text-xl font-black text-white">
              S/ {goalAmount.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-300 mt-1">
              {monthRemainingGoal > 0 ? `Faltan S/ ${monthRemainingGoal.toFixed(2)} este mes` : '¡Objetivo alcanzado! ✨'}
            </p>
          </div>
        </div>
      </aside>

      {/* ================= CABECERA MÓVIL COMPACTA (logo + selector de mes) ================= */}
      <div className="md:hidden sticky top-0 z-30 bg-[#faf5f8]/95 backdrop-blur-md border-b border-[#ec71a8]/20 px-2.5 py-2 flex items-center justify-between gap-2">
        <button
          onClick={() => setActiveTab('resumen')}
          aria-label="Ir al resumen general"
          className="shrink-0 rounded-2xl cursor-pointer"
        >
          <BrandLogo compact />
        </button>
        <div className="flex items-center gap-1.5 ml-auto min-w-0">

        {activeTab === 'resumen' ? (
          /* Selector compacto de mes: < Octubre 2026 > */
          <div className="flex items-center gap-0.5 bg-white border border-[#f9cee3] rounded-full px-0.5 py-0.5 shadow-xs">
            <button
              onClick={handlePrevDashboardMonth}
              aria-label="Mes anterior"
              className="w-7 h-7 flex items-center justify-center rounded-full text-[#ec71a8] active:bg-[#fce3ed] cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={isViewingCurrentMonth ? undefined : handleCurrentDashboardMonth}
              aria-label={isViewingCurrentMonth ? 'Mes en curso' : 'Volver al mes actual'}
              className={`px-0.5 min-w-0 text-center ${isViewingCurrentMonth ? '' : 'cursor-pointer'}`}
            >
              <span className="block font-extrabold text-[11px] text-[#1e1e1c] capitalize whitespace-nowrap">
                {monthNames[selectedDashboardMonth - 1]} {selectedDashboardYear}
              </span>
              <span className={`block text-[9px] font-bold leading-tight ${isViewingCurrentMonth ? 'text-[#8c8884]' : 'text-[#ec71a8]'}`}>
                {isViewingCurrentMonth ? 'Mes en curso' : 'Volver a hoy'}
              </span>
            </button>
            <button
              onClick={handleNextDashboardMonth}
              aria-label="Mes siguiente"
              className="w-7 h-7 flex items-center justify-center rounded-full text-[#ec71a8] active:bg-[#fce3ed] cursor-pointer shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#ec71a8] text-right">
            {activeTab === 'productos' && 'Mis Productos'}
            {activeTab === 'informes' && 'Informes'}
            {activeTab === 'configuracion' && 'Configuración'}
          </span>
        )}
          {/* BOTON REGISTRAR: solo en Resumen, grande y con resplandor rosa */}
          {activeTab === 'resumen' && (
            <button
              type="button"
              onClick={openRegistro}
              aria-label="Registrar nuevo servicio"
              title="Registrar nuevo servicio"
              className="shrink-0 h-11 w-11 min-[380px]:w-auto min-[380px]:px-4 rounded-full border-0 bg-gradient-to-r from-[#ec71a8] to-[#d95392] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 whitespace-nowrap glow-rose active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4 shrink-0" strokeWidth={3} />
              <span className="hidden min-[380px]:inline">Registrar</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <main className="flex-1 px-3 py-4 sm:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto flex flex-col gap-4 sm:gap-8">

        {/* BARRA DE TÍTULO + CONTROL DE MES (compacta, solo desktop) */}
        {/* min-h para que la caja mida igual en Resumen, Productos e Informes (el título va absoluto) */}
        <header className="hidden md:flex relative items-center justify-center gap-4 min-h-[60px] bg-white/90 backdrop-blur-sm border border-[#ec71a8]/20 rounded-2xl px-5 py-3.5 shadow-sm">
          <h2 className="absolute left-5 text-base lg:text-lg font-extrabold text-[#1e1e1c] tracking-tight">
            {activeTab === 'resumen' && 'Panel de Rendimiento Mensual'}
            {activeTab === 'productos' && 'Registro y Control de Productos'}
            {activeTab === 'informes' && 'Historial, Edición e Informes'}
            {activeTab === 'configuracion' && 'Configuración de Usuarios'}
          </h2>

          {activeTab === 'resumen' ? (
            <div className="flex items-center gap-2 bg-[#fdf2f7] p-1.5 rounded-2xl border border-[#f9cee3] shrink-0 shadow-xs">
              <button
                onClick={handlePrevDashboardMonth}
                className="p-2 rounded-xl bg-white hover:bg-[#fce3ed] text-[#1e1e1c] transition-colors border border-[#f9cee3]/60 shadow-xs cursor-pointer shrink-0"
                title="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-2 py-0.5 flex items-center gap-2 text-center min-w-0">
                <CalendarIcon className="w-4 h-4 text-[#ec71a8] shrink-0" />
                <span className="font-extrabold text-sm text-[#1e1e1c] capitalize whitespace-nowrap">
                  {monthNames[selectedDashboardMonth - 1]} {selectedDashboardYear}
                </span>
                {isViewingCurrentMonth ? (
                  <span className="text-[10px] font-black uppercase bg-[#ec71a8] text-white px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                    Mes en curso
                  </span>
                ) : (
                  <button
                    onClick={handleCurrentDashboardMonth}
                    className="text-[11px] font-bold text-[#ec71a8] hover:underline cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Volver a hoy
                  </button>
                )}
              </div>

              <button
                onClick={handleNextDashboardMonth}
                className="p-2 rounded-xl bg-white hover:bg-[#fce3ed] text-[#1e1e1c] transition-colors border border-[#f9cee3]/60 shadow-xs cursor-pointer shrink-0"
                title="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="ml-auto flex items-center gap-3 shrink-0">
              {activeTab === 'productos' && (
                <span className="text-xs font-bold bg-[#ecc880]/15 text-[#8a5a3e] px-3.5 py-1.5 rounded-xl border border-[#ecc880]/40">
                  {products.length} {products.length === 1 ? 'producto' : 'productos'}
                </span>
              )}
            </div>
          )}
        </header>

        {/* ================= VISTA 1: RESUMEN GENERAL (REINICIO A CERO CADA MES) ================= */}
        {activeTab === 'resumen' && (
          <div className="flex flex-col gap-4 sm:gap-8 animate-in fade-in duration-300">
            
            {/* TARJETAS PRINCIPALES DEL MES — grid compacto de 2 columnas en móvil */}
            <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
              
              {/* 1. MI GANANCIA NETA DEL MES (destacada, ancho completo en móvil) */}
              <div className="card-luxury rounded-3xl p-4 sm:p-6 relative overflow-hidden flex flex-col justify-between min-[360px]:col-span-2 lg:col-span-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#ec71a8]/15 to-transparent rounded-full blur-2xl"></div>
                <div className="flex justify-between items-start gap-2">
                  <span className="min-w-0 leading-tight text-[10px] sm:text-xs font-extrabold uppercase tracking-normal sm:tracking-wider text-[#ec71a8] bg-[#fce3ed] px-2 sm:px-2.5 py-1 rounded-lg border border-[#f9cee3]">
                    Mi Ganancia Neta
                  </span>
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-[#ec71a8] to-[#d95392] text-white flex items-center justify-center shadow-md shadow-[#ec71a8]/30 shrink-0">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                  </div>
                </div>
                <div className="mt-3 sm:mt-5">
                  <div className="text-3xl sm:text-5xl font-black text-[#1e1e1c] tracking-tight whitespace-nowrap">
                    <AnimatedAmount value={monthMyGain} animate={animateCounters} />
                  </div>
                  <div className="mt-2 text-[11px] sm:text-xs font-semibold text-[#6b6764] flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#ec71a8] shrink-0"></span>
                    {monthGoalProgressPct}% de la meta mensual
                  </div>
                </div>
              </div>

              {/* 3. TOTAL FACTURADO EN EL MES */}
              <div className="card-luxury rounded-3xl p-4 sm:p-6 relative overflow-hidden flex flex-col justify-between">
                <div className="flex justify-between items-start gap-2">
                  <span className="min-w-0 leading-tight text-[10px] sm:text-xs font-extrabold uppercase tracking-normal sm:tracking-wider text-[#b8860b] bg-[#fdebdd] px-2 sm:px-2.5 py-1 rounded-lg border border-[#edd5b6]">
                    Total Facturado
                  </span>
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-gold text-white flex items-center justify-center shadow-md shadow-[#d4af37]/30 shrink-0">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                  </div>
                </div>
                <div className="mt-3 sm:mt-5">
                  <div className="text-xl sm:text-4xl font-extrabold text-[#1e1e1c] tracking-tight whitespace-nowrap">
                    <AnimatedAmount value={monthFacturado} animate={animateCounters} />
                  </div>
                  <div className="mt-2 text-[11px] sm:text-xs font-semibold text-[#6b6764]">
                    {monthlyServices.length} {monthlyServices.length === 1 ? 'servicio en el mes' : 'servicios en el mes'}
                  </div>
                </div>
              </div>

              {/* 4. META DEL MES CON BARRA DE PROGRESO */}
              <div className="card-luxury rounded-3xl p-4 sm:p-6 relative overflow-hidden flex flex-col justify-between">
                <div className="flex justify-between items-start gap-2">
                  <span className="min-w-0 leading-tight text-[10px] sm:text-xs font-extrabold uppercase tracking-normal sm:tracking-wider text-[#ec71a8] bg-[#fce3ed] px-2 sm:px-2.5 py-1 rounded-lg border border-[#f9cee3]">
                    Meta<span className="hidden sm:inline"> ({monthNames[selectedDashboardMonth - 1]})</span>
                  </span>
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-[#fdebdd] border border-[#d4af37]/40 text-[#b8860b] flex items-center justify-center shrink-0">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>

                <div className="mt-3 sm:mt-5">
                  <div className="text-sm sm:text-3xl font-black text-[#1e1e1c] leading-tight break-words">
                    {monthRemainingGoal > 0 ? (
                      <span>Faltan <AnimatedAmount value={monthRemainingGoal} animate={animateCounters} /></span>
                    ) : (
                      <span className="text-[#ec71a8] flex flex-wrap items-center gap-1">
                        ¡Meta Cumplida! <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#ecc880] shrink-0" />
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5 sm:mt-3.5 w-full bg-[#fce3ed] h-2.5 sm:h-3.5 rounded-full overflow-hidden p-0.5 border border-[#f9cee3]">
                    <div 
                      className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-[#d4af37] via-[#ec71a8] to-[#d95392]"
                      style={{ width: `${monthGoalProgressPct}%` }}
                    ></div>
                  </div>

                  <div className="mt-1.5 sm:mt-2 flex justify-between text-[10px] sm:text-[11px] font-bold text-[#8c8884]">
                    <span>S/ 0.00</span>
                    <span className="text-[#ec71a8] font-extrabold">{monthGoalProgressPct}%</span>
                    <span>S/ {goalAmount.toFixed(0)}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* SECCIÓN DINÁMICA: EVOLUCIÓN SEMANAL & DESGLOSE POR COMISIÓN */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              
              {/* RENDIMIENTO SEMANAL (SEMANAS 1 A 5) — solo desktop, en móvil se oculta para no alargar el scroll */}
              <div className="hidden lg:flex card-luxury rounded-3xl p-6 lg:col-span-3 flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-[#fce3ed] pb-4 mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#fce3ed] text-[#ec71a8] flex items-center justify-center">
                        <BarChart3 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base sm:text-lg text-[#1e1e1c]">
                          Rendimiento por Semanas - {monthNames[selectedDashboardMonth - 1]}
                        </h3>
                        <p className="text-xs text-[#8c8884]">Distribución de tu ganancia neta durante el mes</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#ec71a8] bg-[#fce3ed] px-3 py-1 rounded-xl">
                      {monthlyServices.length} servicios
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-2 sm:gap-4 items-end h-44 pt-4 pb-2">
                    {Object.entries(weeklyEarnings).map(([weekName, amount]) => {
                      const maxPossible = Math.max(...Object.values(weeklyEarnings), 150);
                      const heightPercent = Math.min(100, Math.max(12, Math.round((amount / maxPossible) * 100)));
                      
                      return (
                        <div key={weekName} className="flex flex-col items-center gap-2 h-full justify-end group">
                          <span className="text-[11px] font-extrabold text-[#1e1e1c] group-hover:text-[#ec71a8] transition-colors">
                            S/ {amount.toFixed(0)}
                          </span>
                          <div className="w-full max-w-[96px] bg-[#fce3ed] rounded-2xl overflow-hidden p-1 flex flex-col justify-end border border-[#f9cee3]/50 h-32">
                            <div 
                              className={`w-full rounded-xl transition-all duration-500 ${
                                amount > 0 
                                  ? 'bg-gradient-to-t from-[#ec71a8] to-[#f9cee3] shadow-sm' 
                                  : 'bg-transparent'
                              }`}
                              style={{ height: `${heightPercent}%` }}
                            ></div>
                          </div>
                          <span className="text-[11px] font-bold text-[#8c8884] group-hover:text-[#1e1e1c] whitespace-nowrap">
                            {weekName.replace('Semana ', 'Sem ')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#fce3ed] flex items-center justify-between text-xs text-[#6b6764]">
                  <span>Semana promedio: <b>S/ {(monthMyGain / 5).toFixed(2)}</b></span>
                  <span className="text-[#ec71a8] font-bold">Total Mes: S/ {monthMyGain.toFixed(2)}</span>
                </div>
              </div>

              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Botones de ganancia neta por salón: al pasar el cursor se iluminan y crecen (.gain-card) */}
                <button
                  type="button"
                  onClick={() => { setFilterFrom(''); setFilterTo(''); setSearchTerm(''); setQuickRange('all'); setFilterSalon('1'); setActiveTab('informes'); }}
                  title="Ver los servicios de Vanidades en Informes"
                  className="gain-card text-left rounded-3xl p-5 sm:p-6 border border-[#f3b4d4] bg-gradient-to-br from-[#fff6fb] to-[#efd3e4] shadow-lg shadow-[#b64a83]/10 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3"><span className="text-xs font-extrabold uppercase tracking-wide text-[#933a69]">Ganancia Neta</span><Store className="w-5 h-5 text-[#b64a83]" /></div>
                  <p className="mt-4 text-sm font-semibold text-[#6b6764]">Salón Vanidades</p><p className="text-3xl font-black text-[#2a1a25]"><AnimatedAmount value={vanidadesNetGain} animate={animateCounters} /></p>
                  <p className="mt-3 text-[11px] font-extrabold text-[#933a69]">Ver en Informes →</p>
                </button>
                <button
                  type="button"
                  onClick={() => { setFilterFrom(''); setFilterTo(''); setSearchTerm(''); setQuickRange('all'); setFilterSalon('2'); setActiveTab('informes'); }}
                  title="Ver los servicios de Maison Studio en Informes"
                  className="gain-card text-left rounded-3xl p-5 sm:p-6 border border-[#eec9a3] bg-gradient-to-br from-[#fffaf4] to-[#f6e9df] shadow-lg shadow-[#c89b6b]/15 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3"><span className="text-xs font-extrabold uppercase tracking-wide text-[#7d4e32]">Ganancia Neta</span><Store className="w-5 h-5 text-[#c89b6b]" /></div>
                  <p className="mt-4 text-sm font-semibold text-[#6b6764]">Maison Studio</p><p className="text-3xl font-black text-[#2a1a25]"><AnimatedAmount value={maisonNetGain} animate={animateCounters} /></p>
                  <p className="mt-3 text-[11px] font-extrabold text-[#7d4e32]">Ver en Informes →</p>
                </button>
                {/* Mis ganancias independientes (entidad propia Rodriguez Makeup, 100%) */}
                <button
                  type="button"
                  onClick={() => { setFilterFrom(''); setFilterTo(''); setSearchTerm(''); setQuickRange('all'); setFilterSalon(String(salonPropio ? salonPropio.id : 3)); setActiveTab('informes'); }}
                  title="Ver mis servicios propios en Informes"
                  className="gain-card text-left rounded-3xl p-5 sm:p-6 border border-[#ec71a8]/45 bg-gradient-to-br from-[#fff6fb] via-[#fdf2f7] to-[#fdebdd] shadow-lg shadow-[#ec71a8]/20 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3"><span className="text-xs font-extrabold uppercase tracking-wide text-[#b64a83]">Ganancia Neta · Propia</span><Sparkles className="w-5 h-5 text-[#ec71a8]" /></div>
                  <p className="mt-4 text-sm font-semibold text-[#6b6764]">{independienteNombre} · Mi entidad propia - 100%</p>
                  <p className="text-3xl font-black text-[#2a1a25]"><AnimatedAmount value={independienteNetGain} animate={animateCounters} /></p>
                  <p className="mt-3 text-[11px] font-extrabold text-[#b64a83]">
                    {independienteServicios.length} {independienteServicios.length === 1 ? 'servicio propio' : 'servicios propios'} · Ver en Informes →
                  </p>
                </button>
              </div>

              {/* Desglose histórico retirado de la interfaz: el resumen prioriza ganancias por salón. */}
              {false && <div className="card-luxury rounded-3xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 border-b border-[#fce3ed] pb-4 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-[#fdebdd] text-[#b8860b] flex items-center justify-center">
                      <Percent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base sm:text-lg text-[#1e1e1c]">
                        Comisiones del Mes
                      </h3>
                      <p className="text-xs text-[#8c8884]">40% Maquillaje · 30% otros · 60% Maison</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    {/* Tarjeta 40% */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#fce3ed]/70 to-[#fff5f8] border border-[#f9cee3] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#ec71a8] text-white font-black text-sm flex items-center justify-center shadow-xs">
                          40%
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#6b6764]">Servicios al 40%</div>
                          <div className="text-lg font-black text-[#1e1e1c]">
                            S/ {gain40.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold bg-white text-[#ec71a8] px-2.5 py-1 rounded-xl border border-[#f9cee3] shadow-2xs">
                        {count40} serv.
                      </span>
                    </div>

                    {/* Tarjeta 30% */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#f5f3ef] to-white border border-[#e5e1da] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#1e1e1c] text-[#ecc880] font-black text-sm flex items-center justify-center shadow-xs">
                          30%
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#6b6764]">Servicios al 30%</div>
                          <div className="text-lg font-black text-[#1e1e1c]">
                            S/ {gain30.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold bg-white text-[#1e1e1c] px-2.5 py-1 rounded-xl border border-[#e5e1da] shadow-2xs">
                        {count30} serv.
                      </span>
                    </div>

                    {/* Tarjeta 60% (Maison Studio) */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#fdebdd]/80 to-white border border-[#edd5b6] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-gold text-white font-black text-sm flex items-center justify-center shadow-xs">
                          60%
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#6b6764]">Servicios al 60% (Maison)</div>
                          <div className="text-lg font-black text-[#1e1e1c]">
                            S/ {gain60.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold bg-white text-[#b8860b] px-2.5 py-1 rounded-xl border border-[#edd5b6] shadow-2xs">
                        {count60} serv.
                      </span>
                    </div>

                    {/* Ticket Promedio */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#fdebdd]/50 to-white border border-[#edd5b6] flex items-center justify-between">
                      <span className="text-xs font-bold text-[#6b6764]">Ticket Promedio:</span>
                      <span className="text-sm font-black text-[#1e1e1c]">
                        S/ {ticketPromedio.toFixed(2)} / servicio
                      </span>
                    </div>
                  </div>
                </div>
              </div>}

            </div>


          </div>
        )}

        {/* ================= VISTA 3: INFORMES Y EDICIÓN COMPLETA ================= */}
        {activeTab === 'informes' && (
          <div className="flex flex-col gap-8 animate-in fade-in duration-300">

            {/* SECCIÓN DE FILTROS */}
            {/* z-10 en móvil: por debajo de la cabecera sticky (z-30); z-30 en escritorio para que los
                desplegables queden por encima de la tabla de historial. */}
            <section className="card-luxury relative z-10 md:z-30 overflow-visible rounded-3xl p-4 sm:p-7 flex flex-col gap-4 sm:gap-5">
              <div className="flex items-center gap-3 border-b border-[#fce3ed] pb-3.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#fce3ed] text-[#ec71a8] flex items-center justify-center shrink-0">
                  <CalendarRange className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-xl font-extrabold text-[#1e1e1c]">
                    Filtros e Historial
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#8c8884]">
                    Rango de fechas, salón o nombre del servicio
                  </p>
                </div>
              </div>

                {/* FILA DE FILTROS: a la izquierda la lista de rangos (histórico, hoy, esta semana...)
                    ocupando la mitad de la página; a la derecha la lista de selección de salones. */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 lg:gap-6 items-start">
                  <div className="w-full">
                    <label className="mb-1.5 block text-[11px] font-bold text-[#6b6764]">Rango de fechas</label>
                    <BrandSelect
                      value={quickRange}
                      onChange={handleQuickFilter}
                      options={rangeOptions}
                      placeholder="Rango de fechas"
                      icon={CalendarRange}
                      buttonClass="shadow-[0_0_18px_rgba(217,70,145,0.16)] border-[#e8a1c6]"
                      trailing={<span className="text-[11px] font-black bg-[#f6e3f0] text-[#b64a83] px-2.5 py-1 rounded-lg border border-[#efd3e4] whitespace-nowrap">{filteredServices.length} serv.</span>}
                    />
                  </div>
                  <div className="w-full">
                    <label className="mb-1.5 block text-[11px] font-bold text-[#6b6764]">Salón / Estudio</label>
                    <SalonSelect
                      value={filterSalon}
                      onChange={(v) => setFilterSalon(v)}
                      salones={salones}
                      allowAll
                      placeholder="Salón"
                    />
                  </div>
                </div>
                {hasActiveFilters && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => { setFilterFrom(''); setFilterTo(''); setSearchTerm(''); setFilterSalon('todos'); setQuickRange('all'); }}
                      className="px-3.5 py-2 bg-white hover:bg-[#fce3ed] text-[#ec71a8] rounded-xl text-[11px] sm:text-xs font-extrabold flex items-center gap-1.5 cursor-pointer border border-[#f9cee3] transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Limpiar
                    </button>
                  </div>
                )}

                {/* INPUTS COMPACTOS: DESDE / HASTA / SERVICIO */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#6b6764]">Desde</label>
                    <BrandDateField
                      ariaLabel="Fecha desde"
                      align="left"
                      placeholder="Desde"
                      value={filterFrom}
                      onChange={(v) => { setFilterFrom(v); setQuickRange('custom'); }}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#6b6764]">Hasta</label>
                    <BrandDateField
                      ariaLabel="Fecha hasta"
                      align="right"
                      placeholder="Hasta"
                      value={filterTo}
                      onChange={(v) => { setFilterTo(v); setQuickRange('custom'); }}
                    />
                  </div>

                  <div className="flex flex-col gap-1 col-span-2 lg:col-span-1">
                    <label className="text-[11px] font-bold text-[#6b6764]">Servicio</label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8c8884] pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Nombre del servicio"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full field-uniform pl-11 pr-10 sm:pl-12 sm:pr-11 border border-[#f9cee3] rounded-2xl text-sm font-semibold outline-none bg-white focus:border-[#ec71a8]"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          aria-label="Borrar búsqueda"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c8884] hover:text-[#1e1e1c] text-xs font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
            </section>

            {/* METRICAS FILTRADAS (solo cuando hay un filtro aplicado) */}
            {hasActiveFilters ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 animate-modal">
                <div className="card-luxury rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] sm:text-xs font-bold text-[#8c8884] uppercase">Mi Ganancia Filtrada</div>
                    <div className="text-xl sm:text-2xl font-black text-[#ec71a8] whitespace-nowrap">
                      S/ {reportTotalMyGain.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold bg-[#fce3ed] text-[#ec71a8] px-2.5 py-1.5 rounded-xl whitespace-nowrap shrink-0">
                    {filteredServices.length} serv.
                  </div>
                </div>

                <div className="card-luxury rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] sm:text-xs font-bold text-[#8c8884] uppercase">Ganancia Salón Filtrada</div>
                    <div className="text-xl sm:text-2xl font-black text-[#1e1e1c] whitespace-nowrap">
                      S/ {reportTotalSalonGain.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold bg-[#fdebdd] text-[#b8860b] px-2.5 py-1.5 rounded-xl shrink-0">
                    Salón
                  </div>
                </div>

                <div className="card-luxury rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] sm:text-xs font-bold text-[#8c8884] uppercase">Facturación Total Filtrada</div>
                    <div className="text-xl sm:text-2xl font-black text-[#b8860b] whitespace-nowrap">
                      S/ {reportTotalFacturado.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold bg-[#f5f3ef] text-[#6b6764] px-2.5 py-1.5 rounded-xl shrink-0">
                    Bruto
                  </div>
                </div>
              </div>
            ) : null}

            {/* TABLA PRINCIPAL DE HISTORIAL CON BOTÓN DE EDITAR AL COSTADO DE ELIMINAR */}
            <section className="card-luxury rounded-3xl p-4 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#1e1e1c]">
                    Historial Completo de Servicios
                  </h3>
                  <p className="text-xs sm:text-sm text-[#8c8884]">
                    Puedes editar los datos o eliminar registros directamente desde la columna de acciones
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={handleExportCSV}
                    disabled={filteredServices.length === 0}
                    className="px-4 py-2 rounded-xl bg-[#1e1e1c] text-[#ecc880] hover:bg-[#2c2b28] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Exportar CSV
                  </button>
                  <button
                    onClick={handleExportExcel}
                    disabled={filteredServices.length === 0}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ec71a8] to-[#d95392] text-white hover:opacity-95 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Exportar Excel
                  </button>
                </div>
              </div>

              <div className="hidden md:block overflow-x-auto rounded-2xl border border-[#fce3ed]">
                <table className="w-full text-left border-collapse min-w-[750px]">
                  <thead>
                    <tr className="bg-[#1e1e1c] text-white text-xs font-black uppercase tracking-wider">
                      <th className="p-3 sm:p-4">Fecha</th>
                      <th className="p-3 sm:p-4">Semana</th>
                      <th className="p-3 sm:p-4">Servicio</th>
                      <th className="p-3 sm:p-4">Salón</th>
                      <th className="p-3 sm:p-4">Precio Total</th>
                      <th className="p-3 sm:p-4">Comisión</th>
                      <th className="p-3 sm:p-4">Mi Ganancia</th>
                      <th className="p-3 sm:p-4">Ganancia Salón</th>
                      <th className="p-3 sm:p-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#fce3ed] text-sm bg-white">
                    {paginatedServices.length > 0 ? (
                      paginatedServices.map((item) => (
                        <tr key={item.id} className="hover:bg-[#fff5f8] transition-colors">
                          <td className="p-3 sm:p-4 whitespace-nowrap font-bold text-[#1e1e1c]">{item.date}</td>
                          <td className="p-3 sm:p-4 whitespace-nowrap text-[#8c8884] font-semibold">{item.week}</td>
                          <td className="p-3 sm:p-4 whitespace-nowrap font-extrabold text-[#1e1e1c]">
                            {item.service}
                          </td>
                          <td className="p-3 sm:p-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#f5f3ef] text-[#6b6764] border border-[#e5e1da]">
                              {salonNombre(item.salon_id)}
                            </span>
                          </td>
                          <td className="p-3 sm:p-4 whitespace-nowrap font-bold text-[#1e1e1c]">
                            S/ {item.price.toFixed(2)}
                          </td>
                          <td className="p-3 sm:p-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${
                              item.commission === 40
                                ? 'bg-[#fce3ed] text-[#ec71a8] border-[#f9cee3]'
                                : 'bg-[#fdebdd] text-[#b8860b] border-[#edd5b6]'
                            }`}>
                              {item.commission}%
                            </span>
                          </td>
                          <td className="p-3 sm:p-4 whitespace-nowrap font-black text-[#ec71a8] text-base">
                            S/ {item.myGain.toFixed(2)}
                          </td>
                          <td className="p-3 sm:p-4 whitespace-nowrap font-semibold text-[#6b6764]">
                            S/ {item.salongain.toFixed(2)}
                          </td>
                          <td className="p-3 sm:p-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              
                              {/* BOTÓN DE EDITAR (AL COSTADO DEL BOTÓN DE ELIMINAR) */}
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-2 bg-[#fdebdd]/80 hover:bg-[#fdebdd] text-[#b8860b] rounded-xl border border-[#edd5b6] transition-all cursor-pointer shadow-xs hover:scale-105 flex items-center gap-1 text-xs font-bold"
                                title="Editar este servicio"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>Editar</span>
                              </button>

                              {/* BOTÓN DE ELIMINAR */}
                              <button
                                onClick={() => handleDeleteService(item.id)}
                                className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200 transition-all cursor-pointer shadow-xs hover:scale-105 flex items-center gap-1 text-xs font-bold"
                                title="Eliminar este servicio"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Eliminar</span>
                              </button>

                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="p-10 text-center text-[#8c8884]">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <AlertCircle className="w-8 h-8 text-[#ec71a8]/40" />
                            <span className="font-bold text-[#1e1e1c]">No se encontraron servicios en el filtro seleccionado.</span>
                            <button
                              onClick={() => { setFilterFrom(''); setFilterTo(''); setSearchTerm(''); setFilterSalon('todos'); setQuickRange('all'); }}
                              className="mt-2 text-xs text-[#ec71a8] font-extrabold hover:underline cursor-pointer"
                            >
                              Restablecer todos los filtros
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* TARJETAS MÓVIL: HISTORIAL */}
              <div className="md:hidden flex flex-col gap-3">
                {paginatedServices.length > 0 ? (
                  paginatedServices.map((item) => (
                    <div key={item.id} className="rounded-2xl bg-white border border-[#fce3ed] p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold text-[#6b6764]">{item.date} · {item.week}</span>
                        <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-[#f5f3ef] text-[#6b6764] border border-[#e5e1da]">
                          {salonNombre(item.salon_id)}
                        </span>
                      </div>
                      <div className="font-extrabold text-[#1e1e1c] mb-3">{item.service}</div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-[#8c8884] font-medium">Cobrado</span>
                        <span className="font-bold text-[#1e1e1c]">S/ {item.price.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-[#8c8884] font-medium">Comisión</span>
                        <span className="font-black text-[#ec71a8]">{item.commission}%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#8c8884] font-medium">Mi Ganancia</span>
                        <span className="font-black text-[#ec71a8] text-base">S/ {item.myGain.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1 pt-2 border-t border-[#fce3ed]">
                        <span className="text-[#8c8884] font-medium">Ganancia Salón</span>
                        <span className="font-semibold text-[#6b6764]">S/ {item.salongain.toFixed(2)}</span>
                      </div>
                      <div className="flex gap-2 mt-3 pt-3 border-t border-[#fce3ed]">
                        <button onClick={() => handleOpenEdit(item)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#fdebdd] text-[#b8860b] border border-[#edd5b6] font-bold text-xs">
                          <Pencil className="w-3.5 h-3.5" /> Editar
                        </button>
                        <button onClick={() => handleDeleteService(item.id)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 font-bold text-xs">
                          <Trash2 className="w-3.5 h-3.5" /> Eliminar
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-white border border-[#fce3ed] p-6 text-center">
                    <AlertCircle className="w-8 h-8 text-[#ec71a8]/40 mx-auto mb-2" />
                    <span className="font-bold text-[#1e1e1c] text-sm">No se encontraron servicios en el filtro seleccionado.</span>
                    <button onClick={() => { setFilterFrom(''); setFilterTo(''); setSearchTerm(''); setFilterSalon('todos'); }} className="mt-2 text-xs text-[#ec71a8] font-extrabold">
                      Restablecer todos los filtros
                    </button>
                  </div>
                )}
              </div>

              {/* CONTROLES DE PAGINACIÓN EN LA PARTE INFERIOR */}
              {filteredServices.length > itemsPerPage && (
                <div className="flex flex-col items-center justify-center gap-3 mt-6 pt-5 border-t border-[#fce3ed]">
                  <div className="text-xs text-[#8c8884] font-medium">
                    Mostrando <span className="font-bold text-[#1e1e1c]">{(reportPage - 1) * itemsPerPage + 1}</span> a <span className="font-bold text-[#1e1e1c]">{Math.min(reportPage * itemsPerPage, filteredServices.length)}</span> de <span className="font-bold text-[#1e1e1c]">{filteredServices.length}</span> servicios
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-[#efd3e4] bg-[#fff9fc] p-1.5 shadow-sm">
                    <button onClick={() => setReportPage(1)} disabled={reportPage === 1} className="hidden sm:block px-2.5 py-2 rounded-xl text-xs font-bold text-[#933a69] disabled:opacity-35">Inicio</button>
                    {/* Botón Página Anterior */}
                    <button
                      onClick={() => setReportPage((prev) => Math.max(prev - 1, 1))}
                      disabled={reportPage === 1}
                      className={`px-3 sm:px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                        reportPage === 1
                          ? 'opacity-40 cursor-not-allowed border-[#fce3ed] text-[#8c8884]'
                          : 'bg-white hover:bg-[#fce3ed] border-[#f9cee3] text-[#1e1e1c] cursor-pointer shadow-xs hover:scale-105'
                      }`}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Anterior</span>
                    </button>

                    {/* Botones Numéricos de Página */}
                    <div className="flex items-center gap-1.5">
                      {visibleReportPages.map((pageNum, index) => pageNum === '…' ? (
                        <span key={`ellipsis-${index}`} className="w-5 text-center text-xs font-bold text-[#8c8884]">…</span>
                      ) : (
                        <button key={pageNum} onClick={() => setReportPage(pageNum)} className={`w-8 h-8 rounded-xl font-black text-xs transition-all cursor-pointer ${reportPage === pageNum ? 'bg-gradient-to-tr from-[#b64a83] to-[#933a69] text-white shadow-md shadow-[#b64a83]/25' : 'bg-white hover:bg-[#f6e3f0] text-[#6b6764] border border-[#efd3e4]'}`}>{pageNum}</button>
                      ))}
                    </div>

                    {/* Botón Página Siguiente */}
                    <button
                      onClick={() => setReportPage((prev) => Math.min(prev + 1, totalReportPages))}
                      disabled={reportPage === totalReportPages}
                      className={`px-3 sm:px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                        reportPage === totalReportPages
                          ? 'opacity-40 cursor-not-allowed border-[#fce3ed] text-[#8c8884]'
                          : 'bg-white hover:bg-[#fce3ed] border-[#f9cee3] text-[#1e1e1c] cursor-pointer shadow-xs hover:scale-105'
                      }`}
                    >
                      <span className="hidden sm:inline">Siguiente</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setReportPage(totalReportPages)} disabled={reportPage === totalReportPages} className="hidden sm:block px-2.5 py-2 rounded-xl text-xs font-bold text-[#933a69] disabled:opacity-35">Último</button>
                  </div>
                </div>
              )}
            </section>

          </div>
        )}

      
        {activeTab === 'productos' && (
          <section className="flex flex-col gap-6">
            <div className="md:hidden rounded-3xl bg-white border border-[#efd3e4] p-5 shadow-lg shadow-[#b64a83]/10">
              <div className="mb-4">
                <h3 className="text-lg font-extrabold text-[#2a1a25]">Productos</h3>
                <p className="text-xs text-[#6b6764]">Gestiona tu inventario desde acciones simples.</p>
              </div>
              <div className="flex flex-col gap-3">
                <button type="button" onClick={openProducto} className="glow-pulse-strong w-full min-h-12 rounded-2xl border-0 bg-gradient-to-r from-[#d94691] to-[#9333ea] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_0_22px_rgba(217,70,145,0.55)]"><Plus className="w-4 h-4" strokeWidth={3} />Registrar productos</button>
                <button type="button" onClick={openProductsList} className="w-full min-h-12 rounded-2xl border border-[#efd3e4] bg-[#fff9fc] text-[#933a69] font-extrabold text-sm flex items-center justify-center gap-2"><Package className="w-4 h-4" />Ver mis productos <span className="rounded-full bg-[#efd3e4] px-2 py-0.5 text-[10px]">{products.length}</span></button>
              </div>
            </div>
            {/* Inventario integrado a la paleta clara de la aplicación. */}
            <div className="hidden md:block rounded-3xl p-4 sm:p-8 bg-white border border-[#efd3e4] shadow-lg shadow-[#b64a83]/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#f6e3f0] border border-[#efd3e4] flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-[#b64a83]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-[#2a1a25]">Mis Productos</h3>
                    <p className="text-xs text-[#6b6764] font-medium">
                      {products.length} producto{products.length === 1 ? '' : 's'} registrado{products.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8c8884] pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre..."
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        fetchProducts(e.target.value, productStatusFilter);
                      }}
                      className="pl-11 pr-4 py-2.5 rounded-2xl border border-[#efd3e4] text-sm font-medium bg-[#fff9fc] text-[#2a1a25] placeholder-[#8c8884] outline-none focus:border-[#b64a83] focus:ring-2 focus:ring-[#b64a83]/15 w-full sm:w-56"
                    />
                  </div>
                  <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#fff9fc] border border-[#efd3e4]">
                    <button
                      onClick={() => setProductStatusFilter('activo')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        productStatusFilter === 'activo' ? 'bg-[#b64a83] text-white shadow-sm' : 'text-[#6b6764] hover:text-[#b64a83]'
                      }`}
                    >
                      🟢 Activos
                    </button>
                    <button
                      onClick={() => setProductStatusFilter('terminado')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        productStatusFilter === 'terminado' ? 'bg-[#b64a83] text-white shadow-sm' : 'text-[#6b6764] hover:text-[#b64a83]'
                      }`}
                    >
                      ⚫ Terminados
                    </button>
                    <button
                      onClick={() => setProductStatusFilter('todos')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        productStatusFilter === 'todos' ? 'bg-[#b64a83] text-white shadow-sm' : 'text-[#6b6764] hover:text-[#b64a83]'
                      }`}
                    >
                      Todos
                    </button>
                  </div>
                  <button
                    onClick={openProducto}
                    className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border-0 bg-gradient-to-r from-[#d94691] to-[#9333ea] text-white font-extrabold text-xs shadow-[0_0_20px_rgba(217,70,145,0.45)] glow-pulse-strong hover:opacity-95 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 shrink-0" strokeWidth={3} />
                    Registrar productos
                  </button>
                </div>
              </div>

              {productLoading ? (
                <div className="py-12 text-center text-[#8c8884] text-sm font-medium">Cargando productos...</div>
              ) : products.length === 0 ? (
                <div className="py-12 text-center">
                  <Package className="w-12 h-12 text-[#b64a83]/30 mx-auto mb-3" />
                  <p className="text-sm text-[#8c8884] font-medium">
                    {productSearch ? 'No se encontraron productos con ese nombre.' : 'Aún no tienes productos registrados.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {paginatedProducts.map((p) => {
                    const isTerminated = p.status === 'terminado';
                    // Products terminados no participan en el semáforo de vencimiento
                    const state = isTerminated
                      ? { color: 'gray', label: 'Terminado / Agotado', days: null }
                      : getExpirationState(p.expiration_date);
                    const colorMap = {
                      green: { bg: 'bg-emerald-500/10', text: 'text-emerald-700', border: 'border-emerald-500/30', dot: 'bg-emerald-500' },
                      yellow: { bg: 'bg-amber-500/10', text: 'text-amber-700', border: 'border-amber-500/30', dot: 'bg-amber-500' },
                      red: { bg: 'bg-rose-500/10', text: 'text-rose-700', border: 'border-rose-500/30', dot: 'bg-rose-500' },
                      gray: { bg: 'bg-slate-500/10', text: 'text-slate-600', border: 'border-slate-500/30', dot: 'bg-slate-500' },
                    };
                    const c = colorMap[state.color];
                    return (
                      <div key={p.id} className={`relative rounded-2xl border ${c.border} bg-[#fff9fc] p-5 transition-all hover:border-[#b64a83]/45 hover:shadow-lg hover:shadow-[#b64a83]/10 ${isTerminated ? 'opacity-70 grayscale-[35%]' : ''}`}>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h4 className={`font-extrabold text-base leading-tight flex-1 ${isTerminated ? 'text-[#8c8884] line-through' : 'text-[#2a1a25]'}`}>{p.name}</h4>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${c.bg} ${c.text} text-[10px] font-extrabold uppercase tracking-wider border ${c.border}`}>
                            <span className={`w-2 h-2 rounded-full ${c.dot}`}></span>
                            {isTerminated ? 'Terminado' : ''}
                            {!isTerminated && state.color === 'green' && 'Vigente'}
                            {!isTerminated && state.color === 'yellow' && 'Por vencer'}
                            {!isTerminated && state.color === 'red' && 'Caducado'}
                            {!isTerminated && state.color === 'gray' && 'Sin fecha'}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-[#6b6764] font-medium">
                          <div className="flex items-center justify-between">
                            <span className="text-[#b9b3a6]">Cantidad:</span>
                            <span className="font-bold text-[#2a1a25]">{isTerminated ? 0 : p.quantity}</span>
                          </div>
                          {p.price > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-[#b9b3a6]">Precio:</span>
                            <span className="font-bold text-[#933a69]">S/ {Number(p.price).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-[#b9b3a6]">Compra:</span>
                            <span className="font-bold text-[#2a1a25]">{p.purchase_date}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#b9b3a6]">Caducidad:</span>
                            <span className="font-bold text-[#2a1a25]">{p.expiration_date}</span>
                          </div>
                          <div className="flex items-center justify-between pt-1.5 border-t border-[#ecc880]/15">
                            <span className="text-[#b9b3a6]">Apertura:</span>
                            <span className={`font-bold ${p.start_date ? 'text-[#2a1a25]' : 'text-[#8c8884] italic'}`}>
                              {p.start_date || 'Sin abrir'}
                            </span>
                          </div>
                        </div>

                        <div className={`mt-3 text-[11px] font-bold ${c.text}`}>
                          {isTerminated ? '⚠️ Terminado / Agotado — fuera del semáforo de vencimiento' : state.label}
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-[#efd3e4]">
                          {!isTerminated && !p.start_date && (
                            <button
                              onClick={() => handleOpenToday(p.id)}
                              className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#f6e3f0] border border-[#efd3e4] text-[#933a69] hover:bg-[#efd3e4] font-bold text-xs transition-colors cursor-pointer"
                              title="Marca este producto como abierto hoy"
                            >
                              <CalendarCheck className="w-3.5 h-3.5" />
                              Abrir Hoy
                            </button>
                          )}
                          {!isTerminated && (
                            <button
                              onClick={() => handleFinishProduct(p.id)}
                              className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#efd3e4] text-[#933a69] hover:bg-[#fff9fc] font-bold text-xs transition-colors cursor-pointer"
                              title="Marcar este producto como terminado/agotado"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Terminado
                            </button>
                          )}
                          {isTerminated && (
                            <button
                              onClick={() => handleReactivateProduct(p.id)}
                              className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-400/40 text-emerald-700 hover:bg-emerald-500/20 font-bold text-xs transition-colors cursor-pointer"
                              title="Volver a activar este producto"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Reactivar
                            </button>
                          )}
                          <button
                            onClick={() => openEditProduct(p)}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#efd3e4] text-[#933a69] hover:bg-[#fff9fc] font-bold text-xs transition-colors cursor-pointer"
                            title="Editar producto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="md:hidden">Editar</span>
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-rose-400/40 text-rose-700 hover:bg-rose-500/10 font-bold text-xs transition-colors cursor-pointer"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="md:hidden">Eliminar</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* PAGINACIÓN DEL INVENTARIO (mismo modelo de botones que Informes) */}
              {products.length > productsPerPage && (
                <div className="flex flex-col items-center justify-center gap-3 mt-6 pt-5 border-t border-[#efd3e4]">
                  <div className="text-xs text-[#8c8884] font-medium">
                    Mostrando <span className="font-bold text-[#2a1a25]">{(productPage - 1) * productsPerPage + 1}</span> a <span className="font-bold text-[#2a1a25]">{Math.min(productPage * productsPerPage, products.length)}</span> de <span className="font-bold text-[#2a1a25]">{products.length}</span> productos
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-[#efd3e4] bg-[#fff9fc] p-1.5 shadow-sm">
                    <button onClick={() => setProductPage(1)} disabled={productPage === 1} className="hidden sm:block px-2.5 py-2 rounded-xl text-xs font-bold text-[#933a69] disabled:opacity-35 cursor-pointer">Inicio</button>
                    {/* Página anterior */}
                    <button
                      onClick={() => setProductPage((prev) => Math.max(prev - 1, 1))}
                      disabled={productPage === 1}
                      className={`px-3 sm:px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                        productPage === 1
                          ? 'opacity-40 cursor-not-allowed border-[#efd3e4] text-[#8c8884]'
                          : 'bg-white hover:bg-[#f6e3f0] border-[#efd3e4] text-[#2a1a25] cursor-pointer shadow-xs hover:scale-105'
                      }`}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Anterior</span>
                    </button>

                    {/* Números de página */}
                    <div className="flex items-center gap-1.5">
                      {visibleProductPages.map((pageNum, index) => pageNum === '…' ? (
                        <span key={`product-ellipsis-${index}`} className="w-5 text-center text-xs font-bold text-[#8c8884]">…</span>
                      ) : (
                        <button key={pageNum} onClick={() => setProductPage(pageNum)} className={`w-8 h-8 rounded-xl font-black text-xs transition-all cursor-pointer ${productPage === pageNum ? 'bg-gradient-to-tr from-[#b64a83] to-[#933a69] text-white shadow-md shadow-[#b64a83]/25' : 'bg-white hover:bg-[#f6e3f0] text-[#6b6764] border border-[#efd3e4]'}`}>{pageNum}</button>
                      ))}
                    </div>

                    {/* Página siguiente */}
                    <button
                      onClick={() => setProductPage((prev) => Math.min(prev + 1, totalProductPages))}
                      disabled={productPage === totalProductPages}
                      className={`px-3 sm:px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                        productPage === totalProductPages
                          ? 'opacity-40 cursor-not-allowed border-[#efd3e4] text-[#8c8884]'
                          : 'bg-white hover:bg-[#f6e3f0] border-[#efd3e4] text-[#2a1a25] cursor-pointer shadow-xs hover:scale-105'
                      }`}
                    >
                      <span className="hidden sm:inline">Siguiente</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setProductPage(totalProductPages)} disabled={productPage === totalProductPages} className="hidden sm:block px-2.5 py-2 rounded-xl text-xs font-bold text-[#933a69] disabled:opacity-35 cursor-pointer">Último</button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ================= VISTA 4: CONFIGURACIÓN (SOLO ADMINISTRADOR) ================= */}
        {esAdmin && activeTab === 'configuracion' && (
          <ConfiguracionPanel
            usuario={currentUser}
            usuarios={usuarios}
            cargando={usuariosCargando}
            onCrear={crearUsuario}
            onActualizar={actualizarUsuario}
            onEliminar={eliminarUsuario}
            onRecargar={cargarUsuarios}
            onCerrarSesion={handleLogout}
            onCambiarClave={cambiarClavePropia}
          />
        )}

</main>

        {/* ================= MODAL: REGISTRAR SERVICIO (overlay + backdrop blur) ================= */}
        {showRegistroModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e1e1c]/60 backdrop-blur-md p-3 sm:p-4"
            onClick={closeRegistro}
          >
            <section
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-2xl md:max-w-4xl xl:max-w-5xl max-h-[92vh] rounded-3xl shadow-2xl border border-[#f9cee3] flex flex-col overflow-hidden animate-modal"
            >
              {/* Cabecera fija; la X queda siempre en la esquina superior derecha. */}
              <div className="shrink-0 flex items-center justify-between gap-3 border-b border-[#fce3ed] px-4 py-3.5 sm:px-8 sm:py-5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="min-w-0">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-[#1e1e1c] truncate">Registrar Servicio</h3>
                    <p className="text-[11px] sm:text-sm text-[#8c8884] truncate">Comisión automática según salón y servicio</p>
                  </div>
                </div>
                <button type="button" onClick={closeRegistro} aria-label="Cerrar registro de servicio" className="p-2 rounded-xl bg-[#fce3ed] text-[#1e1e1c] hover:bg-[#f9cee3] cursor-pointer shrink-0"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-8 sm:py-7 flex flex-col gap-4 sm:gap-6">
                  {/* En escritorio: Salón · Fecha · Servicio (ancho) en la primera fila,
                      Precio · Comisión (ancho) en la segunda. Campos amplios y aireados. */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

                    {/* 0. SALÓN / ESTUDIO (obligatorio) */}
                    <div className="flex flex-col gap-2">
                      <label className="min-h-10 text-[11px] sm:text-[13px] font-bold uppercase tracking-wider text-[#4a4744] flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-[#ec71a8] shrink-0" />
                        Salón / Estudio
                      </label>
                      <SalonSelect
                        value={regSalonId}
                        onChange={(v) => handleRegSalonChange(v)}
                        salones={salones}
                      />
                    </div>

                    {/* 1. FECHA */}
                    <div className="flex flex-col gap-2">
                      <label className="min-h-10 text-[11px] sm:text-[13px] font-bold uppercase tracking-wider text-[#4a4744] flex items-center gap-1.5">
                        <CalendarIcon className="w-4 h-4 text-[#ec71a8] shrink-0" />
                        Fecha del Servicio
                      </label>
                      <BrandDateField
                        ariaLabel="Fecha del servicio"
                        align="left"
                        placeholder="Elegir fecha"
                        value={regDate}
                        onChange={(v) => setRegDate(v || todayYMD)}
                      />
                    </div>

                    {/* 2. SERVICIO REALIZADO */}
                    <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-2">
                      <label className="min-h-10 text-[11px] sm:text-[13px] font-bold uppercase tracking-wider text-[#4a4744] flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#ec71a8] shrink-0" />
                        Servicio Realizado
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Maquillaje Social"
                        value={regService}
                        onChange={(e) => handleRegServiceChange(e.target.value)}
                        disabled={esMaison(regSalonId)}
                        className="field-uniform border border-[#f9cee3] rounded-2xl text-sm font-semibold outline-none focus:border-[#ec71a8] focus:ring-3 focus:ring-[#ec71a8]/15 bg-[#faf5f8] focus:bg-white transition-all disabled:bg-[#fce3ed]/60 disabled:text-[#8c8884] disabled:cursor-not-allowed"
                        required
                      />
                      {esMaison(regSalonId) && (
                        <span className="text-[11px] font-bold text-[#ec71a8]">
                          Maison Studio solo permite Maquillaje
                        </span>
                      )}
                    </div>

                    {/* 3. PRECIO COBRADO */}
                    <div className="flex flex-col gap-2 lg:col-span-2">
                      <label className="min-h-10 text-[11px] sm:text-[13px] font-bold uppercase tracking-wider text-[#4a4744] flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-[#ec71a8] shrink-0" />
                        Precio Cobrado (S/)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={regPrice}
                        onChange={(e) => setRegPrice(e.target.value)}
                        className="field-uniform border border-[#f9cee3] rounded-2xl text-sm font-bold outline-none focus:border-[#ec71a8] focus:ring-3 focus:ring-[#ec71a8]/15 bg-[#faf5f8] focus:bg-white transition-all"
                        required
                      />
                    </div>

                    {/* 4. COMISIÓN (autocompletada, ajustable) */}
                    <div className="flex flex-col gap-2 lg:col-span-2">
                      <label className="min-h-10 text-[11px] sm:text-[13px] font-bold uppercase tracking-wider text-[#4a4744] flex items-center gap-1.5">
                        <Percent className="w-4 h-4 text-[#ec71a8] shrink-0" />
                        Comisión (% Mi Ganancia)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={regCommission}
                        onChange={(e) => setRegCommission(Number(e.target.value) || 0)}
                        disabled={esPropio(regSalonId)}
                        className="field-uniform border border-[#f9cee3] rounded-2xl text-sm font-bold outline-none focus:border-[#ec71a8] focus:ring-3 focus:ring-[#ec71a8]/15 bg-[#faf5f8] focus:bg-white transition-all disabled:bg-[#fce3ed]/60 disabled:text-[#8c8884] disabled:cursor-not-allowed"
                        required
                      />
                      <span className={`text-[11px] font-semibold ${esPropio(regSalonId) ? 'font-bold text-[#933a69]' : 'text-[#8c8884]'}`}>
                        {esPropio(regSalonId)
                          ? '🔒 Mi entidad propia - 100%'
                          : esMaison(regSalonId)
                            ? 'Auto: Maison Studio · Maquillaje 60%'
                            : 'Auto: Maquillaje 40% · otros servicios 30%'}
                      </span>
                    </div>

                  </div>

                  {/* Los servicios se registran de uno en uno para mantener el formulario claro. */}
                  {false && <div className="rounded-2xl border border-dashed border-[#f9cee3] bg-[#fff9fb] p-3 sm:p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#ec71a8]" />
                        <span className="text-xs sm:text-sm font-extrabold text-[#1e1e1c]">Servicios extra (misma clienta)</span>
                        {extraItems.length > 0 && (
                          <span className="text-[10px] font-black bg-[#fce3ed] text-[#ec71a8] border border-[#f9cee3] px-2 py-0.5 rounded-full">
                            {extraItems.length}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={addExtraItem}
                        className="px-3 py-2 rounded-xl bg-white border border-[#f9cee3] text-[#ec71a8] hover:bg-[#fce3ed] font-extrabold text-[11px] sm:text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Añadir servicio
                      </button>
                    </div>

                    {extraItems.length === 0 ? (
                      <p className="text-[11px] text-[#8c8884] font-medium">
                        Si la clienta lleva más de un servicio, añádelos aquí: se guardan juntos con la misma fecha y salón.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        {extraItems.map((it, idx) => (
                          <div key={it.key} className="relative grid grid-cols-2 sm:grid-cols-[1fr_7rem_6rem] gap-2 items-end bg-white border border-[#f9cee3] rounded-2xl p-2.5 pr-12">
                            <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-[#4a4744]">
                                Servicio {idx + 2}
                              </label>
                              <input
                                type="text"
                                value={it.service}
                                onChange={(e) => handleExtraServiceChange(it.key, e.target.value)}
                                disabled={esMaison(regSalonId)}
                                placeholder="Ej. Pestañas"
                                className="p-2.5 border border-[#f9cee3] rounded-xl text-sm font-semibold outline-none focus:border-[#ec71a8] bg-[#faf5f8] focus:bg-white transition-all disabled:bg-[#fce3ed]/60 disabled:text-[#8c8884]"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-[#4a4744]">Precio S/</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={it.price}
                                onChange={(e) => updateExtraItem(it.key, { price: e.target.value })}
                                placeholder="0.00"
                                className="p-2.5 border border-[#f9cee3] rounded-xl text-sm font-bold outline-none focus:border-[#ec71a8] bg-[#faf5f8] focus:bg-white transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-[#4a4744]">Comisión %</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                value={it.commission}
                                onChange={(e) => updateExtraItem(it.key, { commission: Number(e.target.value) || 0 })}
                                className="p-2.5 border border-[#f9cee3] rounded-xl text-sm font-bold outline-none focus:border-[#ec71a8] bg-[#faf5f8] focus:bg-white transition-all"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeExtraItem(it.key)}
                              title="Quitar servicio extra"
                              aria-label="Quitar servicio extra"
                              className="absolute right-2 bottom-2 p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-[#6b6764] px-1">
                          <span>{extraItems.length} extra{extraItems.length === 1 ? '' : 's'} · Total S/ {extraTotal.toFixed(2)}</span>
                          <span className="text-[#ec71a8]">Mi ganancia extra: S/ {extraMyGain.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>}

                  {/* VISTA PREVIA DEL CÁLCULO EN VIVO (suma del servicio principal + extras) */}
                  {livePrice > 0 && (
                    <div className="bg-gradient-to-r from-[#fff5f8] via-[#fdf2f7] to-[#fdebdd]/40 border border-[#f9cee3] rounded-2xl p-3.5 sm:p-5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#ec71a8]" />
                        <span className="font-extrabold text-xs sm:text-sm text-[#1e1e1c]">
                          Cálculo en Tiempo Real:
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm">
                        <div>
                          <span className="text-[#8c8884] font-medium">Total: </span>
                          <span className="font-extrabold text-[#1e1e1c]">S/ {livePrice.toFixed(2)}</span>
                        </div>
                        <div className="bg-[#ec71a8] text-white px-3 py-1.5 rounded-xl font-extrabold shadow-sm">
                          Mi Ganancia: S/ {liveMyGain.toFixed(2)}
                        </div>
                        <div className="bg-[#1e1e1c] text-[#ecc880] px-3 py-1.5 rounded-xl font-bold">
                          Salón: S/ {(livePrice - liveMyGain).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                <div className="shrink-0 border-t border-[#fce3ed] bg-white px-4 sm:px-6 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={closeRegistro}
                    className="px-5 py-3 rounded-2xl border border-[#e5e1da] bg-white hover:bg-[#faf5f8] font-bold text-sm text-[#6b6764] cursor-pointer whitespace-nowrap"
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#ec71a8] to-[#d95392] hover:opacity-95 text-white font-extrabold text-sm shadow-lg shadow-[#ec71a8]/25 cursor-pointer flex items-center gap-2 whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    Guardar
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
        {/* ================= MODAL: REGISTRAR PRODUCTO ================= */}
        {showProductModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#2a1a25]/55 backdrop-blur-md p-3 sm:p-4"
            onClick={closeProducto}
          >
            <section
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[90vh] rounded-3xl bg-white border border-[#efd3e4] shadow-2xl flex flex-col overflow-hidden animate-modal"
            >
              <div className="shrink-0 flex items-center justify-between gap-3 border-b border-[#efd3e4] px-4 py-3 sm:px-6">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-extrabold text-[#2a1a25] truncate">Registrar productos</h3>
                    <p className="text-[10px] sm:text-xs text-[#6b6764] truncate">Inventario unitario · caducidad automática</p>
                  </div>
                </div>
                <button type="button" onClick={closeProducto} aria-label="Cerrar registro de producto" className="p-2 rounded-xl bg-[#f6e3f0] text-[#933a69] hover:bg-[#efd3e4] cursor-pointer shrink-0"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleCreateProduct} className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5 grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#933a69] flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#b64a83]" />
                      Nombre del producto
                    </label>
                    <input
                      type="text"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      placeholder="Ej: Pestañina Maybelline"
                      className="w-full p-3 border border-[#efd3e4] rounded-2xl text-sm font-bold outline-none bg-[#fff9fc] text-[#2a1a25] placeholder-[#8c8884] focus:border-[#b64a83] focus:ring-2 focus:ring-[#b64a83]/15"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#933a69] flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-[#b64a83]" />
                      Cantidad
                    </label>
                    <input
                      type="number"
                      value={1}
                      disabled
                      readOnly
                      aria-label="Cantidad fija: 1 unidad"
                      className="w-full p-3 border border-[#efd3e4] rounded-2xl text-sm font-bold bg-[#f6e3f0] text-[#6b6764] cursor-not-allowed outline-none"
                    />
                    <span className="text-[10px] font-semibold text-[#8c8884]">Stock unitario · 1 por producto</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#933a69] flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-[#b64a83]" />
                      Precio / Costo (S/)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full p-3 border border-[#efd3e4] rounded-2xl text-sm font-bold outline-none bg-[#fff9fc] text-[#2a1a25] placeholder-[#8c8884] focus:border-[#b64a83] focus:ring-2 focus:ring-[#b64a83]/15"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#933a69] flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-[#b64a83]" />
                      Fecha de compra
                    </label>
                    <input
                      type="date"
                      value={prodPurchaseDate}
                      onChange={(e) => handlePurchaseDateChange(e.target.value)}
                      className="w-full p-3 border border-[#efd3e4] rounded-2xl text-sm font-bold outline-none bg-[#fff9fc] text-[#2a1a25] focus:border-[#b64a83] focus:ring-2 focus:ring-[#b64a83]/15"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#933a69] flex items-center gap-1.5">
                      <CalendarCheck className="w-3.5 h-3.5 text-[#b64a83]" />
                      Fecha de apertura <span className="text-[#8c8884] normal-case font-medium">(opcional)</span>
                    </label>
                    <input
                      type="date"
                      value={prodStartDate}
                      onChange={(e) => setProdStartDate(e.target.value)}
                      className="w-full p-3 border border-[#efd3e4] rounded-2xl text-sm font-bold outline-none bg-[#fff9fc] text-[#2a1a25] focus:border-[#b64a83] focus:ring-2 focus:ring-[#b64a83]/15"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#933a69] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#b64a83]" />
                      Caducidad
                    </label>
                    <BrandSelect
                      value={prodExpiryPreset}
                      onChange={handleExpiryPresetChange}
                      options={[
                        { value: '6', label: '6 meses', desc: 'Caducidad automática' },
                        { value: '12', label: '12 meses', desc: 'Caducidad automática' },
                        { value: '', label: 'Personalizada', desc: 'Elegir la fecha a mano' },
                      ]}
                      placeholder="Elegir duración"
                      icon={Clock}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#933a69] flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#b64a83]" />
                      Fecha de caducidad
                    </label>
                    <input
                      type="date"
                      value={prodExpirationDate}
                      onChange={(e) => { setProdExpirationDate(e.target.value); setProdExpiryPreset(''); }}
                      className="w-full p-3 border border-[#efd3e4] rounded-2xl text-sm font-bold outline-none bg-[#fff9fc] text-[#2a1a25] focus:border-[#b64a83] focus:ring-2 focus:ring-[#b64a83]/15"
                      required
                    />
                    <span className="text-[10px] font-semibold text-[#8c8884]">Se calcula sola con 6 o 12 meses</span>
                  </div>
                </div>

                <div className="shrink-0 border-t border-[#efd3e4] bg-white px-4 sm:px-6 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={closeProducto}
                    className="px-5 py-3 rounded-2xl border border-[#efd3e4] bg-white hover:bg-[#fff9fc] text-[#6b6764] font-bold text-sm cursor-pointer whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#b64a83] to-[#933a69] text-white font-extrabold text-sm shadow-lg shadow-[#b64a83]/25 hover:opacity-95 cursor-pointer flex items-center gap-2 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 shrink-0" strokeWidth={3} />
                    Registrar
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {showProductsListModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2a1a25]/55 backdrop-blur-md p-3 sm:p-4" onClick={() => setShowProductsListModal(false)}>
            <section onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl max-h-[90vh] rounded-3xl bg-white border border-[#efd3e4] shadow-2xl flex flex-col overflow-hidden animate-modal">
              <div className="shrink-0 flex items-center justify-between border-b border-[#efd3e4] px-5 py-4">
                <div><h3 className="font-extrabold text-[#2a1a25]">Mis productos</h3><p className="text-xs text-[#6b6764]">{products.length} registrados</p></div>
                <button type="button" onClick={() => setShowProductsListModal(false)} aria-label="Cerrar mis productos" className="p-2 rounded-xl bg-[#f6e3f0] text-[#933a69]"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3">
                {products.length === 0 ? <p className="py-10 text-center text-sm text-[#8c8884]">Aún no tienes productos registrados.</p> : products.map((p) => {
                  const isTerminated = p.status === 'terminado';
                  return (
                    <article key={p.id} className={`rounded-2xl border border-[#efd3e4] bg-[#fff9fc] p-4 ${isTerminated ? 'opacity-70' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <h4 className={`font-extrabold ${isTerminated ? 'text-[#8c8884] line-through' : 'text-[#2a1a25]'}`}>{p.name}</h4>
                        <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full ${isTerminated ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'}`}>{isTerminated ? 'Terminado' : 'Activo'}</span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[#6b6764]">
                        <span>Cantidad: <b>{isTerminated ? 0 : p.quantity}</b></span>
                        <span>Caduca: <b>{p.expiration_date}</b></span>
                        <span>Apertura: <b>{p.start_date || 'Sin abrir'}</b></span>
                        {p.price > 0 && <span>Precio: <b>S/ {Number(p.price).toFixed(2)}</b></span>}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#efd3e4]">
                        {!isTerminated && !p.start_date && (
                          <button onClick={() => handleOpenToday(p.id)} title="Marcar este producto como abierto hoy" className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#f6e3f0] border border-[#efd3e4] text-[#933a69] font-bold text-xs cursor-pointer">
                            <CalendarCheck className="w-3.5 h-3.5" /> Abrir Hoy
                          </button>
                        )}
                        {!isTerminated && (
                          <button onClick={() => handleFinishProduct(p.id)} title="Marcar este producto como terminado/agotado" className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#efd3e4] text-[#933a69] font-bold text-xs cursor-pointer">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Terminado
                          </button>
                        )}
                        {isTerminated && (
                          <button onClick={() => handleReactivateProduct(p.id)} title="Volver a activar este producto" className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-400/40 text-emerald-700 font-bold text-xs cursor-pointer">
                            <RotateCcw className="w-3.5 h-3.5" /> Reactivar
                          </button>
                        )}
                        <button onClick={() => openEditProduct(p)} title="Editar producto" className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#fdebdd] border border-[#edd5b6] text-[#b8860b] font-bold text-xs cursor-pointer">
                          <Edit3 className="w-3.5 h-3.5" /> Editar
                        </button>
                        <button onClick={() => handleDeleteProduct(p.id)} title="Eliminar producto" className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 font-bold text-xs cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" /> Eliminar
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        )}


      {/* ================= NAVEGACIÓN INFERIOR MÓVIL (3 secciones + Configuración / Salir) ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-[#b64a83] via-[#a3416f] to-[#8f3663] backdrop-blur-md border-t border-white/15 shadow-[0_-6px_22px_rgba(147,58,105,0.35)] pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-4 items-end">
          <button
            onClick={() => setActiveTab('resumen')}
            aria-label="Resumen general"
            className={`flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${activeTab === 'resumen' ? 'text-white' : 'text-white/55'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-bold">Resumen</span>
            <span className={`h-0.5 w-6 rounded-full ${activeTab === 'resumen' ? 'bg-white' : 'bg-transparent'}`}></span>
          </button>
          <button
            onClick={() => setActiveTab('productos')}
            aria-label="Mis productos"
            className={`flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${activeTab === 'productos' ? 'text-white' : 'text-white/55'}`}
          >
            <Package className="w-5 h-5" />
            <span className="text-[10px] font-bold">Productos</span>
            <span className={`h-0.5 w-6 rounded-full ${activeTab === 'productos' ? 'bg-white' : 'bg-transparent'}`}></span>
          </button>
          <button
            onClick={() => setActiveTab('informes')}
            aria-label="Informes y edición"
            className={`flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${activeTab === 'informes' ? 'text-white' : 'text-white/55'}`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px] font-bold">Informes</span>
            <span className={`h-0.5 w-6 rounded-full ${activeTab === 'informes' ? 'bg-white' : 'bg-transparent'}`}></span>
          </button>
          {esAdmin ? (
            <button
              onClick={() => setActiveTab('configuracion')}
              aria-label="Configuración"
              className={`flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${activeTab === 'configuracion' ? 'text-white' : 'text-white/55'}`}
            >
              <Settings className="w-5 h-5" />
              <span className="text-[10px] font-bold">Ajustes</span>
              <span className={`h-0.5 w-6 rounded-full ${activeTab === 'configuracion' ? 'bg-white' : 'bg-transparent'}`}></span>
            </button>
          ) : (
            <button
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              className="flex flex-col items-center justify-center gap-1 py-2.5 transition-colors text-white/55 hover:text-white"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-[10px] font-bold">Salir</span>
              <span className="h-0.5 w-6 rounded-full bg-transparent"></span>
            </button>
          )}
        </div>
      </nav>



      {/* ================= MODAL INTERACTIVO DE EDICIÓN DE SERVICIO ================= */}
      {editingService && (
        <div className="fixed inset-0 z-50 bg-[#1e1e1c]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#f9cee3] animate-modal relative">
            
            {/* CABECERA DEL MODAL */}
            <div className="flex items-center justify-between border-b border-[#fce3ed] pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ec71a8] to-[#d95392] text-white flex items-center justify-center shadow-md">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-[#1e1e1c]">
                    Editar Registro de Servicio
                  </h3>
                  <p className="text-xs text-[#8c8884]">Modifica los datos del servicio y recalcularemos las ganancias</p>
                </div>
              </div>

              <button
                onClick={() => setEditingService(null)}
                className="p-2 rounded-xl text-[#8c8884] hover:bg-[#fce3ed] hover:text-[#1e1e1c] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORMULARIO DE EDICIÓN */}
            <form onSubmit={handleSaveEdit} className="flex flex-col gap-5">
              
              {/* SALÓN / ESTUDIO */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4a4744] flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-[#ec71a8]" />
                  Salón / Estudio
                </label>
                <SalonSelect
                  value={editSalonId}
                  onChange={(v) => handleEditSalonChange(v)}
                  salones={salones}
                />
              </div>

              {/* FECHA */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4a4744] flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-[#ec71a8]" />
                  Fecha
                </label>
                <BrandDateField
                  ariaLabel="Fecha del servicio"
                  align="left"
                  placeholder="Elegir fecha"
                  value={editDate}
                  onChange={(v) => setEditDate(v || editDate)}
                />
              </div>

              {/* SERVICIO */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4a4744] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#ec71a8]" />
                  Servicio Realizado
                </label>
                <input
                  type="text"
                  value={editService}
                  onChange={(e) => handleEditServiceChange(e.target.value)}
                  disabled={esMaison(editSalonId)}
                  className="p-3.5 border border-[#f9cee3] rounded-2xl text-sm font-semibold outline-none focus:border-[#ec71a8] focus:ring-2 focus:ring-[#ec71a8]/15 bg-[#faf5f8] disabled:bg-[#fce3ed]/60 disabled:text-[#8c8884] disabled:cursor-not-allowed"
                  required
                />
                {esMaison(editSalonId) && (
                  <span className="text-[10px] font-bold text-[#ec71a8]">
                    Maison Studio solo permite Maquillaje
                  </span>
                )}
              </div>

              {/* PRECIO Y COMISIÓN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#4a4744] flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#ec71a8]" />
                    Precio Cobrado (S/)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="p-3.5 border border-[#f9cee3] rounded-2xl text-sm font-bold outline-none focus:border-[#ec71a8] focus:ring-2 focus:ring-[#ec71a8]/15 bg-[#faf5f8]"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#4a4744] flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-[#ec71a8]" />
                    Comisión
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={editCommission}
                    onChange={(e) => setEditCommission(Number(e.target.value) || 0)}
                    disabled={esPropio(editSalonId)}
                    className="p-3.5 border border-[#f9cee3] rounded-2xl text-sm font-bold outline-none focus:border-[#ec71a8] focus:ring-2 focus:ring-[#ec71a8]/15 bg-[#faf5f8] disabled:bg-[#fce3ed]/60 disabled:text-[#8c8884] disabled:cursor-not-allowed"
                    required
                  />
                  <span className={`text-[10px] font-semibold ${esPropio(editSalonId) ? 'font-bold text-[#933a69]' : 'text-[#8c8884]'}`}>
                    {esPropio(editSalonId) ? '🔒 Mi entidad propia - 100%' : 'Comisión del servicio'}
                  </span>
                </div>
              </div>

              {/* VISTA PREVIA DEL CÁLCULO AL EDITAR */}
              {editLivePrice > 0 && (
                <div className="bg-[#fff5f8] border border-[#f9cee3] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="font-extrabold text-[#1e1e1c]">
                    Nuevo Cálculo:
                  </div>
                  <div className="flex items-center gap-3 font-bold">
                    <span className="text-[#ec71a8]">Mi Ganancia: S/ {editLiveMyGain.toFixed(2)}</span>
                    <span className="text-[#8c8884]">|</span>
                    <span className="text-[#1e1e1c]">Salón: S/ {editLiveSalonGain.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* BOTONES DE ACCIÓN */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#fce3ed] mt-2">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-5 py-3 rounded-2xl border border-[#e5e1da] bg-white hover:bg-[#faf5f8] font-bold text-xs text-[#6b6764] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#ec71a8] to-[#d95392] text-white font-extrabold text-xs shadow-md shadow-[#ec71a8]/25 hover:opacity-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Guardar Cambios
                </button>
              </div>

            </form>
          </div>
        </div>
      )}


      {/* ================= MODAL: EDICIÓN DE PRODUCTO ================= */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-[#1e1e1c]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#f9cee3] animate-modal relative">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#fce3ed] flex items-center justify-center">
                  <Package className="w-5 h-5 text-[#ec71a8]" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#1e1e1c]">Editar Producto</h3>
                  <p className="text-xs text-[#6b6764] font-medium">Modifica los datos o cambia la fecha de apertura</p>
                </div>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-2 rounded-xl hover:bg-[#faf5f8] text-[#6b6764] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4a4744]">Nombre</label>
                <input
                  type="text"
                  value={editProdName}
                  onChange={(e) => setEditProdName(e.target.value)}
                  className="p-3 border border-[#f9cee3] rounded-2xl text-sm font-bold outline-none focus:border-[#ec71a8] focus:ring-2 focus:ring-[#ec71a8]/15 bg-[#faf5f8]"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4a4744]">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  value={editProdQuantity}
                  onChange={(e) => setEditProdQuantity(Number(e.target.value) || 1)}
                  className="p-3 border border-[#f9cee3] rounded-2xl text-sm font-bold outline-none focus:border-[#ec71a8] focus:ring-2 focus:ring-[#ec71a8]/15 bg-[#faf5f8]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4a4744]">Precio (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editProdPrice}
                  onChange={(e) => setEditProdPrice(e.target.value)}
                  className="p-3 border border-[#f9cee3] rounded-2xl text-sm font-bold outline-none focus:border-[#ec71a8] focus:ring-2 focus:ring-[#ec71a8]/15 bg-[#faf5f8]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4a4744]">Fecha de compra</label>
                <input
                  type="date"
                  value={editProdPurchaseDate}
                  onChange={(e) => setEditProdPurchaseDate(e.target.value)}
                  className="p-3 border border-[#f9cee3] rounded-2xl text-sm font-bold outline-none focus:border-[#ec71a8] focus:ring-2 focus:ring-[#ec71a8]/15 bg-[#faf5f8]"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4a4744]">Fecha de apertura</label>
                <input
                  type="date"
                  value={editProdStartDate}
                  onChange={(e) => setEditProdStartDate(e.target.value)}
                  className="p-3 border border-[#f9cee3] rounded-2xl text-sm font-bold outline-none focus:border-[#ec71a8] focus:ring-2 focus:ring-[#ec71a8]/15 bg-[#faf5f8]"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4a4744]">Fecha de caducidad</label>
                <input
                  type="date"
                  value={editProdExpirationDate}
                  onChange={(e) => setEditProdExpirationDate(e.target.value)}
                  className="p-3 border border-[#f9cee3] rounded-2xl text-sm font-bold outline-none focus:border-[#ec71a8] focus:ring-2 focus:ring-[#ec71a8]/15 bg-[#faf5f8]"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#4a4744]">Estado</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditProdStatus('activo')}
                      className={`flex items-center justify-center gap-1.5 rounded-2xl font-bold text-xs cursor-pointer border py-3 ${
                        editProdStatus === 'activo'
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                          : 'bg-white text-[#6b6764] border-[#f9cee3]'
                      }`}
                    >
                      🟢 Activo
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditProdStatus('terminado')}
                      className={`flex items-center justify-center gap-1.5 rounded-2xl font-bold text-xs cursor-pointer border py-3 ${
                        editProdStatus === 'terminado'
                          ? 'bg-[#1e1e1c] text-white border-[#1e1e1c] shadow-sm'
                          : 'bg-white text-[#6b6764] border-[#f9cee3]'
                      }`}
                    >
                      ⚫ Terminado
                    </button>
                  </div>
                </div>

              <div className="sm:col-span-2 flex justify-end gap-3 pt-4 border-t border-[#fce3ed] mt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-5 py-2.5 rounded-2xl border border-[#e5e1da] bg-white hover:bg-[#faf5f8] font-bold text-xs text-[#6b6764] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#ec71a8] to-[#d95392] text-white font-extrabold text-xs shadow-md shadow-[#ec71a8]/25 hover:opacity-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}
