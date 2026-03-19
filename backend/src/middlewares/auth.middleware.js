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

    req.user = decoded; // guardamos usuario en request

    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Token inválido'
    });
  }
};

// 👑 SOLO PREMIUM
export const requirePremium = (req, res, next) => {
  if (req.user?.role !== 'PREMIUM') {
    return res.status(403).json({
      message: 'Necesitas ser PREMIUM para acceder'
    });
  }

  next();
};