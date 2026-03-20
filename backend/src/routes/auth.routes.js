import express from 'express';
import { register, login, updateProfile, deleteAccount } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.put('/update', authenticateToken, updateProfile);
router.delete('/delete', authenticateToken, deleteAccount);

export default router;