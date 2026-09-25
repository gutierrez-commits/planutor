const { all, get, run, db } = require('../config/db');

// Crear la tabla del planeador si todavía no existe
db.run(`
  CREATE TABLE IF NOT EXISTS anotaciones_planeador (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    fecha TEXT NOT NULL,
    categoria TEXT,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
  )
`);

const Planeador = {

  // Obtener las anotaciones de un estudiante
  obtenerPorUsuario(usuarioId) {
    const query = `
      SELECT *
      FROM anotaciones_planeador
      WHERE usuario_id = ?
      ORDER BY date(fecha) DESC, datetime(creado_en) DESC
    `;

    return all(query, [usuarioId]);
  },

  // Buscar una anotación específica de un estudiante
  obtenerPorId(id, usuarioId) {
    const query = `
      SELECT *
      FROM anotaciones_planeador
      WHERE id = ? AND usuario_id = ?
    `;

    return get(query, [id, usuarioId]);
  },

  // Crear una anotación
  crear(datos) {
    const query = `
      INSERT INTO anotaciones_planeador
      (usuario_id, titulo, descripcion, fecha, categoria, estado)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    return run(query, [
      datos.usuarioId,
      datos.titulo,
      datos.descripcion || '',
      datos.fecha,
      datos.categoria || 'General',
      datos.estado || 'pendiente'
    ]);
  },

  // Editar una anotación
  editar(id, usuarioId, datos) {
    const query = `
      UPDATE anotaciones_planeador
      SET titulo = ?,
          descripcion = ?,
          fecha = ?,
          categoria = ?,
          estado = ?
      WHERE id = ? AND usuario_id = ?
    `;

    return run(query, [
      datos.titulo,
      datos.descripcion || '',
      datos.fecha,
      datos.categoria || 'General',
      datos.estado || 'pendiente',
      id,
      usuarioId
    ]);
  },

  // Eliminar definitivamente
  eliminar(id, usuarioId) {
    const query = `
      DELETE FROM anotaciones_planeador
      WHERE id = ? AND usuario_id = ?
    `;

    return run(query, [id, usuarioId]);
  },

  // Archivar una anotación
  archivar(id, usuarioId) {
    const query = `
      UPDATE anotaciones_planeador
      SET estado = 'archivada'
      WHERE id = ? AND usuario_id = ?
    `;

    return run(query, [id, usuarioId]);
  },

  // Desarchivar una anotación
  desarchivar(id, usuarioId) {
    const query = `
      UPDATE anotaciones_planeador
      SET estado = 'pendiente'
      WHERE id = ? AND usuario_id = ?
    `;

    return run(query, [id, usuarioId]);
  }
};

module.exports = Planeador;