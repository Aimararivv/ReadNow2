import express from 'express';
import { createLog } from '../controllers/logs.controller.js';

const router = express.Router();

router.post('/', createLog);

export default router;