const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Enrutamos las peticiones hacia las funciones del controlador
router.post('/registro', authController.registro);
router.post('/login', authController.login);

module.exports = router;