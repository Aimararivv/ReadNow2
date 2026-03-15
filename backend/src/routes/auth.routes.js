import express from 'express';
import { register, login, updateProfile } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.put('/update', authenticateToken, updateProfile);

export default router;