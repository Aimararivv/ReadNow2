const pool = require('../config/db');

// CAMBIAR PLAN
exports.updateRole = async (req, res) => {
  const { userId, role, cardYear, cardNumber, cvv } = req.body;

  try {
    await pool.query(
      `UPDATE usuarios SET role = $1 WHERE id_usuario = $2`,
      [role, userId]
    );

    res.json({
      message: 'Plan actualizado',
      user: {
        id: userId,
        role
      }
    });

  } catch (err) {
    res.status(500).json(err);
  }
};