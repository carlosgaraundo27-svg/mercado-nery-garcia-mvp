const express = require('express');
const router = express.Router();
const { obtenerCatalogo } = require('../controllers/catalogController');

// Ruta pública para ver el catálogo
router.get('/', obtenerCatalogo);

module.exports = router;
