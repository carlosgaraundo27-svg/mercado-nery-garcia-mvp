const db = require('../config/db');

// Crear Producto
const crearProducto = async (req, res, next) => {
  try {
    const { nombre, descripcion, precio, stock, stock_minimo, categoria_id, imagen_url } = req.body;
    const usuario_id = req.user.id; // Inyectado por el authMiddleware

    // Validación básica de campos obligatorios
    if (!nombre || precio === undefined || stock === undefined || !categoria_id) {
      return res.status(400).json({ error: 'Nombre, precio, stock y categoria_id son obligatorios.' });
    }

    const minStock = stock_minimo !== undefined ? stock_minimo : 5;

    // Registrar en BD
    const [result] = await db.execute(
      'INSERT INTO productos (usuario_id, categoria_id, nombre, descripcion, precio, stock, stock_minimo, imagen_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [usuario_id, categoria_id, nombre, descripcion || null, precio, stock, minStock, imagen_url || null]
    );

    return res.status(201).json({
      message: 'Producto registrado exitosamente',
      product: {
        id: result.insertId,
        usuario_id,
        categoria_id,
        nombre,
        descripcion: descripcion || null,
        precio,
        stock,
        stock_minimo: minStock,
        imagen_url: imagen_url || null,
        estado: 'activo'
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener mis productos (vendedor logueado)
const obtenerMisProductos = async (req, res, next) => {
  try {
    const usuario_id = req.user.id;

    // Solo obtenemos los productos con estado activo (borrado lógico respetado)
    const [productos] = await db.execute(
      `SELECT p.id, p.usuario_id, p.categoria_id, p.nombre, p.descripcion, p.precio, p.stock, p.stock_minimo, p.imagen_url, p.estado, p.created_at, p.updated_at, c.nombre AS categoria_nombre 
       FROM productos p 
       JOIN categorias c ON p.categoria_id = c.id 
       WHERE p.usuario_id = ? AND p.estado = 'activo'`,
      [usuario_id]
    );

    return res.status(200).json(productos);
  } catch (error) {
    next(error);
  }
};

// Actualizar stock y datos generales del producto
const actualizarStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuario_id = req.user.id;
    const { nombre, descripcion, precio, stock, stock_minimo, categoria_id, imagen_url } = req.body;

    // Verificar existencia del producto, que pertenezca al comerciante y que esté activo
    const [existing] = await db.execute(
      'SELECT id, nombre, descripcion, precio, stock, stock_minimo, categoria_id, imagen_url FROM productos WHERE id = ? AND usuario_id = ? AND estado = "activo"',
      [id, usuario_id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado o no pertenece a tu puesto.' });
    }

    const current = existing[0];

    // Combinar campos actuales y nuevos
    const updatedNombre = nombre !== undefined ? nombre : current.nombre;
    const updatedDesc = descripcion !== undefined ? descripcion : current.descripcion;
    const updatedPrecio = precio !== undefined ? precio : current.precio;
    const updatedStock = stock !== undefined ? stock : current.stock;
    const updatedMinStock = stock_minimo !== undefined ? stock_minimo : current.stock_minimo;
    const updatedCatId = categoria_id !== undefined ? categoria_id : current.categoria_id;
    const updatedImgUrl = imagen_url !== undefined ? imagen_url : current.imagen_url;

    // Actualizar producto
    await db.execute(
      'UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ?, stock_minimo = ?, categoria_id = ?, imagen_url = ? WHERE id = ? AND usuario_id = ?',
      [updatedNombre, updatedDesc, updatedPrecio, updatedStock, updatedMinStock, updatedCatId, updatedImgUrl, id, usuario_id]
    );

    return res.status(200).json({
      message: 'Producto actualizado exitosamente',
      product: {
        id: parseInt(id, 10),
        usuario_id,
        categoria_id: updatedCatId,
        nombre: updatedNombre,
        descripcion: updatedDesc,
        precio: updatedPrecio,
        stock: updatedStock,
        stock_minimo: updatedMinStock,
        imagen_url: updatedImgUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar Producto (Borrado Lógico)
const eliminarProducto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuario_id = req.user.id;

    // Actualizar estado a inactivo
    const [result] = await db.execute(
      'UPDATE productos SET estado = "inactivo" WHERE id = ? AND usuario_id = ? AND estado = "activo"',
      [id, usuario_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Producto no encontrado o no pertenece a tu puesto.' });
    }

    return res.status(200).json({
      message: 'Producto eliminado exitosamente (borrado lógico)'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearProducto,
  obtenerMisProductos,
  actualizarStock,
  eliminarProducto
};
