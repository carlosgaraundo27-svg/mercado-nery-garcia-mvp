require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/authRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const catalogRoutes = require('./routes/catalogRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

// Configuración de limitación de tasa (rate limiting)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'test' ? 10000 : 100,
  message: { error: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'test' ? 10000 : 10,
  message: { error: 'Demasiados intentos de autenticación. Por favor, intente de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Configuración de CORS con origen específico
const allowedOrigins = ['http://localhost:5173'];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: (origin, callback) => {
    // Permitir solicitudes sin origen (como curl o supertest en ambiente de pruebas)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  }
};

// Configuración de middlewares base
app.use(helmet());
app.use(cors(corsOptions));
app.use(generalLimiter);
app.use(express.json({ limit: '10mb' }));

// Registro de rutas
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/orders', orderRoutes);


// Ruta básica de salud para pruebas
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Servidor API del Mercado Nery García Zárate listo.' });
});

// Ruta para forzar un error en entorno de desarrollo/test y probar el middleware de errores
app.get('/test-error', (req, res, next) => {
  const err = new Error('Test Error Message');
  err.status = 400;
  next(err);
});

app.get('/test-error-default', (req, res, next) => {
  const err = new Error('Default Error Message');
  next(err);
});



// Middleware global de manejo de errores (no expone Stack Traces)
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Ocurrió un error interno en el servidor' 
    : err.message;
  
  res.status(status).json({ error: message });
});

module.exports = app;
