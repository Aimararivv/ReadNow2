import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { pool } from './config/db.js';

const app = express();

// Configuración de CORS
const corsOptions = {
  origin: ['http://localhost:4200', 'http://localhost:4201', 'http://127.0.0.1:4200', 'http://127.0.0.1:4201'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Usuarios simulados
const users = [
  { id: 1, nombre: 'Usuario Test', correo: 'test@test.com', password: 'password123', role: 'FREE' },
  { id: 2, nombre: 'Usuario Premium', correo: 'premium@test.com', password: 'password123', role: 'PREMIUM' }
];

// Middleware para verificar token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Token requerido' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, 'EstaEsUnaClaveSuperSeguraParaJWT2026BibliotecaAPI');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

// Verificar estructura de tabla usuarios existente
app.get('/api/check-usuarios', async (req, res) => {
  try {
    console.log('🔍 Verificando estructura detallada de tabla usuarios...');
    
    // Verificar si la tabla existe
    const tableExistsQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'usuarios'
    `;
    const tableResult = await pool.query(tableExistsQuery);
    
    if (tableResult.rows.length === 0) {
      return res.json({ message: 'La tabla usuarios no existe', exists: false });
    }
    
    // Obtener estructura completa
    const columnsQuery = `
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns 
      WHERE table_name = 'usuarios' AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    const columnsResult = await pool.query(columnsQuery);
    
    // Obtener datos de muestra
    const sampleQuery = `SELECT * FROM usuarios LIMIT 3`;
    const sampleResult = await pool.query(sampleQuery);
    
    res.json({
      exists: true,
      columns: columnsResult.rows,
      sampleData: sampleResult.rows,
      columnNames: columnsResult.rows.map(col => col.column_name)
    });
    
  } catch (error) {
    console.error('❌ Error verificando tabla usuarios:', error);
    res.status(500).json({ message: 'Error verificando tabla usuarios', error: error.message });
  }
});

// Verificar y crear tablas necesarias
app.post('/api/verify-db', async (req, res) => {
  try {
    console.log('🔍 Verificando estructura de la base de datos...');
    
    // Verificar tablas existentes
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    const tablesResult = await pool.query(tablesQuery);
    const existingTables = tablesResult.rows.map(row => row.table_name);
    
    console.log('📋 Tablas existentes:', existingTables);
    
    // Si la tabla usuarios existe, usar su estructura actual
    if (existingTables.includes('usuarios')) {
      const columnsQuery = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'usuarios' AND table_schema = 'public'
        ORDER BY ordinal_position
      `;
      const columnsResult = await pool.query(columnsQuery);
      const usuariosColumns = columnsResult.rows;
      console.log('📊 Columnas de usuarios existentes:', usuariosColumns.map(col => `${col.column_name} (${col.data_type})`));
      
      // Verificar si tiene la columna id_usuario (tu estructura)
      const hasIdUsuarioColumn = usuariosColumns.some(col => col.column_name === 'id_usuario');
      if (hasIdUsuarioColumn) {
        console.log('✅ Usando tabla usuarios existente con columna id_usuario');
        
        // Verificar si hay usuarios de prueba
        const testUsersQuery = `SELECT * FROM usuarios WHERE correo LIKE '%@test.com'`;
        const testUsersResult = await pool.query(testUsersQuery);
        
        if (testUsersResult.rows.length === 0) {
          console.log('📝 Insertando usuarios de prueba...');
          const insertUsersQuery = `
            INSERT INTO usuarios (nombre, correo, password, role) VALUES 
            ('Usuario Test', 'test@test.com', 'password123', 'FREE'),
            ('Usuario Premium', 'premium@test.com', 'password123', 'PREMIUM')
          `;
          await pool.query(insertUsersQuery);
          console.log('✅ Usuarios de prueba insertados');
        }
      }
    }
    
    // Crear tabla libros_lectura si no existe
    if (!existingTables.includes('libros_lectura')) {
      console.log('📝 Creando tabla libros_lectura...');
      // Adaptar la referencia según la estructura de usuarios
      const createLecturaQuery = `
        CREATE TABLE libros_lectura (
          id SERIAL PRIMARY KEY,
          id_usuario INTEGER REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
          id_libro VARCHAR(50) NOT NULL,
          fecha_lectura TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await pool.query(createLecturaQuery);
      console.log('✅ Tabla libros_lectura creada');
    }
    
    // Crear tabla suscripciones si no existe
    if (!existingTables.includes('suscripciones')) {
      console.log('📝 Creando tabla suscripciones...');
      // Adaptar la referencia según la estructura de usuarios
      const createSuscripcionesQuery = `
        CREATE TABLE suscripciones (
          id SERIAL PRIMARY KEY,
          id_usuario INTEGER REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
          tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('FREE', 'PREMIUM')),
          fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          fecha_fin TIMESTAMP,
          activa BOOLEAN DEFAULT true
        )
      `;
      await pool.query(createSuscripcionesQuery);
      console.log('✅ Tabla suscripciones creada');
    }
    
    res.json({ 
      message: 'Base de datos verificada y actualizada correctamente',
      existingTables,
      nuevasTablas: ['libros_lectura', 'suscripciones'].filter(tabla => !existingTables.includes(tabla)),
      usuariosStructure: 'Adaptado a tabla existente con id_usuario'
    });
    
  } catch (error) {
    console.error('❌ Error verificando base de datos:', error);
    res.status(500).json({ message: 'Error verificando base de datos', error: error.message });
  }
});

// Inicializar base de datos (método anterior, mantenido por compatibilidad)
app.post('/api/init-db', async (req, res) => {
  try {
    console.log('🔧 Inicializando base de datos...');
    
    // Eliminar tabla existente si hay problemas de estructura
    console.log('🗑️ Eliminando tabla usuarios si existe...');
    try {
      await pool.query('DROP TABLE IF EXISTS usuarios CASCADE');
      console.log('✅ Tabla eliminada');
    } catch (error) {
      console.log('📝 Tabla no existía o error al eliminar:', error.message);
    }
    
    // Crear tabla usuarios con estructura correcta
    console.log('📋 Creando tabla usuarios con estructura correcta...');
    await pool.query(`
      CREATE TABLE usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        correo VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'FREE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla usuarios creada');

    // Insertar usuarios de prueba
    console.log('👤 Insertando usuarios de prueba...');
    const result = await pool.query(`
      INSERT INTO usuarios (nombre, correo, password, role) VALUES 
      ('Usuario Test', 'test@test.com', 'password123', 'FREE'),
      ('Usuario Premium', 'premium@test.com', 'password123', 'PREMIUM')
    `);
    console.log('✅ Usuarios insertados:', result.rowCount);

    res.json({ message: 'Base de datos inicializada correctamente' });
  } catch (error) {
    console.error('❌ Error inicializando DB:', error);
    res.status(500).json({ message: 'Error inicializando base de datos', error: error.message });
  }
});

// Rutas de autenticación
app.post('/api/auth/login', async (req, res) => {
  try {
    const { correo, password } = req.body;
    
    // Buscar usuario en la base de datos
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE correo = $1 AND password = $2',
      [correo, password]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    const user = result.rows[0];
    
    const token = jwt.sign(
      { id: user.id_usuario, email: user.correo, role: user.role }, // Usar id_usuario
      'EstaEsUnaClaveSuperSeguraParaJWT2026BibliotecaAPI',
      { expiresIn: '2h' }
    );
    
    res.json({
      token,
      user: {
        id_usuario: user.id_usuario,
        nombre: user.nombre,
        correo: user.correo,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Rutas de autenticación
app.post('/api/auth/register', async (req, res) => {
  try {
    const { correo, password } = req.body;
    
    console.log('📝 Intentando registrar usuario:', correo);
    
    // Verificar si el usuario ya existe
    const existingUser = await pool.query(
      'SELECT * FROM usuarios WHERE correo = $1',
      [correo]
    );
    
    if (existingUser.rows.length > 0) {
      console.log('⚠️ Usuario ya existe:', correo);
      return res.status(400).json({ message: 'Usuario ya existe' });
    }
    
    // Primero verificar la estructura de la tabla
    console.log('🔍 Verificando estructura de la tabla usuarios...');
    const tableInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'usuarios'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Columnas encontradas:', tableInfo.rows.map(col => `${col.column_name} (${col.data_type})`));
    
    // Crear nuevo usuario - consulta más segura
    const insertQuery = `
      INSERT INTO usuarios (nombre, correo, password, role) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id_usuario, nombre, correo, role
    `;
    
    console.log('🔍 Consulta SQL:', insertQuery);
    console.log('🔍 Parámetros:', [correo.split('@')[0], correo, password, 'FREE']);
    
    const result = await pool.query(insertQuery, [
      correo.split('@')[0], 
      correo, 
      password, 
      'FREE'
    ]);
    
    const newUser = result.rows[0];
    console.log('✅ Usuario creado:', newUser);
    
    res.json({
      id_usuario: newUser.id_usuario,
      nombre: newUser.nombre,
      correo: newUser.correo,
      role: newUser.role
    });
  } catch (error) {
    console.error('❌ Error en registro:', error);
    console.error('❌ Detalles del error:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      position: error.position,
      routine: error.routine
    });
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

// Rutas de libros
app.get('/api/books', async (req, res) => {
  try {
    console.log('📚 Obteniendo libros desde Gutenberg...');
    const startTime = Date.now();
    
    const response = await fetch('https://gutendex.com/books');
    const data = await response.json();
    
    console.log('📊 Datos recibidos de Gutenberg:', data.results?.length || 0, 'libros');
    
    const books = data.results?.slice(0, 20).map((book, index) => ({
      id: book.id.toString(),
      title: book.title || 'Título desconocido',
      author: book.authors?.[0]?.name || 'Autor desconocido',
      thumbnail: book.formats?.['image/jpeg'] || book.formats?.['image/png'] || null,
      premium: index % 3 === 0, // Cada 3 libros es premium
      downloadCount: book.download_count || 0,
      subjects: book.subjects?.slice(0, 3) || []
    })) || [];
    
    const endTime = Date.now();
    console.log(`⏱️ Tiempo de respuesta: ${endTime - startTime}ms`);
    console.log('📚 Enviando', books.length, 'libros al frontend');
    
    res.json(books);
  } catch (error) {
    console.error('❌ Error fetching books from Gutenberg:', error);
    res.status(500).json({ message: 'Error al obtener libros' });
  }
});

// Ruta de suscripción - debe ir antes de la ruta dinámica
app.get('/api/books/subscription', verifyToken, (req, res) => {
  const isPremium = req.user.role === 'PREMIUM';
  
  res.json({
    tieneSuscripcion: isPremium,
    tipoPlan: isPremium ? 'PREMIUM' : 'FREE',
    limiteDiario: isPremium ? -1 : 3,
    leidosHoy: 1,
    restantesHoy: isPremium ? -1 : 2,
    esPremium: isPremium
  });
});

app.get('/api/books/search', async (req, res) => {
  try {
    const query = req.query.query || '';
    if (!query) {
      return res.json([]);
    }
    
    const response = await fetch(`https://gutendex.com/books?search=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    const books = data.results?.slice(0, 10).map((book, index) => ({
      id: book.id.toString(),
      title: book.title || 'Título desconocido',
      author: book.authors?.[0]?.name || 'Autor desconocido',
      thumbnail: book.formats?.['image/jpeg'] || book.formats?.['image/png'] || null,
      premium: index % 3 === 0,
      downloadCount: book.download_count || 0,
      subjects: book.subjects?.slice(0, 3) || []
    })) || [];
    
    res.json(books);
  } catch (error) {
    console.error('Error searching books from Gutenberg:', error);
    res.status(500).json({ message: 'Error en la búsqueda' });
  }
});

// Ruta para obtener libros por categoría (usando subjects de Gutenberg)
app.get('/api/books/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    // Mapeo de categorías a términos de búsqueda
    const categoryMap = {
      'Fiction': 'fiction',
      "Children's Literature": 'children',
      'Mystery': 'mystery',
      'Science Fiction': 'science fiction',
      'Fantasy': 'fantasy',
      'Romance': 'romance',
      'History': 'history',
      'Biography': 'biography',
      'Science': 'science',
      'Poetry': 'poetry',
      'Drama': 'drama',
      'Adventure': 'adventure',
      'Short Stories': 'short stories',
      'Philosophy': 'philosophy',
      'Music': 'music',
      'Composers': 'composers'
    };
    
    const searchQuery = categoryMap[category] || category;
    
    const response = await fetch(`https://gutendex.com/books?search=${encodeURIComponent(searchQuery)}`);
    const data = await response.json();
    
    const books = data.results?.slice(0, 20).map((book, index) => ({
      id: book.id.toString(),
      title: book.title || 'Título desconocido',
      author: book.authors?.[0]?.name || 'Autor desconocido',
      thumbnail: book.formats?.['image/jpeg'] || book.formats?.['image/png'] || null,
      premium: index % 3 === 0,
      downloadCount: book.download_count || 0,
      subjects: book.subjects?.slice(0, 3) || []
    })) || [];
    
    res.json(books);
  } catch (error) {
    console.error('Error fetching books by category from Gutenberg:', error);
    res.status(500).json({ message: 'Error al obtener libros por categoría' });
  }
});

// Ruta pública para obtener detalles del libro (sin autenticación)
app.get('/api/books/public/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const response = await fetch(`https://gutendex.com/books/${id}`);
    const book = await response.json();
    
    const bookDetail = {
      id: book.id?.toString() || id,
      title: book.title || 'Título desconocido',
      author: book.authors?.[0]?.name || 'Autor desconocido',
      thumbnail: book.formats?.['image/jpeg'] || book.formats?.['image/png'] || null,
      description: book.description?.substring(0, 500) || 'Sin descripción disponible',
      premium: false,
      downloadCount: book.download_count || 0,
      subjects: book.subjects?.slice(0, 5) || [],
      languages: book.languages?.map(lang => lang.code) || [],
      downloadLinks: book.formats || {}
    };
    
    res.json(bookDetail);
  } catch (error) {
    console.error('Error fetching public book details from Gutenberg:', error);
    res.status(500).json({ message: 'Error al obtener detalles del libro' });
  }
});

app.get('/api/books/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const response = await fetch(`https://gutendex.com/books/${id}`);
    const book = await response.json();
    
    const bookDetail = {
      id: book.id?.toString() || id,
      title: book.title || 'Título desconocido',
      author: book.authors?.[0]?.name || 'Autor desconocido',
      thumbnail: book.formats?.['image/jpeg'] || book.formats?.['image/png'] || null,
      description: book.description?.substring(0, 500) || 'Sin descripción disponible',
      premium: false,
      downloadCount: book.download_count || 0,
      subjects: book.subjects?.slice(0, 5) || [],
      languages: book.languages?.map(lang => lang.code) || [],
      downloadLinks: book.formats || {}
    };
    
    res.json(bookDetail);
  } catch (error) {
    console.error('Error fetching book details from Gutenberg:', error);
    res.status(500).json({ message: 'Error al obtener detalles del libro' });
  }
});

app.get('/api/books/read/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (req.user.role !== 'PREMIUM') {
      return res.status(403).json({ message: 'Se requiere suscripción premium' });
    }
    
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
});

// Ruta para actualizar perfil
app.put('/api/auth/update', verifyToken, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userId = req.user.id;

    console.log('📝 Actualizando perfil del usuario:', userId);

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
      updates.push('password = $' + (updates.length + 1));
      updateValues.push(password);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No hay campos para actualizar' });
    }

    updateQuery += updates.join(', ') + ' WHERE id_usuario = $' + (updates.length + 1) + ' RETURNING *';
    updateValues.push(userId);

    console.log('🔍 Consulta SQL:', updateQuery);
    console.log('🔍 Parámetros:', updateValues);

    const result = await pool.query(updateQuery, updateValues);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const updatedUser = result.rows[0];
    console.log('✅ Perfil actualizado:', updatedUser);

    res.json({
      message: 'Perfil actualizado exitosamente',
      user: {
        id_usuario: updatedUser.id_usuario,
        nombre: updatedUser.nombre,
        correo: updatedUser.correo,
        role: updatedUser.role
      }
    });

  } catch (error) {
    console.error('❌ Error al actualizar perfil:', error);
    res.status(500).json({ message: 'Error al actualizar el perfil' });
  }
});

// Ruta para eliminar cuenta
app.delete('/api/auth/delete', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('🗑️ Eliminando cuenta del usuario:', userId);

    const result = await pool.query(
      'DELETE FROM usuarios WHERE id_usuario = $1 RETURNING *',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    console.log('✅ Cuenta eliminada exitosamente');
    res.json({ message: 'Cuenta eliminada exitosamente' });

  } catch (error) {
    console.error('❌ Error al eliminar cuenta:', error);
    res.status(500).json({ message: 'Error al eliminar la cuenta' });
  }
});

app.get('/api/auth/test', (req, res) => {
  res.json({ message: 'Backend funcionando correctamente' });
});

const PORT = 5036;

app.listen(PORT, () => {
  console.log(`🚀 Servidor ReadNow corriendo en http://localhost:${PORT}`);
  console.log(`📚 API disponible en http://localhost:${PORT}/api`);
});
