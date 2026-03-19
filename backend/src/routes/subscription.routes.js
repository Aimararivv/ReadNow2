const router = require('express').Router();
const controller = require('../controllers/subscription.controller');

router.post('/update-role', controller.updateRole);

module.exports = router;