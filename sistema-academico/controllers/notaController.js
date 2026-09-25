const Nota = require('../models/notaModel');

function normalizarTexto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

async function listar(req, res) {
  const usuarioId = Number(req.query.usuarioId);

  if (!usuarioId) {
    res.status(400).json({ error: 'usuarioId es obligatorio.' });
    return;
  }

  try {
    const notas = await Nota.obtenerPorUsuario(usuarioId);
    res.json({ notas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No fue posible obtener las notas.' });
  }
}

async function crear(req, res) {
  const usuarioId = Number(req.body.usuarioId);
  const fecha = normalizarTexto(req.body.fecha);
  const titulo = normalizarTexto(req.body.titulo);
  const origen = req.body.origen === 'inicial' ? 'inicial' : 'personal';

  if (!usuarioId || !fecha || !titulo) {
    res.status(400).json({ error: 'usuarioId, fecha y titulo son obligatorios.' });
    return;
  }

  try {
    if (origen === 'inicial') {
      const existe = await Nota.existeEvento({ usuarioId, fecha, titulo });
      if (existe) {
        res.status(200).json({ ok: true, duplicado: true });
        return;
      }
    }

    const nota = await Nota.crear({ usuarioId, fecha, titulo, origen });
    res.status(201).json({ nota });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No fue posible guardar la nota.' });
  }
}

async function eliminar(req, res) {
  const usuarioId = Number(req.body.usuarioId || req.query.usuarioId);
  const id = Number(req.params.id);

  if (!usuarioId || !id) {
    res.status(400).json({ error: 'usuarioId e id son obligatorios.' });
    return;
  }

  try {
    await Nota.eliminar(id, usuarioId);
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No fue posible eliminar la nota.' });
  }
}

module.exports = {
  listar,
  crear,
  eliminar
};
