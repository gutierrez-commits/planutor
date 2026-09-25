const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const ADMIN_SEMILLA = {
  nombre: 'Administrador PLANUTOR',
  correo: 'admin@planutor.edu',
  passwordHash: 'planutoradminseed:dc99ddbdede275526067f8473dd26e7165c862fbc8f104dc23374de4cf63af6ad6f1607f8c3efb274d4ca0dc8b869f5f44ff7a827f83bba59fca0333d885ea10'
};

const PROFESOR_SEMILLA = {
  nombre: 'Profesor Demo',
  correo: 'profesor@planutor.edu',
  passwordHash: 'planutorprofesorseed:3d6b6c4e27a8b893cea701a137016b8beb9338fc0798aa0c44dd0c63f8f3136d236f022d8e3e08427e1cd361f174bc61210be5b04f41a7cae85b030892802f4a',
  grado: '5',
  grupo: 'General'
};

const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'planutor.sqlite');

fs.mkdirSync(dataDir, { recursive: true });

const db = new sqlite3.Database(dbPath, (error) => {
  if (error) {
    console.error('Error al abrir SQLite:', error.message);
    return;
  }

  console.log(`SQLite listo en ${dbPath}`);
});

function createUsuariosTable(nombreTabla = 'usuarios') {
  return `
    CREATE TABLE IF NOT EXISTS ${nombreTabla} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      correo TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      rol TEXT NOT NULL CHECK (rol IN ('estudiante', 'profesor', 'administrador')),
      nivel TEXT,
      grado TEXT,
      grupo TEXT,
      creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

function createTareasTable(nombreTabla = 'tareas') {
  return `
    CREATE TABLE IF NOT EXISTS ${nombreTabla} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profesor_id INTEGER NOT NULL,
      grado TEXT NOT NULL,
      grupo TEXT NOT NULL,
      materia TEXT NOT NULL,
      titulo TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      fecha_entrega TEXT NOT NULL,
      semana_inicio TEXT NOT NULL,
      semana_fin TEXT NOT NULL,
      creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (profesor_id) REFERENCES usuarios(id)
    )
  `;
}

function seedData() {
  db.run(
    `
      UPDATE usuarios
      SET rol = 'administrador'
      WHERE correo = ?
    `,
    [ADMIN_SEMILLA.correo]
  );

  db.run(
    `
      INSERT OR IGNORE INTO usuarios (
        nombre,
        correo,
        password_hash,
        rol
      )
      VALUES (?, ?, ?, 'administrador')
    `,
    [
      ADMIN_SEMILLA.nombre,
      ADMIN_SEMILLA.correo,
      ADMIN_SEMILLA.passwordHash
    ]
  );

  db.run(
    `
      INSERT OR IGNORE INTO usuarios (
        nombre,
        correo,
        password_hash,
        rol,
        grado,
        grupo
      )
      VALUES (?, ?, ?, 'profesor', ?, ?)
    `,
    [
      PROFESOR_SEMILLA.nombre,
      PROFESOR_SEMILLA.correo,
      PROFESOR_SEMILLA.passwordHash,
      PROFESOR_SEMILLA.grado,
      PROFESOR_SEMILLA.grupo
    ]
  );

  db.run(
    `
      UPDATE usuarios
      SET grado = ?, grupo = ?
      WHERE correo = ?
    `,
    [PROFESOR_SEMILLA.grado, PROFESOR_SEMILLA.grupo, PROFESOR_SEMILLA.correo]
  );

  db.run(
    `
      UPDATE tareas
      SET
        grado = COALESCE(grado, (
          SELECT u.grado
          FROM usuarios u
          WHERE u.id = tareas.profesor_id
        )),
        grupo = COALESCE(grupo, (
          SELECT u.grupo
          FROM usuarios u
          WHERE u.id = tareas.profesor_id
        ))
      WHERE grado IS NULL OR grupo IS NULL
    `
  );
}

function migrarUsuariosSiHaceFalta() {
  db.get(
    `SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'usuarios'`,
    (error, row) => {
      if (error) {
        console.error('Error al inspeccionar tabla usuarios:', error.message);
        return;
      }

      const definicionUsuarios = row?.sql || '';
      const requiereMigracionUsuarios = !definicionUsuarios.includes("'administrador'");

      if (!requiereMigracionUsuarios) {
        db.run(`ALTER TABLE usuarios ADD COLUMN nivel TEXT`, () => {});
        db.run(`ALTER TABLE usuarios ADD COLUMN grado TEXT`, () => {});
        db.run(`ALTER TABLE usuarios ADD COLUMN grupo TEXT`, () => {});
        migrarTareasSiHaceFalta();
        return;
      }

      db.run('PRAGMA foreign_keys = OFF');
      db.run(createUsuariosTable('usuarios_migracion'));
      db.run(
        `
          INSERT INTO usuarios_migracion (id, nombre, correo, password_hash, rol, nivel, grado, grupo, creado_en)
          SELECT id, nombre, correo, password_hash, rol, nivel, grado, grupo, creado_en
          FROM usuarios
        `
      );
      db.run('DROP TABLE usuarios');
      db.run('ALTER TABLE usuarios_migracion RENAME TO usuarios');
      db.run('PRAGMA foreign_keys = ON');
      migrarTareasSiHaceFalta();
    }
  );
}

function migrarTareasSiHaceFalta() {
  db.get(
    `SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'tareas'`,
    (error, row) => {
      if (error) {
        console.error('Error al inspeccionar tabla tareas:', error.message);
        return;
      }

      const definicionTareas = row?.sql || '';
      const requiereMigracionTareas = !definicionTareas.includes('grado TEXT') || !definicionTareas.includes('grupo TEXT');

      if (!requiereMigracionTareas) {
        seedData();
        return;
      }

      db.run('PRAGMA foreign_keys = OFF');
      db.run(createTareasTable('tareas_migracion'));
      db.run(
        `
          INSERT INTO tareas_migracion (
            id,
            profesor_id,
            grado,
            grupo,
            materia,
            titulo,
            descripcion,
            fecha_entrega,
            semana_inicio,
            semana_fin,
            creado_en
          )
          SELECT
            t.id,
            t.profesor_id,
            COALESCE(u.grado, 'Sin grado'),
            COALESCE(u.grupo, 'Sin grupo'),
            t.materia,
            t.titulo,
            t.descripcion,
            t.fecha_entrega,
            t.semana_inicio,
            t.semana_fin,
            t.creado_en
          FROM tareas t
          LEFT JOIN usuarios u ON u.id = t.profesor_id
        `
      );
      db.run('DROP TABLE tareas');
      db.run('ALTER TABLE tareas_migracion RENAME TO tareas');
      db.run('PRAGMA foreign_keys = ON');
      seedData();
    }
  );
}

db.serialize(() => {
  db.run(createUsuariosTable());
  db.run(createTareasTable());

  db.run(`
    CREATE TABLE IF NOT EXISTS tarea_estados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tarea_id INTEGER NOT NULL,
      estudiante_id INTEGER NOT NULL,
      estado TEXT NOT NULL CHECK (estado IN ('pendiente', 'en proceso', 'terminado')),
      actualizado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (tarea_id, estudiante_id),
      FOREIGN KEY (tarea_id) REFERENCES tareas(id),
      FOREIGN KEY (estudiante_id) REFERENCES usuarios(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notas_calendario (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      fecha TEXT NOT NULL,
      titulo TEXT NOT NULL,
      origen TEXT NOT NULL DEFAULT 'personal',
      creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )
  `);

  migrarUsuariosSiHaceFalta();
});

function run(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }

      resolve({
        id: this.lastID,
        changes: this.changes
      });
    });
  });
}

function get(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row);
    });
  });
}

function all(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });
}

module.exports = {
  db,
  dbPath,
  run,
  get,
  all
};
