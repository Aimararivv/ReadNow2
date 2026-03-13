import express from 'express';
import axios from 'axios';
import { verifyToken, requirePremium } from '../middlewares/auth.middleware.js';

const router = express.Router();

/* 📚 LISTA DE LIBROS */
router.get('/', async (req, res) => {
  try {

    const query = req.query.q || 'fiction';

    const response = await axios.get(
      'https://www.googleapis.com/books/v1/volumes',
      {
        params: {
          q: query,
          key: process.env.GOOGLE_BOOKS_API_KEY
        }
      }
    );

    const books = response.data.items?.map((b, index) => ({

      id: b.id,
      title: b.volumeInfo.title,
      author: b.volumeInfo.authors?.[0] || 'Autor desconocido',
      thumbnail: b.volumeInfo.imageLinks?.thumbnail || null,

      /* simulación premium */
      premium: index % 2 === 0

    })) || [];

    res.json(books);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: 'Error al obtener libros'
    });

  }
});


/* 📖 LIBRO POR ID */
router.get('/:id', verifyToken, async (req, res) => {
  try {

    const { id } = req.params;

    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes/${id}`,
      {
        params: {
          key: process.env.GOOGLE_BOOKS_API_KEY
        }
      }
    );

    const b = response.data.volumeInfo;

    const book = {

      id,
      title: b.title,
      author: b.authors?.[0] || 'Autor desconocido',
      thumbnail: b.imageLinks?.thumbnail || null,
      description: b.description || 'Sin descripción',

      premium: false

    };

    res.json(book);

  } catch (error) {

    console.error(error);

    res.status(404).json({
      message: 'Libro no encontrado'
    });

  }
});


/* 👁️ PREVIEW DEL LIBRO (usuarios logueados) */
router.get('/preview/:id', verifyToken, async (req, res) => {

  try {

    const { id } = req.params;

    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes/${id}`,
      {
        params: {
          key: process.env.GOOGLE_BOOKS_API_KEY
        }
      }
    );

    const b = response.data.volumeInfo;

    res.json({
      id,
      title: b.title,
      preview: b.previewLink || null
    });

  } catch (error) {

    res.status(500).json({
      message: 'Error obteniendo preview'
    });

  }

});


/* 📖 LEER LIBRO COMPLETO (SOLO PREMIUM) */
router.get('/read/:id', verifyToken, requirePremium, async (req, res) => {

  try {

    const { id } = req.params;

    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes/${id}`,
      {
        params: {
          key: process.env.GOOGLE_BOOKS_API_KEY
        }
      }
    );

    const b = response.data.volumeInfo;

    res.json({

      id,
      title: b.title,
      author: b.authors?.[0] || 'Autor desconocido',

      /* enlace de lectura */
      readLink: b.previewLink || null

    });

  } catch (error) {

    res.status(500).json({
      message: 'Error cargando lectura'
    });

  }

});


/* ⬇️ DESCARGAR LIBRO (SOLO PREMIUM) */
router.get('/download/:id', verifyToken, requirePremium, async (req, res) => {

  try {

    const { id } = req.params;

    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes/${id}`,
      {
        params: {
          key: process.env.GOOGLE_BOOKS_API_KEY
        }
      }
    );

    const b = response.data.volumeInfo;

    res.json({

      id,
      title: b.title,

      /* enlace de descarga */
      downloadLink: b.previewLink || null

    });

  } catch (error) {

    res.status(500).json({
      message: 'Error descargando libro'
    });

  }

});


export default router;