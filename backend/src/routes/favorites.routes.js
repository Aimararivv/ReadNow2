import express from 'express';
import {
  addFavorite,
  removeFavorite,
  getFavoritesByUser,
  checkFavorite
} from '../controllers/favorites.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/',                          verifyToken, addFavorite);
router.delete('/:usuarioid/:bookid',      verifyToken, removeFavorite);
router.get('/user/:usuarioid',            verifyToken, getFavoritesByUser);
router.get('/check/:usuarioid/:bookid',   verifyToken, checkFavorite);

export default router;