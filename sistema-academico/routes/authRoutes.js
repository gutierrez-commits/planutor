const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.get('/', authController.mostrarLogin);
router.post('/login', authController.iniciarSesion);
router.get('/panel/:userId', authController.mostrarPanel);

router.get('/inicio', authController.mostrarInicio);
router.get('/codigo-profesor', authController.mostrarCodigoProfesor);
router.post('/codigo-profesor', authController.validarCodigoProfesor);

router.get('/registro-estudiante', authController.mostrarRegistroEstudiante);
router.post('/registro-estudiante', authController.registrarEstudiante);

module.exports = router;
