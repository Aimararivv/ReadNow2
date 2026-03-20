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
    id_usuario: user.id_usuario,
    email: user.correo,
    role: user.role // ESTO ES CLAVE
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

// UPDATE PROFILE
export const updateProfile = async (req, res) => {
  const { name, email, password } = req.body;
  const userId = req.user.id_usuario; // Corregido para coincidir con el token JWT

  try {
    let updateQuery = 'UPDATE usuarios SET ';
    const updateValues = [];
    const updates = [];

    if (name) {
      updates.push('nombre = $' + (updates.length + 1));
      updateValues.push(name);
    }

    if (email) {
      updates.push('correo = $' + (updates.length + 1));
      updateValues.push(email);
    }

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      updates.push('password = $' + (updates.length + 1));
      updateValues.push(hash);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No hay campos para actualizar' });
    }

    updateQuery += updates.join(', ') + ' WHERE id_usuario = $' + (updates.length + 1) + ' RETURNING *';
    updateValues.push(userId);

    const result = await pool.query(updateQuery, updateValues);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const updatedUser = result.rows[0];

    res.json({
      message: 'Perfil actualizado exitosamente',
      user: {
        id_usuario: updatedUser.id_usuario,
        nombre: updatedUser.nombre,
        correo: updatedUser.correo,
        role: updatedUser.role
      }
    });

  } catch (err) {
    console.error('Error al actualizar perfil:', err);
    res.status(500).json({ message: 'Error al actualizar el perfil' });
  }
};

// DELETE ACCOUNT
export const deleteAccount = async (req, res) => {
  const userId = req.user.id_usuario;

  try {
    const result = await pool.query(
      'DELETE FROM usuarios WHERE id_usuario = $1 RETURNING *',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ message: 'Cuenta eliminada exitosamente' });

  } catch (err) {
    console.error('Error al eliminar cuenta:', err);
    res.status(500).json({ message: 'Error al eliminar la cuenta' });
  }
};