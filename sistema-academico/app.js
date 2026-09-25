// Carga el .env SIEMPRE desde la carpeta de este archivo,
// sin importar desde donde se ejecute 'npm start'.

const path = require('path');

require('dotenv').config({
  path: path.join(__dirname, '.env')
});

const clave = (process.env.GEMINI_API_KEY || '').trim();

if (!clave) {
  console.warn('[IA] AVISO: no se encontro GEMINI_API_KEY en el .env');
} else {
  console.log('[IA] Clave de Gemini cargada desde .env.');
}

const express = require('express');

const { port } = require('./config/env');

require('./config/db');

const authRoutes = require('./routes/authRoutes');
const tareaRoutes = require('./routes/tareaRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const notaRoutes = require('./routes/notaRoutes');
const recordatorioRoutes = require('./routes/recordatorioRoutes');
const eventoRoutes = require('./routes/eventoRoutes');
const iaRoutes = require('./routes/iaRoutes');

// NUEVO: rutas del planeador
const planeadorRoutes = require('./routes/planeadorRoutes');


const app = express();

app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.use(express.static(path.join(__dirname, '..', 'public')));


// ===============================
// Rutas principales
// ===============================

app.use(authRoutes);

app.use(tareaRoutes);

app.use(usuarioRoutes);

app.use(notaRoutes);

app.use(recordatorioRoutes);

app.use(eventoRoutes);

app.use('/ia', iaRoutes);

// NUEVO: Planeador personal
app.use('/planeador', planeadorRoutes);


app.post('/prueba-ia', async (req, res) => {

  res.json({
    mensaje: 'La ruta funciona correctamente'
  });

});


// ===============================
// Ruta raíz: pantalla principal
// ===============================

app.get('/', (req, res) => {

  res.render('index');

});


app.get('/inicio-estudiante', (req, res) => {

  res.render('inicio-estudiante');

});


// ===============================
// Calendario
// ===============================

app.get('/calendario', (req, res) => {

  const personaje = req.query.personaje || 'estudiante';

  const currentUserId = req.query.usuarioId
    ? Number(req.query.usuarioId)
    : null;

  const eventos = personaje === 'profesor'
    ? [
        {
          fecha: '2026-09-05',
          titulo: 'Reunión con departamento'
        },
        {
          fecha: '2026-09-12',
          titulo: 'Entrega de calificaciones'
        }
      ]
    : [
        {
          fecha: '2026-09-07',
          titulo: 'Inicio de clases'
        },
        {
          fecha: '2026-09-20',
          titulo: 'Entrega de tarea 1'
        }
      ];

  res.render('calendario', {
    personaje,
    eventos,
    currentUserId
  });

});


// ===============================
// Presentación personal
// ===============================

app.get('/presentacion', (req, res) => {

  const personaje = req.query.personaje || 'estudiante';

  const perfil = personaje === 'profesor'
    ? {
        nombre: 'Profesor Juan Pérez',
        cargo: 'Profesor de Matemáticas',
        descripcion: 'Apasionado por la enseñanza y el análisis.'
      }
    : {
        nombre: 'Estudiante Ana Gómez',
        grado: 'Ingeniería',
        descripcion: 'Interesada en sistemas y algoritmos.'
      };

  res.render('presentacion', {
    personaje,
    perfil
  });

});


// ===============================
// Tareas
// ===============================

app.get('/tareas', (req, res) => {

  const personaje = req.query.personaje || 'estudiante';

  const tareas = personaje === 'profesor'
    ? [
        {
          id: 1,
          titulo: 'Publicar plan de clase',
          fecha: '2026-09-04',
          estado: 'pendiente'
        },
        {
          id: 2,
          titulo: 'Revisar evaluaciones',
          fecha: '2026-09-10',
          estado: 'en proceso'
        }
      ]
    : [
        {
          id: 3,
          titulo: 'Resolver tarea 1',
          fecha: '2026-09-20',
          estado: 'pendiente'
        },
        {
          id: 4,
          titulo: 'Estudiar para quiz',
          fecha: '2026-09-15',
          estado: 'en proceso'
        }
      ];

  res.render('tareas', {
    personaje,
    tareas
  });

});


// ===============================
// Manejo de rutas inexistentes
// ===============================

app.use((req, res) => {

  res.status(404).render('error', {
    titulo: 'Ruta no encontrada',
    mensaje: 'La pagina solicitada no existe.',
    volverA: '/',
    volverTexto: 'Volver al inicio'
  });

});


// ===============================
// Iniciar servidor
// ===============================

app.listen(port, () => {

  console.log(
    `Servidor ejecutandose en http://localhost:${port}`
  );

});