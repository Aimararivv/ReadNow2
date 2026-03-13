import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// Cambiar rol del usuario
router.put('/update-role/:id', async (req, res) => {

  const { id } = req.params;
  const { role } = req.body;

  if (!['FREE','PREMIUM'].includes(role)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }

  try {

    const result = await pool.query(
      `UPDATE usuarios 
       SET role = $1 
       WHERE id_usuario = $2 
       RETURNING *`,
      [role, id]
    );

    res.json({
      message: 'Rol actualizado',
      user: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error actualizando rol' });
  }

});

export default router;