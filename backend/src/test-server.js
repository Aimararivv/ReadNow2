import express from 'express';
import cors from 'cors';

const app = express();

// Configuración de CORS
const corsOptions = {
  origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Ruta de prueba
app.get('/api/books', (req, res) => {
  res.json([
    { id: 1, title: 'Libro de Prueba 1', author: 'Autor 1', premium: false },
    { id: 2, title: 'Libro de Prueba 2', author: 'Autor 2', premium: true }
  ]);
});

app.get('/api/auth/test', (req, res) => {
  res.json({ message: 'Backend funcionando correctamente' });
});

const PORT = 5036;

app.listen(PORT, () => {
  console.log(`Servidor de prueba corriendo en http://localhost:${PORT}`);
});
