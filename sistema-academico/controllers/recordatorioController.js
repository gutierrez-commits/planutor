const Usuario = require('../models/usuarioModel');
const Recordatorio = require('../models/recordatorioModel');

async function listar(req, res) {
  const usuarioId = Number(req.query.usuarioId);

  if (!usuarioId) {
    res.status(400).json({ error: 'usuarioId es obligatorio.' });
    return;
  }

  try {
    const usuario = await Usuario.buscarPorId(usuarioId);

    if (!usuario) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    let recordatorios = [];

    if (usuario.rol === 'profesor') {
      recordatorios = await Recordatorio.obtenerParaProfesor(usuario.id);
    } else if (usuario.rol === 'estudiante') {
      recordatorios = await Recordatorio.obtenerParaEstudiante({
        estudianteId: usuario.id,
        grado: usuario.grado,
        grupo: usuario.grupo
      });
    }

    res.json({ recordatorios });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No fue posible obtener los recordatorios.' });
  }
}

module.exports = { listar };