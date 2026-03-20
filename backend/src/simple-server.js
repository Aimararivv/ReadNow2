import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
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
  
  console.log('🔑 Verificando token - Header:', authHeader ? authHeader.substring(0, 50) + '...' : 'null');
  
  if (!authHeader) {
    console.log('❌ Token requerido - No hay header de autorización');
    return res.status(401).json({ message: 'Token requerido' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, 'EstaEsUnaClaveSuperSeguraParaJWT2026BibliotecaAPI');
    console.log('✅ Token decodificado:', { 
      id_usuario: decoded.id_usuario, 
      email: decoded.email, 
      role: decoded.role 
    });
    
    req.user = {
      id_usuario: decoded.id_usuario, // Corregido: usar id_usuario
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (error) {
    console.log('❌ Error verificando token:', error.message);
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

// Migrar contraseñas existentes a formato encriptado
app.post('/api/migrate-passwords', async (req, res) => {
  try {
    console.log('🔄 Iniciando migración de contraseñas...');
    
    // Obtener todos los usuarios
    const usersResult = await pool.query('SELECT id_usuario, correo, password FROM usuarios');
    
    let migratedCount = 0;
    let alreadyEncryptedCount = 0;
    
    for (const user of usersResult.rows) {
      // Verificar si la contraseña ya está encriptada (bcrypt hashes empiezan con $2b$)
      if (user.password.startsWith('$2b$')) {
        alreadyEncryptedCount++;
        console.log(`⏭️ Usuario ${user.correo} ya tiene contraseña encriptada`);
        continue;
      }
      
      // Encriptar la contraseña actual
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      // Actualizar la contraseña en la base de datos
      await pool.query(
        'UPDATE usuarios SET password = $1 WHERE id_usuario = $2',
        [hashedPassword, user.id_usuario]
      );
      
      migratedCount++;
      console.log(`✅ Contraseña migrada para usuario: ${user.correo}`);
    }
    
    res.json({
      message: 'Migración completada',
      totalUsers: usersResult.rows.length,
      migratedPasswords: migratedCount,
      alreadyEncrypted: alreadyEncryptedCount
    });
    
  } catch (error) {
    console.error('❌ Error en migración de contraseñas:', error);
    res.status(500).json({ message: 'Error en migración', error: error.message });
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
          console.log('📝 Insertando usuarios de prueba con contraseñas encriptadas...');
          
          // Encriptar contraseñas de prueba
          const testPasswordHash = await bcrypt.hash('password123', 10);
          const premiumPasswordHash = await bcrypt.hash('password123', 10);
          
          const insertUsersQuery = `
            INSERT INTO usuarios (nombre, correo, password, role) VALUES 
            ($1, $2, $3, $4),
            ($5, $6, $7, $8)
          `;
          await pool.query(insertUsersQuery, [
            'Usuario Test', 'test@test.com', testPasswordHash, 'FREE',
            'Usuario Premium', 'premium@test.com', premiumPasswordHash, 'PREMIUM'
          ]);
          console.log('✅ Usuarios de prueba insertados con contraseñas encriptadas');
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
      'SELECT * FROM usuarios WHERE correo = $1',
      [correo]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    const user = result.rows[0];
    
    // Verificar la contraseña encriptada
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('❌ Contraseña incorrecta para usuario:', correo);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    console.log('✅ Contraseña verificada para usuario:', correo);
    
    const token = jwt.sign(
      { id_usuario: user.id_usuario, email: user.correo, role: user.role }, 
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
    const { nombre, correo, password } = req.body;
    
    console.log('📝 Intentando registrar usuario:', { nombre, correo });
    
    // Validar que se proporcionen todos los campos
    if (!nombre || !correo || !password) {
      return res.status(400).json({ 
        message: 'Faltan campos requeridos: nombre, correo y password' 
      });
    }
    
    // Verificar si el usuario ya existe
    const existingUser = await pool.query(
      'SELECT * FROM usuarios WHERE correo = $1',
      [correo]
    );
    
    if (existingUser.rows.length > 0) {
      console.log('⚠️ Usuario ya existe:', correo);
      return res.status(400).json({ message: 'Usuario ya existe' });
    }
    
    // Encriptar la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('🔐 Contraseña encriptada correctamente');
    
    // Crear nuevo usuario - consulta más segura
    const insertQuery = `
      INSERT INTO usuarios (nombre, correo, password, role) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id_usuario, nombre, correo, role
    `;
    
    console.log('🔍 Consulta SQL:', insertQuery);
    console.log('🔍 Parámetros:', [nombre, correo, '[ENCRYPTED]', 'FREE']);
    
    const result = await pool.query(insertQuery, [
      nombre, // Usar el nombre proporcionado
      correo, 
      hashedPassword, // Guardar contraseña encriptada
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
      hint: error.hint
    });
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

// Endpoint para actualizar rol de usuario (suscripción premium)
app.put('/api/users/update-role/:id_usuario', verifyToken, async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const { role, cardYear, cardNumber, cvv } = req.body;
    
    console.log('🔄 Actualizando rol de usuario:', { id_usuario, role });
    console.log('� Usuario del token:', req.user);
    console.log('� Datos de tarjeta recibidos:', { 
      cardYear: cardYear, 
      cardNumber: cardNumber ? '****' + cardNumber.slice(-4) : null, 
      cvv: cvv ? '***' : null 
    });
    
    // Validar que el rol sea válido
    if (!['FREE', 'PREMIUM'].includes(role)) {
      console.log('❌ Rol inválido:', role);
      return res.status(400).json({ message: 'Rol inválido' });
    }
    
    // Verificar que el usuario exista
    const userResult = await pool.query(
      'SELECT * FROM usuarios WHERE id_usuario = $1',
      [id_usuario]
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ Usuario no encontrado:', id_usuario);
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    console.log('✅ Usuario encontrado:', userResult.rows[0].nombre);
    
    // Simplificar: solo actualizar el rol sin encriptación por ahora
    console.log('🔄 Actualizando rol...');
    const updateQuery = `
      UPDATE usuarios 
      SET role = $1
      WHERE id_usuario = $2
      RETURNING id_usuario, nombre, correo, role
    `;
    
    const result = await pool.query(updateQuery, [role, id_usuario]);
    
    console.log('✅ Usuario actualizado:', result.rows[0]);
    
    // Generar nuevo token con rol actualizado
    const updatedUser = result.rows[0];
    const newToken = jwt.sign(
      { 
        id_usuario: updatedUser.id_usuario, 
        email: updatedUser.correo, 
        role: updatedUser.role 
      },
      'EstaEsUnaClaveSuperSeguraParaJWT2026BibliotecaAPI',
      { expiresIn: '2h' }
    );
    
    console.log('🔑 Nuevo token generado con rol:', updatedUser.role);
    
    res.json({
      message: 'Rol actualizado exitosamente',
      user: updatedUser,
      token: newToken // Enviar nuevo token
    });
    
  } catch (error) {
    console.error('❌ Error completo en actualización:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ 
      message: 'Error en el servidor', 
      error: error.message 
    });
  }
});

// Endpoint para crear tabla de lectura_usuario si no existe
app.get('/api/create-lectura-table', async (req, res) => {
  try {
    console.log('🔧 Creando tabla lectura_usuario...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lectura_usuario (
        id SERIAL PRIMARY KEY,
        id_usuario INTEGER NOT NULL,
        id_libro VARCHAR(50) NOT NULL,
        fecha_lectura DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_lectura_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
        CONSTRAINT unique_lectura UNIQUE (id_usuario, id_libro)
      )
    `);
    
    console.log('✅ Tabla lectura_usuario creada exitosamente');
    res.json({ message: 'Tabla lectura_usuario creada exitosamente' });
  } catch (error) {
    console.error('❌ Error creando tabla:', error);
    res.status(500).json({ message: 'Error creando tabla', error: error.message });
  }
});

// Endpoint para ver todos los usuarios (debug)
app.get('/api/debug/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_usuario, nombre, correo, role FROM usuarios ORDER BY id_usuario');
    res.json({
      message: 'Usuarios encontrados',
      users: result.rows
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ message: 'Error obteniendo usuarios' });
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
    const userId = req.user.id_usuario;
    const userRole = req.user.role;
    
    console.log('📖 Usuario intentando leer libro:', { userId, userRole, bookId: id });
    
    // Si es PREMIUM, acceso ilimitado
    if (userRole === 'PREMIUM') {
      console.log('👑 Usuario PREMIUM - acceso ilimitado');
      return fetchBookAndRespond(id, res);
    }
    
    // Si es FREE, verificar límite mensual
    if (userRole === 'FREE') {
      console.log('🆓 Usuario FREE - verificando límite mensual');
      
      // Obtener conteo de libros leídos este mes
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const countResult = await pool.query(`
        SELECT COUNT(*) as books_read 
        FROM lectura_usuario 
        WHERE id_usuario = $1 
        AND DATE_TRUNC('month', fecha_lectura) = DATE_TRUNC('month', CURRENT_DATE)
      `, [userId]);
      
      const booksReadThisMonth = parseInt(countResult.rows[0].books_read);
      console.log('📊 Libros leídos este mes:', booksReadThisMonth);
      
      // Verificar límite de 1 libro por mes
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
      
      // Registrar lectura
      await pool.query(`
        INSERT INTO lectura_usuario (id_usuario, id_libro, fecha_lectura)
        VALUES ($1, $2, CURRENT_DATE)
        ON CONFLICT (id_usuario, id_libro) DO NOTHING
      `, [userId, id]);
      
      return fetchBookAndRespond(id, res);
    }
    
    // Otros roles no permitidos
    return res.status(403).json({ message: 'Rol no válido' });
    
  } catch (error) {
    console.error('Error en lectura:', error);
    res.status(500).json({ message: 'Error al procesar solicitud de lectura' });
  }
});

// Función auxiliar para obtener libro y responder
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

// Función auxiliar para calcular fecha de reset
function getNextMonthReset() {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toISOString().split('T')[0];
}

app.get('/api/auth/test', (req, res) => {
  res.json({ message: 'Backend funcionando correctamente' });
});

const PORT = 5036;

app.listen(PORT, () => {
  console.log(`🚀 Servidor ReadNow corriendo en http://localhost:${PORT}`);
  console.log(`📚 API disponible en http://localhost:${PORT}/api`);
});
