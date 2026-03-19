const pool = require('../config/db');

exports.agregar = async (req, res) => {
  const { bookId, titulo, autor, imagen } = req.body;
  const userId = req.user.id;

  await pool.query(
    `INSERT INTO favoritos(usuario_id, book_id, titulo, autor, imagen)
     VALUES($1,$2,$3,$4,$5)`,
    [userId, bookId, titulo, autor, imagen]
  );

  res.json({ message: 'Agregado a favoritos' });
};

exports.obtener = async (req, res) => {
  const userId = req.user.id;

  const result = await pool.query(
    'SELECT * FROM favoritos WHERE usuario_id = $1',
    [userId]
  );

  res.json(result.rows);
};