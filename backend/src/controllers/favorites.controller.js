import { pool } from '../config/db.js';

export const addFavorite = async (req, res) => {
  const usuarioid = req.user.id_usuario;
  const { bookid, titulo, autor, imagen } = req.body;

  if (!bookid || !titulo || !autor || !imagen) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  try {
    const existing = await pool.query(
      'SELECT 1 FROM favoritos WHERE usuarioid = $1 AND bookid = $2',
      [usuarioid, bookid]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Ya está en favoritos' });
    }

    const result = await pool.query(
      `INSERT INTO favoritos (usuarioid, bookid, titulo, autor, imagen)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [usuarioid, bookid, titulo, autor, imagen]
    );

    res.status(201).json({ message: 'Agregado a favoritos', favorite: result.rows[0] });
  } catch (err) {
    console.error('Error al agregar favorito:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const removeFavorite = async (req, res) => {
  const usuarioid = req.user.id_usuario; 
  const { bookid } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM favoritos WHERE usuarioid = $1 AND bookid = $2 RETURNING *',
      [usuarioid, bookid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Favorito no encontrado' });
    }

    res.json({ message: 'Eliminado de favoritos' });
  } catch (err) {
    console.error('Error al eliminar favorito:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getFavoritesByUser = async (req, res) => {
  const usuarioid = req.user.id_usuario; 

  try {
    const result = await pool.query(
      'SELECT * FROM favoritos WHERE usuarioid = $1 ORDER BY id_usuario DESC',
      [usuarioid]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener favoritos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const checkFavorite = async (req, res) => {
  const usuarioid = req.user.id_usuario; 
  const { bookid } = req.params;

  try {
    const result = await pool.query(
      'SELECT 1 FROM favoritos WHERE usuarioid = $1 AND bookid = $2',
      [usuarioid, bookid]
    );
    res.json({ isFavorite: result.rows.length > 0 });
  } catch (err) {
    console.error('Error al verificar favorito:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};