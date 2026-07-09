const request = require('supertest');
const app = require('../app');
const db = require('../config/db');

// Mockear el pool de base de datos
jest.mock('../config/db', () => ({
  execute: jest.fn()
}));

describe('Catalog Controller Tests (Public Routes)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch the full public catalog successfully (stock > 0 and active)', async () => {
    const mockCatalog = [
      { id: 101, nombre: 'Carne de Res', precio: 22.50, stock: 15, categoria_nombre: 'Carnes y Aves', vendedor_nombre: 'Dora Nery', nombre_puesto: 'A-15' },
      { id: 102, nombre: 'Trucha Fresca', precio: 18.00, stock: 8, categoria_nombre: 'Pescados y Mariscos', vendedor_nombre: 'Juan Quispe', nombre_puesto: 'B-2' }
    ];
    
    db.execute.mockResolvedValueOnce([mockCatalog]);

    const response = await request(app).get('/api/catalog');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockCatalog);
    
    // Verificar que se llame la consulta SQL sin parámetros extras
    expect(db.execute).toHaveBeenCalledWith(
      expect.stringContaining('WHERE p.estado = \'activo\' AND p.stock > 0'),
      []
    );
  });

  it('should fetch filtered catalog when categoria_id is provided', async () => {
    const mockFilteredCatalog = [
      { id: 102, nombre: 'Trucha Fresca', precio: 18.00, stock: 8, categoria_nombre: 'Pescados y Mariscos', vendedor_nombre: 'Juan Quispe', nombre_puesto: 'B-2' }
    ];

    db.execute.mockResolvedValueOnce([mockFilteredCatalog]);

    const response = await request(app)
      .get('/api/catalog')
      .query({ categoria_id: 2 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockFilteredCatalog);

    // Verificar que la consulta SQL filtre por categoria_id y pase el parámetro correcto
    expect(db.execute).toHaveBeenCalledWith(
      expect.stringContaining('AND p.categoria_id = ?'),
      [2]
    );
  });

  it('should propagate database errors to the global error middleware', async () => {
    db.execute.mockRejectedValueOnce(new Error('Catalog SQL Query Failed'));

    const response = await request(app).get('/api/catalog');

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'Catalog SQL Query Failed');
  });
});
