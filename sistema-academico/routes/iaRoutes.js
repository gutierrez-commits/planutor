const express = require('express');
const router = express.Router();

const iaController = require('../controllers/iaController');

// POST /ia/preguntar  -> hace la pregunta a Gemini
router.post('/preguntar', iaController.responderPregunta);

// GET /ia/estado -> revisa si la clave funciona (diagnostico)
router.get('/estado', iaController.estado);

module.exports = router;
