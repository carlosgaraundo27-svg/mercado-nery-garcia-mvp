import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import ThemeToggle from '../components/ThemeToggle';
import { Mail, Lock, Store, ArrowLeft } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ type: '', message: '' });

    try {
      const response = await api.post('/auth/login', formData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      setAlert({
        type: 'success',
        message: '¡Ingreso exitoso! Cargando panel de control...'
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Credenciales incorrectas o problemas al conectar. Inténtalo de nuevo.';
      setAlert({
        type: 'error',
        message: errorMsg
      });
    } finally {
      setLoading(false);
    }
  };

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

      {/* Tarjeta de Formulario */}
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-100/50 dark:border-slate-700/30 transition-all duration-200">
        
        {/* Cabecera / Marca */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-3">
            <Store size={24} className="stroke-[2.5]" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-850 dark:text-slate-100">Mercado Nery García</h2>
          <p className="text-slate-450 dark:text-slate-500 text-xs mt-1">Ingreso de Comerciantes</p>
        </div>

        {/* Alertas */}
        {alert.message && (
          <div className={`p-3.5 rounded-xl text-xs font-bold border mb-4 ${
            alert.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border-emerald-250/30 dark:border-emerald-900/40' 
              : 'bg-red-50 dark:bg-red-955/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-900/40'
          }`}>
            {alert.message}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Correo */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="ejemplo@correo.com"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-slate-700 dark:text-slate-100 bg-slate-50 dark:bg-slate-750 text-xs"
              />
              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Contraseña
              </label>
            </div>
            <div className="relative">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Introduce tu contraseña"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-slate-700 dark:text-slate-100 bg-slate-50 dark:bg-slate-750 text-xs"
              />
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Botón Principal (Verde Esmeralda) */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all duration-200 ease-in-out active:scale-95 disabled:opacity-75 disabled:pointer-events-none mt-6 shadow-md shadow-primary-500/10 cursor-pointer"
          >
            {loading ? 'Validando...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Enlace de Registro */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700/60 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
            ¿Eres nuevo comerciante?{' '}
            <Link to="/register" className="font-extrabold text-primary hover:underline transition">
              Registra tu puesto aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
