const Usuario = require('../models/usuarioModel');

async function listar(req, res) {
  try {
    const usuarios = await Usuario.obtenerTodos();

    res.render('usuarios', {
      usuarios,
      currentUser: null,
      mensaje: '',
      error: ''
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      titulo: 'Error de datos',
      mensaje: 'No fue posible consultar los usuarios registrados.',
      volverA: '/',
      volverTexto: 'Volver al login'
    });
  }
}

module.exports = {
  listar
};
