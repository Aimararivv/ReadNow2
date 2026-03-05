export const requireAdmin = (req, res, next) => {

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      message: "Acceso solo para administradores"
    });
  }

  next();
};

export const requirePremium = (req, res, next) => {

  if (req.user.role !== 'PREMIUM' && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      message: "Acceso solo para usuarios premium"
    });
  }

  next();
};