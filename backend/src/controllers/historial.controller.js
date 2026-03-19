const pool = require('../config/db');

exports.getHistorial = async (req, res) => {
  const userId = req.user.id;

  const result = await pool.query(
    `SELECT * FROM historial_libros
     WHERE usuario_id = $1
     ORDER BY fecha_lectura DESC`,
    [userId]
  );

  res.json(result.rows);
};

exports.agregar = async (req, res) => {
  const userId = req.user.id;
  const { bookId, titulo, autor, imagen, link } = req.body;

  await pool.query(
    `INSERT INTO historial_libros
     (usuario_id, book_id, titulo, autor, imagen, link_lectura, fecha_lectura)
     VALUES($1,$2,$3,$4,$5,$6,NOW())`,
    [userId, bookId, titulo, autor, imagen, link]
  );

  res.json({ message: 'Guardado en historial' });
};