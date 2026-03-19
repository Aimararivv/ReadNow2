import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes.js';
import bookRoutes from './routes/books.routes.js';
import favRoutes from './routes/favoritos.routes.js';
import historialRoutes from './routes/historial.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import categoriasRoutes from './routes/categorias.routes.js';

const app = express();

// Configuración de CORS más específica
const corsOptions = {
  origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/favoritos', favRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/categorias', categoriasRoutes);

const PORT = 5036;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});