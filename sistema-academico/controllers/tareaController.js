const Usuario = require('../models/usuarioModel');
const Tarea = require('../models/tareaModel');

function normalizarTexto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function normalizarFecha(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

async function crear(req, res) {
  const profesorId = Number(req.body.profesorId);
  const valores = {
    materia: normalizarTexto(req.body.materia),
    titulo: normalizarTexto(req.body.titulo),
    descripcion: normalizarTexto(req.body.descripcion),
    fechaEntrega: normalizarFecha(req.body.fechaEntrega)
  };

  try {
    const profesor = await Usuario.buscarPorId(profesorId);

    if (!profesor || profesor.rol !== 'profesor') {
      res.status(403).render('error', {
        titulo: 'Acceso denegado',
        mensaje: 'Solo un profesor puede publicar tareas.',
        volverA: '/',
        volverTexto: 'Volver al login'
      });
      return;
    }

    if (!profesor.grado || !profesor.grupo) {
      res.status(400).render('error', {
        titulo: 'Profesor sin curso asignado',
        mensaje: 'El profesor debe tener grado y grupo asignados antes de publicar tareas.',
        volverA: `/panel/${profesor.id}`,
        volverTexto: 'Volver al panel'
      });
      return;
    }

    if (!valores.materia || !valores.titulo || !valores.descripcion || !valores.fechaEntrega) {
      const semana = Tarea.obtenerRangoSemanaActual();
      const tareas = await Tarea.obtenerPorProfesorSemana(profesor.id, semana.inicio, semana.fin);

      res.status(400).render('profesor-dashboard', {
        currentUser: profesor,
        tareas,
        mensaje: '',
        error: 'Todos los campos de la tarea son obligatorios.',
        valores,
        semana
      });
      return;
    }

    const semana = Tarea.obtenerRangoSemanaActual();

    await Tarea.crear({
      profesorId: profesor.id,
      grado: profesor.grado,
      grupo: profesor.grupo,
      ...valores,
      semanaInicio: semana.inicio,
      semanaFin: semana.fin
    });

    res.redirect(`/panel/${profesor.id}?mensaje=tarea-creada`);
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      titulo: 'Error de tarea',
      mensaje: 'No fue posible publicar la tarea.',
      volverA: '/',
      volverTexto: 'Volver al login'
    });
  }
}

async function actualizarEstado(req, res) {
  const estudianteId = Number(req.body.estudianteId);
  const tareaId = Number(req.params.tareaId);
  const estado = normalizarTexto(req.body.estado).toLowerCase();
  const estadosValidos = ['pendiente', 'en proceso', 'terminado'];

  try {
    const estudiante = await Usuario.buscarPorId(estudianteId);
    const tarea = await Tarea.buscarPorId(tareaId);

    if (!estudiante || estudiante.rol !== 'estudiante' || !tarea) {
      res.status(404).render('error', {
        titulo: 'Recurso no encontrado',
        mensaje: 'No fue posible actualizar el estado de la tarea.',
        volverA: '/',
        volverTexto: 'Volver al login'
      });
      return;
    }

    if (estudiante.grado !== tarea.grado || estudiante.grupo !== tarea.grupo) {
      res.status(403).render('error', {
        titulo: 'Acceso denegado',
        mensaje: 'Solo los estudiantes del grado y grupo asignado pueden actualizar esta tarea.',
        volverA: `/panel/${estudiante.id}`,
        volverTexto: 'Volver al panel'
      });
      return;
    }

    if (!estadosValidos.includes(estado)) {
      res.status(400).render('error', {
        titulo: 'Estado invalido',
        mensaje: 'El estado seleccionado no es valido.',
        volverA: `/panel/${estudiante.id}`,
        volverTexto: 'Volver al panel'
      });
      return;
    }

    await Tarea.guardarEstado({
      tareaId,
      estudianteId: estudiante.id,
      estado
    });

    res.redirect(`/panel/${estudiante.id}?mensaje=estado-actualizado`);
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      titulo: 'Error de estado',
      mensaje: 'No fue posible actualizar el estado de la tarea.',
      volverA: '/',
      volverTexto: 'Volver al login'
    });
  }
}

module.exports = {
  crear,
  actualizarEstado
};
