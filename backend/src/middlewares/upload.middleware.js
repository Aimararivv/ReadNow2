import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = 'uploads/profile';

// Crear carpeta si no existe
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📁 Carpeta creada:', uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('📂 Guardando archivo en:', uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.random().toString(36).substring(2, 15);
    const filename = name + ext;
    console.log('📝 Nombre de archivo:', filename);
    cb(null, filename);
  }
});

// Filtro de archivos - solo imágenes
const fileFilter = (req, file, cb) => {
  console.log('🔍 Archivo recibido:', file.originalname, '- Tipo:', file.mimetype);
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

export const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  }
});

// Middleware de manejo de errores de multer
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('❌ Error de Multer:', err.message);
    return res.status(400).json({ message: 'Error al subir archivo: ' + err.message });
  }
  next(err);
};