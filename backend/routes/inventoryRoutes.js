const express = require('express');
const router = express.Router();
const {
  crearProducto,
  obtenerMisProductos,
  actualizarStock,
  eliminarProducto
} = require('../controllers/inventoryController');
const authMiddleware = require('../middleware/authMiddleware');

// Aplicar protección JWT a todos los endpoints del inventario
router.use(authMiddleware);

// Endpoints CRUD del Inventario
router.post('/', crearProducto);
router.get('/', obtenerMisProductos);
router.put('/:id', actualizarStock);
router.delete('/:id', eliminarProducto);

module.exports = router;
