const db = require('../config/db');

// Obtener catálogo público para compradores
const obtenerCatalogo = async (req, res, next) => {
  try {
    const { categoria_id } = req.query;

    // Filtro base: solo productos activos y con stock disponible (> 0)
    let query = `
      SELECT 
        p.id, 
        p.nombre, 
        p.descripcion, 
        p.precio, 
        p.stock, 
        p.stock_minimo, 
        p.imagen_url, 
        p.categoria_id, 
        c.nombre AS categoria_nombre, 
        u.nombre AS vendedor_nombre, 
        u.puesto AS nombre_puesto 
      FROM productos p 
      JOIN categorias c ON p.categoria_id = c.id 
      JOIN usuarios u ON p.usuario_id = u.id 
      WHERE p.estado = 'activo' AND p.stock > 0
    `;

    const params = [];

    // Filtro condicional por categoría/rubro
    if (categoria_id) {
      query += ' AND p.categoria_id = ?';
      params.push(parseInt(categoria_id, 10));
    }

    // Ordenar los productos por fecha de creación de forma descendente
    query += ' ORDER BY p.created_at DESC';

    const [productos] = await db.execute(query, params);

    return res.status(200).json(productos);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerCatalogo
};
