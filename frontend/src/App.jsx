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
  Save
} from 'lucide-react';

const API_BASE_URL = typeof window !== 'undefined' && window.location.port === '5173'
  ? 'http://localhost:8000'
  : '/api';

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

// Componente de Logo elegante GUADALUPE MAKE UP Rodriguez
function BrandLogo({ compact = false }) {
  return (
    <div className="flex items-center gap-3 select-none">
      {/* Emblema con monograma y pincel dorado/rosa */}
      <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#1e1e1c] via-[#2c2b28] to-[#1e1e1c] p-0.5 shadow-md flex items-center justify-center shrink-0 border border-[#ecc880]/40 group">
        <div className="w-full h-full rounded-[14px] bg-[#1e1e1c] flex items-center justify-center relative overflow-hidden">
          {/* Brillo sutil de fondo */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#ec71a8]/20 via-transparent to-[#ecc880]/30 opacity-70"></div>
          
          {/* Vector SVG monograma GR estilizado con pincel y corazón */}
          <svg className="w-8 h-8 text-[#ecc880] relative z-10 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M42 28 C28 28, 22 40, 22 52 C22 66, 32 76, 48 76 C60 76, 68 70, 72 62 L64 58 C60 64, 55 68, 48 68 C37 68, 30 60, 30 52 C30 44, 35 36, 43 36 C52 36, 56 42, 57 48 L65 48 C64 36, 56 28, 42 28 Z" fill="#ecc880" />
            <path d="M50 48 H72 C77 48, 80 52, 80 56 C80 61, 76 64, 71 64 L65 64 L74 76 H64 L56 64 H56" stroke="#d4af37" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {/* Corazón / Detalle de brillo Make Up */}
            <path d="M74 34 C72 30, 68 30, 66 33 C64 30, 60 30, 58 34 C58 39, 66 45, 66 45 C66 45, 74 39, 74 34 Z" fill="#ec71a8" />
            <circle cx="78" cy="26" r="2.5" fill="#f9cee3" />
          </svg>
        </div>
      </div>

      {!compact && (
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <span className="font-extrabold text-lg sm:text-xl tracking-[0.18em] text-[#1e1e1c] uppercase leading-none">
              Guadalupe
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-bold tracking-[0.25em] text-[#6b6764] uppercase">
              MAKE UP
            </span>
            <span className="font-brand-script text-[#ec71a8] text-base sm:text-lg leading-none transform -rotate-3">
              Rodriguez
            </span>
          </div>
        </div>
      )}




    </div>
  );
}

// Dropdown de marca reutilizable: mismo estilo del selector de Salón
// (botón con chevron + panel animado). Se usa en Salón, Rango de fechas y Caducidad.
function BrandSelect({ value, onChange, options = [], placeholder = 'Selecciona...', icon: Icon = Store, buttonClass = '', panelClass = '', dark = false }) {
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
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 p-3 sm:p-3.5 border rounded-2xl text-sm font-semibold outline-none transition-all text-left cursor-pointer ${
          open
            ? (dark ? 'border-[#ecc880] ring-3 ring-[#ecc880]/20 bg-[#1e1e1c]' : 'border-[#ec71a8] ring-3 ring-[#ec71a8]/15 bg-white')
            : (dark ? 'border-[#ecc880]/30 bg-[#1e1e1c] hover:border-[#ecc880]/70' : 'border-[#f9cee3] bg-[#faf5f8] hover:border-[#ec71a8]/50')
        } ${buttonClass}`}
      >
        <span className={`flex items-center gap-2 min-w-0 ${selected ? (dark ? 'text-white' : 'text-[#1e1e1c]') : 'text-[#8c8884]'}`}>
          <Icon className={`w-4 h-4 shrink-0 ${dark ? 'text-[#ecc880]' : 'text-[#ec71a8]'}`} />
          <span className="truncate">{selected ? selected.label : placeholder}</span>
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 shrink-0 ${dark ? 'text-[#ecc880]' : 'text-[#ec71a8]'} ${open ? 'rotate-180' : ''}`} />
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

// FAB arrastrable: posición persistida en localStorage, distingue toque de arrastre
function useDraggableFab({ storageKey, size = 56, defaultRight = 16, defaultBottom = 68, onTap }) {
  const clamp = (p) => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 390;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 844;
    return {
      x: Math.min(Math.max(8, p.x), Math.max(8, vw - size - 8)),
      y: Math.min(Math.max(8, p.y), Math.max(8, vh - size - 8)),
    };
  };
  const defaultPos = () => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 390;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 844;
    return clamp({ x: vw - size - defaultRight, y: vh - size - defaultBottom });
  };
  const readInitial = () => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw);
        if (typeof saved.x === 'number' && typeof saved.y === 'number') return clamp(saved);
      }
    } catch (err) { /* almacenamiento no disponible */ }
    return defaultPos();
  };

  const [pos, setPos] = useState(readInitial);
  const posRef = useRef(pos);
  const tapRef = useRef(onTap);
  const drag = useRef({ active: false, moved: false, dx: 0, dy: 0, sx: 0, sy: 0 });

  useEffect(() => { tapRef.current = onTap; });

  const apply = (next) => { posRef.current = next; setPos(next); };

  useEffect(() => {
    const onResize = () => apply(clamp(posRef.current));
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlers = {
    onPointerDown: (e) => {
      drag.current = {
        active: true, moved: false,
        dx: e.clientX - posRef.current.x, dy: e.clientY - posRef.current.y,
        sx: e.clientX, sy: e.clientY,
      };
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
    },
    onPointerMove: (e) => {
      const d = drag.current;
      if (!d.active) return;
      if (!d.moved && (Math.abs(e.clientX - d.sx) > 4 || Math.abs(e.clientY - d.sy) > 4)) d.moved = true;
      if (!d.moved) return;
      apply(clamp({ x: e.clientX - d.dx, y: e.clientY - d.dy }));
    },
    onPointerUp: (e) => {
      const d = drag.current;
      if (!d.active) return;
      d.active = false;
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) { /* noop */ }
      if (d.moved) {
        try { window.localStorage.setItem(storageKey, JSON.stringify(posRef.current)); } catch (err) { /* noop */ }
      } else if (typeof tapRef.current === 'function') {
        tapRef.current();
      }
    },
    onPointerCancel: () => { drag.current.active = false; },
  };

  return { pos, style: { left: `${pos.x}px`, top: `${pos.y}px`, touchAction: 'none' }, handlers };
}

export default function App() {
  // Navegación por pestañas ('resumen' | 'productos' | 'informes')
  // El registro de servicio y el de producto se abren como ventanas modales superpuestas
  const [activeTab, setActiveTab] = useState('resumen');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
  const [extraItems, setExtraItems] = useState([]); // servicios extra de la misma clienta (misma visita)
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
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false); // modal superpuesto de registro de producto

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

  // Cargar servicios desde backend
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/servicios`);
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
  }, []);

  // Cargar salones / estudios
  useEffect(() => {
    fetch(`${API_BASE_URL}/salones`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setSalones(Array.isArray(data) ? data : []))
      .catch(() => console.log('No se pudieron cargar los salones'));
  }, []);

  // Cargar productos cuando se activa la pestaña "productos"
  useEffect(() => {
    if (activeTab === 'productos') {
      fetchProducts(productSearch, productStatusFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, productStatusFilter]);

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
  const comisionSugerida = (salonId, servicio) => {
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

  // ---- Servicios extra: mismos fecha + salón, una sola transacción ----
  const itemsCount = 1 + extraItems.length;
  const extraTotal = extraItems.reduce((acc, it) => acc + (parseFloat(it.price) || 0), 0);
  const extraMyGain = extraItems.reduce(
    (acc, it) => acc + (parseFloat(it.price) || 0) * ((Number(it.commission) || 0) / 100), 0
  );
  const batchLivePrice = livePrice + extraTotal;
  const batchLiveMyGain = liveMyGain + extraMyGain;
  const batchLiveSalonGain = batchLivePrice - batchLiveMyGain;

  const comisionExtra = (salonId, servicio) => (esMaison(salonId) ? 60 : comisionSugerida(salonId, servicio));

  const addExtraItem = () => {
    setExtraItems((prev) => [
      ...prev,
      {
        key: `extra-${Date.now()}-${prev.length}`,
        service: esMaison(regSalonId) ? 'Maquillaje' : '',
        price: '',
        commission: comisionExtra(regSalonId, ''),
      },
    ]);
  };

  const updateExtraItem = (key, patch) => {
    setExtraItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  };

  const handleExtraServiceChange = (key, val) => {
    setExtraItems((prev) => prev.map((it) => (
      it.key === key ? { ...it, service: val, commission: comisionExtra(regSalonId, val) } : it
    )));
  };

  const removeExtraItem = (key) => setExtraItems((prev) => prev.filter((it) => it.key !== key));

  // Cambio de salón en el formulario: recalcula comisión y, en Maison, fuerza Maquillaje
  const handleRegSalonChange = (val) => {
    setRegSalonId(val);
    if (esMaison(val)) {
      setRegService('Maquillaje');
      setRegCommission(60);
      setExtraItems((prev) => prev.map((it) => ({ ...it, service: 'Maquillaje', commission: 60 })));
    } else {
      setRegCommission(comisionSugerida(val, regService));
      setExtraItems((prev) => prev.map((it) => ({ ...it, commission: comisionSugerida(val, it.service) })));
    }
  };
  const handleRegServiceChange = (val) => {
    setRegService(val);
    if (!esMaison(regSalonId)) {
      setRegCommission(comisionSugerida(regSalonId, val));
    }
  };

  // Cambio de salón / servicio en el modal de edición
  const handleEditSalonChange = (val) => {
    setEditSalonId(val);
    if (esMaison(val)) {
      setEditService('Maquillaje');
      setEditCommission(60);
    } else {
      setEditCommission(comisionSugerida(val, editService));
    }
  };
  const handleEditServiceChange = (val) => {
    setEditService(val);
    if (!esMaison(editSalonId)) {
      setEditCommission(comisionSugerida(editSalonId, val));
    }
  };

  // Envío nuevo servicio (principal + servicios extra en una sola transacción)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!regSalonId) { showToast('Selecciona el salón/estudio', 'error'); return; }
    if (!regService.trim()) { showToast('Indica el servicio realizado', 'error'); return; }
    const priceNum = parseFloat(regPrice);
    if (isNaN(priceNum) || priceNum <= 0) { showToast('Ingresa un precio válido', 'error'); return; }

    // Validación de los servicios extra
    const extras = [];
    for (const it of extraItems) {
      const p = parseFloat(it.price);
      if (!it.service.trim()) { showToast('Completa el nombre del servicio extra', 'error'); return; }
      if (isNaN(p) || p <= 0) { showToast('Ingresa un precio válido en el servicio extra', 'error'); return; }
      extras.push({ service: it.service.trim(), price: p, commission: Number(it.commission) || comisionExtra(regSalonId, it.service) });
    }

    const items = [
      { service: regService.trim(), price: priceNum, commission: Number(regCommission) },
      ...extras,
    ];

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

    let creados = items.map((it) => buildLocal(it));

    try {
      const res = await fetch(`${API_BASE_URL}/registro-lote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha: regDate,
          salon_id: Number(regSalonId),
          items: items.map((it) => ({
            servicio_nombre: it.service,
            precio: it.price,
            porcentaje: it.commission,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.entries) && data.entries.length === items.length) {
          creados = data.entries;
        }
      } else {
        // Respaldo: si el endpoint en lote no está disponible, se registra uno por uno
        for (let i = 0; i < items.length; i += 1) {
          const it = items[i];
          const r2 = await fetch(`${API_BASE_URL}/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fecha: regDate,
              servicio_nombre: it.service,
              precio: it.price,
              porcentaje: it.commission,
              salon_id: Number(regSalonId),
            }),
          });
          if (r2.ok) {
            const d2 = await r2.json();
            if (d2.entry) creados[i] = d2.entry;
          }
        }
      }
    } catch (err) {
      console.log('Guardado local activado');
    }

    setServices((prev) => [...creados, ...prev]);
    setRegService('');
    setRegPrice('');
    setExtraItems([]);
    setShowRegistroModal(false);
    showToast(
      items.length > 1 ? `¡${items.length} servicios registrados juntos!` : '¡Servicio registrado con éxito!',
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
      await fetch(`${API_BASE_URL}/registro/${editingService.id}`, {
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
      await fetch(`${API_BASE_URL}/registro/${id}`, { method: 'DELETE' });
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
      const res = await fetch(url);
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
      const res = await fetch(`${API_BASE_URL}/products`, {
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
      const res = await fetch(`${API_BASE_URL}/products/${id}/open`, { method: 'PATCH' });
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
      const res = await fetch(`${API_BASE_URL}/products/${id}/finish`, { method: 'PATCH' });
      if (!res.ok) throw new Error('No se pudo marcar como terminado');
      showToast('Producto marcado como terminado', 'success');
      await fetchProducts(productSearch, productStatusFilter);
    } catch (err) {
      showToast(err.message || 'Error', 'error');
    }
  };

  const handleReactivateProduct = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}/reactivate`, { method: 'PATCH' });
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
      const res = await fetch(`${API_BASE_URL}/products/${id}`, { method: 'DELETE' });
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
      const res = await fetch(`${API_BASE_URL}/products/${editingProduct.id}`, {
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

  // FABs arrastrables (se recuerda dónde los deja la usuaria)
  const serviceFab = useDraggableFab({ storageKey: 'salon_fab_servicio', onTap: () => setShowRegistroModal(true) });
  const productFab = useDraggableFab({ storageKey: 'salon_fab_producto', onTap: () => setShowProductModal(true) });

  const anyModalOpen = showRegistroModal || showProductModal;

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
      if (e.key === 'Escape') { setShowRegistroModal(false); setShowProductModal(false); }
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

  // Desglose por comisiones en el mes
  const count40 = monthlyServices.filter((s) => s.commission === 40).length;
  const gain40 = monthlyServices.filter((s) => s.commission === 40).reduce((acc, curr) => acc + curr.myGain, 0);
  const count30 = monthlyServices.filter((s) => s.commission === 30).length;
  const gain30 = monthlyServices.filter((s) => s.commission === 30).reduce((acc, curr) => acc + curr.myGain, 0);
  const count60 = monthlyServices.filter((s) => s.commission === 60).length;
  const gain60 = monthlyServices.filter((s) => s.commission === 60).reduce((acc, curr) => acc + curr.myGain, 0);
  const ticketPromedio = monthlyServices.length > 0 ? monthFacturado / monthlyServices.length : 0;

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
  const paginatedServices = useMemo(() => {
    const start = (reportPage - 1) * itemsPerPage;
    return filteredServices.slice(start, start + itemsPerPage);
  }, [filteredServices, reportPage, itemsPerPage]);

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
      <aside className="hidden md:flex md:w-80 bg-white/95 backdrop-blur-md border-r border-[#ec71a8]/20 p-6 flex-col justify-between shrink-0 shadow-sm z-20">
        <div>
          {/* CABECERA CON LOGO PRINCIPAL */}
          <div className="flex items-center justify-between md:justify-start pb-6 border-b border-[#fce3ed]">
            <BrandLogo />
            {/* BOTÓN MENÚ MÓVIL */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl border border-[#ec71a8]/30 bg-[#fce3ed]/50 text-[#1e1e1c]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* INSIGNIA DE ESTILO */}
          <div className="mt-4 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#fce3ed] via-[#fdf2f7] to-[#fdebdd] border border-[#f9cee3] flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider uppercase text-[#1e1e1c] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#ec71a8]" />
              Control de Ganancias
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#ec71a8] text-white shadow-xs">
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
                  ? 'bg-gradient-to-r from-[#ec71a8] to-[#d95392] text-white shadow-lg shadow-[#ec71a8]/25 translate-x-1'
                  : 'text-[#4a4744] hover:bg-[#fce3ed]/60 hover:text-[#1e1e1c]'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeTab === 'resumen' ? 'bg-white/20' : 'bg-[#fce3ed] text-[#ec71a8]'}`}>
                <LayoutDashboard className="w-4 h-4" />
              </div>
              <div className="text-left flex-1">
                <span className="block font-extrabold">Resumen General</span>
                <span className={`text-[11px] block font-medium ${activeTab === 'resumen' ? 'text-pink-100' : 'text-[#8c8884]'}`}>
                  Métricas del mes en curso
                </span>
              </div>
            </button>

            {/* 2. NUEVO REGISTRO (abre la ventana modal superpuesta) */}
            <button
              onClick={openRegistro}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                showRegistroModal
                  ? 'bg-gradient-to-r from-[#ec71a8] to-[#d95392] text-white shadow-lg shadow-[#ec71a8]/25 translate-x-1'
                  : 'text-[#4a4744] hover:bg-[#fce3ed]/60 hover:text-[#1e1e1c]'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${showRegistroModal ? 'bg-white/20' : 'bg-[#fce3ed] text-[#ec71a8]'}`}>
                <PlusCircle className="w-4 h-4" />
              </div>
              <div className="text-left flex-1">
                <span className="block font-extrabold">Registrar Servicio</span>
                <span className={`text-[11px] block font-medium ${showRegistroModal ? 'text-pink-100' : 'text-[#8c8884]'}`}>
                  Ingreso rápido & cálculo
                </span>
              </div>
            </button>

            {/* 3. INFORMES */}
            <button
              onClick={() => { setActiveTab('informes'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                activeTab === 'informes'
                  ? 'bg-gradient-to-r from-[#ec71a8] to-[#d95392] text-white shadow-lg shadow-[#ec71a8]/25 translate-x-1'
                  : 'text-[#4a4744] hover:bg-[#fce3ed]/60 hover:text-[#1e1e1c]'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeTab === 'informes' ? 'bg-white/20' : 'bg-[#fce3ed] text-[#ec71a8]'}`}>
                <FileText className="w-4 h-4" />
              </div>
              <div className="text-left flex-1">
                <span className="block font-extrabold">Informes & Edición</span>
                <span className={`text-[11px] block font-medium ${activeTab === 'informes' ? 'text-pink-100' : 'text-[#8c8884]'}`}>
                  Historial, filtros y cambios
                </span>
              </div>
            </button>

            {/* 4. PRODUCTOS (INVENTARIO) */}
            <button
              onClick={() => { setActiveTab('productos'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                activeTab === 'productos'
                  ? 'bg-gradient-to-r from-[#ec71a8] to-[#d95392] text-white shadow-lg shadow-[#ec71a8]/25 translate-x-1'
                  : 'text-[#4a4744] hover:bg-[#fce3ed]/60 hover:text-[#1e1e1c]'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeTab === 'productos' ? 'bg-white/20' : 'bg-[#fce3ed] text-[#ec71a8]'}`}>
                <Package className="w-4 h-4" />
              </div>
              <div className="text-left flex-1">
                <span className="block font-extrabold">Mis Productos</span>
                <span className={`text-[11px] block font-medium ${activeTab === 'productos' ? 'text-pink-100' : 'text-[#8c8884]'}`}>
                  Inventario y vencimientos
                </span>
              </div>
            </button>

          </nav>
        </div>

        {/* PIE DEL PANEL LATERAL */}
        <div className="hidden md:block pt-6 border-t border-[#fce3ed] mt-6">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1e1e1c] to-[#2c2b28] text-white relative overflow-hidden shadow-md">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#ec71a8]/20 rounded-full blur-xl"></div>
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
      <div className="md:hidden sticky top-0 z-30 bg-[#faf5f8]/95 backdrop-blur-md border-b border-[#ec71a8]/20 px-3 py-2 flex items-center justify-between gap-2">
        <button
          onClick={() => setActiveTab('resumen')}
          aria-label="Ir al resumen general"
          className="shrink-0 rounded-2xl cursor-pointer"
        >
          <BrandLogo compact />
        </button>

        {activeTab === 'resumen' ? (
          /* Selector compacto de mes: < Octubre 2026 > */
          <div className="flex items-center gap-0.5 bg-white border border-[#f9cee3] rounded-full px-0.5 py-0.5 shadow-xs">
            <button
              onClick={handlePrevDashboardMonth}
              aria-label="Mes anterior"
              className="w-8 h-8 flex items-center justify-center rounded-full text-[#ec71a8] active:bg-[#fce3ed] cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={isViewingCurrentMonth ? undefined : handleCurrentDashboardMonth}
              aria-label={isViewingCurrentMonth ? 'Mes en curso' : 'Volver al mes actual'}
              className={`px-1 min-w-0 text-center ${isViewingCurrentMonth ? '' : 'cursor-pointer'}`}
            >
              <span className="block font-extrabold text-xs text-[#1e1e1c] capitalize whitespace-nowrap">
                {monthNames[selectedDashboardMonth - 1]} {selectedDashboardYear}
              </span>
              <span className={`block text-[9px] font-bold leading-tight ${isViewingCurrentMonth ? 'text-[#8c8884]' : 'text-[#ec71a8]'}`}>
                {isViewingCurrentMonth ? 'Mes en curso' : 'Volver a hoy'}
              </span>
            </button>
            <button
              onClick={handleNextDashboardMonth}
              aria-label="Mes siguiente"
              className="w-8 h-8 flex items-center justify-center rounded-full text-[#ec71a8] active:bg-[#fce3ed] cursor-pointer shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#ec71a8] text-right">
            {activeTab === 'productos' && 'Mis Productos'}
            {activeTab === 'informes' && 'Informes'}
          </span>
        )}
      </div>

      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <main className="flex-1 px-3 py-4 sm:p-8 pb-36 md:pb-8 max-w-7xl w-full mx-auto flex flex-col gap-4 sm:gap-8 overflow-y-auto">

        {/* BARRA DE TÍTULO + CONTROL DE MES (compacta, solo desktop) */}
        <header className="hidden md:flex items-center justify-between gap-4 bg-white/90 backdrop-blur-sm border border-[#ec71a8]/20 rounded-2xl px-5 py-3.5 shadow-sm">
          <h2 className="text-base lg:text-lg font-extrabold text-[#1e1e1c] tracking-tight">
            {activeTab === 'resumen' && 'Panel de Rendimiento Mensual'}
            {activeTab === 'productos' && 'Registro y Control de Productos'}
            {activeTab === 'informes' && 'Historial, Edición e Informes'}
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
            <div className="flex items-center gap-3 shrink-0">
              {activeTab === 'productos' && (
                <span className="text-xs font-bold bg-[#fce3ed] text-[#ec71a8] px-3.5 py-1.5 rounded-xl border border-[#f9cee3]">
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
                    S/ {monthMyGain.toFixed(2)}
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
                    S/ {monthFacturado.toFixed(2)}
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
                      <span>Faltan S/ {monthRemainingGoal.toFixed(2)}</span>
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
              <div className="hidden lg:flex card-luxury rounded-3xl p-6 lg:col-span-2 flex-col justify-between">
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
                          <div className="w-full max-w-[48px] bg-[#fce3ed] rounded-2xl overflow-hidden p-1 flex flex-col justify-end border border-[#f9cee3]/50 h-32">
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

              {/* DESGLOSE POR TIPO DE COMISIÓN */}
              <div className="card-luxury rounded-3xl p-6 flex flex-col justify-between">
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
              </div>

            </div>


          </div>
        )}

        {/* ================= VISTA 3: INFORMES Y EDICIÓN COMPLETA ================= */}
        {activeTab === 'informes' && (
          <div className="flex flex-col gap-8 animate-in fade-in duration-300">

            {/* SECCIÓN DE FILTROS */}
            <section className="card-luxury rounded-3xl p-4 sm:p-7 flex flex-col gap-4 sm:gap-5">
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

                {/* DROPDOWNS + CONTADOR DE SERVICIOS EN LA MISMA FILA */}
                <div className="grid grid-cols-[1fr_auto] sm:flex sm:flex-wrap sm:items-center gap-2.5">
                  <div className="min-w-0 sm:w-56">
                    <BrandSelect
                      value={quickRange}
                      onChange={handleQuickFilter}
                      options={rangeOptions}
                      placeholder="Rango de fechas"
                      icon={CalendarRange}
                    />
                  </div>
                  <span className="self-center text-[11px] sm:text-xs font-black bg-[#fce3ed] text-[#ec71a8] px-2.5 sm:px-3 py-2 rounded-xl border border-[#f9cee3] whitespace-nowrap">
                    {filteredServices.length} <span className="hidden sm:inline">{filteredServices.length === 1 ? 'servicio' : 'servicios'}</span><span className="sm:hidden">serv.</span>
                  </span>
                  <div className="min-w-0 sm:w-52">
                    <SalonSelect
                      value={filterSalon}
                      onChange={(v) => setFilterSalon(v)}
                      salones={salones}
                      allowAll
                      placeholder="Salón"
                    />
                  </div>
                  {hasActiveFilters && (
                    <button
                      onClick={() => { setFilterFrom(''); setFilterTo(''); setSearchTerm(''); setFilterSalon('todos'); setQuickRange('all'); }}
                      className="px-3 py-2 bg-white hover:bg-[#fce3ed] text-[#ec71a8] rounded-xl text-[11px] sm:text-xs font-extrabold flex items-center gap-1.5 cursor-pointer border border-[#f9cee3] transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Limpiar
                    </button>
                  )}
                </div>

                {/* INPUTS COMPACTOS: DESDE / HASTA / SERVICIO */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#6b6764]">Desde</label>
                    <input
                      type="date"
                      value={filterFrom}
                      onChange={(e) => { setFilterFrom(e.target.value); setQuickRange('custom'); }}
                      className="p-2.5 sm:p-3 border border-[#f9cee3] rounded-xl text-xs sm:text-sm font-semibold outline-none bg-white focus:border-[#ec71a8]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#6b6764]">Hasta</label>
                    <input
                      type="date"
                      value={filterTo}
                      onChange={(e) => { setFilterTo(e.target.value); setQuickRange('custom'); }}
                      className="p-2.5 sm:p-3 border border-[#f9cee3] rounded-xl text-xs sm:text-sm font-semibold outline-none bg-white focus:border-[#ec71a8]"
                    />
                  </div>

                  <div className="flex flex-col gap-1 col-span-2 lg:col-span-1">
                    <label className="text-[11px] font-bold text-[#6b6764]">Servicio</label>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8c8884]" />
                      <input
                        type="text"
                        placeholder="Nombre del servicio"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-9 p-2.5 sm:p-3 border border-[#f9cee3] rounded-xl text-xs sm:text-sm font-semibold outline-none bg-white focus:border-[#ec71a8]"
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
            ) : (
              <div className="flex items-center gap-2.5 bg-white/80 border border-[#fce3ed] rounded-2xl px-3.5 py-3">
                <Filter className="w-4 h-4 text-[#ec71a8] shrink-0" />
                <p className="text-[11px] sm:text-xs font-semibold text-[#8c8884]">
                  Aplica un rango de fechas, un salón o una búsqueda para ver tus métricas filtradas.
                </p>
              </div>
            )}

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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-5 border-t border-[#fce3ed]">
                  <div className="text-xs text-[#8c8884] font-medium">
                    Mostrando <span className="font-bold text-[#1e1e1c]">{(reportPage - 1) * itemsPerPage + 1}</span> a <span className="font-bold text-[#1e1e1c]">{Math.min(reportPage * itemsPerPage, filteredServices.length)}</span> de <span className="font-bold text-[#1e1e1c]">{filteredServices.length}</span> servicios
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Botón Página Anterior */}
                    <button
                      onClick={() => setReportPage((prev) => Math.max(prev - 1, 1))}
                      disabled={reportPage === 1}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                        reportPage === 1
                          ? 'opacity-40 cursor-not-allowed border-[#fce3ed] text-[#8c8884]'
                          : 'bg-white hover:bg-[#fce3ed] border-[#f9cee3] text-[#1e1e1c] cursor-pointer shadow-xs hover:scale-105'
                      }`}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Anterior
                    </button>

                    {/* Botones Numéricos de Página */}
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: totalReportPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => setReportPage(pageNum)}
                          className={`w-8 h-8 rounded-xl font-black text-xs transition-all cursor-pointer ${
                            reportPage === pageNum
                              ? 'bg-gradient-to-tr from-[#ec71a8] to-[#d95392] text-white shadow-md shadow-[#ec71a8]/25'
                              : 'bg-white hover:bg-[#fce3ed] text-[#6b6764] border border-[#f9cee3]'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    {/* Botón Página Siguiente */}
                    <button
                      onClick={() => setReportPage((prev) => Math.min(prev + 1, totalReportPages))}
                      disabled={reportPage === totalReportPages}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                        reportPage === totalReportPages
                          ? 'opacity-40 cursor-not-allowed border-[#fce3ed] text-[#8c8884]'
                          : 'bg-white hover:bg-[#fce3ed] border-[#f9cee3] text-[#1e1e1c] cursor-pointer shadow-xs hover:scale-105'
                      }`}
                    >
                      Siguiente
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </section>

          </div>
        )}

      
        {activeTab === 'productos' && (
          <section className="flex flex-col gap-6">
            {/* Buscador + listado (tema negro & dorado) */}
            <div className="rounded-3xl p-4 sm:p-8 bg-[#151513] border border-[#ecc880]/25 shadow-xl shadow-black/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#ecc880]/15 border border-[#ecc880]/30 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-[#ecc880]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-white">Mis Productos</h3>
                    <p className="text-xs text-[#8c8884] font-medium">
                      {products.length} producto{products.length === 1 ? '' : 's'} registrado{products.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8c8884]" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre..."
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        fetchProducts(e.target.value, productStatusFilter);
                      }}
                      className="pl-9 pr-4 py-2.5 rounded-2xl border border-[#ecc880]/25 text-sm font-medium bg-[#1e1e1c] text-white placeholder-[#8c8884] outline-none focus:border-[#ecc880] focus:ring-2 focus:ring-[#ecc880]/15 w-full sm:w-56"
                    />
                  </div>
                  <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#1e1e1c] border border-[#ecc880]/25">
                    <button
                      onClick={() => setProductStatusFilter('activo')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        productStatusFilter === 'activo' ? 'bg-[#ecc880] text-[#151513] shadow-sm' : 'text-[#8c8884] hover:text-[#ecc880]'
                      }`}
                    >
                      🟢 Activos
                    </button>
                    <button
                      onClick={() => setProductStatusFilter('terminado')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        productStatusFilter === 'terminado' ? 'bg-[#ecc880] text-[#151513] shadow-sm' : 'text-[#8c8884] hover:text-[#ecc880]'
                      }`}
                    >
                      ⚫ Terminados
                    </button>
                    <button
                      onClick={() => setProductStatusFilter('todos')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        productStatusFilter === 'todos' ? 'bg-[#ecc880] text-[#151513] shadow-sm' : 'text-[#8c8884] hover:text-[#ecc880]'
                      }`}
                    >
                      Todos
                    </button>
                  </div>
                  <button
                    onClick={openProducto}
                    className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#ecc880] to-[#c89b6b] text-[#151513] font-extrabold text-xs shadow-md shadow-black/30 hover:opacity-95 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 shrink-0" strokeWidth={3} />
                    Registrar Producto
                  </button>
                </div>
              </div>

              {productLoading ? (
                <div className="py-12 text-center text-[#8c8884] text-sm font-medium">Cargando productos...</div>
              ) : products.length === 0 ? (
                <div className="py-12 text-center">
                  <Package className="w-12 h-12 text-[#ecc880]/40 mx-auto mb-3" />
                  <p className="text-sm text-[#8c8884] font-medium">
                    {productSearch ? 'No se encontraron productos con ese nombre.' : 'Aún no tienes productos registrados.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {products.map((p) => {
                    const isTerminated = p.status === 'terminado';
                    // Products terminados no participan en el semáforo de vencimiento
                    const state = isTerminated
                      ? { color: 'gray', label: 'Terminado / Agotado', days: null }
                      : getExpirationState(p.expiration_date);
                    const colorMap = {
                      green: { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
                      yellow: { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/30', dot: 'bg-amber-400' },
                      red: { bg: 'bg-rose-500/15', text: 'text-rose-300', border: 'border-rose-500/30', dot: 'bg-rose-400' },
                      gray: { bg: 'bg-slate-500/15', text: 'text-slate-300', border: 'border-slate-500/30', dot: 'bg-slate-400' },
                    };
                    const c = colorMap[state.color];
                    return (
                      <div key={p.id} className={`relative rounded-2xl border ${c.border} bg-[#1e1e1c] p-5 transition-all hover:border-[#ecc880]/60 hover:shadow-lg hover:shadow-black/30 ${isTerminated ? 'opacity-70 grayscale-[35%]' : ''}`}>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h4 className={`font-extrabold text-base leading-tight flex-1 ${isTerminated ? 'text-[#8c8884] line-through' : 'text-white'}`}>{p.name}</h4>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${c.bg} ${c.text} text-[10px] font-extrabold uppercase tracking-wider border ${c.border}`}>
                            <span className={`w-2 h-2 rounded-full ${c.dot}`}></span>
                            {isTerminated ? 'Terminado' : ''}
                            {!isTerminated && state.color === 'green' && 'Vigente'}
                            {!isTerminated && state.color === 'yellow' && 'Por vencer'}
                            {!isTerminated && state.color === 'red' && 'Caducado'}
                            {!isTerminated && state.color === 'gray' && 'Sin fecha'}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-[#8c8884] font-medium">
                          <div className="flex items-center justify-between">
                            <span className="text-[#8c8884]">Cantidad:</span>
                            <span className="font-bold text-white">{isTerminated ? 0 : p.quantity}</span>
                          </div>
                          {p.price > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-[#8c8884]">Precio:</span>
                              <span className="font-bold text-[#ecc880]">S/ {Number(p.price).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-[#8c8884]">Compra:</span>
                            <span className="font-bold text-white">{p.purchase_date}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#8c8884]">Caducidad:</span>
                            <span className="font-bold text-white">{p.expiration_date}</span>
                          </div>
                          <div className="flex items-center justify-between pt-1.5 border-t border-[#ecc880]/15">
                            <span className="text-[#8c8884]">Apertura:</span>
                            <span className={`font-bold ${p.start_date ? 'text-white' : 'text-[#8c8884] italic'}`}>
                              {p.start_date || 'Sin abrir'}
                            </span>
                          </div>
                        </div>

                        <div className={`mt-3 text-[11px] font-bold ${c.text}`}>
                          {isTerminated ? '⚠️ Terminado / Agotado — fuera del semáforo de vencimiento' : state.label}
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-[#ecc880]/15">
                          {!isTerminated && !p.start_date && (
                            <button
                              onClick={() => handleOpenToday(p.id)}
                              className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#ecc880]/10 border border-[#ecc880]/40 text-[#ecc880] hover:bg-[#ecc880]/25 font-bold text-xs transition-colors cursor-pointer"
                              title="Marca este producto como abierto hoy"
                            >
                              <CalendarCheck className="w-3.5 h-3.5" />
                              Abrir Hoy
                            </button>
                          )}
                          {!isTerminated && (
                            <button
                              onClick={() => handleFinishProduct(p.id)}
                              className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#1e1e1c] border border-[#ecc880]/25 text-[#ecc880] hover:border-[#ecc880] font-bold text-xs transition-colors cursor-pointer"
                              title="Marcar este producto como terminado/agotado"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Terminado
                            </button>
                          )}
                          {isTerminated && (
                            <button
                              onClick={() => handleReactivateProduct(p.id)}
                              className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/25 font-bold text-xs transition-colors cursor-pointer"
                              title="Volver a activar este producto"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Reactivar
                            </button>
                          )}
                          <button
                            onClick={() => openEditProduct(p)}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#1e1e1c] border border-[#ecc880]/25 text-[#ecc880] hover:border-[#ecc880] font-bold text-xs transition-colors cursor-pointer"
                            title="Editar producto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#1e1e1c] border border-rose-400/40 text-rose-300 hover:bg-rose-500/20 font-bold text-xs transition-colors cursor-pointer"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

</main>

        {/* ================= MODAL: REGISTRAR SERVICIO (overlay + backdrop blur) ================= */}
        {showRegistroModal && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#1e1e1c]/60 backdrop-blur-md sm:p-4"
            onClick={closeRegistro}
          >
            <section
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[88vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#f9cee3] flex flex-col overflow-hidden animate-modal"
            >
              {/* CABECERA: cierre a la IZQUIERDA */}
              <div className="shrink-0 flex items-center justify-between gap-3 border-b border-[#fce3ed] px-4 py-3 sm:px-6">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={closeRegistro}
                    aria-label="Cerrar registro de servicio"
                    className="p-2 rounded-xl bg-[#fce3ed] text-[#1e1e1c] hover:bg-[#f9cee3] cursor-pointer shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-extrabold text-[#1e1e1c] truncate">Registrar Servicio</h3>
                    <p className="text-[10px] sm:text-xs text-[#8c8884] truncate">Comisión automática según salón y servicio</p>
                  </div>
                </div>
                <span className="hidden sm:inline text-[10px] bg-[#fdebdd] text-[#b8860b] px-2.5 py-1 rounded-full border border-[#edd5b6] font-extrabold whitespace-nowrap">
                  GUADALUPE MAKE UP
                </span>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5 flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">

                    {/* 0. SALÓN / ESTUDIO (obligatorio) */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#4a4744] flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-[#ec71a8]" />
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
                      <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#4a4744] flex items-center gap-1.5">
                        <CalendarIcon className="w-4 h-4 text-[#ec71a8]" />
                        Fecha del Servicio
                      </label>
                      <input
                        type="date"
                        value={regDate}
                        onChange={(e) => setRegDate(e.target.value)}
                        className="p-3 sm:p-3.5 border border-[#f9cee3] rounded-2xl text-sm font-semibold outline-none focus:border-[#ec71a8] focus:ring-3 focus:ring-[#ec71a8]/15 bg-[#faf5f8] focus:bg-white transition-all"
                        required
                      />
                    </div>

                    {/* 2. SERVICIO REALIZADO */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#4a4744] flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#ec71a8]" />
                        Servicio Realizado
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Maquillaje Social"
                        value={regService}
                        onChange={(e) => handleRegServiceChange(e.target.value)}
                        disabled={esMaison(regSalonId)}
                        className="p-3 sm:p-3.5 border border-[#f9cee3] rounded-2xl text-sm font-semibold outline-none focus:border-[#ec71a8] focus:ring-3 focus:ring-[#ec71a8]/15 bg-[#faf5f8] focus:bg-white transition-all disabled:bg-[#fce3ed]/60 disabled:text-[#8c8884] disabled:cursor-not-allowed"
                        required
                      />
                      {esMaison(regSalonId) && (
                        <span className="text-[10px] font-bold text-[#ec71a8]">
                          Maison Studio solo permite Maquillaje
                        </span>
                      )}
                    </div>

                    {/* 3. PRECIO COBRADO */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#4a4744] flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-[#ec71a8]" />
                        Precio Cobrado (S/)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={regPrice}
                        onChange={(e) => setRegPrice(e.target.value)}
                        className="p-3 sm:p-3.5 border border-[#f9cee3] rounded-2xl text-sm font-bold outline-none focus:border-[#ec71a8] focus:ring-3 focus:ring-[#ec71a8]/15 bg-[#faf5f8] focus:bg-white transition-all"
                        required
                      />
                    </div>

                    {/* 4. COMISIÓN (autocompletada, ajustable) */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#4a4744] flex items-center gap-1.5">
                        <Percent className="w-4 h-4 text-[#ec71a8]" />
                        Comisión (% Mi Ganancia)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={regCommission}
                        onChange={(e) => setRegCommission(Number(e.target.value) || 0)}
                        className="p-3 sm:p-3.5 border border-[#f9cee3] rounded-2xl text-sm font-bold outline-none focus:border-[#ec71a8] focus:ring-3 focus:ring-[#ec71a8]/15 bg-[#faf5f8] focus:bg-white transition-all"
                        required
                      />
                      <span className="text-[10px] font-semibold text-[#8c8884]">
                        {esMaison(regSalonId)
                          ? 'Auto: Maison Studio · Maquillaje 60%'
                          : 'Auto: Maquillaje 40% · otros servicios 30%'}
                      </span>
                    </div>

                  </div>

                  {/* SERVICIOS EXTRA: misma clienta, misma transacción */}
                  <div className="rounded-2xl border border-dashed border-[#f9cee3] bg-[#fff9fb] p-3 sm:p-5 flex flex-col gap-3">
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
                  </div>

                  {/* VISTA PREVIA DEL CÁLCULO EN VIVO (suma del servicio principal + extras) */}
                  {batchLivePrice > 0 && (
                    <div className="bg-gradient-to-r from-[#fff5f8] via-[#fdf2f7] to-[#fdebdd]/40 border border-[#f9cee3] rounded-2xl p-3.5 sm:p-5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#ec71a8]" />
                        <span className="font-extrabold text-xs sm:text-sm text-[#1e1e1c]">
                          Cálculo en Tiempo Real{itemsCount > 1 ? ` (${itemsCount} servicios)` : ''}:
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm">
                        <div>
                          <span className="text-[#8c8884] font-medium">Total: </span>
                          <span className="font-extrabold text-[#1e1e1c]">S/ {batchLivePrice.toFixed(2)}</span>
                        </div>
                        <div className="bg-[#ec71a8] text-white px-3 py-1.5 rounded-xl font-extrabold shadow-sm">
                          Mi Ganancia: S/ {batchLiveMyGain.toFixed(2)}
                        </div>
                        <div className="bg-[#1e1e1c] text-[#ecc880] px-3 py-1.5 rounded-xl font-bold">
                          Salón: S/ {batchLiveSalonGain.toFixed(2)}
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
                    {itemsCount > 1 && (
                      <span className="bg-white/25 rounded-full px-1.5 py-0.5 text-[10px] font-black">{itemsCount}</span>
                    )}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
        {/* ================= MODAL: REGISTRAR PRODUCTO (overlay, negro & dorado) ================= */}
        {showProductModal && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md sm:p-4"
            onClick={closeProducto}
          >
            <section
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[88vh] rounded-t-3xl sm:rounded-3xl bg-[#151513] border border-[#ecc880]/30 shadow-2xl flex flex-col overflow-hidden animate-modal"
            >
              {/* CABECERA: cierre a la IZQUIERDA */}
              <div className="shrink-0 flex items-center justify-between gap-3 border-b border-[#ecc880]/20 px-4 py-3 sm:px-6">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={closeProducto}
                    aria-label="Cerrar registro de producto"
                    className="p-2 rounded-xl bg-[#ecc880]/15 text-[#ecc880] hover:bg-[#ecc880]/25 cursor-pointer shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-extrabold text-white truncate">Registrar Producto</h3>
                    <p className="text-[10px] sm:text-xs text-[#8c8884] truncate">Inventario unitario · caducidad automática</p>
                  </div>
                </div>
                <span className="hidden sm:inline text-[10px] bg-[#ecc880]/15 text-[#ecc880] px-2.5 py-1 rounded-full border border-[#ecc880]/40 font-extrabold whitespace-nowrap">
                  INVENTARIO
                </span>
              </div>

              <form onSubmit={handleCreateProduct} className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5 grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#ecc880]/80 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#ecc880]" />
                      Nombre del producto
                    </label>
                    <input
                      type="text"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      placeholder="Ej: Pestañina Maybelline"
                      className="w-full p-3 border border-[#ecc880]/25 rounded-2xl text-sm font-bold outline-none bg-[#1e1e1c] text-white placeholder-[#8c8884] focus:border-[#ecc880] focus:ring-2 focus:ring-[#ecc880]/15"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#ecc880]/80 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-[#ecc880]" />
                      Cantidad
                    </label>
                    <input
                      type="number"
                      value={1}
                      disabled
                      readOnly
                      aria-label="Cantidad fija: 1 unidad"
                      className="w-full p-3 border border-[#ecc880]/15 rounded-2xl text-sm font-bold bg-[#ecc880]/10 text-[#8c8884] cursor-not-allowed outline-none"
                    />
                    <span className="text-[10px] font-semibold text-[#8c8884]">Stock unitario · 1 por producto</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#ecc880]/80 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-[#ecc880]" />
                      Precio / Costo (S/)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full p-3 border border-[#ecc880]/25 rounded-2xl text-sm font-bold outline-none bg-[#1e1e1c] text-white placeholder-[#8c8884] focus:border-[#ecc880] focus:ring-2 focus:ring-[#ecc880]/15"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#ecc880]/80 flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-[#ecc880]" />
                      Fecha de compra
                    </label>
                    <input
                      type="date"
                      value={prodPurchaseDate}
                      onChange={(e) => handlePurchaseDateChange(e.target.value)}
                      className="w-full p-3 border border-[#ecc880]/25 rounded-2xl text-sm font-bold outline-none bg-[#1e1e1c] text-white [color-scheme:dark] focus:border-[#ecc880] focus:ring-2 focus:ring-[#ecc880]/15"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#ecc880]/80 flex items-center gap-1.5">
                      <CalendarCheck className="w-3.5 h-3.5 text-[#ecc880]" />
                      Fecha de apertura <span className="text-[#8c8884] normal-case font-medium">(opcional)</span>
                    </label>
                    <input
                      type="date"
                      value={prodStartDate}
                      onChange={(e) => setProdStartDate(e.target.value)}
                      className="w-full p-3 border border-[#ecc880]/25 rounded-2xl text-sm font-bold outline-none bg-[#1e1e1c] text-white [color-scheme:dark] focus:border-[#ecc880] focus:ring-2 focus:ring-[#ecc880]/15"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#ecc880]/80 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#ecc880]" />
                      Caducidad
                    </label>
                    <BrandSelect
                      value={prodExpiryPreset}
                      onChange={handleExpiryPresetChange}
                      dark
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
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#ecc880]/80 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#ecc880]" />
                      Fecha de caducidad
                    </label>
                    <input
                      type="date"
                      value={prodExpirationDate}
                      onChange={(e) => { setProdExpirationDate(e.target.value); setProdExpiryPreset(''); }}
                      className="w-full p-3 border border-[#ecc880]/25 rounded-2xl text-sm font-bold outline-none bg-[#1e1e1c] text-white [color-scheme:dark] focus:border-[#ecc880] focus:ring-2 focus:ring-[#ecc880]/15"
                      required
                    />
                    <span className="text-[10px] font-semibold text-[#8c8884]">Se calcula sola con 6 o 12 meses</span>
                  </div>
                </div>

                <div className="shrink-0 border-t border-[#ecc880]/20 bg-[#151513] px-4 sm:px-6 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={closeProducto}
                    className="px-5 py-3 rounded-2xl border border-[#8c8884]/40 bg-[#1e1e1c] hover:border-[#ecc880]/60 text-[#8c8884] hover:text-[#ecc880] font-bold text-sm cursor-pointer whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#ecc880] to-[#c89b6b] text-[#151513] font-extrabold text-sm shadow-lg shadow-black/40 hover:opacity-95 cursor-pointer flex items-center gap-2 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 shrink-0" strokeWidth={3} />
                    Registrar
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}


      {/* ================= NAVEGACIÓN INFERIOR MÓVIL (3 pestañas + FAB flotante) ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#ec71a8]/20 shadow-[0_-4px_20px_rgba(236,113,168,0.10)] pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-3 items-end">
          <button
            onClick={() => setActiveTab('resumen')}
            aria-label="Resumen general"
            className={`flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${activeTab === 'resumen' ? 'text-[#ec71a8]' : 'text-[#8c8884]'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-bold">Resumen</span>
          </button>
          <button
            onClick={() => setActiveTab('productos')}
            aria-label="Mis productos"
            className={`flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${activeTab === 'productos' ? 'text-[#ec71a8]' : 'text-[#8c8884]'}`}
          >
            <Package className="w-5 h-5" />
            <span className="text-[10px] font-bold">Productos</span>
          </button>
          <button
            onClick={() => setActiveTab('informes')}
            aria-label="Informes y edición"
            className={`flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${activeTab === 'informes' ? 'text-[#ec71a8]' : 'text-[#8c8884]'}`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px] font-bold">Informes</span>
          </button>
        </div>
      </nav>

      {/* ================= FAB ARRASTRABLE: REGISTRAR SERVICIO (móvil, abajo a la derecha) ================= */}
      {!anyModalOpen && activeTab !== 'productos' && (
        <button
          type="button"
          {...serviceFab.handlers}
          style={serviceFab.style}
          aria-label="Registrar nuevo servicio"
          title="Registrar servicio · mantén pulsado para mover"
          className="md:hidden fixed z-40 w-14 h-14 rounded-full bg-gradient-to-r from-[#ec71a8] to-[#d95392] text-white flex items-center justify-center shadow-lg shadow-[#ec71a8]/40 ring-4 ring-white select-none cursor-grab active:cursor-grabbing"
        >
          <Plus className="w-6 h-6" strokeWidth={3} />
        </button>
      )}

      {/* ================= FAB EXCLUSIVO DE PRODUCTOS (negro & dorado) ================= */}
      {!anyModalOpen && activeTab === 'productos' && (
        <button
          type="button"
          {...productFab.handlers}
          style={productFab.style}
          aria-label="Registrar producto"
          title="Registrar producto · mantén pulsado para mover"
          className="md:hidden fixed z-40 w-14 h-14 rounded-full bg-gradient-to-br from-[#2c2b28] to-[#151513] text-[#ecc880] border border-[#ecc880]/60 flex items-center justify-center shadow-lg shadow-black/40 ring-2 ring-[#ecc880]/40 select-none cursor-grab active:cursor-grabbing"
        >
          <Plus className="w-6 h-6" strokeWidth={3} />
        </button>
      )}

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
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="p-3.5 border border-[#f9cee3] rounded-2xl text-sm font-semibold outline-none focus:border-[#ec71a8] focus:ring-2 focus:ring-[#ec71a8]/15 bg-[#faf5f8]"
                  required
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
                    className="p-3.5 border border-[#f9cee3] rounded-2xl text-sm font-bold outline-none focus:border-[#ec71a8] focus:ring-2 focus:ring-[#ec71a8]/15 bg-[#faf5f8]"
                    required
                  />
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