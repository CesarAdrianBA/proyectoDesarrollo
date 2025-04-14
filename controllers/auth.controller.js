const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const mysqlConfig = require('../config/mysqlConfig');

const loginView = (req, res) => {
  res.render('loginRegister', { title: 'Login', mensaje: null });
};

const loginPost = async (req, res) => {
  const { correo, password } = req.body;
  try {
    const connection = await mysql.createConnection(mysqlConfig);
    const [rows] = await connection.execute('SELECT * FROM usuarios WHERE correo = ?', [correo]);
    await connection.end();

    if (rows.length === 0) {
      return res.render('loginRegister', { title: 'Login', mensaje: 'Correo no registrado' });
    }

    const usuario = rows[0];
    const coincide = await bcrypt.compare(password, usuario.password);

    if (coincide) {
      req.session.usuario = usuario;
      res.redirect('/productos');
    } else {
      res.render('loginRegister', { title: 'Login', mensaje: 'Password incorrecta' });
    }
  } catch (error) {
    console.error('Error en login:', error);
    res.send('Error del servidor');
  }
};

const registerView = (req, res) => {
  res.render('register', { title: 'Registro', mensaje: null });
};

const registerPost = async (req, res) => {
  const { nombre, correo, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const connection = await mysql.createConnection(mysqlConfig);
    const [existente] = await connection.execute('SELECT * FROM usuarios WHERE correo = ?', [correo]);

    if (existente.length > 0) {
      await connection.end();
      return res.render('register', { title: 'Registro', mensaje: 'Correo ya registrado' });
    }

    await connection.execute(
      'INSERT INTO usuarios (nombre, correo, password) VALUES (?, ?, ?)',
      [nombre, correo, hash]
    );
    await connection.end();

    res.redirect('/login');
  } catch (error) {
    console.error('Error al registrar:', error);
    res.send('Error del servidor');
  }
};

const logout = (req, res) => {
  req.session.destroy(err => {
    if (err) console.log(err);
    res.redirect('/login');
  });
};

module.exports = {
  loginView,
  loginPost,
  registerView,
  registerPost,
  logout
};
