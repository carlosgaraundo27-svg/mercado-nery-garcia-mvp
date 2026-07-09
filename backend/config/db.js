const mysql = require('mysql2/promise');

// Crear el pool de conexiones usando variables de entorno
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'unsch-2005',
  database: process.env.DB_NAME || 'mercado_nery_garcia',
  waitForConnections: true,
  connectionLimit: 10, // Límite razonable para evitar cuellos de botella
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

module.exports = pool;

// Agrega esto en config/db.js para probar la conexión real
pool.getConnection()
  .then(connection => {
    console.log('✅ ¡Éxito! El servidor Node.js está conectado a la base de datos de MySQL local.');
    connection.release(); // Liberamos la conexión
  })
  .catch(err => {
    console.error('❌ Error fatal: No se pudo conectar a MySQL. Revisa tu archivo .env.', err.message);
  });