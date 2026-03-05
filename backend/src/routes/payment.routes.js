
import express from 'express';
import pool from '../config/db.js';
const router = express.Router();

router.post('/buy', async (req, res) => {
  const { userId } = req.body;
  await pool.query('UPDATE users SET role=$1 WHERE id=$2',['PREMIUM', userId]);
  res.json({message:'Premium activado'});
});
export default router;
