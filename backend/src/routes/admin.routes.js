import { Router } from 'express';
import { verifyToken, verifyAdmin } from '../middlewares/auth.middleware.js';
import * as adminController from '../controllers/admin.controller.js';

const router = Router();

// Todas las rutas de admin requieren autenticación y rol de administrador
router.use(verifyToken, verifyAdmin);

// Gestión de usuarios
router.get('/users', adminController.getAllUsers);
router.post('/users', adminController.createUser);
router.delete('/users/:id_usuario', adminController.deleteUser);
router.put('/users/:id_usuario/role', adminController.updateUserRole);

// Estadísticas
router.get('/stats', adminController.getStats);

// Logs del sistema
router.get('/logs', adminController.getSystemLogs);
router.get('/logs/download', adminController.downloadLogsCSV);

export default router;
