// Controlador del Asistente IA (Google Gemini)
// Usa fetch nativo de Node 18+ contra la API REST de Gemini.
// No depende del SDK @google/generative-ai.

const MODELOS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-flash-latest'
];

const API_BASE =
  'https://generativelanguage.googleapis.com/v1beta/models';

// Instrucciones para que la IA responda como tutor escolar
const INSTRUCCIONES =
  'Eres el asistente academico de PLANUTOR, una plataforma escolar. ' +
  'Respondes a estudiantes de colegio en espanol, de forma clara, breve ' +
  'y con ejemplos sencillos. Si te preguntan algo que no es academico, ' +
  'responde igual pero de manera corta y apropiada para un colegio. ' +
  'No uses formato markdown con asteriscos, escribe texto plano.';

function revisarClave() {
  const clave = (process.env.GEMINI_API_KEY || '').trim();

  if (!clave) {
    return {
      ok: false,
      mensaje:
        'No se encontro GEMINI_API_KEY. Crea el archivo .env dentro de ' +
        'la carpeta sistema-academico con la linea GEMINI_API_KEY=tu_clave'
    };
  }

  // No comprobamos que empiece por "AIza".
  // Google puede proporcionar claves con otros formatos.
  return {
    ok: true,
    clave
  };
}

async function llamarGemini(clave, modelo, pregunta) {
  const url = `${API_BASE}/${modelo}:generateContent?key=${clave}`;

  const cuerpo = {
    systemInstruction: {
      parts: [{ text: INSTRUCCIONES }]
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: pregunta }]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 800
    }
  };

  // Corta la espera a 30 segundos para que la pagina no se quede colgada
  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), 30000);

  try {
    const respuesta = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cuerpo),
      signal: control.signal
    });

    const datos = await respuesta.json().catch(() => ({}));

    return {
      estado: respuesta.status,
      datos
    };
  } finally {
    clearTimeout(reloj);
  }
}

function extraerTexto(datos) {
  const candidato =
    datos && datos.candidates && datos.candidates[0];

  if (!candidato) {
    return '';
  }

  const partes =
    (candidato.content && candidato.content.parts) || [];

  return partes
    .map((p) => p.text || '')
    .join('')
    .trim();
}

async function responderPregunta(req, res) {
  try {
    const pregunta = (
      req.body && req.body.pregunta
        ? req.body.pregunta
        : ''
    ).trim();

    if (!pregunta) {
      return res.status(400).json({
        error: 'Escribe una pregunta'
      });
    }

    if (pregunta.length > 2000) {
      return res.status(400).json({
        error:
          'La pregunta es demasiado larga (maximo 2000 caracteres).'
      });
    }

    const revision = revisarClave();

    if (!revision.ok) {
      console.error(
        '[IA] Problema con la clave:',
        revision.mensaje
      );

      return res.status(500).json({
        error: revision.mensaje
      });
    }

    let ultimoError = 'Error desconocido de Gemini';

    for (const modelo of MODELOS) {
      let salida;

      try {
        salida = await llamarGemini(
          revision.clave,
          modelo,
          pregunta
        );
      } catch (e) {
        if (e.name === 'AbortError') {
          ultimoError =
            'La IA tardo demasiado en responder. Intenta de nuevo.';
        } else {
          ultimoError =
            'No hay conexion a internet o Google no responde. Revisa tu red.';
        }

        console.error(
          '[IA] Fallo de red con',
          modelo,
          '->',
          e.message
        );

        continue;
      }

      const { estado, datos } = salida;

      if (estado === 200) {
        const texto = extraerTexto(datos);

        if (texto) {
          return res.json({
            respuesta: texto,
            modelo
          });
        }

        const motivo =
          (datos.candidates &&
            datos.candidates[0] &&
            datos.candidates[0].finishReason) ||
          (datos.promptFeedback &&
            datos.promptFeedback.blockReason) ||
          '';

        ultimoError =
          motivo === 'SAFETY' ||
          motivo === 'PROHIBITED_CONTENT'
            ? 'La IA no puede responder esa pregunta. Intenta con otra.'
            : 'La IA devolvio una respuesta vacia. Intenta reformular la pregunta.';

        console.error(
          '[IA] Respuesta vacia de',
          modelo,
          JSON.stringify(datos)
        );

        continue;
      }

      const detalle =
        (datos.error && datos.error.message) ||
        `HTTP ${estado}`;

      console.error(
        '[IA]',
        modelo,
        'respondio',
        estado,
        '->',
        detalle
      );

      // 404 = ese modelo no existe para esta clave.
      // Probamos el siguiente.
      if (estado === 404) {
        ultimoError =
          'Ningun modelo de Gemini esta disponible para tu clave.';

        continue;
      }

      if (
        estado === 400 &&
        /API key not valid|API_KEY_INVALID/i.test(detalle)
      ) {
        return res.status(500).json({
          error:
            'La clave de Gemini no es valida. Verifica la clave en Google AI Studio y el archivo .env.'
        });
      }

      if (estado === 403) {
        return res.status(500).json({
          error:
            'Google rechazo la clave (403). Verifica que la API de Gemini este habilitada para tu proyecto.'
        });
      }

      if (estado === 429) {
        return res.status(429).json({
          error:
            'Se agoto la cuota gratuita de Gemini. Espera un momento e intenta de nuevo.'
        });
      }

      if (estado >= 500) {
        ultimoError =
          'El servidor de Google esta fallando. Intenta en unos minutos.';

        continue;
      }

      ultimoError = detalle;
      break;
    }

    return res.status(500).json({
      error: ultimoError
    });
  } catch (error) {
    console.error(
      '[IA] ERROR INESPERADO:',
      error
    );

    return res.status(500).json({
      error:
        'Error interno del servidor al consultar la IA.'
    });
  }
}

// Ruta de diagnostico: GET /ia/estado
async function estado(req, res) {
  const revision = revisarClave();

  if (!revision.ok) {
    return res.status(500).json({
      ok: false,
      mensaje: revision.mensaje
    });
  }

  try {
    const r = await fetch(
      `${API_BASE}?key=${revision.clave}`
    );

    const datos = await r.json().catch(() => ({}));

    if (r.status !== 200) {
      return res.status(500).json({
        ok: false,
        mensaje:
          (datos.error && datos.error.message) ||
          `HTTP ${r.status}`
      });
    }

    const disponibles = (datos.models || [])
      .map((m) =>
        String(m.name).replace('models/', '')
      )
      .filter((n) =>
        n.startsWith('gemini')
      );

    return res.json({
      ok: true,
      mensaje: 'La clave funciona correctamente.',
      modelosDisponibles: disponibles
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      mensaje:
        'No hay conexion a internet con Google: ' +
        e.message
    });
  }
}

module.exports = {
  responderPregunta,
  estado
};