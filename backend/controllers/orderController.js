const db = require('../config/db');
const PDFDocument = require('pdfkit');

// Función auxiliar para generar el PDF directamente al response (stream)
const generateReceiptPDF = (res, orderData) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=recibo_${orderData.ventaId}.pdf`);

  const doc = new PDFDocument({ margin: 30, size: 'A6' }); // Tamaño boleta compacta

  doc.pipe(res);

  // Encabezado
  doc.fontSize(11).font('Helvetica-Bold').text('MERCADO NERY GARCÍA ZÁRATE', { align: 'center' });
  doc.fontSize(8).font('Helvetica').text('Ayacucho, Perú', { align: 'center' });
  doc.text('----------------------------------------------------', { align: 'center' });
  doc.fontSize(9).font('Helvetica-Bold').text('RECIBO DE COMPRA VIRTUAL', { align: 'center' });
  doc.text('----------------------------------------------------', { align: 'center' });
  doc.moveDown(0.5);

  // Datos de la Venta
  doc.fontSize(8);
  doc.font('Helvetica-Bold').text('Boleta Nº: ', { continued: true }).font('Helvetica').text(`${orderData.ventaId}`);
  doc.font('Helvetica-Bold').text('Fecha: ', { continued: true }).font('Helvetica').text(`${new Date().toLocaleString('es-PE')}`);
  doc.font('Helvetica-Bold').text('Cliente: ', { continued: true }).font('Helvetica').text(`${orderData.clienteNombre}`);
  doc.font('Helvetica-Bold').text('Vendedor: ', { continued: true }).font('Helvetica').text(`${orderData.vendedorNombre}`);
  doc.font('Helvetica-Bold').text('Puesto: ', { continued: true }).font('Helvetica').text(`${orderData.nombrePuesto || 'N/A'}`);
  doc.font('Helvetica-Bold').text('Medio de Pago: ', { continued: true }).font('Helvetica').text(`${orderData.metodoPago}`);
  doc.text('----------------------------------------------------', { align: 'center' });
  doc.moveDown(0.5);

  // Detalle de Producto
  doc.font('Helvetica-Bold').text('Ítem / Descripción:', { align: 'left' });
  doc.font('Helvetica').text(`${orderData.productoNombre}`, { align: 'left' });
  doc.text(`Cantidad: ${orderData.cantidad} unidades`);
  doc.text(`Precio Unitario: S/. ${parseFloat(orderData.precioUnitario).toFixed(2)}`);
  doc.text(`Subtotal: S/. ${parseFloat(orderData.subtotal).toFixed(2)}`);
  doc.text('----------------------------------------------------', { align: 'center' });
  doc.moveDown(0.5);

  // Total
  doc.fontSize(10).font('Helvetica-Bold').text(`TOTAL PAGADO: S/. ${parseFloat(orderData.total).toFixed(2)}`, { align: 'right' });
  doc.moveDown(1);

  // Pie de página
  doc.fontSize(7).font('Helvetica-Oblique').text('Conserva este recibo digital para tu control de compras.', { align: 'center' });
  doc.text('¡Apoya al comercio local ayacuchano!', { align: 'center' });

  doc.end();
};

// POST /api/orders
const procesarCompra = async (req, res, next) => {
  const { producto_id, cantidad, cliente_nombre, metodo_pago } = req.body;

  // Validación inicial de campos obligatorios
  if (!producto_id || cantidad === undefined || cantidad === null || !cliente_nombre || !metodo_pago) {
    return res.status(400).json({ error: 'producto_id, cantidad, cliente_nombre y metodo_pago son obligatorios.' });
  }

  if (parseInt(cantidad, 10) <= 0) {
    return res.status(400).json({ error: 'La cantidad debe ser mayor a cero.' });
  }

  // Obtener una conexión exclusiva del Pool para manejar la Transacción ACID
  const connection = await db.getConnection();

  try {
    // 1. Obtener los detalles del producto a comprar y validar stock
    const [existing] = await connection.execute(
      `SELECT p.id, p.nombre, p.precio, p.stock, p.usuario_id, u.nombre AS vendedor_nombre, u.puesto AS nombre_puesto 
       FROM productos p 
       JOIN usuarios u ON p.usuario_id = u.id 
       WHERE p.id = ? AND p.estado = 'activo'`,
      [producto_id]
    );

    if (existing.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Producto no encontrado o inactivo.' });
    }

    const product = existing[0];

    if (product.stock < cantidad) {
      connection.release();
      return res.status(400).json({ error: 'Stock insuficiente para completar la compra.' });
    }

    // 2. Iniciar Transacción ACID
    await connection.beginTransaction();

    // 3. Descontar stock del producto
    await connection.execute(
      'UPDATE productos SET stock = stock - ? WHERE id = ?',
      [cantidad, producto_id]
    );

    // 4. Calcular totales
    const subtotal = product.precio * cantidad;
    const total = subtotal;

    // 5. Insertar cabecera de Venta
    const [resultVenta] = await connection.execute(
      'INSERT INTO ventas (vendedor_id, cliente_nombre, total, metodo_pago) VALUES (?, ?, ?, ?)',
      [product.usuario_id, cliente_nombre, total, metodo_pago]
    );
    const ventaId = resultVenta.insertId;

    // 6. Insertar detalle de Venta
    await connection.execute(
      'INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
      [ventaId, producto_id, cantidad, product.precio, subtotal]
    );

    // 7. Confirmar transacción
    await connection.commit();

    // Liberar conexión ya comprometida
    connection.release();

    // 8. Generar el documento PDF y transmitirlo directamente
    res.status(200);
    generateReceiptPDF(res, {
      ventaId,
      clienteNombre: cliente_nombre,
      vendedorNombre: product.vendedor_nombre,
      nombrePuesto: product.nombre_puesto,
      metodoPago: metodo_pago,
      productoNombre: product.nombre,
      cantidad,
      precioUnitario: product.precio,
      subtotal,
      total
    });
    return;

  } catch (error) {
    // Si la conexión sigue abierta durante un error, se realiza Rollback para garantizar atomicidad
    try {
      await connection.rollback();
    } catch (rbErr) {
      // Ignorar fallo de rollback secundario si la conexión ya cerró
    }
    connection.release();
    next(error);
  }
};

module.exports = {
  procesarCompra
};
