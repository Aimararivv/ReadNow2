import { pool } from '../config/db.js';

export const getReadingHistory = async (req, res) => {
  try {
    const userId = req.user.id_usuario;
    console.log('📚 Obteniendo historial de lectura para usuario:', userId);

    // Obtener los libros leídos por el usuario
    const result = await pool.query(`
      SELECT 
        lu.id,
        lu.id_usuario,
        lu.id_libro,
        lu.fecha_lectura
      FROM lectura_usuario lu
      WHERE lu.id_usuario = $1
      ORDER BY lu.fecha_lectura DESC
      LIMIT 10
    `, [userId]);

    console.log('� Libros leídos encontrados:', result.rows.length);

    // Para cada libro, obtener sus detalles desde Gutenberg
    const historyPromises = result.rows.map(async (row) => {
      try {
        // Obtener detalles del libro desde Gutenberg
        const response = await fetch(`https://gutendex.com/books/${row.id_libro}`);
        const bookData = await response.json();

        console.log(`📖 Datos del libro ${row.id_libro}:`, {
          title: bookData.title,
          author: bookData.authors?.[0]?.name,
          formats: bookData.formats,
          id: bookData.id,
          allKeys: Object.keys(bookData)
        });

        // Buscar la portada en diferentes formatos
        let thumbnail = null;
        
        // Primero intentar con formats
        if (bookData.formats) {
          const imageFormats = [
            'image/jpeg',
            'image/png', 
            'image/webp',
            'image/jpg',
            'jpeg',
            'png',
            'jpg'
          ];
          
          for (const format of imageFormats) {
            if (bookData.formats[format]) {
              thumbnail = bookData.formats[format];
              console.log(`✅ Portada encontrada en formato ${format}:`, thumbnail);
              break;
            }
          }
        }
        
        // Si no hay formato, intentar con diferentes URL de portadas
        if (!thumbnail && bookData.id) {
          const possibleUrls = [
            `https://covers.gutenberg.org/${bookData.id}/medium.jpg`,
            `https://covers.gutenberg.org/${bookData.id}/small.jpg`,
            `https://www.gutenberg.org/files/${bookData.id}/${bookData.id}-h.jpg`,
            `https://www.gutenberg.org/files/${bookData.id}/${bookData.id}-h/cover.jpg`,
            `https://www.gutenberg.org/cache/epub/${bookData.id}/pg${bookData.id}.cover.medium.jpg`
          ];
          
          thumbnail = possibleUrls[0]; // Usar la primera como fallback
          console.log(`🖼️ Usando URL de portada fallback:`, thumbnail);
        }

        console.log(`📚 Datos finales para libro ${row.id_libro}:`, {
          title: bookData.title,
          author: bookData.authors?.[0]?.name,
          thumbnail: thumbnail
        });

        return {
          id: row.id,
          id_usuario: row.id_usuario,
          id_libro: row.id_libro,
          fecha_lectura: new Date(row.fecha_lectura).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }),
          book_details: {
            id: row.id_libro,
            title: bookData.title || 'Título no disponible',
            author: bookData.authors?.[0]?.name || 'Autor no disponible',
            thumbnail: thumbnail
          }
        };
      } catch (error) {
        console.error(`❌ Error obteniendo libro ${row.id_libro}:`, error);
        return {
          id: row.id,
          id_usuario: row.id_usuario,
          id_libro: row.id_libro,
          fecha_lectura: new Date(row.fecha_lectura).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }),
          book_details: {
            id: row.id_libro,
            title: 'Libro #' + row.id_libro,
            author: 'Autor no disponible',
            thumbnail: null
          }
        };
      }
    });

    const history = await Promise.all(historyPromises);

    console.log('📚 Historial completo con detalles:', history.length, 'libros');
    res.json(history);
  } catch (error) {
    console.error('❌ Error al obtener historial de lectura:', error);
    res.status(500).json({ message: 'Error al obtener historial de lectura' });
  }
};

export const readBook = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id_usuario;
    const userRole = req.user.role;

    console.log('📖 Usuario intentando leer libro:', { userId, userRole, bookId: id });

    // Primero crear la tabla si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lectura_usuario (
        id SERIAL PRIMARY KEY,
        id_usuario INTEGER REFERENCES usuarios(id),
        id_libro VARCHAR(50),
        fecha_lectura DATE DEFAULT CURRENT_DATE
      )
    `);

    if (userRole === 'PREMIUM') {
      console.log('👑 Usuario PREMIUM - acceso ilimitado');
      
      // Registrar la lectura para usuarios PREMIUM también
      const existingResult = await pool.query(
        'SELECT id FROM lectura_usuario WHERE id_usuario = $1 AND id_libro = $2',
        [userId, id]
      );

      if (existingResult.rows.length === 0) {
        await pool.query(
          'INSERT INTO lectura_usuario (id_usuario, id_libro, fecha_lectura) VALUES ($1, $2, CURRENT_DATE)',
          [userId, id]
        );
        console.log('📝 Lectura registrada para usuario PREMIUM');
      }
      
      return fetchBookAndRespond(id, res);
    }

    if (userRole === 'FREE') {
      console.log('🆓 Usuario FREE - verificando límite mensual');

      const countResult = await pool.query(`
        SELECT COUNT(*) as books_read
        FROM lectura_usuario
        WHERE id_usuario = $1
        AND DATE_TRUNC('month', fecha_lectura) = DATE_TRUNC('month', CURRENT_DATE)
      `, [userId]);

      const booksReadThisMonth = parseInt(countResult.rows[0].books_read);
      console.log('📊 Libros leídos este mes:', booksReadThisMonth);

      if (booksReadThisMonth >= 1) {
        console.log('❌ Límite mensual alcanzado');
        return res.status(403).json({
          message: 'Límite de lectura alcanzado',
          limit: 1,
          current: booksReadThisMonth,
          resetDate: getNextMonthReset()
        });
      }

      console.log('✅ Límite disponible - permitiendo lectura');

      // Verificar si ya existe la lectura
      const existingResult = await pool.query(
        'SELECT id FROM lectura_usuario WHERE id_usuario = $1 AND id_libro = $2',
        [userId, id]
      );

      if (existingResult.rows.length === 0) {
        // Insertar solo si no existe
        await pool.query(
          'INSERT INTO lectura_usuario (id_usuario, id_libro, fecha_lectura) VALUES ($1, $2, CURRENT_DATE)',
          [userId, id]
        );
        console.log('📝 Lectura registrada para usuario FREE');
      } else {
        console.log('📝 Lectura ya existía, no se duplica');
      }

      return fetchBookAndRespond(id, res);
    }

    return res.status(403).json({ message: 'Rol no válido' });
  } catch (error) {
    console.error('Error en lectura:', error);
    res.status(500).json({ message: 'Error al procesar solicitud de lectura' });
  }
};

async function fetchBookAndRespond(id, res) {
  try {
    const response = await fetch(`https://gutendex.com/books/${id}`);
    const book = await response.json();

    res.json({
      id: book.id?.toString() || id,
      title: book.title || 'Título desconocido',
      author: book.authors?.[0]?.name || 'Autor desconocido',
      readLink: book.formats?.['text/html'] || book.formats?.['application/pdf'] || null,
      downloadLinks: book.formats || {}
    });
  } catch (error) {
    console.error('Error fetching read link from Gutenberg:', error);
    res.status(500).json({ message: 'Error al obtener enlace de lectura' });
  }
}

function getNextMonthReset() {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toISOString().split('T')[0];
}
