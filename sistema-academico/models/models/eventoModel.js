const { db, all, run } = require('../config/db');

db.run(`
  CREATE TABLE IF NOT EXISTS eventos_escolares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    fecha TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'festividad',
    creado_por INTEGER NOT NULL,
    creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id)
  )
`);

const EventoEscolar = {
  obtenerTodos() {
    const query = `
      SELECT
        e.id,
        e.titulo,
        e.descripcion,
        e.fecha,
        e.tipo,
        e.creado_por,
        u.nombre AS creado_por_nombre
      FROM eventos_escolares e
      INNER JOIN usuarios u ON u.id = e.creado_por
      ORDER BY date(e.fecha) ASC
    `;

    return all(query);
  },

  crear({ titulo, descripcion, fecha, tipo, creadoPor }) {
    return run(
      `INSERT INTO eventos_escolares (titulo, descripcion, fecha, tipo, creado_por)
       VALUES (?, ?, ?, ?, ?)`,
      [titulo, descripcion, fecha, tipo, creadoPor]
    );
  },

  eliminar(id) {
    return run(`DELETE FROM eventos_escolares WHERE id = ?`, [id]);
  }
};

module.exports = EventoEscolar;