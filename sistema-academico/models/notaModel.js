const { all, get, run } = require('../config/db');

const Nota = {
  obtenerPorUsuario(usuarioId) {
    const query = `
      SELECT id, fecha, titulo, origen, creado_en
      FROM notas_calendario
      WHERE usuario_id = ?
      ORDER BY fecha ASC, id ASC
    `;

    return all(query, [usuarioId]);
  },

  async existeEvento({ usuarioId, fecha, titulo }) {
    const fila = await get(
      `SELECT id FROM notas_calendario WHERE usuario_id = ? AND fecha = ? AND titulo = ?`,
      [usuarioId, fecha, titulo]
    );

    return Boolean(fila);
  },

  async crear({ usuarioId, fecha, titulo, origen = 'personal' }) {
    const resultado = await run(
      `INSERT INTO notas_calendario (usuario_id, fecha, titulo, origen) VALUES (?, ?, ?, ?)`,
      [usuarioId, fecha, titulo, origen]
    );

    return {
      id: resultado.id,
      usuario_id: usuarioId,
      fecha,
      titulo,
      origen
    };
  },

  eliminar(id, usuarioId) {
    return run(
      `DELETE FROM notas_calendario WHERE id = ? AND usuario_id = ?`,
      [id, usuarioId]
    );
  }
};

module.exports = Nota;
