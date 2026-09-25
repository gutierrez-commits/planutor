const express = require('express');
const Planeador = require('../models/planeadorModel');

const router = express.Router();


// MOSTRAR PLANEADOR
router.get('/:userId', async (req, res) => {
    console.log('ENTRO AL PLANEADOR');
    
    console.log('[PLANEADOR] Entró a la ruta con usuario:', req.params.userId);
  try {
    const usuarioId = Number(req.params.userId);

    if (!usuarioId) {
      return res.status(400).send('Usuario no valido.');
    }

    const anotaciones = await Planeador.obtenerPorUsuario(usuarioId);

    const hoy = new Date().toISOString().split('T')[0];

    for (const anotacion of anotaciones) {
      if (
        anotacion.estado !== 'completada' &&
        anotacion.estado !== 'archivada' &&
        anotacion.fecha < hoy
      ) {
        anotacion.estado = 'atrasada';
      }
    }

    res.render('planeador', {
      anotaciones,
      usuarioId
    });

  } catch (error) {
    console.error(error);
    res.status(500).send('No fue posible cargar el planeador.');
  }
});


// CREAR ANOTACIÓN
router.post('/:userId/crear', async (req, res) => {
  try {
    const usuarioId = Number(req.params.userId);

    await Planeador.crear({
      usuarioId,
      titulo: req.body.titulo,
      descripcion: req.body.descripcion,
      fecha: req.body.fecha,
      categoria: req.body.categoria,
      estado: req.body.estado || 'pendiente'
    });

    res.redirect(`/planeador/${usuarioId}`);

  } catch (error) {
    console.error(error);
    res.status(500).send('No fue posible crear la anotacion.');
  }
});


// EDITAR ANOTACIÓN
router.post('/:userId/editar/:id', async (req, res) => {
  try {
    const usuarioId = Number(req.params.userId);
    const id = Number(req.params.id);

    await Planeador.editar(id, usuarioId, {
      titulo: req.body.titulo,
      descripcion: req.body.descripcion,
      fecha: req.body.fecha,
      categoria: req.body.categoria,
      estado: req.body.estado
    });

    res.redirect(`/planeador/${usuarioId}`);

  } catch (error) {
    console.error(error);
    res.status(500).send('No fue posible editar la anotacion.');
  }
});


// ELIMINAR ANOTACIÓN
router.post('/:userId/eliminar/:id', async (req, res) => {
  try {
    const usuarioId = Number(req.params.userId);
    const id = Number(req.params.id);

    await Planeador.eliminar(id, usuarioId);

    res.redirect(`/planeador/${usuarioId}`);

  } catch (error) {
    console.error(error);
    res.status(500).send('No fue posible eliminar la anotacion.');
  }
});


// ARCHIVAR ANOTACIÓN
router.post('/:userId/archivar/:id', async (req, res) => {
  try {
    const usuarioId = Number(req.params.userId);
    const id = Number(req.params.id);

    await Planeador.archivar(id, usuarioId);

    res.redirect(`/planeador/${usuarioId}`);

  } catch (error) {
    console.error(error);
    res.status(500).send('No fue posible archivar la anotacion.');
  }
});


// DESARCHIVAR ANOTACIÓN
router.post('/:userId/desarchivar/:id', async (req, res) => {
  try {
    const usuarioId = Number(req.params.userId);
    const id = Number(req.params.id);

    await Planeador.desarchivar(id, usuarioId);

    res.redirect(`/planeador/${usuarioId}`);

  } catch (error) {
    console.error(error);
    res.status(500).send('No fue posible desarchivar la anotacion.');
  }
});


console.log('[PLANEADOR] Rutas cargadas correctamente');

module.exports = router;
