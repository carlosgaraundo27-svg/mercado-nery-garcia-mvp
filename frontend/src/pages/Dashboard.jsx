import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import ThemeToggle from '../components/ThemeToggle';
import { 
  Package, 
  AlertTriangle, 
  PackageOpen, 
  Edit, 
  Trash2, 
  LogOut, 
  Store, 
  Eye, 
  Plus
} from 'lucide-react';

const CATEGORIES = [
  { id: 1, nombre: 'Carnes y Aves' },
  { id: 2, nombre: 'Pescados y Mariscos' },
  { id: 3, nombre: 'Frutas y Verduras' },
  { id: 4, nombre: 'Abarrotes' },
  { id: 5, nombre: 'Lácteos y Embutidos' }
];

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados del modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null); // null para Crear, objeto producto para Editar
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    stock_minimo: 5,
    categoria_id: '',
    imagen_url: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      localStorage.clear();
      navigate('/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchProducts();
  }, [navigate]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/inventory');
      setProducts(response.data);
    } catch (err) {
      setError('Error al cargar los productos de tu inventario.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Modales
  const handleOpenCreate = () => {
    setCurrentProduct(null);
    setForm({
      nombre: '',
      descripcion: '',
      precio: '',
      stock: '',
      stock_minimo: 5,
      categoria_id: '',
      imagen_url: ''
    });
    setSubmitError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setCurrentProduct(product);
    setForm({
      nombre: product.nombre,
      descripcion: product.descripcion || '',
      precio: product.precio,
      stock: product.stock,
      stock_minimo: product.stock_minimo,
      categoria_id: product.categoria_id,
      imagen_url: product.imagen_url || ''
    });
    setSubmitError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitError('');

    try {
      const payload = {
        ...form,
        precio: parseFloat(form.precio),
        stock: parseInt(form.stock, 10),
        stock_minimo: parseInt(form.stock_minimo, 10),
        categoria_id: parseInt(form.categoria_id, 10)
      };

      if (currentProduct) {
        // Modo Editar (PUT)
        const response = await api.put(`/inventory/${currentProduct.id}`, payload);
        const updatedProduct = response.data.product;
        
        const category = CATEGORIES.find(c => c.id === updatedProduct.categoria_id);
        const mappedProduct = {
          ...updatedProduct,
          categoria_nombre: category ? category.nombre : 'General'
        };

        setProducts(products.map(p => p.id === currentProduct.id ? mappedProduct : p));
      } else {
        // Modo Crear (POST)
        const response = await api.post('/inventory', payload);
        const newProduct = response.data.product;

        const category = CATEGORIES.find(c => c.id === newProduct.categoria_id);
        const mappedProduct = {
          ...newProduct,
          categoria_nombre: category ? category.nombre : 'General'
        };

        setProducts([...products, mappedProduct]);
      }
      setIsModalOpen(false);
    } catch (err) {
      const msg = err.response?.data?.error || 'No se pudo guardar el producto. Verifica los datos.';
      setSubmitError(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este producto de tu inventario?')) {
      return;
    }

    try {
      await api.delete(`/inventory/${id}`);
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      alert('No se pudo eliminar el producto del inventario.');
      console.error(err);
    }
  };

  const getCategoryName = (catId) => {
    const cat = CATEGORIES.find(c => c.id === parseInt(catId, 10));
    return cat ? cat.nombre : 'General';
  };

  if (!user) return null;

  // Contar alertas de stock crítico (stock < stock_minimo)
  const criticalCount = products.filter(p => p.stock < p.stock_minimo).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col relative pb-24 transition-colors duration-200">
      {/* Navbar Superior */}
      <header className="bg-white dark:bg-slate-850 border-b border-slate-150 dark:border-slate-700/60 sticky top-0 z-10 px-4 py-3 flex justify-between items-center max-w-md mx-auto w-full transition-colors duration-200 shadow-xs">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-secondary/10 dark:bg-slate-700 flex items-center justify-center border-2 border-secondary shadow-sm shrink-0">
            <span className="text-sm">🏪</span>
          </div>
          <span className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">Mercado Nery García</span>
        </div>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <Link
            to="/catalogo"
            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-750 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-full transition-colors shadow-xs"
            title="Ver Catálogo Público"
          >
            <Eye size={14} />
          </Link>
          <button
            onClick={handleLogout}
            className="p-1.5 bg-red-50 hover:bg-red-105 dark:bg-red-955/20 dark:hover:bg-red-900/30 text-red-650 dark:text-red-400 rounded-full transition border border-red-100/60 dark:border-red-900/40 cursor-pointer shadow-xs"
            title="Salir del Panel"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* Contenido Principal (Mobile First) */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-6 space-y-6">
        
        {/* Header de Estadísticas / Saludo */}
        <div className="flex justify-between items-center bg-white dark:bg-slate-850 rounded-2xl p-5 shadow-md border border-slate-150/40 dark:border-slate-700/40">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary text-xl font-bold shrink-0 shadow-xs">
              👨‍🌾
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
                ¡Hola, {user.nombre}!
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                Puesto: {user.puesto || 'S/N'} • {user.rubro || 'Comerciante'}
              </p>
            </div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider flex items-center space-x-1 shadow-xs">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
            <span>Activo</span>
          </div>
        </div>

        {/* Resumen e Indicadores */}
        <div className="grid grid-cols-2 gap-4">
          {/* Tarjeta 1: Productos Activos */}
          <div className="bg-white dark:bg-slate-850 p-4.5 rounded-xl shadow-md border border-slate-150/50 dark:border-slate-700/30 transition-colors duration-200 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-2xl font-black text-slate-800 dark:text-white leading-none">
                {products.length}
              </span>
              <div className="p-1.5 bg-primary/10 text-primary rounded-lg dark:bg-slate-700/60 dark:text-primary-300">
                <Package size={16} />
              </div>
            </div>
            <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-3">
              Total de Prod. Activos
            </span>
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-primary h-1 rounded-full" style={{ width: products.length > 0 ? '75%' : '0%' }}></div>
            </div>
          </div>

          {/* Tarjeta 2: Stock Crítico */}
          <div className={`p-4.5 rounded-xl shadow-md border transition-all duration-300 flex flex-col justify-between ${
            criticalCount > 0 
              ? 'bg-red-50 dark:bg-red-955/20 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-400' 
              : 'bg-white dark:bg-slate-850 border-slate-150/50 dark:border-slate-700/30 text-slate-800 dark:text-white'
          }`}>
            <div className="flex justify-between items-start">
              <span className="text-2xl font-black leading-none">
                {criticalCount}
              </span>
              <div className={`p-1.5 rounded-lg ${
                criticalCount > 0 ? 'bg-red-100 text-red-650 dark:bg-red-900/40 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
              }`}>
                <AlertTriangle size={16} className={criticalCount > 0 ? 'animate-bounce' : ''} />
              </div>
            </div>
            <span className={`block text-[10px] font-bold uppercase tracking-wider mt-3 ${
              criticalCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'
            }`}>
              Stock Crítico
            </span>
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1 rounded-full mt-2 overflow-hidden">
              <div className={`h-1 rounded-full ${criticalCount > 0 ? 'bg-red-500' : 'bg-slate-350'}`} style={{ width: criticalCount > 0 ? '100%' : '0%' }}></div>
            </div>
          </div>
        </div>

        {/* Sección del Listado */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Mi Inventario</h3>
            <button
              onClick={handleOpenCreate}
              className="text-xs bg-primary hover:bg-emerald-600 text-white font-bold py-1.5 px-3 rounded-xl shadow-sm transition cursor-pointer flex items-center space-x-1"
            >
              <Plus size={12} />
              <span>Añadir Producto</span>
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-8 h-8 border-4 border-emerald-250 border-t-primary rounded-full animate-spin"></div>
              <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Cargando inventario...</p>
            </div>
          ) : error ? (
            <p className="text-center text-red-500 dark:text-red-400 text-sm py-8 font-semibold">{error}</p>
          ) : products.length === 0 ? (
            /* Empty State (Estado Vacío) */
            <div className="bg-white dark:bg-slate-850 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-4 shadow-sm transition-colors duration-200">
              <div className="p-4 bg-slate-50 dark:bg-slate-750 text-slate-400 dark:text-slate-500 rounded-full">
                <PackageOpen size={48} className="stroke-[1.5]" />
              </div>
              <div>
                <p className="text-slate-600 dark:text-slate-200 font-extrabold text-sm">Aún no tienes productos registrados</p>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 max-w-xs mx-auto">
                  Registra tu primer producto para comenzar a vender en el catálogo digital.
                </p>
              </div>
              <button
                onClick={handleOpenCreate}
                className="px-6 py-2.5 bg-primary hover:bg-emerald-650 text-white text-xs font-black rounded-full shadow-md animate-pulse active:scale-95 transition-all uppercase tracking-wider cursor-pointer"
              >
                + Añadir Producto
              </button>
            </div>
          ) : (
            /* Lista de Productos en List-view horizontal */
            <div className="space-y-3">
              {products.map((product) => {
                const isLessThanFive = product.stock < 5;
                return (
                  <div 
                    key={product.id} 
                    className={`bg-white dark:bg-slate-850 p-4 rounded-xl shadow-md flex items-center space-x-4 hover:shadow-lg transition-all duration-200 border border-slate-100/50 dark:border-slate-700/30 ${
                      isLessThanFive ? 'border-l-4 border-l-red-500 dark:border-l-red-500' : ''
                    }`}
                  >
                    {/* Thumbnail o Categoría */}
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-slate-700 dark:to-slate-750 border border-emerald-100/60 dark:border-slate-700 flex flex-col items-center justify-center shrink-0 transition-colors duration-200">
                      <span className="text-[8px] text-primary dark:text-primary-300 font-bold uppercase tracking-wider">PRECIO</span>
                      <span className="text-[11px] font-black text-slate-800 dark:text-white mt-0.5">S/. {product.precio}</span>
                    </div>

                    {/* Información del Producto */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm truncate leading-none">
                          {product.nombre}
                        </h4>
                        <span className="inline-block text-[8px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-full px-2 py-0.5 uppercase tracking-wider shrink-0 leading-none">
                          Activo
                        </span>
                      </div>
                      <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                        {product.categoria_nombre || getCategoryName(product.categoria_id)}
                      </p>
                      
                      {/* Stock Badge */}
                      <div className="pt-1">
                        <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          isLessThanFive 
                            ? 'bg-red-100 text-red-650 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-900/50 font-black' 
                            : 'bg-emerald-50 text-emerald-750 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                        }`}>
                          Stock: {product.stock} {isLessThanFive && '⚠️ (Bajo)'}
                        </span>
                      </div>
                    </div>

                    {/* Acciones con Iconos Limpios */}
                    <div className="flex space-x-1.5 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(product)}
                        className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-750 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer shadow-xs"
                        title="Editar Producto"
                      >
                        <Edit size={13} className="stroke-[2.5]" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 bg-red-50 hover:bg-red-105 dark:bg-red-955/20 dark:hover:bg-red-900/30 text-red-650 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/40 transition cursor-pointer shadow-xs"
                        title="Eliminar Producto"
                      >
                        <Trash2 size={13} className="stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Botón flotante agregar producto (Estilo Mobile) */}
      {products.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xs px-4 z-10">
          <button
            onClick={handleOpenCreate}
            className="w-full py-3.5 bg-gradient-to-r from-primary to-emerald-600 hover:scale-102 hover:shadow-lg text-white font-black rounded-full text-xs shadow-md shadow-primary-600/30 transition-all duration-200 active:scale-95 flex items-center justify-center space-x-1.5 uppercase tracking-wider cursor-pointer"
          >
            <Plus size={14} className="stroke-[3]" />
            <span>Agregar Producto</span>
          </button>
        </div>
      )}

      {/* Modal de Crear / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 dark:border-slate-800">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary to-emerald-600 p-4 text-white rounded-t-2xl flex justify-between items-center sticky top-0 z-10 shadow-sm">
              <h3 className="font-extrabold text-sm">
                {currentProduct ? '✏️ Editar Producto' : '📦 Registrar Producto'}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="text-white hover:text-primary-100 text-xs font-black w-6 h-6 flex items-center justify-center rounded-full bg-white/10 cursor-pointer transition-transform hover:rotate-90"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              {submitError && (
                <div className="p-3 bg-red-50 dark:bg-red-955/30 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-900/40 text-xs font-bold rounded-xl">
                  {submitError}
                </div>
              )}

              {/* Nombre */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Nombre del Producto</label>
                <input
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleInputChange}
                  placeholder="Ej. Lomo fino de res"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xs text-slate-700 dark:text-slate-100 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Categoría</label>
                <select
                  name="categoria_id"
                  value={form.categoria_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xs text-slate-700 dark:text-slate-100 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="">Selecciona una categoría...</option>
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Precio */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Precio (S/.)</label>
                  <input
                    type="number"
                    name="precio"
                    value={form.precio}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xs text-slate-700 dark:text-slate-100 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Stock Actual</label>
                  <input
                    type="number"
                    name="stock"
                    value={form.stock}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xs text-slate-700 dark:text-slate-100 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {/* Stock Mínimo */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Stock Mínimo (Alerta)</label>
                  <input
                    type="number"
                    name="stock_minimo"
                    value={form.stock_minimo}
                    onChange={handleInputChange}
                    placeholder="5"
                    min="1"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xs text-slate-700 dark:text-slate-100 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Descripción (Opcional)</label>
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleInputChange}
                  placeholder="Detalles del corte, procedencia, etc."
                  rows="2"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xs text-slate-700 dark:text-slate-100 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              {/* Imagen URL */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">URL de Imagen (Opcional)</label>
                <input
                  type="text"
                  name="imagen_url"
                  value={form.imagen_url}
                  onChange={handleInputChange}
                  placeholder="http://..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xs text-slate-700 dark:text-slate-100 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              {/* Botón Guardar */}
              <button
                type="submit"
                disabled={submitLoading}
                className="w-full py-3 bg-gradient-to-r from-primary to-emerald-600 text-white font-black rounded-xl text-xs transition-all duration-200 transform active:scale-95 disabled:opacity-70 mt-2 shadow-md shadow-primary-500/10 cursor-pointer uppercase tracking-wider"
              >
                {submitLoading ? 'Guardando...' : 'Guardar Producto'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
