import jwt from 'jsonwebtoken';

// 🔐 VERIFICAR TOKEN
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: 'Token requerido'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, 'EstaEsUnaClaveSuperSeguraParaJWT2026BibliotecaAPI');
    console.log('Token decodificado:', decoded);

    // Compatibilidad con ambos formatos de token
    if (decoded.id_usuario) {
      req.user = decoded;
    } else if (decoded.id) {
      // Convertir token antiguo al nuevo formato
      req.user = {
        ...decoded,
        id_usuario: decoded.id
      };
    } else {
      throw new Error('Token sin información de usuario');
    }

    next();
  } catch (error) {
    console.log('Error al verificar token:', error.message);
    return res.status(401).json({
      message: 'Token inválido'
    });
  }
};

// SOLO PREMIUM
export const requirePremium = (req, res, next) => {
  if (req.user?.role !== 'PREMIUM') {
    return res.status(403).json({
      message: 'Necesitas ser PREMIUM para acceder'
    });
  }

  next();
};