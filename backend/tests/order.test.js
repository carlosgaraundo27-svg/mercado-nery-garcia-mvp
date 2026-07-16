const request = require('supertest');
const app = require('../app');
const db = require('../config/db');

// Mockear el pool y la conexión exclusiva de la base de datos
jest.mock('../config/db', () => {
  const mockConnection = {
    execute: jest.fn(),
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn()
  };
  return {
    getConnection: jest.fn(() => Promise.resolve(mockConnection)),
    execute: jest.fn()
  };
});

// Mockear pdfkit para simular el comportamiento de transmisión directa (pipe)
jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => {
    return {
      pipe: jest.fn().mockImplementation(function(res) {
        this.res = res;
        return res;
      }),
      fontSize: jest.fn().mockReturnThis(),
      font: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      moveDown: jest.fn().mockReturnThis(),
      end: jest.fn().mockImplementation(function() {
        if (this.res) {
          this.res.write(Buffer.from('mock pdf binary content'));
          this.res.end();
        }
      })
    };
  });
});

describe('Order Controller Tests (Transactions & PDF)', () => {
  let mockConnection;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockConnection = await db.getConnection();
  });

  it('should process order successfully and return a PDF buffer', async () => {
    // Simulamos las respuestas sucesivas para: SELECT, UPDATE stock, INSERT venta, INSERT detalle
    mockConnection.execute
      .mockResolvedValueOnce([[
        { id: 1, nombre: 'Carne de Res', precio: 22.50, stock: 15, usuario_id: 10, vendedor_nombre: 'Dora Nery', nombre_puesto: 'A-15' }
      ]]) // SELECT
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // UPDATE stock
      .mockResolvedValueOnce([{ insertId: 501 }]) // INSERT venta
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // INSERT detalle

    const response = await request(app)
      .post('/api/orders')
      .send({
        producto_id: 1,
        cantidad: 2,
        cliente_nombre: 'Carlos Comprador',
        metodo_pago: 'Yape'
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('application/pdf');
    expect(response.headers['content-disposition']).toContain('attachment; filename=recibo_501.pdf');
    expect(Buffer.isBuffer(response.body)).toBe(true);

    expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
    expect(mockConnection.commit).toHaveBeenCalledTimes(1);
    expect(mockConnection.release).toHaveBeenCalledTimes(1);
  });

  it('should return 400 if required fields are missing or invalid', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send({
        producto_id: 1,
        cantidad: 0, // cantidad no permitida
        cliente_nombre: 'Carlos',
        metodo_pago: 'Yape'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'La cantidad debe ser mayor a cero.');

    const responseMissing = await request(app)
      .post('/api/orders')
      .send({
        producto_id: 1
      });

    expect(responseMissing.status).toBe(400);
    expect(responseMissing.body).toHaveProperty('error', 'producto_id, cantidad, cliente_nombre y metodo_pago son obligatorios.');
  });

  it('should return 404 if product is not found or inactive', async () => {
    mockConnection.execute.mockResolvedValueOnce([[]]); // No retorna producto

    const response = await request(app)
      .post('/api/orders')
      .send({
        producto_id: 999,
        cantidad: 1,
        cliente_nombre: 'Carlos',
        metodo_pago: 'Tarjeta'
      });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Producto no encontrado o inactivo.');
    expect(mockConnection.release).toHaveBeenCalledTimes(1);
  });

  it('should return 400 if stock is insufficient', async () => {
    mockConnection.execute.mockResolvedValueOnce([[
      { id: 1, nombre: 'Carne', precio: 20, stock: 2, usuario_id: 10 }
    ]]);

    const response = await request(app)
      .post('/api/orders')
      .send({
        producto_id: 1,
        cantidad: 5, // 5 > stock actual de 2
        cliente_nombre: 'Carlos',
        metodo_pago: 'Tarjeta'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Stock insuficiente para completar la compra.');
    expect(mockConnection.release).toHaveBeenCalledTimes(1);
  });

  it('should perform rollback and propagate database errors', async () => {
    mockConnection.execute
      .mockResolvedValueOnce([[
        { id: 1, nombre: 'Carne de Res', precio: 22.50, stock: 15, usuario_id: 10 }
      ]]) // SELECT
      .mockRejectedValueOnce(new Error('UPDATE stock query failed')); // falla el UPDATE stock

    const response = await request(app)
      .post('/api/orders')
      .send({
        producto_id: 1,
        cantidad: 1,
        cliente_nombre: 'Carlos',
        metodo_pago: 'Yape'
      });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'UPDATE stock query failed');
    expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
    expect(mockConnection.release).toHaveBeenCalledTimes(1);
  });

  it('should process order successfully and default to N/A when nombre_puesto is missing', async () => {
    mockConnection.execute
      .mockResolvedValueOnce([[
        { id: 1, nombre: 'Carne de Res', precio: 22.50, stock: 15, usuario_id: 10, vendedor_nombre: 'Dora Nery', nombre_puesto: null }
      ]]) // SELECT (nombre_puesto is null)
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // UPDATE stock
      .mockResolvedValueOnce([{ insertId: 502 }]) // INSERT venta
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // INSERT detalle

    const response = await request(app)
      .post('/api/orders')
      .send({
        producto_id: 1,
        cantidad: 2,
        cliente_nombre: 'Carlos Comprador',
        metodo_pago: 'Yape'
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('application/pdf');
    expect(response.headers['content-disposition']).toContain('attachment; filename=recibo_502.pdf');
    expect(Buffer.isBuffer(response.body)).toBe(true);

    expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
    expect(mockConnection.commit).toHaveBeenCalledTimes(1);
    expect(mockConnection.release).toHaveBeenCalledTimes(1);
  });
});
