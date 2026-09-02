import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  CalendarRange,
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Scissors, 
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
  ArrowRight
} from 'lucide-react';

const API_BASE_URL = typeof window !== 'undefined' && window.location.port === '5173'
  ? 'http://localhost:8000'
  : '/api';

const DEFAULT_GOAL = 480.00;

export default function App() {
  // Estado de navegación activa ('resumen' | 'nuevo_servicio' | 'informes')
  const [activeTab, setActiveTab] = useState('resumen');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Estado principal de servicios
  const [services, setServices] = useState(() => {
    const saved = localStorage.getItem('salon_services');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing localStorage', e);
      }
    }
    return [
      {
        id: 1,
        date: '2026-08-30',
        week: 'Semana 5',
        service: 'Maquillaje',
        price: 120.00,
        commission: 40,
        myGain: 48.00,
        salongain: 72.00
      }
    ];
  });

  // Meta mensual
  const [goalAmount, setGoalAmount] = useState(DEFAULT_GOAL);

  // Formulario nuevo registro
  const [regDate, setRegDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [regService, setRegService] = useState('');
  const [regPrice, setRegPrice] = useState('');
  const [regCommission, setRegCommission] = useState(40); // 30 o 40
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Filtros de fecha y búsqueda
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCalendarWidget, setShowCalendarWidget] = useState(false);

  // Estado del calendario interactivo
  const [calViewDate, setCalViewDate] = useState(() => new Date());

  // Cargar datos iniciales desde Backend si está disponible
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
        console.log('Backend no disponible temporalmente, usando almacenamiento local.');
      }
    };
    fetchServices();
  }, []);

  // Guardar en localStorage cuando cambian los servicios
  useEffect(() => {
    localStorage.setItem('salon_services', JSON.stringify(services));
  }, [services]);

  // Función para calcular la semana del mes
  const getWeekOfMonth = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    return `Semana ${Math.ceil((date.getDate() + dayOfWeek) / 7)}`;
  };

  // Cálculos en vivo para el formulario
  const livePrice = parseFloat(regPrice) || 0;
  const liveMyGain = livePrice * (regCommission / 100);
  const liveSalonGain = livePrice - liveMyGain;

  // Manejo de envío de nuevo servicio
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!regService.trim()) return;
    const priceNum = parseFloat(regPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;

    const commNum = Number(regCommission);
    const myGain = Math.round(priceNum * (commNum / 100) * 100) / 100;
    const salongain = Math.round((priceNum - myGain) * 100) / 100;

    const newEntry = {
      id: Date.now(),
      date: regDate,
      week: getWeekOfMonth(regDate),
      service: regService.trim(),
      price: priceNum,
      commission: commNum,
      myGain: myGain,
      salongain: salongain
    };

    // Intentar sincronizar con Backend
    try {
      const res = await fetch(`${API_BASE_URL}/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha: regDate,
          servicio_nombre: regService.trim(),
          precio: priceNum,
          porcentaje: commNum
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.entry) {
          newEntry.id = data.entry.id;
        }
      }
    } catch (err) {
      console.log('Guardado local activado (Backend offline)');
    }

    setServices((prev) => [newEntry, ...prev]);
    setRegService('');
    setRegPrice('');
    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 5000);
  };

  // Eliminar un servicio
  const handleDeleteService = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro?')) return;

    try {
      await fetch(`${API_BASE_URL}/registro/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.log('Eliminando localmente');
    }

    setServices((prev) => prev.filter((item) => item.id !== id));
  };

  // Atajos rápidos de filtro
  const handleQuickFilter = (type) => {
    const today = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (type === 'today') {
      const todayStr = toYMD(today);
      setFilterFrom(todayStr);
      setFilterTo(todayStr);
    } else if (type === 'week') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // lunes
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

  // Filtrado de servicios
  const filteredServices = useMemo(() => {
    return services.filter((item) => {
      const matchFrom = filterFrom ? item.date >= filterFrom : true;
      const matchTo = filterTo ? item.date <= filterTo : true;
      const matchSearch = searchTerm.trim() 
        ? item.service.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      return matchFrom && matchTo && matchSearch;
    });
  }, [services, filterFrom, filterTo, searchTerm]);

  // Fechas con servicios para marcar en el calendario
  const datesWithServices = useMemo(() => {
    const set = new Set();
    services.forEach((s) => set.add(s.date));
    return set;
  }, [services]);

  // Totales y métricas del dashboard
  const totalMyGain = filteredServices.reduce((acc, curr) => acc + curr.myGain, 0);
  const totalSalonGain = filteredServices.reduce((acc, curr) => acc + curr.salongain, 0);
  const totalFacturado = filteredServices.reduce((acc, curr) => acc + curr.price, 0);
  const remainingGoal = Math.max(0, goalAmount - totalMyGain);
  const goalProgressPct = Math.min(100, Math.round((totalMyGain / goalAmount) * 100));

  // Desglose por tipo de comisión (30% vs 40%)
  const count40 = filteredServices.filter((s) => s.commission === 40).length;
  const gain40 = filteredServices.filter((s) => s.commission === 40).reduce((acc, curr) => acc + curr.myGain, 0);
  const count30 = filteredServices.filter((s) => s.commission === 30).length;
  const gain30 = filteredServices.filter((s) => s.commission === 30).reduce((acc, curr) => acc + curr.myGain, 0);
  const ticketPromedio = filteredServices.length > 0 ? totalFacturado / filteredServices.length : 0;

  // Lógica del Mini Calendario Interactivo
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
    const pad = (n) => String(n).padStart(2, '0');
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

  const handlePrevMonth = () => {
    setCalViewDate(new Date(calViewDate.getFullYear(), calViewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalViewDate(new Date(calViewDate.getFullYear(), calViewDate.getMonth() + 1, 1));
  };

  return (
    <div className="min-h-screen bg-[#faf5f8] text-slate-900 flex flex-col md:flex-row">
      
      {/* ================= PANEL LATERAL (SIDEBAR) ================= */}
      <aside className="w-full md:w-72 bg-white border-r-0 md:border-r-3 border-b-3 md:border-b-0 border-black p-5 flex flex-col justify-between shrink-0 shadow-[4px_0px_0px_rgba(0,0,0,0.05)] z-20">
        <div>
          {/* LOGO Y NOMBRE DEL APLICATIVO */}
          <div className="flex items-center justify-between md:justify-start gap-3 pb-6 border-b-2 border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#d81b60] text-white rounded-xl border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_#000]">
                <Scissors className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-[#d81b60]">
                  Make APP
                </h1>
                <span className="bg-[#fce4ec] text-[#d81b60] font-bold text-[11px] px-2 py-0.5 rounded-full border border-black inline-block">
                  Control de Ganancias
                </span>
              </div>
            </div>

            {/* BOTÓN MENÚ MÓVIL */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl border-2 border-black bg-slate-100 shadow-[2px_2px_0px_#000]"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* BOTONES DE NAVEGACIÓN PRINCIPALES (PANEL LATERAL) */}
          <nav className={`mt-6 flex-col gap-3 ${mobileMenuOpen ? 'flex' : 'hidden md:flex'}`}>
            
            {/* BOTÓN 1: RESUMEN */}
            <button
              onClick={() => { setActiveTab('resumen'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border-2 border-black font-extrabold text-base text-left transition-all cursor-pointer ${
                activeTab === 'resumen'
                  ? 'bg-[#d81b60] text-white shadow-[4px_4px_0px_#000] translate-x-0.5'
                  : 'bg-white text-slate-700 hover:bg-pink-50 shadow-[2px_2px_0px_#000]'
              }`}
            >
              <LayoutDashboard className={`w-5 h-5 ${activeTab === 'resumen' ? 'text-white' : 'text-[#d81b60]'}`} />
              <span>Resumen</span>
            </button>

            {/* BOTÓN 2: NUEVO REGISTRO DE SERVICIO */}
            <button
              onClick={() => { setActiveTab('nuevo_servicio'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border-2 border-black font-extrabold text-base text-left transition-all cursor-pointer ${
                activeTab === 'nuevo_servicio'
                  ? 'bg-[#d81b60] text-white shadow-[4px_4px_0px_#000] translate-x-0.5'
                  : 'bg-white text-slate-700 hover:bg-pink-50 shadow-[2px_2px_0px_#000]'
              }`}
            >
              <PlusCircle className={`w-5 h-5 ${activeTab === 'nuevo_servicio' ? 'text-white' : 'text-[#d81b60]'}`} />
              <span>Nuevo Registro de Servicio</span>
            </button>

            {/* BOTÓN 3: INFORMES */}
            <button
              onClick={() => { setActiveTab('informes'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border-2 border-black font-extrabold text-base text-left transition-all cursor-pointer ${
                activeTab === 'informes'
                  ? 'bg-[#d81b60] text-white shadow-[4px_4px_0px_#000] translate-x-0.5'
                  : 'bg-white text-slate-700 hover:bg-pink-50 shadow-[2px_2px_0px_#000]'
              }`}
            >
              <FileText className={`w-5 h-5 ${activeTab === 'informes' ? 'text-white' : 'text-[#d81b60]'}`} />
              <span>Informes</span>
            </button>

          </nav>
        </div>

        {/* PIE DEL PANEL LATERAL */}
        <div className="hidden md:block pt-6 border-t-2 border-slate-100 mt-6 text-xs text-slate-500 font-medium">
          <p className="font-bold text-slate-700">Make APP v2.0</p>
          <p>Gestión inteligente de comisiones y servicios</p>
        </div>
      </aside>

      {/* ================= CONTENIDO PRINCIPAL SEGÚN BOTÓN SELECCIONADO ================= */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto flex flex-col gap-8 overflow-y-auto">

        {/* HEADER DE CABECERA DE LA VISTA */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border-2 border-black rounded-2xl p-6 shadow-[6px_6px_0px_#000]">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              {activeTab === 'resumen' && 'Resumen General del Dashboard'}
              {activeTab === 'nuevo_servicio' && 'Nuevo Registro de Servicio'}
              {activeTab === 'informes' && 'Informes y Reportes'}
            </h2>
            <p className="text-sm text-slate-600 font-medium mt-1">
              {activeTab === 'resumen' && 'Vista global de comisiones, métricas principales y meta del mes.'}
              {activeTab === 'nuevo_servicio' && 'Ingresa los datos del nuevo servicio realizado y calcula la ganancia.'}
              {activeTab === 'informes' && 'Filtro por rango de calendario, categorización por comisión e historial.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold bg-[#fce4ec] text-[#d81b60] px-3.5 py-1.5 rounded-xl border border-black shadow-[2px_2px_0px_#000]">
              {services.length} {services.length === 1 ? 'registro' : 'registros en total'}
            </span>
          </div>
        </header>

        {/* ================= VISTA 1: RESUMEN ================= */}
        {activeTab === 'resumen' && (
          <div className="flex flex-col gap-8 animate-in fade-in duration-200">
            
            {/* METRICAS PRINCIPALES DEL RESUMEN */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* 1. MI GANANCIA NETA */}
              <div className="bg-gradient-to-br from-[#fff0f6] to-white border-3 border-black border-l-[12px] border-l-[#d81b60] rounded-2xl p-6 shadow-[6px_6px_0px_#000] flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#d81b60] bg-pink-100 px-2.5 py-1 rounded-md border border-pink-300">
                    Mi Ganancia Neta
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-pink-100 border border-pink-300 flex items-center justify-center text-[#d81b60]">
                    <DollarSign className="w-6 h-6 stroke-[2.5]" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-4xl sm:text-5xl font-black text-[#d81b60] tracking-tight">
                    S/ {totalMyGain.toFixed(2)}
                  </div>
                  <div className="mt-2 text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-[#d81b60]"></span>
                    {goalProgressPct}% alcanzado de la meta
                  </div>
                </div>
              </div>

              {/* 2. GANANCIA SALÓN */}
              <div className="bg-gradient-to-br from-[#f5f3ff] to-white border-3 border-black border-l-[12px] border-l-[#6366f1] rounded-2xl p-6 shadow-[6px_6px_0px_#000] flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#4f46e5] bg-indigo-100 px-2.5 py-1 rounded-md border border-indigo-300">
                    Ganancia Salón
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-300 flex items-center justify-center text-[#4f46e5]">
                    <Store className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl sm:text-4xl font-extrabold text-[#312e81] tracking-tight">
                    S/ {totalSalonGain.toFixed(2)}
                  </div>
                  <div className="mt-2 text-xs font-semibold text-slate-600">
                    Total retenido para local y costos
                  </div>
                </div>
              </div>

              {/* 3. TOTAL FACTURADO */}
              <div className="bg-gradient-to-br from-[#f0fdf4] to-white border-3 border-black border-l-[12px] border-l-[#10b981] rounded-2xl p-6 shadow-[6px_6px_0px_#000] flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#059669] bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-300">
                    Total Facturado
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-[#059669]">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl sm:text-4xl font-extrabold text-[#064e3b] tracking-tight">
                    S/ {totalFacturado.toFixed(2)}
                  </div>
                  <div className="mt-2 text-xs font-semibold text-slate-600">
                    Facturación bruta acumulada
                  </div>
                </div>
              </div>

              {/* 4. META MENSUAL */}
              <div className="bg-gradient-to-br from-[#fffbeb] to-white border-3 border-black border-l-[12px] border-l-[#f59e0b] rounded-2xl p-6 shadow-[6px_6px_0px_#000] flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#d97706] bg-amber-100 px-2.5 py-1 rounded-md border border-amber-300">
                    Meta (S/ {goalAmount.toFixed(0)})
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-[#d97706]">
                    <Target className="w-6 h-6" />
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#78350f]">
                      {remainingGoal > 0 ? `Faltan S/ ${remainingGoal.toFixed(2)}` : '¡Meta Cumplida! 🎉'}
                    </div>
                  </div>

                  <div className="mt-3 w-full bg-slate-200 h-3 rounded-full overflow-hidden border border-black">
                    <div 
                      className="bg-gradient-to-r from-[#f59e0b] to-[#d81b60] h-full transition-all duration-500 rounded-full"
                      style={{ width: `${goalProgressPct}%` }}
                    ></div>
                  </div>

                  <div className="mt-1.5 flex justify-between text-[11px] font-bold text-slate-500">
                    <span>S/ 0</span>
                    <span>{goalProgressPct}%</span>
                    <span>S/ {goalAmount.toFixed(0)}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* TARJETAS DE DESGLOSE DE CATEGORÍAS Y PROMEDIO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-white border-2 border-black rounded-xl p-5 shadow-[4px_4px_0px_#000] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-pink-100 border-2 border-pink-400 text-[#d81b60] font-black flex items-center justify-center text-base">
                    40%
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase">Servicios al 40%</div>
                    <div className="text-xl font-black text-slate-900">
                      S/ {gain40.toFixed(2)} <span className="text-xs font-semibold text-slate-500">({count40} serv.)</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-extrabold bg-pink-50 text-[#d81b60] px-2.5 py-1 rounded-md border border-pink-200">
                  Principal
                </span>
              </div>

              <div className="bg-white border-2 border-black rounded-xl p-5 shadow-[4px_4px_0px_#000] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 border-2 border-indigo-400 text-indigo-700 font-black flex items-center justify-center text-base">
                    30%
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase">Servicios al 30%</div>
                    <div className="text-xl font-black text-slate-900">
                      S/ {gain30.toFixed(2)} <span className="text-xs font-semibold text-slate-500">({count30} serv.)</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-extrabold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md border border-indigo-200">
                  Especial
                </span>
              </div>

              <div className="bg-white border-2 border-black rounded-xl p-5 shadow-[4px_4px_0px_#000] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 border-2 border-emerald-400 text-emerald-700 font-black flex items-center justify-center text-base">
                    AVG
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase">Ticket Promedio</div>
                    <div className="text-xl font-black text-slate-900">
                      S/ {ticketPromedio.toFixed(2)} <span className="text-xs font-semibold text-slate-500">/ serv.</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-extrabold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md border border-emerald-200">
                  Promedio
                </span>
              </div>

            </div>

            {/* VISTA RÁPIDA / ACCESOS DIRECTOS */}
            <div className="bg-white border-3 border-black rounded-2xl p-6 sm:p-8 shadow-[6px_6px_0px_#000] flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#d81b60]" />
                  ¿Deseas registrar un nuevo servicio o revisar los informes?
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  Usa el panel lateral para navegar entre la carga de nuevos registros e informes con filtro por rango de fechas.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab('nuevo_servicio')}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-[#d81b60] hover:bg-[#c2185b] text-white font-extrabold px-5 py-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  Nuevo Registro
                </button>
                <button
                  onClick={() => setActiveTab('informes')}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold px-5 py-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] cursor-pointer"
                >
                  Ver Informes
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ================= VISTA 2: NUEVO REGISTRO DE SERVICIO ================= */}
        {activeTab === 'nuevo_servicio' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            
            {/* NOTIFICACIÓN DE ÉXITO */}
            {submitSuccess && (
              <div className="bg-emerald-50 border-3 border-black rounded-2xl p-4 shadow-[4px_4px_0px_#000] flex items-center justify-between gap-4 text-emerald-900 font-extrabold">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  <span>¡Servicio registrado exitosamente en Make APP!</span>
                </div>
                <button 
                  onClick={() => setActiveTab('informes')}
                  className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg border border-black hover:bg-emerald-700 cursor-pointer"
                >
                  Ver en Informes →
                </button>
              </div>
            )}

            <section className="bg-white border-3 border-black rounded-2xl p-6 sm:p-8 shadow-[8px_8px_0px_#000]">
              <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-[#d81b60]" />
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">Formulario de Registro de Servicio</h3>
                </div>
                <span className="text-xs bg-pink-100 text-[#d81b60] px-3 py-1 rounded-full border border-black font-extrabold">
                  Texto Libre & Comisión
                </span>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  {/* 1. FECHA */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <CalendarIcon className="w-4 h-4 text-[#d81b60]" />
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={regDate}
                      onChange={(e) => setRegDate(e.target.value)}
                      className="p-3.5 border-2 border-black rounded-xl text-base font-semibold outline-none focus:ring-2 focus:ring-[#d81b60] bg-slate-50 focus:bg-white transition-all shadow-[2px_2px_0px_#000]"
                      required
                    />
                  </div>

                  {/* 2. SERVICIO (CAMPO DE TEXTO LIBRE) */}
                  <div className="flex flex-col gap-2 sm:col-span-1 lg:col-span-1">
                    <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Scissors className="w-4 h-4 text-[#d81b60]" />
                        Servicio Realizado
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Maquillaje, Alisado, Peinado, Corte..."
                      value={regService}
                      onChange={(e) => setRegService(e.target.value)}
                      className="p-3.5 border-2 border-black rounded-xl text-base font-semibold outline-none focus:ring-2 focus:ring-[#d81b60] bg-slate-50 focus:bg-white transition-all shadow-[2px_2px_0px_#000]"
                      required
                      autoFocus
                    />
                  </div>

                  {/* 3. PRECIO (S/) */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-[#d81b60]" />
                      Precio Cobrado (S/)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={regPrice}
                      onChange={(e) => setRegPrice(e.target.value)}
                      className="p-3.5 border-2 border-black rounded-xl text-base font-bold outline-none focus:ring-2 focus:ring-[#d81b60] bg-slate-50 focus:bg-white transition-all shadow-[2px_2px_0px_#000]"
                      required
                    />
                  </div>

                  {/* 4. SELECTOR DE COMISIÓN (30% vs 40%) */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Percent className="w-4 h-4 text-[#d81b60]" />
                      Comisión (% Ganancia)
                    </label>
                    <div className="grid grid-cols-2 gap-2 h-[52px]">
                      <button
                        type="button"
                        onClick={() => setRegCommission(30)}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border-2 border-black font-extrabold text-base transition-all cursor-pointer shadow-[2px_2px_0px_#000] ${
                          regCommission === 30
                            ? 'bg-[#6366f1] text-white ring-2 ring-indigo-900 shadow-[3px_3px_0px_#000]'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {regCommission === 30 && <Check className="w-4 h-4 stroke-[3]" />}
                        30%
                      </button>

                      <button
                        type="button"
                        onClick={() => setRegCommission(40)}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border-2 border-black font-extrabold text-base transition-all cursor-pointer shadow-[2px_2px_0px_#000] ${
                          regCommission === 40
                            ? 'bg-[#d81b60] text-white ring-2 ring-pink-900 shadow-[3px_3px_0px_#000]'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {regCommission === 40 && <Check className="w-4 h-4 stroke-[3]" />}
                        40%
                      </button>
                    </div>
                  </div>

                </div>

                {/* VISTA PREVIA DEL CÁLCULO EN VIVO */}
                {livePrice > 0 && (
                  <div className="bg-[#fff9fb] border-2 border-[#d81b60] border-dashed rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#d81b60]" />
                      <span className="font-bold text-sm text-slate-700">Cálculo Automático de Ganancia:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-6 text-sm">
                      <div>
                        <span className="text-slate-500 font-medium">Precio Total: </span>
                        <span className="font-bold">S/ {livePrice.toFixed(2)}</span>
                      </div>
                      <div className="bg-pink-100 text-[#d81b60] px-3.5 py-1.5 rounded-lg border border-pink-300 font-extrabold">
                        Mi Ganancia ({regCommission}%): S/ {liveMyGain.toFixed(2)}
                      </div>
                      <div className="bg-indigo-50 text-indigo-900 px-3.5 py-1.5 rounded-lg border border-indigo-200 font-bold">
                        Salón ({100 - regCommission}%): S/ {liveSalonGain.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('resumen')}
                    className="px-6 py-3.5 rounded-xl border-2 border-black bg-slate-100 hover:bg-slate-200 font-bold text-sm shadow-[2px_2px_0px_#000] cursor-pointer"
                  >
                    Volver a Resumen
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3.5 rounded-xl border-2 border-black bg-[#d81b60] hover:bg-[#c2185b] text-white font-extrabold text-base shadow-[4px_4px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Guardar Registro
                  </button>
                </div>
              </form>
            </section>

          </div>
        )}

        {/* ================= VISTA 3: INFORMES ================= */}
        {activeTab === 'informes' && (
          <div className="flex flex-col gap-8 animate-in fade-in duration-200">

            {/* SECCIÓN DE FILTRO CON CALENDARIO INTERACTIVO */}
            <section className="bg-white border-3 border-black rounded-2xl p-6 shadow-[6px_6px_0px_#000] flex flex-col gap-6">
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b-2 border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#d81b60] text-white flex items-center justify-center border border-black shadow-[2px_2px_0px_#000]">
                    <CalendarRange className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900">
                      Filtro por Rango de Calendario
                    </h3>
                    <p className="text-xs text-slate-500">
                      Selecciona un rango de fechas o busca por nombre de servicio
                    </p>
                  </div>
                </div>

                {/* BOTONES DE FILTRO RÁPIDO */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleQuickFilter('today')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-black rounded-lg text-xs font-bold transition-all shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                  >
                    Hoy
                  </button>
                  <button
                    onClick={() => handleQuickFilter('week')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-black rounded-lg text-xs font-bold transition-all shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                  >
                    Esta Semana
                  </button>
                  <button
                    onClick={() => handleQuickFilter('month')}
                    className="px-3 py-1.5 bg-[#fce4ec] text-[#d81b60] hover:bg-[#f8bbd0] border border-black rounded-lg text-xs font-bold transition-all shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                  >
                    Este Mes
                  </button>
                  <button
                    onClick={() => handleQuickFilter('last_month')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-black rounded-lg text-xs font-bold transition-all shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                  >
                    Mes Anterior
                  </button>
                  <button
                    onClick={() => handleQuickFilter('all')}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 border border-black rounded-lg text-xs font-bold transition-all shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                  >
                    Todo
                  </button>
                  <button
                    onClick={() => setShowCalendarWidget(!showCalendarWidget)}
                    className={`px-3 py-1.5 border-2 border-black rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                      showCalendarWidget ? 'bg-[#d81b60] text-white shadow-[2px_2px_0px_#000]' : 'bg-pink-100 text-[#d81b60]'
                    }`}
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {showCalendarWidget ? 'Ocultar Calendario Visual' : 'Ver Calendario Visual'}
                  </button>
                </div>
              </div>

              {/* INPUTS DE FECHA DESDE / HASTA Y BUSCADOR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5 text-[#d81b60]" />
                    Fecha Inicio (Desde):
                  </label>
                  <input
                    type="date"
                    value={filterFrom}
                    onChange={(e) => setFilterFrom(e.target.value)}
                    className="p-2.5 border-2 border-black rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white shadow-[2px_2px_0px_#000]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5 text-[#d81b60]" />
                    Fecha Fin (Hasta):
                  </label>
                  <input
                    type="date"
                    value={filterTo}
                    onChange={(e) => setFilterTo(e.target.value)}
                    className="p-2.5 border-2 border-black rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white shadow-[2px_2px_0px_#000]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Search className="w-3.5 h-3.5 text-slate-600" />
                    Buscar por Servicio:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ej. Maquillaje, Alisado..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full p-2.5 border-2 border-black rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white shadow-[2px_2px_0px_#000]"
                    />
                    {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {(filterFrom || filterTo || searchTerm) && (
                    <button
                      onClick={() => { setFilterFrom(''); setFilterTo(''); setSearchTerm(''); }}
                      className="w-full p-2.5 bg-slate-200 hover:bg-slate-300 border-2 border-black rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Limpiar Filtros
                    </button>
                  )}
                </div>
              </div>

              {/* WIDGET DE CALENDARIO VISUAL INTERACTIVO */}
              {showCalendarWidget && (
                <div className="bg-[#fff9fb] border-2 border-black rounded-2xl p-5 shadow-[4px_4px_0px_#000] animate-in fade-in duration-150">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={handlePrevMonth}
                      className="p-2 bg-white border border-black rounded-lg hover:bg-slate-100 shadow-[2px_2px_0px_#000] cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="text-base font-extrabold capitalize text-slate-800 flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-[#d81b60]" />
                      {currentMonthYearStr}
                    </div>
                    <button
                      onClick={handleNextMonth}
                      className="p-2 bg-white border border-black rounded-lg hover:bg-slate-100 shadow-[2px_2px_0px_#000] cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* DÍAS DE LA SEMANA */}
                  <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-black text-slate-500 mb-2 uppercase">
                    <span>Lun</span>
                    <span>Mar</span>
                    <span>Mié</span>
                    <span>Jue</span>
                    <span>Vie</span>
                    <span>Sáb</span>
                    <span>Dom</span>
                  </div>

                  {/* GRILLA DE DÍAS */}
                  <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
                    {calendarDays.map((day, idx) => {
                      if (!day) {
                        return <div key={`empty-${idx}`} className="h-10 sm:h-12"></div>;
                      }

                      let bgClass = "bg-white hover:bg-pink-50 text-slate-800 border-slate-200";
                      if (day.isSelectedStart || day.isSelectedEnd) {
                        bgClass = "bg-[#d81b60] text-white font-black border-black shadow-[2px_2px_0px_#000]";
                      } else if (day.isInRange) {
                        bgClass = "bg-pink-100 text-[#d81b60] font-bold border-pink-300";
                      }

                      return (
                        <button
                          key={day.dateStr}
                          onClick={() => handleCalendarDayClick(day.dateStr)}
                          className={`h-10 sm:h-12 rounded-xl border flex flex-col items-center justify-center relative transition-all cursor-pointer text-xs sm:text-sm ${bgClass}`}
                        >
                          <span>{day.dayNumber}</span>
                          {day.hasServices && (
                            <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                              day.isSelectedStart || day.isSelectedEnd ? 'bg-white' : 'bg-[#d81b60]'
                            }`}></span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-3 border-t border-pink-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#d81b60]"></span>
                        <span>Punto rosa = Días con servicios</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-pink-100 border border-pink-300"></span>
                        <span>Rango seleccionado</span>
                      </div>
                    </div>
                    <div className="font-semibold text-slate-700">
                      {filterFrom && filterTo ? (
                        <span>Filtrando del <b>{filterFrom}</b> al <b>{filterTo}</b></span>
                      ) : filterFrom ? (
                        <span>Haz clic en otro día para fijar la fecha final (Desde: <b>{filterFrom}</b>)</span>
                      ) : (
                        <span>Haz clic en un día para seleccionar inicio de rango</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* BANNER DE ESTADO DEL FILTRO ACTIVO */}
              {(filterFrom || filterTo || searchTerm) && (
                <div className="bg-pink-50 border-2 border-[#d81b60] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2 text-[#d81b60] font-bold">
                    <Filter className="w-4 h-4" />
                    <span>
                      Filtro activo: {filterFrom ? `Desde ${filterFrom}` : ''} {filterTo ? `Hasta ${filterTo}` : ''} {searchTerm ? `· Búsqueda: "${searchTerm}"` : ''}
                    </span>
                    <span className="bg-white text-slate-800 text-xs px-2 py-0.5 rounded-full border border-pink-300">
                      {filteredServices.length} resultados encontrados
                    </span>
                  </div>
                  <button
                    onClick={() => { setFilterFrom(''); setFilterTo(''); setSearchTerm(''); }}
                    className="text-xs font-extrabold text-[#d81b60] hover:underline cursor-pointer"
                  >
                    Mostrar todos los registros
                  </button>
                </div>
              )}
            </section>

            {/* RESUMEN DE LAS CATEGORÍAS FILTRADAS EN INFORMES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border-2 border-black rounded-xl p-5 shadow-[4px_4px_0px_#000] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase">Mi Ganancia Filtrada</div>
                  <div className="text-2xl font-black text-[#d81b60]">
                    S/ {totalMyGain.toFixed(2)}
                  </div>
                </div>
                <div className="text-xs font-bold bg-pink-100 text-[#d81b60] px-2.5 py-1 rounded-md border border-pink-300">
                  {filteredServices.length} serv.
                </div>
              </div>

              <div className="bg-white border-2 border-black rounded-xl p-5 shadow-[4px_4px_0px_#000] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase">Ganancia Salón Filtrada</div>
                  <div className="text-2xl font-black text-[#4f46e5]">
                    S/ {totalSalonGain.toFixed(2)}
                  </div>
                </div>
                <div className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-md border border-indigo-300">
                  Salón
                </div>
              </div>

              <div className="bg-white border-2 border-black rounded-xl p-5 shadow-[4px_4px_0px_#000] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase">Facturación Total Filtrada</div>
                  <div className="text-2xl font-black text-emerald-700">
                    S/ {totalFacturado.toFixed(2)}
                  </div>
                </div>
                <div className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md border border-emerald-300">
                  Bruto
                </div>
              </div>
            </div>

            {/* TABLA DE HISTÓRICO DE SERVICIOS */}
            <section className="bg-white border-3 border-black rounded-2xl p-6 sm:p-8 shadow-[8px_8px_0px_#000]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    Historial de Servicios Realizados
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Listado detallado con desglose de comisión y ganancia
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border-2 border-black">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-900 text-white text-xs font-black uppercase tracking-wider">
                      <th className="p-4">Fecha</th>
                      <th className="p-4">Semana</th>
                      <th className="p-4">Servicio</th>
                      <th className="p-4">Precio Total</th>
                      <th className="p-4">Comisión</th>
                      <th className="p-4">Mi Ganancia</th>
                      <th className="p-4">Ganancia Salón</th>
                      <th className="p-4 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-slate-100 text-sm">
                    {filteredServices.length > 0 ? (
                      filteredServices.map((item) => (
                        <tr key={item.id} className="hover:bg-pink-50/50 transition-colors">
                          <td className="p-4 whitespace-nowrap font-bold text-slate-800">{item.date}</td>
                          <td className="p-4 whitespace-nowrap text-slate-500 font-semibold">{item.week}</td>
                          <td className="p-4 whitespace-nowrap font-extrabold text-slate-900">
                            {item.service}
                          </td>
                          <td className="p-4 whitespace-nowrap font-bold text-slate-800">
                            S/ {item.price.toFixed(2)}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-black border ${
                              item.commission === 40
                                ? 'bg-pink-100 text-[#d81b60] border-pink-300'
                                : 'bg-indigo-100 text-indigo-800 border-indigo-300'
                            }`}>
                              {item.commission}%
                            </span>
                          </td>
                          <td className="p-4 whitespace-nowrap font-black text-[#d81b60] text-base">
                            S/ {item.myGain.toFixed(2)}
                          </td>
                          <td className="p-4 whitespace-nowrap font-bold text-indigo-900">
                            S/ {item.salongain.toFixed(2)}
                          </td>
                          <td className="p-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleDeleteService(item.id)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-200 transition-all cursor-pointer"
                              title="Eliminar registro"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="p-10 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <AlertCircle className="w-8 h-8 text-slate-300" />
                            <span className="font-bold text-slate-600">No se encontraron servicios en este filtro.</span>
                            <button
                              onClick={() => { setFilterFrom(''); setFilterTo(''); setSearchTerm(''); }}
                              className="mt-2 text-xs text-[#d81b60] font-extrabold hover:underline"
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
            </section>

          </div>
        )}

      </main>

    </div>
  );
}