const express = require('express');
const recordatorioController = require('../controllers/recordatorioController');

const router = express.Router();

router.get('/recordatorios', recordatorioController.listar);

module.exports = router;