const router = require('express').Router();
const controller = require('../controllers/historial.controller');
const auth = require('../middlewares/auth');

router.get('/', auth, controller.getHistorial);
router.post('/', auth, controller.agregar);

module.exports = router;