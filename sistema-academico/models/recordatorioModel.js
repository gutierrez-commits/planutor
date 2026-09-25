const { all } = require('../config/db');

function obtenerRangoRecordatorio(dias = 3) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const limite = new Date(hoy);
  limite.setDate(hoy.getDate() + dias);

  return {
    desde: hoy.toISOString().slice(0, 10),
    hasta: limite.toISOString().slice(0, 10)
  };
}

const Recordatorio = {
  obtenerRangoRecordatorio,

  obtenerParaProfesor(profesorId, dias = 3) {
    const { desde, hasta } = obtenerRangoRecordatorio(dias);

    const query = `
      SELECT id, materia, titulo, fecha_entrega
      FROM tareas
      WHERE profesor_id = ?
        AND date(fecha_entrega) BETWEEN date(?) AND date(?)
      ORDER BY date(fecha_entrega) ASC
    `;

    return all(query, [profesorId, desde, hasta]);
  },

  obtenerParaEstudiante({ estudianteId, grado, grupo }, dias = 3) {
    const { desde, hasta } = obtenerRangoRecordatorio(dias);

    const query = `
      SELECT
        t.id,
        t.materia,
        t.titulo,
        t.fecha_entrega,
        COALESCE(te.estado, 'pendiente') AS estado
      FROM tareas t
      LEFT JOIN tarea_estados te
        ON te.tarea_id = t.id
       AND te.estudiante_id = ?
      WHERE t.grado = ?
        AND t.grupo = ?
        AND date(t.fecha_entrega) BETWEEN date(?) AND date(?)
        AND COALESCE(te.estado, 'pendiente') != 'terminado'
      ORDER BY date(t.fecha_entrega) ASC
    `;

    return all(query, [estudianteId, grado, grupo, desde, hasta]);
  }
};

module.exports = Recordatorio;