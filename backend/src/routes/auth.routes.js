import express from 'express';
import { register, login, updateProfile, deleteAccount } from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.put('/update', verifyToken, updateProfile);
router.delete('/delete', verifyToken, deleteAccount);

export default router;