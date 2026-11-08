const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verificarToken = require('../middlewares/authMiddleware');

// Cuando hagan GET a /empleados, primero verifica el token, luego ejecuta el controlador
router.get('/empleados', verificarToken, userController.obtenerEmpleados);

module.exports = router;