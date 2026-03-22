import { pool } from '../config/db.js';

export const createLog = async (req, res) => {
  const { level, message, component, user_id, data } = req.body;

  try {
    await pool.query(
      `INSERT INTO logs (level, message, component, user_id, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        level,
        message,
        component || 'frontend',
        user_id || null,
        data ? JSON.stringify(data) : null
      ]
    );

    res.status(201).json({ message: 'Log guardado correctamente' });

  } catch (error) {
    console.error('Error guardando log:', error);
    res.status(500).json({ message: 'Error al guardar log' });
  }
};