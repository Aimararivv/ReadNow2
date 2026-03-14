import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            message: "Token requerido"
        });
    }

    jwt.verify(token, process.env.JWT_SECRET || "secret", (err, decoded) => {
        if (err) {
            return res.status(403).json({
                message: "Token inválido o expirado"
            });
        }

        req.user = decoded;
        next();
    });
};
