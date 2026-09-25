const express = require('express');
const tareaController = require('../controllers/tareaController');

const router = express.Router();

router.post('/profesor/tareas', tareaController.crear);
router.post('/estudiante/tareas/:tareaId/estado', tareaController.actualizarEstado);

module.exports = router;
