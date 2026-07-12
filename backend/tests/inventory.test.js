const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const db = require('../config/db');

// Mockear el pool de base de datos
jest.mock('../config/db', () => ({
  execute: jest.fn()
}));

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_mercado_nery_garcia_2026_change_me_in_production';
const VALID_TOKEN = jwt.sign({ id: 10, rol: 'Vendedor', email: 'dora@nery.com' }, JWT_SECRET);
const INVALID_TOKEN = 'Bearer thisisnotavalidtoken';

describe('Inventory Controller & Auth Middleware Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authorization Middleware Guards', () => {
    it('should return 401 if Authorization header is missing', async () => {
      const response = await request(app).get('/api/inventory');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Acceso denegado. Token no proporcionado.');
    });

    it('should return 401 if Authorization header is malformed', async () => {
      const response = await request(app)
        .get('/api/inventory')
        .set('Authorization', 'InvalidFormat token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Acceso denegado. Token no proporcionado.');
    });

    it('should return 401 if token is expired or invalid', async () => {
      const response = await request(app)
        .get('/api/inventory')
        .set('Authorization', `Bearer ${INVALID_TOKEN}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Token no válido o expirado.');
    });

    it('should return 500 if JWT_SECRET is not configured', async () => {
      const originalJwtSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      try {
        const response = await request(app)
          .get('/api/inventory')
          .set('Authorization', `Bearer ${VALID_TOKEN}`);
        
        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Error de configuración del servidor. JWT_SECRET no configurado.');
      } finally {
        process.env.JWT_SECRET = originalJwtSecret;
      }
    });
  });

  describe('POST /api/inventory (crearProducto)', () => {
    const validProduct = {
      nombre: 'Trucha Fresca',
      descripcion: 'Trucha fresca del río Mantaro',
      precio: 18.50,
      stock: 30,
      stock_minimo: 6,
      categoria_id: 2,
      imagen_url: 'http://image.url/trucha.png'
    };

    it('should create a product successfully with a valid token', async () => {
      db.execute.mockResolvedValueOnce([{ insertId: 101 }]);

      const response = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send(validProduct);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Producto registrado exitosamente');
      expect(response.body.product).toEqual({
        id: 101,
        usuario_id: 10,
        categoria_id: 2,
        nombre: 'Trucha Fresca',
        descripcion: 'Trucha fresca del río Mantaro',
        precio: 18.50,
        stock: 30,
        stock_minimo: 6,
        imagen_url: 'http://image.url/trucha.png',
        estado: 'activo'
      });

      expect(db.execute).toHaveBeenCalledTimes(1);
    });

    it('should fall back to default stock_minimo = 5 when not provided', async () => {
      db.execute.mockResolvedValueOnce([{ insertId: 102 }]);

      const response = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({
          nombre: 'Trucha Simple',
          precio: 15.00,
          stock: 20,
          categoria_id: 2
        });

      expect(response.status).toBe(201);
      expect(response.body.product.stock_minimo).toBe(5);
      expect(db.execute).toHaveBeenCalledTimes(1);
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({
          nombre: 'Solo Nombre' // Faltan precio, stock, categoria_id
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Nombre, precio, stock y categoria_id son obligatorios.');
      expect(db.execute).not.toHaveBeenCalled();
    });

    it('should propagate database errors via next()', async () => {
      db.execute.mockRejectedValueOnce(new Error('Insert failed'));

      const response = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send(validProduct);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Insert failed');
    });
  });

  describe('GET /api/inventory (obtenerMisProductos)', () => {
    it('should return active products owned by the active merchant user', async () => {
      const mockProducts = [
        { id: 101, usuario_id: 10, categoria_id: 2, nombre: 'Trucha', precio: 18.50, stock: 30, categoria_nombre: 'Pescados y Mariscos' }
      ];
      db.execute.mockResolvedValueOnce([mockProducts]);

      const response = await request(app)
        .get('/api/inventory')
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProducts);
      expect(db.execute).toHaveBeenCalledTimes(1);
    });

    it('should propagate GET errors to error middleware', async () => {
      db.execute.mockRejectedValueOnce(new Error('SELECT failed'));

      const response = await request(app)
        .get('/api/inventory')
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'SELECT failed');
    });
  });

  describe('PUT /api/inventory/:id (actualizarStock)', () => {
    const currentProduct = {
      id: 101,
      usuario_id: 10,
      categoria_id: 2,
      nombre: 'Trucha',
      descripcion: 'Pescado',
      precio: 18.50,
      stock: 30,
      stock_minimo: 5,
      imagen_url: null
    };

    it('should update product fields successfully', async () => {
      db.execute
        .mockResolvedValueOnce([[currentProduct]]) // Mock de consulta del producto existente
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // Mock del UPDATE

      const response = await request(app)
        .put('/api/inventory/101')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({
          nombre: 'Trucha Fresca Extra',
          stock: 45,
          precio: 20.00
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Producto actualizado exitosamente');
      expect(response.body.product).toEqual({
        id: 101,
        usuario_id: 10,
        categoria_id: 2,
        nombre: 'Trucha Fresca Extra',
        descripcion: 'Pescado',
        precio: 20.00,
        stock: 45,
        stock_minimo: 5,
        imagen_url: null
      });
      expect(db.execute).toHaveBeenCalledTimes(2);
    });

    it('should update all product fields successfully when all fields are provided in the body', async () => {
      db.execute
        .mockResolvedValueOnce([[currentProduct]]) // SELECT
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE

      const response = await request(app)
        .put('/api/inventory/101')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({
          nombre: 'Trucha Premium',
          descripcion: 'Trucha fresca del criadero',
          precio: 25.00,
          stock: 60,
          stock_minimo: 10,
          categoria_id: 1,
          imagen_url: 'http://image.url/new-trucha.png'
        });

      expect(response.status).toBe(200);
      expect(response.body.product).toEqual({
        id: 101,
        usuario_id: 10,
        categoria_id: 1,
        nombre: 'Trucha Premium',
        descripcion: 'Trucha fresca del criadero',
        precio: 25.00,
        stock: 60,
        stock_minimo: 10,
        imagen_url: 'http://image.url/new-trucha.png'
      });
      expect(db.execute).toHaveBeenCalledTimes(2);
    });


    it('should keep current fields if request fields are undefined', async () => {
      db.execute
        .mockResolvedValueOnce([[currentProduct]]) // SELECT
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE

      const response = await request(app)
        .put('/api/inventory/101')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({}); // Ningún cambio

      expect(response.status).toBe(200);
      expect(response.body.product.stock).toBe(30);
      expect(db.execute).toHaveBeenCalledTimes(2);
    });

    it('should return 404 if product not found or not owned', async () => {
      db.execute.mockResolvedValueOnce([[]]); // No se encuentra en SELECT

      const response = await request(app)
        .put('/api/inventory/999')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({ stock: 50 });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Producto no encontrado o no pertenece a tu puesto.');
      expect(db.execute).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors during update flow', async () => {
      db.execute.mockRejectedValueOnce(new Error('Update database failed'));

      const response = await request(app)
        .put('/api/inventory/101')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({ stock: 50 });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Update database failed');
    });
  });

  describe('DELETE /api/inventory/:id (eliminarProducto)', () => {
    it('should soft delete product successfully', async () => {
      db.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const response = await request(app)
        .delete('/api/inventory/101')
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Producto eliminado exitosamente (borrado lógico)');
      expect(db.execute).toHaveBeenCalledTimes(1);
    });

    it('should return 404 if product to delete not found or not owned', async () => {
      db.execute.mockResolvedValueOnce([{ affectedRows: 0 }]);

      const response = await request(app)
        .delete('/api/inventory/999')
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Producto no encontrado o no pertenece a tu puesto.');
      expect(db.execute).toHaveBeenCalledTimes(1);
    });

    it('should propagate database error during deletion', async () => {
      db.execute.mockRejectedValueOnce(new Error('Delete query failed'));

      const response = await request(app)
        .delete('/api/inventory/101')
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Delete query failed');
    });
  });
});
