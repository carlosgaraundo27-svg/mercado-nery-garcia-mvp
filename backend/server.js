// Carga de variables de entorno al inicio
require('dotenv').config();

const app = require('./app');
const PORT = process.env.PORT || 5000;

// Inicio del servidor HTTP
const server = app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  Servidor iniciado en modo: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Escuchando en el puerto: ${PORT}`);
  console.log(`  Ruta de salud: http://localhost:${PORT}/health`);
  console.log(`==================================================`);
});

// Manejo de cierres limpios
process.on('SIGTERM', () => {
  console.log('Se recibió señal SIGTERM. Cerrando el servidor de forma ordenada...');
  server.close(() => {
    console.log('Servidor HTTP cerrado.');
  });
});
