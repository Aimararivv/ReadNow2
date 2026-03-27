import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes.js';
import bookRoutes from './routes/books.routes.js';
import usersRoutes from './routes/users.routes.js';
import lecturaRoutes from './routes/lectura.routes.js';
import dbRoutes from './routes/db.routes.js';
import logsRoutes from './routes/logs.routes.js';
import favoritesRoutes from './routes/favorites.routes.js';

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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/books/read', lecturaRoutes);
app.use('/api', dbRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/favorites', favoritesRoutes);


// Error handler
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

const PORT = 5036;

app.listen(PORT, () => {
  console.log(`🚀 Servidor ReadNow corriendo en http://localhost:${PORT}`);
  console.log(`📚 API disponible en http://localhost:${PORT}/api`);
});

export default app;
