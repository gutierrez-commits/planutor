const express = require('express');
const notaController = require('../controllers/notaController');

const router = express.Router();

router.get('/calendario/notas', notaController.listar);
router.post('/calendario/notas', notaController.crear);
router.delete('/calendario/notas/:id', notaController.eliminar);

module.exports = router;
