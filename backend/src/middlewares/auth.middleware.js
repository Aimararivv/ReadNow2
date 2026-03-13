// src/middlewares/auth.middleware.js
import jwt from 'jsonwebtoken';

/**
 * Middleware para verificar que el usuario esté autenticado mediante JWT
 */
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: "Token requerido" });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    req.user = decoded; // guardamos la información del usuario en req.user
    next();
  } catch (error) {
    return res.status(403).json({ message: "Token inválido" });
  }
};

/**
 * Middleware para verificar que el usuario tenga rol premium
 * Debe ejecutarse después de verifyToken
 */
export const requirePremium = (req, res, next) => {
  // verificamos que req.user exista y tenga rol 'premium'
  if (!req.user || req.user.role !== 'premium') {
    return res.status(403).json({ message: "Acceso premium requerido" });
  }
  next();
};