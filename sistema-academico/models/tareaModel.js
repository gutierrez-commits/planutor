const { all, get, run } = require('../config/db');

function obtenerRangoSemanaActual() {
  const hoy = new Date();
  const dia = hoy.getDay();
  const diferenciaAlLunes = dia === 0 ? -6 : 1 - dia;
  const inicio = new Date(hoy);
  inicio.setHours(0, 0, 0, 0);
  inicio.setDate(hoy.getDate() + diferenciaAlLunes);

  const fin = new Date(inicio);
  fin.setDate(inicio.getDate() + 6);

  return {
    inicio: inicio.toISOString().slice(0, 10),
    fin: fin.toISOString().slice(0, 10)
  };
}

const Tarea = {
  obtenerRangoSemanaActual,

  crear(datos) {
    const query = `
      INSERT INTO tareas (
        profesor_id,
        grado,
        grupo,
        materia,
        titulo,
        descripcion,
        fecha_entrega,
        semana_inicio,
        semana_fin
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return run(query, [
      datos.profesorId,
      datos.grado,
      datos.grupo,
      datos.materia,
      datos.titulo,
      datos.descripcion,
      datos.fechaEntrega,
      datos.semanaInicio,
      datos.semanaFin
    ]);
  },

  obtenerPorProfesorSemana(profesorId, semanaInicio, semanaFin) {
    const query = `
      SELECT
        t.id,
        t.grado,
        t.grupo,
        t.materia,
        t.titulo,
        t.descripcion,
        t.fecha_entrega,
        t.semana_inicio,
        t.semana_fin,
        t.creado_en,
        SUM(CASE WHEN te.estado = 'pendiente' THEN 1 ELSE 0 END) AS pendientes,
        SUM(CASE WHEN te.estado = 'en proceso' THEN 1 ELSE 0 END) AS en_proceso,
        SUM(CASE WHEN te.estado = 'terminado' THEN 1 ELSE 0 END) AS terminados
      FROM tareas t
      LEFT JOIN tarea_estados te ON te.tarea_id = t.id
      WHERE t.profesor_id = ?
        AND t.semana_inicio = ?
        AND t.semana_fin = ?
      GROUP BY t.id
      ORDER BY date(t.fecha_entrega) ASC, t.id DESC
    `;

    return all(query, [profesorId, semanaInicio, semanaFin]);
  },

  obtenerMuroSemana({ estudianteId, grado, grupo, semanaInicio, semanaFin }) {
    const query = `
      SELECT
        t.id,
        t.grado,
        t.grupo,
        t.materia,
        t.titulo,
        t.descripcion,
        t.fecha_entrega,
        t.semana_inicio,
        t.semana_fin,
        t.creado_en,
        u.nombre AS profesor_nombre,
        COALESCE(te.estado, 'pendiente') AS estado
      FROM tareas t
      INNER JOIN usuarios u ON u.id = t.profesor_id
      LEFT JOIN tarea_estados te
        ON te.tarea_id = t.id
       AND te.estudiante_id = ?
      WHERE t.semana_inicio = ?
        AND t.semana_fin = ?
        AND t.grado = ?
        AND t.grupo = ?
      ORDER BY date(t.fecha_entrega) ASC, t.id DESC
    `;

    return all(query, [estudianteId, semanaInicio, semanaFin, grado, grupo]);
  },

  buscarPorId(id) {
    const query = `
      SELECT id, profesor_id, grado, grupo, materia, titulo, descripcion, fecha_entrega, semana_inicio, semana_fin, creado_en
      FROM tareas
      WHERE id = ?
    `;

    return get(query, [id]);
  },

  async guardarEstado({ tareaId, estudianteId, estado }) {
    const existente = await get(
      'SELECT id FROM tarea_estados WHERE tarea_id = ? AND estudiante_id = ?',
      [tareaId, estudianteId]
    );

    if (existente) {
      return run(
        `
          UPDATE tarea_estados
          SET estado = ?, actualizado_en = CURRENT_TIMESTAMP
          WHERE tarea_id = ? AND estudiante_id = ?
        `,
        [estado, tareaId, estudianteId]
      );
    }

    return run(
      `
        INSERT INTO tarea_estados (tarea_id, estudiante_id, estado)
        VALUES (?, ?, ?)
      `,
      [tareaId, estudianteId, estado]
    );
  }
};

module.exports = Tarea;
