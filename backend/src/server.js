import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import booksRoutes from './routes/books.routes.js';
import premiumRoutes from './routes/premium.routes.js';
import authRoutes from './routes/auth.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import usersRoutes from './routes/users.routes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/books', booksRoutes);
app.use('/api/premium', premiumRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/users', usersRoutes);

app.listen(3000, () => {
  console.log('✅ ReadNow corriendo en el puerto 3000');
});