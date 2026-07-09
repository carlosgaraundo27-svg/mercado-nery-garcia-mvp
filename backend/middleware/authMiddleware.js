const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Verificar presencia y formato del token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }

  const token = authHeader.split(' ')[1];

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: 'Error de configuración del servidor. JWT_SECRET no configurado.' });
  }

  try {
    // Verificar firma y expiración del JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );
    
    // Adjuntar datos de sesión del usuario en la solicitud
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token no válido o expirado.' });
  }
};

module.exports = authMiddleware;
