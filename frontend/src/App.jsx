import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  CalendarRange,
  ChevronLeft, 
  ChevronRight, 
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
            <path d="M42 28 C28 28, 22 40, 22 52 C22 66, 32 76, 48 76 C60 76, 68 70, 72 62 L64 58 C60 64, 55 68, 48 68 C37 68, 30 60, 30 52 C30 44, 35 36, 43 36 C52 36, 56 42, 57 48 L65 48 C64 36, 56 28, 42 28 Z" fill="url(#goldGrad)" />
            <path d="M50 48 H72 C77 48, 80 52, 80 56 C80 61, 76 64, 71 64 L65 64 L74 76 H64 L56 64 H56" stroke="url(#goldGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {/* Corazón / Detalle de brillo Make Up */}
            <path d="M74 34 C72 30, 68 30, 66 33 C64 30, 60 30, 58 34 C58 39, 66 45, 66 45 C66 45, 74 39, 74 34 Z" fill="#ec71a8" />
            <circle cx="78" cy="26" r="2.5" fill="#f9cee3" />
            <defs>
              <linearGradient id="goldGrad" x1="20" y1="20" x2="85" y2="85" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fdf0cd" />
                <stop offset="0.5" stopColor="#d4af37" />
                <stop offset="1" stopColor="#aa7c11" />
              </linearGradient>
            </defs>
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

export default function App() {
  // Navegación ('resumen' | 'nuevo_servicio' | 'productos' | 'informes')
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

  // Formulario de nuevo producto
  const todayYMDProduct = todayYMD; // reutilizamos el todayYMD ya definido arriba
  const [prodName, setProdName] = useState('');
  const [prodQuantity, setProdQuantity] = useState(1);
  const [prodPrice, setProdPrice] = useState('');
  const [prodPurchaseDate, setProdPurchaseDate] = useState(todayYMDProduct);
  const [prodStartDate, setProdStartDate] = useState('');
  const [prodExpirationDate, setProdExpirationDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });

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
  const [showCalendarWidget, setShowCalendarWidget] = useState(false);
  const [calViewDate, setCalViewDate] = useState(() => new Date());

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
  const liveSalonGain = livePrice - liveMyGain;

  // Cálculos en vivo (Modal de Edición)
  const editLivePrice = parseFloat(editPrice) || 0;
  const editLiveMyGain = editLivePrice * (editCommission / 100);
  const editLiveSalonGain = editLivePrice - editLiveMyGain;

  // Cambio de salón en el formulario: recalcula comisión y, en Maison, fuerza Maquillaje
  const handleRegSalonChange = (val) => {
    setRegSalonId(val);
    if (esMaison(val)) {
      setRegService('Maquillaje');
      setRegCommission(60);
    } else {
      setRegCommission(comisionSugerida(val, regService));
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

  // Envío nuevo servicio
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!regSalonId) { showToast('Selecciona el salón/estudio', 'error'); return; }
    if (!regService.trim()) return;
    const priceNum = parseFloat(regPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;

    const commNum = Number(regCommission);
    const myGain = Math.round(priceNum * (commNum / 100) * 100) / 100;
    const salongain = Math.round((priceNum - myGain) * 100) / 100;

    const dateObj = new Date(regDate + 'T00:00:00');
    const sMonth = dateObj.getMonth() + 1;
    const sYear = dateObj.getFullYear();

    const newEntry = {
      id: Date.now(),
      date: regDate,
      week: getWeekOfMonth(regDate),
      service: regService.trim(),
      price: priceNum,
      commission: commNum,
      myGain: myGain,
      salongain: salongain,
      salon_id: Number(regSalonId),
      salon_name: salonNombre(regSalonId),
      month: sMonth,
      year: sYear
    };

    try {
      const res = await fetch(`${API_BASE_URL}/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha: regDate,
          servicio_nombre: regService.trim(),
          precio: priceNum,
          porcentaje: commNum,
          salon_id: Number(regSalonId)
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.entry) {
          newEntry.id = data.entry.id;
        }
      }
    } catch (err) {
      console.log('Guardado local activado');
    }

    setServices((prev) => [newEntry, ...prev]);
    setRegService('');
    setRegPrice('');
    showToast('¡Servicio registrado con éxito!', 'success');
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
      quantity: Number(prodQuantity) || 1,
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
      setProdName('');
      setProdQuantity(1);
      setProdPrice('');
      setProdStartDate('');
      const d = new Date();
      d.setMonth(d.getMonth() + 6);
      setProdExpirationDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
      setProdPurchaseDate(todayYMD);
      await fetchProducts(productSearch, productStatusFilter);
    } catch (err) {
      showToast(err.message || 'Error al registrar', 'error');
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

  const reportTotalMyGain = filteredServices.reduce((acc, curr) => acc + curr.myGain, 0);
  const reportTotalSalonGain = filteredServices.reduce((acc, curr) => acc + curr.salongain, 0);
  const reportTotalFacturado = filteredServices.reduce((acc, curr) => acc + curr.price, 0);

  // Fechas con servicios
  const datesWithServices = useMemo(() => {
    const set = new Set();
    services.forEach((s) => set.add(s.date));
    return set;
  }, [services]);

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
    } else if (type === 'all') {
      setFilterFrom('');
      setFilterTo('');
    }
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

  // Mini Calendario
  const currentMonthYearStr = calViewDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  const calendarDays = useMemo(() => {
    const year = calViewDate.getFullYear();
    const month = calViewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
      days.push({
        dayNumber: d,
        dateStr: dateStr,
        hasServices: datesWithServices.has(dateStr),
        isSelectedStart: filterFrom === dateStr,
        isSelectedEnd: filterTo === dateStr,
        isInRange: filterFrom && filterTo && dateStr >= filterFrom && dateStr <= filterTo
      });
    }
    return days;
  }, [calViewDate, filterFrom, filterTo, datesWithServices]);

  const handleCalendarDayClick = (dateStr) => {
    if (!filterFrom || (filterFrom && filterTo)) {
      setFilterFrom(dateStr);
      setFilterTo('');
    } else if (filterFrom && !filterTo) {
      if (dateStr < filterFrom) {
        setFilterTo(filterFrom);
        setFilterFrom(dateStr);
      } else {
        setFilterTo(dateStr);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#faf5f8] text-[#1e1e1c] flex flex-col md:flex-row antialiased">
      
      {/* TOAST FLOTANTE DE NOTIFICACIONES */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 animate-modal flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border border-white/60 backdrop-blur-md bg-[#1e1e1c] text-white font-bold text-sm">
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

            {/* 2. NUEVO REGISTRO */}
            <button
              onClick={() => { setActiveTab('nuevo_servicio'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                activeTab === 'nuevo_servicio'
                  ? 'bg-gradient-to-r from-[#ec71a8] to-[#d95392] text-white shadow-lg shadow-[#ec71a8]/25 translate-x-1'
                  : 'text-[#4a4744] hover:bg-[#fce3ed]/60 hover:text-[#1e1e1c]'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeTab === 'nuevo_servicio' ? 'bg-white/20' : 'bg-[#fce3ed] text-[#ec71a8]'}`}>
                <PlusCircle className="w-4 h-4" />
              </div>
              <div className="text-left flex-1">
                <span className="block font-extrabold">Registrar Servicio</span>
                <span className={`text-[11px] block font-medium ${activeTab === 'nuevo_servicio' ? 'text-pink-100' : 'text-[#8c8884]'}`}>
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

      {/* ================= CABECERA MÓVIL ================= */}
      <div className="md:hidden sticky top-0 z-30 bg-[#faf5f8]/95 backdrop-blur-md border-b border-[#ec71a8]/20 px-4 py-3 flex items-center justify-between">
        <BrandLogo compact />
        <span className="text-xs font-extrabold uppercase tracking-widest text-[#ec71a8]">
          {activeTab === 'resumen' && 'Resumen'}
          {activeTab === 'nuevo_servicio' && 'Registrar Servicio'}
          {activeTab === 'productos' && 'Mis Productos'}
          {activeTab === 'informes' && 'Informes'}
        </span>
      </div>

      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <main className="flex-1 p-4 sm:p-8 pb-28 md:pb-8 max-w-7xl w-full mx-auto flex flex-col gap-8 overflow-y-auto">

        {/* HEADER DE BIENVENIDA Y CONTROL DE MES */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/90 backdrop-blur-sm border border-[#ec71a8]/20 rounded-3xl p-6 sm:p-7 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#ec71a8] mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Sistema de Gestión
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1e1e1c] tracking-tight">
              {activeTab === 'resumen' && 'Panel de Rendimiento Mensual'}
              {activeTab === 'nuevo_servicio' && 'Nuevo Registro de Servicio'}
              {activeTab === 'productos' && 'Registro y Control de Productos'}
              {activeTab === 'informes' && 'Historial, Edición e Informes'}
            </h2>
            <p className="text-sm text-[#6b6764] font-medium mt-1">
              {activeTab === 'resumen' && 'El panel se actualiza automáticamente al inicio de cada mes.'}
              {activeTab === 'nuevo_servicio' && 'Calcula comisiones y distribuye la ganancia al instante.'}
              {activeTab === 'productos' && 'Lleva el inventario de tu maquillaje y controla vencimientos con semáforo 🟢🟡🔴.'}
              {activeTab === 'informes' && 'Consulta cualquier rango de fechas, edita o elimina servicios registrados.'}
            </p>
          </div>

          {/* SELECTOR DE MES DINÁMICO (Para Resumen General) */}
          {activeTab === 'resumen' && (
            <div className="w-full sm:w-auto flex items-center justify-between gap-1.5 sm:gap-2 bg-[#fdf2f7] p-1.5 sm:p-2 rounded-2xl border border-[#f9cee3] flex-nowrap shrink-0 shadow-xs">
              <button
                onClick={handlePrevDashboardMonth}
                className="p-2 sm:p-2.5 rounded-xl bg-white hover:bg-[#fce3ed] text-[#1e1e1c] transition-colors border border-[#f9cee3]/60 shadow-xs cursor-pointer shrink-0"
                title="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-2 sm:px-3 py-1 flex items-center justify-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial text-center min-w-0">
                <CalendarIcon className="w-4 h-4 text-[#ec71a8] shrink-0" />
                <span className="font-extrabold text-xs sm:text-base text-[#1e1e1c] capitalize whitespace-nowrap truncate">
                  {monthNames[selectedDashboardMonth - 1]} {selectedDashboardYear}
                </span>
                {isViewingCurrentMonth ? (
                  <span className="text-[9px] sm:text-[10px] font-black uppercase bg-[#ec71a8] text-white px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                    Mes en curso
                  </span>
                ) : (
                  <button
                    onClick={handleCurrentDashboardMonth}
                    className="text-[10px] sm:text-[11px] font-bold text-[#ec71a8] hover:underline cursor-pointer whitespace-nowrap shrink-0"
                  >
                    (Volver a Hoy)
                  </button>
                )}
              </div>

              <button
                onClick={handleNextDashboardMonth}
                className="p-2 sm:p-2.5 rounded-xl bg-white hover:bg-[#fce3ed] text-[#1e1e1c] transition-colors border border-[#f9cee3]/60 shadow-xs cursor-pointer shrink-0"
                title="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {activeTab !== 'resumen' && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold bg-[#fce3ed] text-[#ec71a8] px-3.5 py-1.5 rounded-xl border border-[#f9cee3]">
                {services.length} {services.length === 1 ? 'servicio registrado' : 'servicios registrados'}
              </span>
            </div>
          )}
        </header>

        {/* ================= VISTA 1: RESUMEN GENERAL (REINICIO A CERO CADA MES) ================= */}
        {activeTab === 'resumen' && (
          <div className="flex flex-col gap-8 animate-in fade-in duration-300">
            
            {/* TARJETAS PRINCIPALES DEL MES */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* 1. MI GANANCIA NETA DEL MES */}
              <div className="card-luxury rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#ec71a8]/15 to-transparent rounded-full blur-2xl"></div>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#ec71a8] bg-[#fce3ed] px-3 py-1 rounded-lg border border-[#f9cee3]">
                    Mi Ganancia Neta
                  </span>
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#ec71a8] to-[#d95392] text-white flex items-center justify-center shadow-md shadow-[#ec71a8]/30">
                    <DollarSign className="w-5 h-5 stroke-[2.5]" />
                  </div>
                </div>
                <div className="mt-5">
                  <div className="text-4xl sm:text-5xl font-black text-[#1e1e1c] tracking-tight">
                    S/ {monthMyGain.toFixed(2)}
                  </div>
                  <div className="mt-2.5 text-xs font-semibold text-[#6b6764] flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#ec71a8]"></span>
                    {monthGoalProgressPct}% alcanzado de la meta mensual
                  </div>
                </div>
              </div>

              {/* 2. GANANCIA SALÓN DEL MES */}
              <div className="card-luxury rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#6b6764] bg-[#f5f3ef] px-3 py-1 rounded-lg border border-[#e5e1da]">
                    Ganancia Salón
                  </span>
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#1e1e1c] to-[#3a3936] text-[#ecc880] flex items-center justify-center shadow-md">
                    <Store className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-5">
                  <div className="text-3xl sm:text-4xl font-extrabold text-[#1e1e1c] tracking-tight">
                    S/ {monthSalonGain.toFixed(2)}
                  </div>
                  <div className="mt-2.5 text-xs font-semibold text-[#6b6764]">
                    Local, insumos y mantenimiento
                  </div>
                </div>
              </div>

              {/* 3. TOTAL FACTURADO EN EL MES */}
              <div className="card-luxury rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#b8860b] bg-[#fdebdd] px-3 py-1 rounded-lg border border-[#edd5b6]">
                    Total Facturado
                  </span>
                  <div className="w-11 h-11 rounded-2xl bg-gradient-gold text-white flex items-center justify-center shadow-md shadow-[#d4af37]/30">
                    <TrendingUp className="w-5 h-5 stroke-[2.5]" />
                  </div>
                </div>
                <div className="mt-5">
                  <div className="text-3xl sm:text-4xl font-extrabold text-[#1e1e1c] tracking-tight">
                    S/ {monthFacturado.toFixed(2)}
                  </div>
                  <div className="mt-2.5 text-xs font-semibold text-[#6b6764]">
                    {monthlyServices.length} {monthlyServices.length === 1 ? 'servicio en el mes' : 'servicios en el mes'}
                  </div>
                </div>
              </div>

              {/* 4. META DEL MES CON BARRA DE PROGRESO */}
              <div className="card-luxury rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#ec71a8] bg-[#fce3ed] px-3 py-1 rounded-lg border border-[#f9cee3]">
                    Meta ({monthNames[selectedDashboardMonth - 1]})
                  </span>
                  <div className="w-11 h-11 rounded-2xl bg-[#fdebdd] border border-[#d4af37]/40 text-[#b8860b] flex items-center justify-center">
                    <Target className="w-5 h-5" />
                  </div>
                </div>

                <div className="mt-5">
                  <div className="text-2xl sm:text-3xl font-black text-[#1e1e1c]">
                    {monthRemainingGoal > 0 ? (
                      <span>Faltan S/ {monthRemainingGoal.toFixed(2)}</span>
                    ) : (
                      <span className="text-[#ec71a8] flex items-center gap-1.5">
                        ¡Meta Cumplida! <Sparkles className="w-5 h-5 text-[#ecc880]" />
                      </span>
                    )}
                  </div>

                  <div className="mt-3.5 w-full bg-[#fce3ed] h-3.5 rounded-full overflow-hidden p-0.5 border border-[#f9cee3]">
                    <div 
                      className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-[#d4af37] via-[#ec71a8] to-[#d95392]"
                      style={{ width: `${monthGoalProgressPct}%` }}
                    ></div>
                  </div>

                  <div className="mt-2 flex justify-between text-[11px] font-bold text-[#8c8884]">
                    <span>S/ 0.00</span>
                    <span className="text-[#ec71a8] font-extrabold">{monthGoalProgressPct}%</span>
                    <span>S/ {goalAmount.toFixed(0)}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* SECCIÓN DINÁMICA: EVOLUCIÓN SEMANAL & DESGLOSE POR COMISIÓN */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* RENDIMIENTO SEMANAL (SEMANAS 1 A 5) */}
              <div className="card-luxury rounded-3xl p-6 lg:col-span-2 flex flex-col justify-between">
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

                <button
                  onClick={() => setActiveTab('nuevo_servicio')}
                  className="mt-6 w-full py-3 rounded-2xl bg-gradient-to-r from-[#ec71a8] to-[#d95392] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#ec71a8]/25 hover:opacity-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Registrar Servicio en este Mes
                </button>
              </div>

            </div>

            {/* TABLA DE ÚLTIMO SERVICIO REGISTRADO DEL MES (SOLO 1 REGISTRO, EL MÁS ACTUAL) */}
            <div className="card-luxury rounded-3xl p-6 sm:p-7">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-extrabold text-[#1e1e1c]">
                      Último Servicio de {monthNames[selectedDashboardMonth - 1]} {selectedDashboardYear}
                    </h3>
                    <span className="text-[11px] font-black uppercase bg-[#fce3ed] text-[#ec71a8] px-2.5 py-0.5 rounded-full border border-[#f9cee3]">
                      Más reciente
                    </span>
                  </div>
                  <p className="text-xs text-[#8c8884] mt-0.5">
                    Mostrando el servicio más reciente del mes. Para ver el historial completo, accede a Informes.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('informes')}
                  className="px-4 py-2 rounded-xl bg-[#fce3ed] text-[#ec71a8] hover:bg-[#f9cee3] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  Ver todos los informes <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="hidden md:block overflow-x-auto rounded-2xl border border-[#fce3ed]">
                <table className="w-full text-left border-collapse min-w-[650px]">
                  <thead>
                    <tr className="bg-[#1e1e1c] text-white text-[11px] font-black uppercase tracking-wider">
                      <th className="p-3.5">Fecha</th>
                      <th className="p-3.5">Semana</th>
                      <th className="p-3.5">Servicio Realizado</th>
                      <th className="p-3.5">Salón</th>
                      <th className="p-3.5">Cobrado (S/)</th>
                      <th className="p-3.5">Comisión</th>
                      <th className="p-3.5">Mi Ganancia</th>
                      <th className="p-3.5">Ganancia Salón</th>
                      <th className="p-3.5 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#fce3ed] text-sm bg-white">
                    {monthlyServices.length > 0 ? (
                      monthlyServices.slice(0, 1).map((item) => (
                        <tr key={item.id} className="hover:bg-[#fff5f8] transition-colors">
                          <td className="p-3.5 whitespace-nowrap font-bold text-[#1e1e1c]">{item.date}</td>
                          <td className="p-3.5 whitespace-nowrap text-[#8c8884] font-semibold">{item.week}</td>
                          <td className="p-3.5 whitespace-nowrap font-extrabold text-[#1e1e1c]">{item.service}</td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-[#f5f3ef] text-[#6b6764] border border-[#e5e1da]">
                              {salonNombre(item.salon_id)}
                            </span>
                          </td>
                          <td className="p-3.5 whitespace-nowrap font-bold text-[#1e1e1c]">S/ {item.price.toFixed(2)}</td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${
                              item.commission === 40
                                ? 'bg-[#fce3ed] text-[#ec71a8] border-[#f9cee3]'
                                : 'bg-[#fdebdd] text-[#b8860b] border-[#edd5b6]'
                            }`}>
                              {item.commission}%
                            </span>
                          </td>
                          <td className="p-3.5 whitespace-nowrap font-black text-[#ec71a8] text-base">
                            S/ {item.myGain.toFixed(2)}
                          </td>
                          <td className="p-3.5 whitespace-nowrap font-semibold text-[#6b6764]">
                            S/ {item.salongain.toFixed(2)}
                          </td>
                          <td className="p-3.5 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* BOTÓN EDITAR */}
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-2 bg-[#fdebdd]/70 hover:bg-[#fdebdd] text-[#b8860b] rounded-xl border border-[#edd5b6] transition-all cursor-pointer shadow-xs hover:scale-105"
                                title="Editar servicio"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              {/* BOTÓN ELIMINAR */}
                              <button
                                onClick={() => handleDeleteService(item.id)}
                                className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200 transition-all cursor-pointer shadow-xs hover:scale-105"
                                title="Eliminar servicio"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="p-10 text-center text-[#8c8884]">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Sparkles className="w-8 h-8 text-[#ec71a8]/40" />
                            <span className="font-extrabold text-[#1e1e1c]">
                              No hay servicios registrados en {monthNames[selectedDashboardMonth - 1]} {selectedDashboardYear}.
                            </span>
                            <p className="text-xs text-[#8c8884]">
                              El panel inicia en 0.00 al comenzar cada nuevo mes.
                            </p>
                            <button
                              onClick={() => setActiveTab('nuevo_servicio')}
                              className="mt-2 text-xs text-white bg-[#ec71a8] px-4 py-2 rounded-xl font-bold hover:bg-[#d95392] cursor-pointer shadow-sm"
                            >
                              + Registrar Primer Servicio de Este Mes
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* TARJETAS MÓVIL: ÚLTIMO SERVICIO */}
              <div className="md:hidden flex flex-col gap-3">
                {monthlyServices.length > 0 ? (
                  monthlyServices.slice(0, 1).map((item) => (
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
                    <Sparkles className="w-8 h-8 text-[#ec71a8]/40 mx-auto mb-2" />
                    <span className="font-extrabold text-[#1e1e1c] text-sm">No hay servicios registrados en {monthNames[selectedDashboardMonth - 1]} {selectedDashboardYear}.</span>
                  </div>
                )}
              </div>

              {/* ENLACE AL HISTORIAL COMPLETO SI HAY MÁS DE UN SERVICIO */}
              {monthlyServices.length > 1 && (
                <div className="mt-4 pt-3 border-t border-[#fce3ed] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#6b6764]">
                  <span>Hay <b>{monthlyServices.length} servicios</b> registrados en este mes.</span>
                  <button
                    onClick={() => setActiveTab('informes')}
                    className="font-extrabold text-[#ec71a8] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    Ver los {monthlyServices.length} servicios en Informes y Edición →
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ================= VISTA 2: NUEVO REGISTRO ================= */}
        {activeTab === 'nuevo_servicio' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <section className="card-luxury rounded-3xl p-6 sm:p-9">
              <div className="flex items-center justify-between border-b border-[#fce3ed] pb-5 mb-7">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ec71a8] to-[#d95392] text-white flex items-center justify-center shadow-md shadow-[#ec71a8]/20">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-[#1e1e1c]">
                      Registrar Nuevo Servicio
                    </h3>
                    <p className="text-xs text-[#8c8884]">
                      Ingresa los datos para calcular la comisión automáticamente
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-[#fdebdd] text-[#b8860b] px-3 py-1.5 rounded-full border border-[#edd5b6] font-extrabold">
                  GUADALUPE MAKE UP
                </span>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">

                  {/* 0. SALÓN / ESTUDIO (obligatorio) */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#4a4744] flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-[#ec71a8]" />
                      Salón / Estudio
                    </label>
                    <select
                      value={regSalonId}
                      onChange={(e) => handleRegSalonChange(e.target.value)}
                      className="p-3.5 border border-[#f9cee3] rounded-2xl text-sm font-semibold outline-none focus:border-[#ec71a8] focus:ring-3 focus:ring-[#ec71a8]/15 bg-[#faf5f8] focus:bg-white transition-all"
                      required
                    >
                      <option value="" disabled>Selecciona un salón...</option>
                      {salones.map((s) => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                  </div>

                  {/* 1. FECHA */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#4a4744] flex items-center gap-1.5">
                      <CalendarIcon className="w-4 h-4 text-[#ec71a8]" />
                      Fecha del Servicio
                    </label>
                    <input
                      type="date"
                      value={regDate}
                      onChange={(e) => setRegDate(e.target.value)}
                      className="p-3.5 border border-[#f9cee3] rounded-2xl text-sm font-semibold outline-none focus:border-[#ec71a8] focus:ring-3 focus:ring-[#ec71a8]/15 bg-[#faf5f8] focus:bg-white transition-all"
                      required
                    />
                  </div>

                  {/* 2. SERVICIO REALIZADO */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#4a4744] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#ec71a8]" />
                      Servicio Realizado
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Maquillaje Social, Novia, Pestañas..."
                      value={regService}
                      onChange={(e) => handleRegServiceChange(e.target.value)}
                      disabled={esMaison(regSalonId)}
                      className="p-3.5 border border-[#f9cee3] rounded-2xl text-sm font-semibold outline-none focus:border-[#ec71a8] focus:ring-3 focus:ring-[#ec71a8]/15 bg-[#faf5f8] focus:bg-white transition-all disabled:bg-[#fce3ed]/60 disabled:text-[#8c8884] disabled:cursor-not-allowed"
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
                    <label className="text-xs font-bold uppercase tracking-wider text-[#4a4744] flex items-center gap-1.5">
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
                      className="p-3.5 border border-[#f9cee3] rounded-2xl text-sm font-bold outline-none focus:border-[#ec71a8] focus:ring-3 focus:ring-[#ec71a8]/15 bg-[#faf5f8] focus:bg-white transition-all"
                      required
                    />
                  </div>

                  {/* 4. COMISIÓN (autocompletada, ajustable) */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#4a4744] flex items-center gap-1.5">
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
                      className="p-3.5 border border-[#f9cee3] rounded-2xl text-sm font-bold outline-none focus:border-[#ec71a8] focus:ring-3 focus:ring-[#ec71a8]/15 bg-[#faf5f8] focus:bg-white transition-all"
                      required
                    />
                    <span className="text-[10px] font-semibold text-[#8c8884]">
                      {esMaison(regSalonId)
                        ? 'Auto: Maison Studio · Maquillaje 60%'
                        : 'Auto: Maquillaje 40% · otros servicios 30%'}
                    </span>
                  </div>

                </div>

                {/* VISTA PREVIA DEL CÁLCULO EN VIVO */}
                {livePrice > 0 && (
                  <div className="bg-gradient-to-r from-[#fff5f8] via-[#fdf2f7] to-[#fdebdd]/40 border border-[#f9cee3] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#ec71a8]" />
                      <span className="font-extrabold text-sm text-[#1e1e1c]">Cálculo en Tiempo Real:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-6 text-sm">
                      <div>
                        <span className="text-[#8c8884] font-medium">Total: </span>
                        <span className="font-extrabold text-[#1e1e1c]">S/ {livePrice.toFixed(2)}</span>
                      </div>
                      <div className="bg-[#ec71a8] text-white px-4 py-1.5 rounded-xl font-extrabold shadow-sm">
                        Mi Ganancia ({regCommission}%): S/ {liveMyGain.toFixed(2)}
                      </div>
                      <div className="bg-[#1e1e1c] text-[#ecc880] px-4 py-1.5 rounded-xl font-bold">
                        Salón ({100 - regCommission}%): S/ {liveSalonGain.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-[#fce3ed]">
                  <button
                    type="button"
                    onClick={() => setActiveTab('resumen')}
                    className="px-6 py-3.5 rounded-2xl border border-[#e5e1da] bg-white hover:bg-[#faf5f8] font-bold text-sm text-[#6b6764] cursor-pointer transition-colors"
                  >
                    Volver al Panel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#ec71a8] to-[#d95392] hover:opacity-95 text-white font-extrabold text-sm shadow-lg shadow-[#ec71a8]/25 cursor-pointer flex items-center gap-2 transition-transform active:scale-98"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Guardar Registro de Servicio
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {/* ================= VISTA 3: INFORMES Y EDICIÓN COMPLETA ================= */}
        {activeTab === 'informes' && (
          <div className="flex flex-col gap-8 animate-in fade-in duration-300">

            {/* SECCIÓN DE FILTRO CON CALENDARIO */}
            <section className="card-luxury rounded-3xl p-6 sm:p-7 flex flex-col gap-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#fce3ed] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#fce3ed] text-[#ec71a8] flex items-center justify-center">
                    <CalendarRange className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-[#1e1e1c]">
                      Filtro de Rango y Búsqueda
                    </h3>
                    <p className="text-xs text-[#8c8884]">
                      Selecciona un rango de fechas o busca por nombre de servicio
                    </p>
                  </div>
                </div>

                {/* BOTONES DE FILTRO RÁPIDO */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleQuickFilter('today')}
                    className="px-3.5 py-2 bg-white hover:bg-[#fce3ed] border border-[#f9cee3] rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    Hoy
                  </button>
                  <button
                    onClick={() => handleQuickFilter('week')}
                    className="px-3.5 py-2 bg-white hover:bg-[#fce3ed] border border-[#f9cee3] rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    Esta Semana
                  </button>
                  <button
                    onClick={() => handleQuickFilter('month')}
                    className="px-3.5 py-2 bg-[#fce3ed] text-[#ec71a8] hover:bg-[#f9cee3] border border-[#f9cee3] rounded-xl text-xs font-black transition-all shadow-2xs cursor-pointer"
                  >
                    Este Mes
                  </button>
                  <button
                    onClick={() => handleQuickFilter('last_month')}
                    className="px-3.5 py-2 bg-white hover:bg-[#fce3ed] border border-[#f9cee3] rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    Mes Anterior
                  </button>
                  <button
                    onClick={() => handleQuickFilter('all')}
                    className="px-3.5 py-2 bg-[#f5f3ef] hover:bg-[#e5e1da] border border-[#e5e1da] rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Todo el Histórico
                  </button>
                  <button
                    onClick={() => setShowCalendarWidget(!showCalendarWidget)}
                    className={`px-3.5 py-2 border rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                      showCalendarWidget ? 'bg-[#ec71a8] text-white border-[#ec71a8] shadow-sm' : 'bg-[#fdebdd] text-[#b8860b] border-[#edd5b6]'
                    }`}
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {showCalendarWidget ? 'Ocultar Calendario' : 'Calendario Visual'}
                  </button>
                </div>
              </div>

              {/* FILTRO POR SALÓN / ESTUDIO */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-[#6b6764] flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-[#ec71a8]" />
                  Salón:
                </span>
                <button
                  onClick={() => setFilterSalon('todos')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                    filterSalon === 'todos'
                      ? 'bg-[#1e1e1c] text-white border-[#1e1e1c] shadow-sm'
                      : 'bg-white text-[#6b6764] border-[#f9cee3] hover:bg-[#fce3ed]/50'
                  }`}
                >
                  Todos
                </button>
                {salones.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setFilterSalon(String(s.id))}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                      filterSalon === String(s.id)
                        ? 'bg-gradient-to-r from-[#ec71a8] to-[#d95392] text-white border-[#ec71a8] shadow-sm'
                        : 'bg-white text-[#6b6764] border-[#f9cee3] hover:bg-[#fce3ed]/50'
                    }`}
                  >
                    {s.nombre}
                  </button>
                ))}
              </div>

              {/* INPUTS DE FILTRO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#6b6764] flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5 text-[#ec71a8]" />
                    Fecha Desde:
                  </label>
                  <input
                    type="date"
                    value={filterFrom}
                    onChange={(e) => setFilterFrom(e.target.value)}
                    className="p-3 border border-[#f9cee3] rounded-2xl text-xs sm:text-sm font-semibold outline-none bg-white focus:border-[#ec71a8]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#6b6764] flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5 text-[#ec71a8]" />
                    Fecha Hasta:
                  </label>
                  <input
                    type="date"
                    value={filterTo}
                    onChange={(e) => setFilterTo(e.target.value)}
                    className="p-3 border border-[#f9cee3] rounded-2xl text-xs sm:text-sm font-semibold outline-none bg-white focus:border-[#ec71a8]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#6b6764] flex items-center gap-1">
                    <Search className="w-3.5 h-3.5 text-[#8c8884]" />
                    Buscar Servicio:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ej. Maquillaje, Alisado..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full p-3 border border-[#f9cee3] rounded-2xl text-xs sm:text-sm font-semibold outline-none bg-white focus:border-[#ec71a8]"
                    />
                    {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-3 text-[#8c8884] hover:text-[#1e1e1c] text-xs font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {(filterFrom || filterTo || searchTerm || filterSalon !== 'todos') && (
                    <button
                      onClick={() => { setFilterFrom(''); setFilterTo(''); setSearchTerm(''); setFilterSalon('todos'); }}
                      className="w-full p-3 bg-[#fce3ed] hover:bg-[#f9cee3] text-[#ec71a8] rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Limpiar Filtros
                    </button>
                  )}
                </div>
              </div>

              {/* CALENDARIO VISUAL INTERACTIVO */}
              {showCalendarWidget && (
                <div className="bg-[#fff9fb] border border-[#f9cee3] rounded-3xl p-5 shadow-inner animate-modal">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setCalViewDate(new Date(calViewDate.getFullYear(), calViewDate.getMonth() - 1, 1))}
                      className="p-2 bg-white border border-[#f9cee3] rounded-xl hover:bg-[#fce3ed] cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="text-base font-extrabold capitalize text-[#1e1e1c] flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-[#ec71a8]" />
                      {currentMonthYearStr}
                    </div>
                    <button
                      onClick={() => setCalViewDate(new Date(calViewDate.getFullYear(), calViewDate.getMonth() + 1, 1))}
                      className="p-2 bg-white border border-[#f9cee3] rounded-xl hover:bg-[#fce3ed] cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[11px] font-black text-[#8c8884] mb-2 uppercase">
                    <span>Lun</span>
                    <span>Mar</span>
                    <span>Mié</span>
                    <span>Jue</span>
                    <span>Vie</span>
                    <span>Sáb</span>
                    <span>Dom</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
                    {calendarDays.map((day, idx) => {
                      if (!day) return <div key={`empty-${idx}`} className="h-10 sm:h-11"></div>;

                      let bgClass = "bg-white hover:bg-[#fce3ed]/50 text-[#1e1e1c] border-[#fce3ed]";
                      if (day.isSelectedStart || day.isSelectedEnd) {
                        bgClass = "bg-[#ec71a8] text-white font-black shadow-md shadow-[#ec71a8]/30";
                      } else if (day.isInRange) {
                        bgClass = "bg-[#fce3ed] text-[#ec71a8] font-bold border-[#f9cee3]";
                      }

                      return (
                        <button
                          key={day.dateStr}
                          onClick={() => handleCalendarDayClick(day.dateStr)}
                          className={`h-10 sm:h-11 rounded-xl border flex flex-col items-center justify-center relative transition-all cursor-pointer text-xs sm:text-sm ${bgClass}`}
                        >
                          <span>{day.dayNumber}</span>
                          {day.hasServices && (
                            <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                              day.isSelectedStart || day.isSelectedEnd ? 'bg-white' : 'bg-[#ec71a8]'
                            }`}></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* METRICAS TOTALES FILTRADAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card-luxury rounded-3xl p-6 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#8c8884] uppercase">Mi Ganancia Filtrada</div>
                  <div className="text-2xl font-black text-[#ec71a8]">
                    S/ {reportTotalMyGain.toFixed(2)}
                  </div>
                </div>
                <div className="text-xs font-bold bg-[#fce3ed] text-[#ec71a8] px-3 py-1.5 rounded-xl">
                  {filteredServices.length} servicios
                </div>
              </div>

              <div className="card-luxury rounded-3xl p-6 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#8c8884] uppercase">Ganancia Salón Filtrada</div>
                  <div className="text-2xl font-black text-[#1e1e1c]">
                    S/ {reportTotalSalonGain.toFixed(2)}
                  </div>
                </div>
                <div className="text-xs font-bold bg-[#fdebdd] text-[#b8860b] px-3 py-1.5 rounded-xl">
                  Salón
                </div>
              </div>

              <div className="card-luxury rounded-3xl p-6 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#8c8884] uppercase">Facturación Total Filtrada</div>
                  <div className="text-2xl font-black text-[#b8860b]">
                    S/ {reportTotalFacturado.toFixed(2)}
                  </div>
                </div>
                <div className="text-xs font-bold bg-[#f5f3ef] text-[#6b6764] px-3 py-1.5 rounded-xl">
                  Bruto Total
                </div>
              </div>
            </div>

            {/* TABLA PRINCIPAL DE HISTORIAL CON BOTÓN DE EDITAR AL COSTADO DE ELIMINAR */}
            <section className="card-luxury rounded-3xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#1e1e1c]">
                    Historial Completo de Servicios
                  </h3>
                  <p className="text-xs sm:text-sm text-[#8c8884]">
                    Puedes editar los datos o eliminar registros directamente desde la columna de acciones
                  </p>
                </div>
                <button
                  onClick={handleExportCSV}
                  disabled={filteredServices.length === 0}
                  className="px-4 py-2 rounded-xl bg-[#1e1e1c] text-[#ecc880] hover:bg-[#2c2b28] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed self-start sm:self-auto"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Exportar CSV
                </button>
              </div>

              <div className="hidden md:block overflow-x-auto rounded-2xl border border-[#fce3ed]">
                <table className="w-full text-left border-collapse min-w-[750px]">
                  <thead>
                    <tr className="bg-[#1e1e1c] text-white text-xs font-black uppercase tracking-wider">
                      <th className="p-4">Fecha</th>
                      <th className="p-4">Semana</th>
                      <th className="p-4">Servicio</th>
                      <th className="p-4">Salón</th>
                      <th className="p-4">Precio Total</th>
                      <th className="p-4">Comisión</th>
                      <th className="p-4">Mi Ganancia</th>
                      <th className="p-4">Ganancia Salón</th>
                      <th className="p-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#fce3ed] text-sm bg-white">
                    {paginatedServices.length > 0 ? (
                      paginatedServices.map((item) => (
                        <tr key={item.id} className="hover:bg-[#fff5f8] transition-colors">
                          <td className="p-4 whitespace-nowrap font-bold text-[#1e1e1c]">{item.date}</td>
                          <td className="p-4 whitespace-nowrap text-[#8c8884] font-semibold">{item.week}</td>
                          <td className="p-4 whitespace-nowrap font-extrabold text-[#1e1e1c]">
                            {item.service}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#f5f3ef] text-[#6b6764] border border-[#e5e1da]">
                              {salonNombre(item.salon_id)}
                            </span>
                          </td>
                          <td className="p-4 whitespace-nowrap font-bold text-[#1e1e1c]">
                            S/ {item.price.toFixed(2)}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${
                              item.commission === 40
                                ? 'bg-[#fce3ed] text-[#ec71a8] border-[#f9cee3]'
                                : 'bg-[#fdebdd] text-[#b8860b] border-[#edd5b6]'
                            }`}>
                              {item.commission}%
                            </span>
                          </td>
                          <td className="p-4 whitespace-nowrap font-black text-[#ec71a8] text-base">
                            S/ {item.myGain.toFixed(2)}
                          </td>
                          <td className="p-4 whitespace-nowrap font-semibold text-[#6b6764]">
                            S/ {item.salongain.toFixed(2)}
                          </td>
                          <td className="p-4 whitespace-nowrap text-center">
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
                              onClick={() => { setFilterFrom(''); setFilterTo(''); setSearchTerm(''); setFilterSalon('todos'); }}
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
          <section className="flex flex-col gap-6 animate-modal">
            {/* Formulario de registro */}
            <div className="card-luxury rounded-3xl p-6 sm:p-8 bg-white/90 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#ec71a8] to-[#d95392] flex items-center justify-center shadow-md shadow-[#ec71a8]/25">
                  <PlusCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#1e1e1c]">Registrar Producto / Insumo</h3>
                  <p className="text-xs text-[#6b6764] font-medium">Añade maquillaje o insumos al inventario</p>
                </div>
              </div>

              <form onSubmit={handleCreateProduct} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#4a4744] flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#ec71a8]" />
                    Nombre del producto
                  </label>
                  <input
                    type="text"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="Ej: Pestañina Maybelline"
                    className="p-3.5 border border-[#f9cee3] rounded-2xl text-sm font-bold outline-none focus:border-[#ec71a8] focus:ring-2 focus:ring-[#ec71a8]/15 bg-[#faf5f8]"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#4a4744] flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-[#ec71a8]" />
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={prodQuantity}
                    onChange={(e) => setProdQuantity(Number(e.target.value) || 1)}
                    className="p-3.5 border border-[#f9cee3] rounded-2xl text-sm font-bold outline-none focus:border-[#ec71a8] focus:ring-2 focus:ring-[#ec71a8]/15 bg-[#faf5f8]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#4a4744] flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#ec71a8]" />
                    Precio / Costo (S/)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="0.00"
                    className="p-3.5 border border-[#f9cee3] rounded-2xl text-sm font-bold outline-none focus:border-[#ec71a8] focus:ring-2 focus:ring-[#ec71a8]/15 bg-[#faf5f8]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#4a4744] flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-[#ec71a8]" />
                    Fecha de compra
                  </label>
                  <input
                    type="date"
                    value={prodPurchaseDate}
                    onChange={(e) => setProdPurchaseDate(e.target.value)}
                    className="p-3.5 border border-[#f9cee3] rounded-2xl text-sm font-bold outline-none focus:border-[#ec71a8] focus:ring-2 focus:ring-[#ec71a8]/15 bg-[#faf5f8]"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#4a4744] flex items-center gap-1.5">
                    <CalendarCheck className="w-3.5 h-3.5 text-[#ec71a8]" />
                    Fecha de apertura <span className="text-[#8c8884] normal-case font-medium">(opcional)</span>
                  </label>
                  <input
                    type="date"
                    value={prodStartDate}
                    onChange={(e) => setProdStartDate(e.target.value)}
                    className="p-3.5 border border-[#f9cee3] rounded-2xl text-sm font-bold outline-none focus:border-[#ec71a8] focus:ring-2 focus:ring-[#ec71a8]/15 bg-[#faf5f8]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#4a4744] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#ec71a8]" />
                    Fecha de caducidad
                  </label>
                  <input
                    type="date"
                    value={prodExpirationDate}
                    onChange={(e) => setProdExpirationDate(e.target.value)}
                    className="p-3.5 border border-[#f9cee3] rounded-2xl text-sm font-bold outline-none focus:border-[#ec71a8] focus:ring-2 focus:ring-[#ec71a8]/15 bg-[#faf5f8]"
                    required
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3 flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#ec71a8] to-[#d95392] text-white font-extrabold text-xs shadow-md shadow-[#ec71a8]/25 hover:opacity-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Registrar Producto
                  </button>
                </div>
              </form>
            </div>

            {/* Buscador + listado */}
            <div className="card-luxury rounded-3xl p-6 sm:p-8 bg-white/90 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#fce3ed] flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-[#ec71a8]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-[#1e1e1c]">Mis Productos</h3>
                    <p className="text-xs text-[#6b6764] font-medium">
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
                      className="pl-9 pr-4 py-2.5 rounded-2xl border border-[#f9cee3] text-sm font-medium bg-[#faf5f8] outline-none focus:border-[#ec71a8] focus:ring-2 focus:ring-[#ec71a8]/15 w-full sm:w-56"
                    />
                  </div>
                  <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#fce3ed]/60 border border-[#f9cee3]">
                    <button
                      onClick={() => setProductStatusFilter('activo')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        productStatusFilter === 'activo' ? 'bg-[#ec71a8] text-white shadow-sm' : 'text-[#8c8884] hover:text-[#1e1e1c]'
                      }`}
                    >
                      🟢 Activos
                    </button>
                    <button
                      onClick={() => setProductStatusFilter('terminado')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        productStatusFilter === 'terminado' ? 'bg-[#1e1e1c] text-white shadow-sm' : 'text-[#8c8884] hover:text-[#1e1e1c]'
                      }`}
                    >
                      ⚫ Terminados
                    </button>
                    <button
                      onClick={() => setProductStatusFilter('todos')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        productStatusFilter === 'todos' ? 'bg-[#d95392] text-white shadow-sm' : 'text-[#8c8884] hover:text-[#1e1e1c]'
                      }`}
                    >
                      Todos
                    </button>
                  </div>
                </div>
              </div>

              {productLoading ? (
                <div className="py-12 text-center text-[#6b6764] text-sm font-medium">Cargando productos...</div>
              ) : products.length === 0 ? (
                <div className="py-12 text-center">
                  <Package className="w-12 h-12 text-[#f9cee3] mx-auto mb-3" />
                  <p className="text-sm text-[#6b6764] font-medium">
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
                      green: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
                      yellow: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
                      red: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
                      gray: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
                    };
                    const c = colorMap[state.color];
                    return (
                      <div key={p.id} className={`relative rounded-2xl border-2 ${c.border} ${c.bg} p-5 transition-all hover:shadow-md ${isTerminated ? 'opacity-75 grayscale-[30%]' : ''}`}>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h4 className={`font-extrabold text-base leading-tight flex-1 ${isTerminated ? 'text-[#6b6764] line-through' : 'text-[#1e1e1c]'}`}>{p.name}</h4>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${c.bg} ${c.text} text-[10px] font-extrabold uppercase tracking-wider border ${c.border}`}>
                            <span className={`w-2 h-2 rounded-full ${c.dot}`}></span>
                            {isTerminated ? 'Terminado' : ''}
                            {!isTerminated && state.color === 'green' && 'Vigente'}
                            {!isTerminated && state.color === 'yellow' && 'Por vencer'}
                            {!isTerminated && state.color === 'red' && 'Caducado'}
                            {!isTerminated && state.color === 'gray' && 'Sin fecha'}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-[#4a4744] font-medium">
                          <div className="flex items-center justify-between">
                            <span className="text-[#8c8884]">Cantidad:</span>
                            <span className="font-bold text-[#1e1e1c]">{isTerminated ? 0 : p.quantity}</span>
                          </div>
                          {p.price > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-[#8c8884]">Precio:</span>
                              <span className="font-bold text-[#1e1e1c]">S/ {Number(p.price).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-[#8c8884]">Compra:</span>
                            <span className="font-bold text-[#1e1e1c]">{p.purchase_date}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#8c8884]">Caducidad:</span>
                            <span className="font-bold text-[#1e1e1c]">{p.expiration_date}</span>
                          </div>
                          <div className="flex items-center justify-between pt-1.5 border-t border-current/10">
                            <span className="text-[#8c8884]">Apertura:</span>
                            <span className={`font-bold ${p.start_date ? 'text-[#1e1e1c]' : 'text-[#8c8884] italic'}`}>
                              {p.start_date || 'Sin abrir'}
                            </span>
                          </div>
                        </div>

                        <div className={`mt-3 text-[11px] font-bold ${c.text}`}>
                          {isTerminated ? '⚠️ Terminado / Agotado — fuera del semáforo de vencimiento' : state.label}
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-current/10">
                          {!isTerminated && !p.start_date && (
                            <button
                              onClick={() => handleOpenToday(p.id)}
                              className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#ec71a8]/40 text-[#ec71a8] hover:bg-[#fce3ed] font-bold text-xs transition-colors cursor-pointer"
                              title="Marca este producto como abierto hoy"
                            >
                              <CalendarCheck className="w-3.5 h-3.5" />
                              Abrir Hoy
                            </button>
                          )}
                          {!isTerminated && (
                            <button
                              onClick={() => handleFinishProduct(p.id)}
                              className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#1e1e1c]/30 text-[#1e1e1c] hover:bg-[#1e1e1c] hover:text-white font-bold text-xs transition-colors cursor-pointer"
                              title="Marcar este producto como terminado/agotado"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Terminado
                            </button>
                          )}
                          {isTerminated && (
                            <button
                              onClick={() => handleReactivateProduct(p.id)}
                              className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-emerald-400/40 text-emerald-600 hover:bg-emerald-50 font-bold text-xs transition-colors cursor-pointer"
                              title="Volver a activar este producto"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Reactivar
                            </button>
                          )}
                          <button
                            onClick={() => openEditProduct(p)}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#f9cee3] text-[#4a4744] hover:bg-[#fce3ed] hover:text-[#1e1e1c] font-bold text-xs transition-colors cursor-pointer"
                            title="Editar producto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer"
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

      {/* ================= NAVEGACIÓN INFERIOR MÓVIL ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#ec71a8]/20 shadow-[0_-4px_20px_rgba(236,113,168,0.10)]">
        <div className="grid grid-cols-4 items-end">
          <button
            onClick={() => setActiveTab('resumen')}
            className={`flex flex-col items-center justify-center gap-1 py-2.5 ${activeTab === 'resumen' ? 'text-[#ec71a8]' : 'text-[#8c8884]'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-bold">Resumen</span>
          </button>
          <button
            onClick={() => setActiveTab('nuevo_servicio')}
            className="flex flex-col items-center justify-center gap-1 py-2.5"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#ec71a8] to-[#d95392] text-white flex items-center justify-center shadow-md shadow-[#ec71a8]/30">
              <Plus className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-bold ${activeTab === 'nuevo_servicio' ? 'text-[#ec71a8]' : 'text-[#8c8884]'}`}>Registrar</span>
          </button>
          <button
            onClick={() => setActiveTab('productos')}
            className={`flex flex-col items-center justify-center gap-1 py-2.5 ${activeTab === 'productos' ? 'text-[#ec71a8]' : 'text-[#8c8884]'}`}
          >
            <Package className="w-5 h-5" />
            <span className="text-[10px] font-bold">Productos</span>
          </button>
          <button
            onClick={() => setActiveTab('informes')}
            className={`flex flex-col items-center justify-center gap-1 py-2.5 ${activeTab === 'informes' ? 'text-[#ec71a8]' : 'text-[#8c8884]'}`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px] font-bold">Informes</span>
          </button>
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
                <select
                  value={editSalonId}
                  onChange={(e) => handleEditSalonChange(e.target.value)}
                  className="p-3.5 border border-[#f9cee3] rounded-2xl text-sm font-semibold outline-none focus:border-[#ec71a8] focus:ring-2 focus:ring-[#ec71a8]/15 bg-[#faf5f8]"
                  required
                >
                  <option value="" disabled>Selecciona un salón...</option>
                  {salones.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
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