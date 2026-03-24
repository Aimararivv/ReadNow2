import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import * as lecturaController from '../controllers/lectura.controller.js';

const router = Router();

router.get('/historial', verifyToken, lecturaController.getReadingHistory);
router.get('/:id', verifyToken, lecturaController.readBook);

export default router;
