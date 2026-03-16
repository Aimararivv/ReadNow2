import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from "crypto"; // 🔹 agregado

/* ================= ENCRYPT FUNCTION ================= */
const algorithm = "aes-256-cbc";

// 🔹 AGREGADO → clave segura para encriptar
const key = crypto.createHash('sha256')
  .update(process.env.CARD_SECRET || "clave_super_segura_32_chars")
  .digest();

// 🔹 AGREGADO → función encrypt corregida
function encrypt(text){
    const iv = crypto.randomBytes(16); 
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(text.toString(), "utf8", "hex");
    encrypted += cipher.final("hex");

    return iv.toString("hex") + ":" + encrypted;
}

// 🔹 AGREGADO → función para ocultar tarjeta
function maskCardNumber(card){
    const clean = card.replace(/\s/g,'');
    const last4 = clean.slice(-4);

    return "**** **** **** " + last4;
}

/* ================= REGISTER ================= */
export const register = async (req, res) => {
    const { nombre, correo, password, cardYear } = req.body;

    try {
        const hash = await bcrypt.hash(password, 10);

        let encryptedYear = null;

        if(cardYear){
            encryptedYear = encrypt(cardYear);
        }

        const user = await pool.query(
            `INSERT INTO usuarios (nombre, correo, password, role, card_year_encrypted)
             VALUES ($1,$2,$3,$4,$5)
             RETURNING id_usuario, nombre, correo, role`,
            [nombre, correo, hash, 'FREE', encryptedYear]
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
            "SELECT id_usuario, nombre, correo, password, role, fecha_creacion FROM usuarios WHERE correo = $1",
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

/* ================= UPDATE PROFILE ================= */
export const updateProfile = async (req, res) => {
    const { name, email, password } = req.body;
    const userId = req.user.id; // ID del usuario desde el token

    try {
        // Construir consulta dinámica
        let updateFields = [];
        let updateValues = [];
        let paramIndex = 1;

        if (name && name.trim()) {
            updateFields.push(`nombre = $${paramIndex}`);
            updateValues.push(name.trim());
            paramIndex++;
        }

        if (email && email.trim()) {
            updateFields.push(`correo = $${paramIndex}`);
            updateValues.push(email.trim());
            paramIndex++;
        }

        if (password && password.trim()) {
            const hash = await bcrypt.hash(password, 10);
            updateFields.push(`password = $${paramIndex}`);
            updateValues.push(hash);
            paramIndex++;
        }

        // Si no hay campos para actualizar
        if (updateFields.length === 0) {
            return res.status(400).json({
                message: "No hay campos para actualizar"
            });
        }

        // Agregar el ID al final de los valores
        updateValues.push(userId);

        // Construir y ejecutar la consulta
        const updateQuery = `
            UPDATE usuarios 
            SET ${updateFields.join(', ')} 
            WHERE id_usuario = $${paramIndex}
            RETURNING id_usuario, nombre, correo, role, fecha_creacion
        `;

        const result = await pool.query(updateQuery, updateValues);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            });
        }

        res.json({
            message: "Perfil actualizado exitosamente",
            user: result.rows[0]
        });

    } catch (error) {
        console.error("ERROR UPDATE PROFILE:", error);
        
        // Manejar error de correo duplicado
        if (error.code === '23505') {
            return res.status(400).json({
                message: "El correo electrónico ya está en uso"
            });
        }
        
        res.status(500).json({
            error: "Error al actualizar perfil"
        });
    }
};