const request = require('supertest');
// Mockear el pool de BD para evitar conexiones colgantes durante las pruebas básicas de app
jest.mock('../config/db', () => ({
  execute: jest.fn()
}));
const app = require('../app');

describe('GET /health', () => {
  it('should return 200 OK and health status message', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('Mercado Nery García Zárate');
  });
});

describe('Error Handling Middleware', () => {
  let originalEnv;

  beforeAll(() => {
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('should handle custom status errors in non-production mode', async () => {
    process.env.NODE_ENV = 'development';
    const response = await request(app).get('/test-error');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Test Error Message');
  });

  it('should handle errors with default 500 status in non-production mode', async () => {
    process.env.NODE_ENV = 'development';
    const response = await request(app).get('/test-error-default');
    
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'Default Error Message');
  });

  it('should mask error message in production mode', async () => {
    process.env.NODE_ENV = 'production';
    const response = await request(app).get('/test-error');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Ocurrió un error interno en el servidor');
  });
});

