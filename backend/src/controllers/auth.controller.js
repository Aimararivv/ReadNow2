import pool from '../config/db.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const SECRET = "CLAVE_SUPER_SECRETA";

// LOGIN
export const login = async (req, res) => {
  const { correo, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE correo = $1',
      [correo]
    );

    if (result.rows.length === 0)
      return res.status(401).json({ message: 'Usuario no encontrado' });

    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.password);

    if (!valid)
      return res.status(401).json({ message: 'Password incorrecto' });

    const token = jwt.sign(
  {
    id: user.id,
    email: user.email,
    role: user.role // 🔥 ESTO ES CLAVE
  },
  'EstaEsUnaClaveSuperSeguraParaJWT2026BibliotecaAPI',
  { expiresIn: '2h' }
);

    res.json({
      token,
      user: {
        id: user.id_usuario,
        nombre: user.nombre,
        correo: user.correo,
        role: user.role
      }
    });

  } catch (err) {
    res.status(500).json(err);
  }
};

// REGISTER
export const register = async (req, res) => {
  const { correo, password } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);
    const nombre = correo.split('@')[0];

    const result = await pool.query(
      `INSERT INTO usuarios(nombre, correo, password, role)
       VALUES($1,$2,$3,'FREE') RETURNING *`,
      [nombre, correo, hash]
    );

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json(err);
  }
};