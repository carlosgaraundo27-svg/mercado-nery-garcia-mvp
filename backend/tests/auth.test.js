const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../app');
const db = require('../config/db');

// Mockear el pool de la base de datos
jest.mock('../config/db', () => ({
  execute: jest.fn()
}));

const CORRECT_PASSWORD = 'password123';
const HASHED_PASSWORD = bcrypt.hashSync(CORRECT_PASSWORD, 10);

describe('Auth Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a merchant successfully', async () => {
      // 1. Simular que el correo NO existe (SELECT returns empty array)
      // 2. Simular inserción exitosa (INSERT returns insertId)
      db.execute
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([{ insertId: 10 }]);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nombre: 'Dora Nery',
          email: 'dora@nery.com',
          password: CORRECT_PASSWORD,
          puesto: 'A-15',
          rubro: 'Carnes y Aves'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Usuario registrado exitosamente');
      expect(response.body.user).toEqual({
        id: 10,
        nombre: 'Dora Nery',
        email: 'dora@nery.com',
        puesto: 'A-15',
        rubro: 'Carnes y Aves',
        rol: 'Vendedor'
      });

      expect(db.execute).toHaveBeenCalledTimes(2);
    });

    it('should register a merchant with default rol, puesto and rubro when they are not provided', async () => {
      db.execute
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([{ insertId: 11 }]);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nombre: 'Dora Nery',
          email: 'dora2@nery.com',
          password: CORRECT_PASSWORD
        });

      expect(response.status).toBe(201);
      expect(response.body.user).toEqual({
        id: 11,
        nombre: 'Dora Nery',
        email: 'dora2@nery.com',
        puesto: null,
        rubro: null,
        rol: 'Vendedor'
      });
      expect(db.execute).toHaveBeenCalledTimes(2);
    });

    it('should register a merchant forcing rol to Vendedor even if a custom rol is provided', async () => {
      db.execute
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([{ insertId: 12 }]);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nombre: 'Dora Admin',
          email: 'dora_admin@nery.com',
          password: CORRECT_PASSWORD,
          rol: 'Admin'
        });

      expect(response.status).toBe(201);
      expect(response.body.user.rol).toBe('Vendedor');
      expect(db.execute).toHaveBeenCalledTimes(2);
    });


    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'dora@nery.com' // Falta nombre y password
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Nombre, email y contraseña son obligatorios.');
      expect(db.execute).not.toHaveBeenCalled();
    });

    it('should return 400 if email format is invalid', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nombre: 'Dora Nery',
          email: 'invalid-email-format',
          password: CORRECT_PASSWORD
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'El formato del correo electrónico no es válido.');
      expect(db.execute).not.toHaveBeenCalled();
    });

    it('should return 400 if password is less than 8 characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nombre: 'Dora Nery',
          email: 'dora@nery.com',
          password: 'short'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'La contraseña debe tener al menos 8 caracteres.');
      expect(db.execute).not.toHaveBeenCalled();
    });

    it('should return 400 if email is already registered', async () => {
      // Simular que el correo ya existe (SELECT returns array with 1 user)
      db.execute.mockResolvedValueOnce([[{ id: 1 }]]);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nombre: 'Dora Nery',
          email: 'dora@nery.com',
          password: CORRECT_PASSWORD
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'El correo electrónico ya está registrado.');
      expect(db.execute).toHaveBeenCalledTimes(1);
    });

    it('should pass database errors to the error middleware', async () => {
      // Simular fallo en la conexión/consulta de base de datos
      db.execute.mockRejectedValueOnce(new Error('DB connection failed'));

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nombre: 'Dora Nery',
          email: 'dora@nery.com',
          password: CORRECT_PASSWORD
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'DB connection failed');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully and return a token', async () => {
      const originalJwtExpiresIn = process.env.JWT_EXPIRES_IN;
      delete process.env.JWT_EXPIRES_IN;

      try {
        // Simular que el usuario existe y está activo
        db.execute.mockResolvedValueOnce([[{
          id: 10,
          nombre: 'Dora Nery',
          email: 'dora@nery.com',
          password: HASHED_PASSWORD,
          puesto: 'A-15',
          rubro: 'Carnes y Aves',
          rol: 'Vendedor',
          estado: 'activo'
        }]]);

        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'dora@nery.com',
            password: CORRECT_PASSWORD
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(response.body.user).toEqual({
          id: 10,
          nombre: 'Dora Nery',
          email: 'dora@nery.com',
          puesto: 'A-15',
          rubro: 'Carnes y Aves',
          rol: 'Vendedor'
        });
        expect(db.execute).toHaveBeenCalledTimes(1);
      } finally {
        process.env.JWT_EXPIRES_IN = originalJwtExpiresIn;
      }
    });

    it('should return 400 if login fields are missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'dora@nery.com' // Falta password
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Email y contraseña son obligatorios.');
      expect(db.execute).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not found', async () => {
      // Simular que no se encuentra ningún usuario
      db.execute.mockResolvedValueOnce([[]]);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'dora@nery.com',
          password: CORRECT_PASSWORD
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Credenciales inválidas.');
      expect(db.execute).toHaveBeenCalledTimes(1);
    });

    it('should return 403 if user account is inactive', async () => {
      // Simular que el usuario existe pero está inactivo
      db.execute.mockResolvedValueOnce([[{
        id: 10,
        nombre: 'Dora Nery',
        email: 'dora@nery.com',
        password: HASHED_PASSWORD,
        puesto: 'A-15',
        rubro: 'Carnes y Aves',
        rol: 'Vendedor',
        estado: 'inactivo'
      }]]);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'dora@nery.com',
          password: CORRECT_PASSWORD
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'La cuenta se encuentra inactiva.');
      expect(db.execute).toHaveBeenCalledTimes(1);
    });

    it('should return 401 if password does not match', async () => {
      // Simular usuario existente
      db.execute.mockResolvedValueOnce([[{
        id: 10,
        nombre: 'Dora Nery',
        email: 'dora@nery.com',
        password: HASHED_PASSWORD,
        puesto: 'A-15',
        rubro: 'Carnes y Aves',
        rol: 'Vendedor',
        estado: 'activo'
      }]]);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'dora@nery.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Credenciales inválidas.');
      expect(db.execute).toHaveBeenCalledTimes(1);
    });

    it('should pass login database errors to error middleware', async () => {
      db.execute.mockRejectedValueOnce(new Error('DB failure during login'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'dora@nery.com',
          password: CORRECT_PASSWORD
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'DB failure during login');
    });

    it('should throw an error if JWT_SECRET is not configured during login', async () => {
      const originalJwtSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      try {
        db.execute.mockResolvedValueOnce([[{
          id: 10,
          nombre: 'Dora Nery',
          email: 'dora@nery.com',
          password: HASHED_PASSWORD,
          puesto: 'A-15',
          rubro: 'Carnes y Aves',
          rol: 'Vendedor',
          estado: 'activo'
        }]]);

        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'dora@nery.com',
            password: CORRECT_PASSWORD
          });

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'JWT_SECRET no está configurado en las variables de entorno.');
      } finally {
        process.env.JWT_SECRET = originalJwtSecret;
      }
    });
  });
});
