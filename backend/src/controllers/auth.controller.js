import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

/* ================= REGISTER ================= */
export const register = async (req, res) => {
    const { nombre, correo, password } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        const user = await pool.query(
            `INSERT INTO usuarios (nombre, correo, password, role)
             VALUES ($1,$2,$3,$4)
             RETURNING id_usuario, nombre, correo, role`,
            [nombre, correo, hash, 'FREE']
        );
        res.json({
            message: "Usuario registrado",
            user: user.rows[0]
        });
    } catch (error) {
        console.error("ERROR REGISTER:", error);
        res.status(500).json({
            error: "Error al registrar"
        });
    }

};
/* ================= LOGIN ================= */
export const login = async (req, res) => {
    const { correo, password } = req.body;
    try {
        const result = await pool.query(
            `SELECT * FROM usuarios WHERE correo=$1`,
            [correo]
        );
        if (result.rows.length === 0) {
            return res.status(400).json({
                message: "Usuario no existe"
            });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({
                message: "Contraseña incorrecta"
            });
        }
        const token = jwt.sign(
            {
                id: user.id_usuario,
                role: user.role || 'FREE'
            },
            process.env.JWT_SECRET || "secret",
            { expiresIn: "1h" }
        );

        // 🔐 eliminar contraseña antes de enviarla
        delete user.password;
        res.json({
            token,
            user
        });
    } catch (error) {
        console.error("ERROR LOGIN:", error);
        res.status(500).json({
            error: "Error en login"
        });
    }
};