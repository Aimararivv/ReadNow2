import express from 'express';
import { updateRole } from '../controllers/subscriptionController.js';

const router = express.Router();

// Cambiar rol del usuario
router.put('/update-role/:id', updateRole);

export default router;