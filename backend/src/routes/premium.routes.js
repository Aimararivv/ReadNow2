
import express from 'express';
import pool from '../config/db.js';
const router = express.Router();

router.get('/', async (req, res) => {
  const r = await pool.query('SELECT * FROM premium_books');
  res.json(r.rows);
});
export default router;
