const pool = require('../config/db');
const axios = require('axios');

// OBTENER LIBROS
exports.getBooks = async (req, res) => {
  const response = await axios.get('https://gutendex.com/books?search=popular');
  res.json(response.data.results.slice(0, 10));
};

// BUSCAR
exports.search = async (req, res) => {
  const { query } = req.query;
  const response = await axios.get(`https://gutendex.com/books?search=${query}`);
  res.json(response.data.results);
};

// SUSCRIPCIÓN
exports.getSubscription = async (req, res) => {
  const userId = req.user.id;

  const user = await pool.query(
    'SELECT role FROM usuarios WHERE id_usuario = $1',
    [userId]
  );

  const role = user.rows[0]?.role || 'FREE';
  const esPremium = role === 'PREMIUM';

  const historial = await pool.query(
    `SELECT COUNT(*) FROM historial_libros
     WHERE usuario_id = $1
     AND DATE_TRUNC('month', fecha_lectura) = DATE_TRUNC('month', CURRENT_DATE)`,
    [userId]
  );

  const leidos = parseInt(historial.rows[0].count);
  const limite = esPremium ? 9999 : 1;

  res.json({
    tipoPlan: role,
    limite,
    leidos,
    restantes: esPremium ? 'Ilimitado' : Math.max(0, limite - leidos)
  });
};

// LEER LIBRO
exports.readBook = async (req, res) => {
  const userId = req.user.id;
  const { bookId } = req.params;

  const user = await pool.query(
    'SELECT role FROM usuarios WHERE id_usuario = $1',
    [userId]
  );

  const esPremium = user.rows[0]?.role === 'PREMIUM';

  const historial = await pool.query(
    `SELECT COUNT(*) FROM historial_libros
     WHERE usuario_id = $1
     AND DATE_TRUNC('month', fecha_lectura) = DATE_TRUNC('month', CURRENT_DATE)`,
    [userId]
  );

  const leidos = parseInt(historial.rows[0].count);

  if (!esPremium && leidos >= 1) {
    return res.status(403).json({
      message: 'Límite alcanzado. Pasa a PREMIUM'
    });
  }

  const response = await axios.get(`https://gutendex.com/books/${bookId}`);
  const book = response.data;

  await pool.query(
    `INSERT INTO historial_libros
     (usuario_id, book_id, titulo, autor, imagen, link_lectura, fecha_lectura)
     VALUES($1,$2,$3,$4,$5,$6,NOW())`,
    [
      userId,
      bookId,
      book.title,
      book.authors[0]?.name || 'Autor',
      book.formats['image/jpeg'],
      book.formats['text/html']
    ]
  );

  res.json(book);
};