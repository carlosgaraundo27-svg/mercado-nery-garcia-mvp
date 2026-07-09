const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Registro de comerciantes
const register = async (req, res, next) => {
  try {
    const { nombre, email, password, puesto, rubro } = req.body;

    // Validación de campos obligatorios
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios.' });
    }

    // Validación del formato de email (Regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'El formato del correo electrónico no es válido.' });
    }

    // Validación de contraseña (mínimo 8 caracteres)
    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    // Verificar existencia del correo electrónico
    const [existingUsers] = await db.execute(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = 'Vendedor';

    // Guardar el registro en la base de datos
    const [result] = await db.execute(
      'INSERT INTO usuarios (nombre, email, password, puesto, rubro, rol) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, email, hashedPassword, puesto || null, rubro || null, userRole]
    );

    return res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        id: result.insertId,
        nombre,
        email,
        puesto: puesto || null,
        rubro: rubro || null,
        rol: userRole
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login de comerciantes
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validación de campos
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios.' });
    }

    // Buscar al usuario por correo
    const [users] = await db.execute(
      'SELECT id, nombre, email, password, puesto, rubro, rol, estado FROM usuarios WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const user = users[0];

    // Control de borrado lógico / cuenta inactiva
    if (user.estado !== 'activo') {
      return res.status(403).json({ error: 'La cuenta se encuentra inactiva.' });
    }

    // Verificar la contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // Generar token JWT
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET no está configurado en las variables de entorno.');
    }

    const token = jwt.sign(
      { id: user.id, rol: user.rol, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        puesto: user.puesto,
        rubro: user.rubro,
        rol: user.rol
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login
};
