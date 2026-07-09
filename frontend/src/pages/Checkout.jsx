import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import ThemeToggle from '../components/ThemeToggle';
import { ArrowLeft, User, Hash, CreditCard, ShoppingBag } from 'lucide-react';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extraer el producto del estado de navegación
  const product = location.state?.product;

  const [clienteNombre, setClienteNombre] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [metodoPago, setMetodoPago] = useState('Yape');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!product) {
      navigate('/');
    }
  }, [product, navigate]);

  if (!product) return null;

  const handleQtyChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (val > product.stock) {
      setCantidad(product.stock);
    } else if (val < 1) {
      setCantidad(1);
    } else {
      setCantidad(val);
    }
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        producto_id: product.id,
        cantidad,
        cliente_nombre: clienteNombre,
        metodo_pago: metodoPago
      };

      const response = await api.post('/orders', payload, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `recibo_compra_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      link.remove();
      window.URL.revokeObjectURL(url);

      alert('¡Compra Exitosa!\nSu boleta/recibo en PDF se ha generado y descargado automáticamente.');
      navigate('/');

    } catch (err) {
      console.error(err);
      if (err.response?.data instanceof Blob) {
        try {
          const errorText = await err.response.data.text();
          const errorJson = JSON.parse(errorText);
          setErrorMsg(errorJson.error || 'Ocurrió un error al registrar la compra.');
        } catch (parseErr) {
          setErrorMsg('Ocurrió un error inesperado al procesar la compra.');
        }
      } else {
        setErrorMsg(err.response?.data?.error || 'No se pudo comunicar con el servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  const subtotal = product.precio * cantidad;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-900 px-4 py-8 relative transition-colors duration-200 font-poppins">
      {/* Botones de Cabecera flotantes */}
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <ThemeToggle />
      </div>

      <div className="absolute top-4 left-4">
        <Link 
          to="/" 
          className="flex items-center space-x-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-bold transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Volver al Catálogo</span>
        </Link>
      </div>

      {/* Tarjeta de Checkout */}
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-100/50 dark:border-slate-700/30 transition-all duration-200">
        
        {/* Cabecera */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-3">
            <ShoppingBag size={24} className="stroke-[2.5]" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-850 dark:text-slate-100">Completar Compra</h2>
          <p className="text-slate-450 dark:text-slate-500 text-xs mt-1">Confirma los detalles de tu pedido</p>
        </div>

        {/* Resumen del Producto */}
        <div className="bg-slate-50 dark:bg-slate-750 rounded-xl p-4 border border-slate-100 dark:border-slate-700/60 mb-5 text-left">
          <span className="text-[8px] bg-secondary text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
            {product.categoria_nombre}
          </span>
          <h3 className="font-extrabold text-slate-800 dark:text-slate-150 text-sm mt-1.5 leading-tight">{product.nombre}</h3>
          {product.descripcion && <p className="text-slate-555 dark:text-slate-400 text-xs mt-1 leading-snug line-clamp-2">{product.descripcion}</p>}
          
          <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700 grid grid-cols-2 gap-3 text-[10px]">
            <div>
              <span className="text-slate-400 dark:text-slate-500 font-bold block">Puesto</span>
              <span className="font-extrabold text-slate-700 dark:text-slate-300 mt-0.5 block">🏪 {product.nombre_puesto || 'Puesto S/N'}</span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 font-bold block">Vendedor</span>
              <span className="font-extrabold text-slate-700 dark:text-slate-300 mt-0.5 block">👤 {product.vendedor_nombre}</span>
            </div>
          </div>
        </div>

        {/* Mensaje de Error */}
        {errorMsg && (
          <div className="p-3.5 bg-red-50 dark:bg-red-955/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-900/40 text-xs font-bold rounded-xl mb-4">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleCheckoutSubmit} className="space-y-4">
          
          {/* Nombre Completo */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
              Nombre Completo
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                placeholder="Ej. Juan Pérez Ramos"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-slate-700 dark:text-slate-100 bg-slate-50 dark:bg-slate-750 text-xs"
              />
              <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {/* Cantidad */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Cantidad
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="1"
                  max={product.stock}
                  value={cantidad}
                  onChange={handleQtyChange}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-slate-700 dark:text-slate-100 bg-slate-50 dark:bg-slate-750 text-xs"
                />
                <Hash size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 block">Disponible: {product.stock}</span>
            </div>

            {/* Método de Pago */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Método de Pago
              </label>
              <div className="relative">
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-slate-700 dark:text-slate-100 bg-slate-50 dark:bg-slate-750 text-xs appearance-none"
                >
                  <option value="Yape">Yape</option>
                  <option value="Tarjeta">Tarjeta de Crédito</option>
                </select>
                <CreditCard size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Resumen de Totales */}
          <div className="bg-slate-50 dark:bg-slate-750 p-4 rounded-xl border border-slate-100 dark:border-slate-700/60 flex justify-between items-center transition-colors duration-200">
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Total a Pagar</span>
              <div className="text-base font-black text-slate-800 dark:text-white mt-0.5">S/. {subtotal.toFixed(2)}</div>
            </div>
            <div className="text-right text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
              Unit: S/. {parseFloat(product.precio).toFixed(2)}
            </div>
          </div>

          {/* Botón Pagar (Verde Esmeralda) */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all duration-200 ease-in-out active:scale-95 disabled:opacity-75 shadow-md shadow-primary-500/10 flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Procesando pago...</span>
              </>
            ) : (
              <span>Confirmar y Pagar</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
