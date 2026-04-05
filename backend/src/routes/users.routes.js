import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { upload, handleMulterError } from '../middlewares/upload.middleware.js'; 
import * as usersController from '../controllers/users.controller.js';


const router = Router();

// OBTENER USUARIO ACTUAL
router.get('/me', verifyToken, usersController.getMe);

router.put('/update-role/:id_usuario', verifyToken, usersController.updateRole);
router.put('/save-card-data/:id_usuario', verifyToken, usersController.saveCardData);
router.get('/debug', usersController.getAllUsers);


// FOTO DE PERFIL - multer debe ir PRIMERO para procesar el archivo
router.put(
  '/profile',
  verifyToken,
  upload.single('foto'),
  handleMulterError,
  usersController.updateProfile
);

export default router;