import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Catalogo from './pages/Catalogo';
import Checkout from './pages/Checkout';

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta pública del catálogo por defecto */}
        <Route path="/" element={<Catalogo />} />
        <Route path="/catalogo" element={<Catalogo />} />
        
        {/* Ruta de pasarela de pago */}
        <Route path="/checkout" element={<Checkout />} />
        
        {/* Rutas de autenticación y panel de comerciante */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Redirección por defecto a catálogo */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
