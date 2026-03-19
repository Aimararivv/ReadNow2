const router = require('express').Router();
const controller = require('../controllers/favoritos.controller');
const auth = require('../middlewares/auth');

router.post('/', auth, controller.agregar);
router.get('/', auth, controller.obtener);

module.exports = router;