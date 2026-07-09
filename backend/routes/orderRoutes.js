const express = require('express');
const router = express.Router();
const { procesarCompra } = require('../controllers/orderController');

// Ruta pública para procesar la compra de un producto
router.post('/', procesarCompra);

module.exports = router;
