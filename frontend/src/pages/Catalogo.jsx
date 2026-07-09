import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ThemeToggle from '../components/ThemeToggle';
import { 
  MapPin, 
  ChevronDown, 
  Bell, 
  Search, 
  ShoppingCart, 
  Store, 
  Home, 
  ClipboardList, 
  Settings
} from 'lucide-react';

const CATEGORIES = [
  { id: '', nombre: 'Todos' },
  { id: '1', nombre: 'Carnes y Aves' },
  { id: '2', nombre: 'Pescados y Mariscos' },
  { id: '3', nombre: 'Frutas y Verduras' },
  { id: '4', nombre: 'Abarrotes' },
  { id: '5', nombre: 'Lácteos y Embutidos' }
];

const categoryEmojis = {
  '': '🍽️',
  '1': '🥩',
  '2': '🐟',
  '3': '🥦',
  '4': '🥫',
  '5': '🧀'
};

const Catalogo = () => {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCatalog();
  }, [selectedCategory]);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (selectedCategory) {
        params.categoria_id = selectedCategory;
      }
      const response = await api.get('/catalog', { params });
      setProducts(response.data);
    } catch (err) {
      setError('No se pudo cargar el catálogo de productos. Inténtalo de nuevo más tarde.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (id) => {
    setSelectedCategory(id);
  };

  const filteredProducts = products.filter(product => {
    const query = searchQuery.toLowerCase();
    return (
      product.nombre.toLowerCase().includes(query) ||
      (product.descripcion && product.descripcion.toLowerCase().includes(query)) ||
      (product.categoria_nombre && product.categoria_nombre.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-200 pb-24">
      {/* Header Público */}
      <header className="bg-white dark:bg-slate-850 border-b border-slate-150 dark:border-slate-700/60 sticky top-0 z-10 px-4 py-3 flex justify-between items-center max-w-md mx-auto w-full transition-colors duration-200 shadow-xs">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-secondary/10 dark:bg-slate-700 flex items-center justify-center border-2 border-secondary shadow-sm shrink-0">
            <span className="text-sm">👨‍🌾</span>
          </div>
          <div className="flex flex-col items-start leading-tight">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Ubicación</span>
            <div className="flex items-center space-x-0.5">
              <MapPin size={11} className="text-secondary fill-secondary/20" />
              <span className="text-[11px] font-black text-slate-800 dark:text-slate-100">Mercado Nery García</span>
              <ChevronDown size={10} className="text-slate-400" />
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <Link
            to="/login"
            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-750 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-full transition-colors shadow-xs"
            title="Soy Vendedor"
          >
            <Store size={14} />
          </Link>
          <div className="relative p-1.5 bg-secondary text-white rounded-full transition-colors shadow-sm">
            <Bell size={14} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 border border-white rounded-full"></span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-md mx-auto w-full">
        {/* Hero Banner (Banner superior redondeado) */}
        <div className="px-4 pt-4">
          <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 text-white rounded-3xl p-5 flex items-center justify-between shadow-md border border-slate-800/20">
            <div className="w-7/12 z-10 flex flex-col items-start text-left">
              <span className="text-[9px] bg-secondary text-white font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2 shadow-xs">
                FRESCO Y NATURAL
              </span>
              <h2 className="text-[15px] font-extrabold leading-tight text-slate-100">
                Descubre lo más fresco del Mercado Nery García Zárate
              </h2>
              <p className="text-[10px] text-slate-300 mt-1 leading-normal">
                Carnes, pescados, verduras y abarrotes disponibles en tiempo real.
              </p>
              <button 
                onClick={() => {
                  const el = document.getElementById('catalog-list');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="mt-3 px-3.5 py-1.5 bg-secondary hover:bg-amber-650 text-white text-[9px] font-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-sm uppercase tracking-wider"
              >
                Comprar Ahora
              </button>
            </div>
            <div className="w-5/12 absolute right-0 top-0 bottom-0 flex items-center justify-center overflow-hidden pointer-events-none">
              <img 
                src="/fresh_salad_accent.png" 
                alt="Salad Accent" 
                className="w-32 h-32 object-cover transform translate-x-4 rotate-12 scale-110 drop-shadow-md"
              />
            </div>
          </div>
        </div>

        {/* Buscador de Productos */}
        <div className="px-4 mt-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar productos por nombre, puesto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-xs transition-all dark:text-white"
            />
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* Barra de Filtros de Categorías (Pills con scroll horizontal) */}
        <div className="py-3 sticky top-[57px] z-10 w-full overflow-x-auto scrollbar-none flex px-4 space-x-2.5 bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`px-4 py-2 rounded-full text-[11px] font-extrabold whitespace-nowrap transition-all flex items-center border ${
                  isActive 
                    ? 'bg-secondary border-secondary text-white shadow-md scale-102' 
                    : 'bg-white border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-750 shadow-xs'
                }`}
              >
                <span className="mr-1.5 text-xs">{categoryEmojis[cat.id]}</span>
                {cat.nombre}
              </button>
            );
          })}
        </div>

        {/* Contenido Principal */}
        <main id="catalog-list" className="px-4 py-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-8 h-8 border-4 border-emerald-200 border-t-primary rounded-full animate-spin"></div>
              <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Cargando productos...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-955/30 border border-red-200 dark:border-red-900/50 rounded-2xl text-center">
              <p className="text-red-700 dark:text-red-400 text-xs font-semibold">{error}</p>
              <button
                onClick={fetchCatalog}
                className="mt-3 px-4 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition"
              >
                Reintentar
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/40 rounded-3xl p-12 text-center shadow-md transition-colors duration-200">
              <span className="text-4xl block mb-2">🍎</span>
              <p className="text-slate-600 dark:text-slate-300 font-bold text-sm">Sin stock disponible</p>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">No se encontraron productos disponibles para tu búsqueda.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                Mostrando {filteredProducts.length} productos disponibles
              </p>

              {/* Listado de Tarjetas */}
              <div className="space-y-3.5">
                {filteredProducts.map((product) => (
                  <div 
                    key={product.id}
                    className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex items-center space-x-4 border border-slate-100/50 dark:border-slate-700/30"
                  >
                    {/* Thumbnail / Precio */}
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-slate-700 dark:to-slate-750 border border-emerald-100/60 dark:border-slate-700 flex flex-col items-center justify-center shrink-0 transition-colors duration-200 relative overflow-hidden">
                      <span className="text-[8px] text-primary dark:text-primary-300 font-bold uppercase tracking-wider">PRECIO</span>
                      <span className="text-xs font-black text-slate-800 dark:text-white mt-0.5">S/. {product.precio}</span>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full opacity-70 animate-pulse"></div>
                    </div>

                    {/* Detalle Producto */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <span className="inline-block text-[8px] font-bold tracking-wider uppercase text-secondary bg-secondary-50 dark:bg-secondary-950/20 px-2 py-0.5 rounded-full border border-secondary-100/50 dark:border-secondary-900/30">
                        {product.categoria_nombre}
                      </span>
                      <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm leading-tight truncate">
                        {product.nombre}
                      </h3>
                      {product.descripcion && (
                        <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-1 leading-tight">
                          {product.descripcion}
                        </p>
                      )}

                      {/* Vendedor y Puesto */}
                      <div className="flex items-center space-x-2 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-400 dark:text-slate-500">
                        <span className="font-medium text-slate-500 dark:text-slate-350">🏪 {product.nombre_puesto || 'Puesto S/N'}</span>
                        <span className="text-slate-200 dark:text-slate-700">|</span>
                        <span className="font-medium text-slate-500 dark:text-slate-350 truncate">👤 {product.vendedor_nombre}</span>
                      </div>
                    </div>

                    {/* Stock Badge / Acciones */}
                    <div className="shrink-0 flex flex-col items-end space-y-2.5">
                      <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 px-2 py-0.5 rounded-full text-[9px] font-bold">
                        Stock: {product.stock}
                      </span>
                      
                      <button
                        onClick={() => navigate('/checkout', { state: { product } })}
                        className="px-2.5 py-1.5 bg-primary hover:bg-emerald-600 active:scale-95 text-white rounded-lg text-[10px] font-bold transition flex items-center space-x-1 cursor-pointer shadow-sm"
                      >
                        <ShoppingCart size={11} />
                        <span>Comprar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Footer (Pie de Página) */}
        <footer className="mt-8 py-6 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700/60 text-center transition-colors duration-200">
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-white font-bold text-xs">
                M
              </div>
              <span className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">Mercado Nery García</span>
            </div>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
              &copy; {new Date().getFullYear()} Mercado Nery García. Todos los derechos reservados.
            </p>
          </div>
        </footer>
      </div>

      {/* Barra de Navegación Inferior (Estilo Mobile del Mockup) */}
      <div className="fixed bottom-0 left-0 right-0 z-20 max-w-md mx-auto w-full bg-secondary text-white rounded-t-3xl shadow-xl border-t border-secondary-600/10 px-6 py-2 pb-3.5 transition-colors duration-200">
        <div className="flex justify-between items-end">
          {/* Home */}
          <button 
            onClick={() => navigate('/')} 
            className="flex flex-col items-center justify-center flex-1 py-1 text-white hover:opacity-80 transition cursor-pointer"
          >
            <Home size={20} className="stroke-[2.5]" />
            <span className="text-[9px] font-bold mt-1">Catálogo</span>
          </button>

          {/* Search */}
          <button 
            onClick={() => {
              const searchInput = document.querySelector('input[placeholder="Buscar productos por nombre, puesto..."]');
              if (searchInput) {
                searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                searchInput.focus();
              }
            }} 
            className="flex flex-col items-center justify-center flex-1 py-1 text-white hover:opacity-80 transition cursor-pointer"
          >
            <Search size={20} className="stroke-[2.5]" />
            <span className="text-[9px] font-bold mt-1">Buscar</span>
          </button>

          {/* Elevated Cart Button */}
          <div className="flex-1 flex justify-center -translate-y-4">
            <button 
              onClick={() => navigate('/checkout')} 
              className="w-14 h-14 rounded-full bg-white dark:bg-slate-800 border-4 border-secondary text-secondary hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center relative cursor-pointer"
            >
              <ShoppingCart size={22} className="stroke-[2.5]" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                3
              </span>
            </button>
          </div>

          {/* Orders */}
          <button 
            onClick={() => navigate('/dashboard')} 
            className="flex flex-col items-center justify-center flex-1 py-1 text-white hover:opacity-80 transition cursor-pointer"
          >
            <ClipboardList size={20} className="stroke-[2.5]" />
            <span className="text-[9px] font-bold mt-1">Panel</span>
          </button>

          {/* Info */}
          <button 
            onClick={() => {
              alert('Mercado Nery García Zárate - Ayacucho, Perú\nUsa la barra superior para cambiar el tema.');
            }}
            className="flex flex-col items-center justify-center flex-1 py-1 text-white hover:opacity-80 transition cursor-pointer"
          >
            <Settings size={20} className="stroke-[2.5]" />
            <span className="text-[9px] font-bold mt-1">Info</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Catalogo;
