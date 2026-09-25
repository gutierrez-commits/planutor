const crypto = require('crypto');
const { all, get, run, db } = require('../config/db');

// Agrega la columna institucion si todavia no existe (no rompe datos existentes)
db.run(`ALTER TABLE usuarios ADD COLUMN institucion TEXT`, () => {});

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');

  return `${salt}:${hash}`;
}

function verifyPassword(password, passwordHash) {
  const [salt, storedHash] = String(passwordHash || '').split(':');

  if (!salt || !storedHash) {
    return false;
  }

  const derivedHash = crypto.scryptSync(password, salt, 64);
  const storedBuffer = Buffer.from(storedHash, 'hex');

  if (storedBuffer.length !== derivedHash.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedBuffer, derivedHash);
}

const Usuario = {
  obtenerTodos() {
    const query = `
      SELECT id, nombre, correo, rol, nivel, grado, grupo, institucion, creado_en
      FROM usuarios
      ORDER BY datetime(creado_en) DESC, id DESC
    `;

    return all(query);
  },

  buscarPorCorreo(correo) {
    const query = `
      SELECT id, nombre, correo, password_hash, rol, nivel, grado, grupo, institucion, creado_en
      FROM usuarios
      WHERE correo = ?
    `;

    return get(query, [correo]);
  },

  buscarPorId(id) {
    const query = `
      SELECT id, nombre, correo, password_hash, rol, nivel, grado, grupo, institucion, creado_en
      FROM usuarios
      WHERE id = ?
    `;

    return get(query, [id]);
  },

  crear(datos) {
    const query = `
      INSERT INTO usuarios (nombre, correo, password_hash, rol, nivel, grado, grupo, institucion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return run(query, [
      datos.nombre,
      datos.correo,
      datos.passwordHash,
      datos.rol,
      datos.nivel || null,
      datos.grado || null,
      datos.grupo || null,
      datos.institucion || null
    ]);
  },

  hashPassword,
  verifyPassword
};

module.exports = Usuario;