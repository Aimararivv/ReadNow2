const router = require('express').Router();
const controller = require('../controllers/categorias.controller');

router.get('/', controller.getCategorias);

module.exports = router;