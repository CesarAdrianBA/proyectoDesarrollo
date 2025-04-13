const express = require('express');
const router = express.Router();
const mysqlConfig = require('../config/mysqlConfig');
const mysql = require('mysql2/promise'); 

const session = require('express-session');
const bcrypt = require('bcrypt');
// const authRoutes = require('./auth');



// router.get('/', (req, res) => {
//   res.render('inicio', {
//     title: 'Inicio',
//     usuario: req.session.usuario || null
//   });
// });

router.get('/login', (req, res) => {
  res.render('loginRegister', {
    title: 'Login',
    mensaje: null
  });
});

// Procesar login
router.post('/login', async (req, res) => {
  const { correo, password } = req.body;
  try {
    const connection = await mysql.createConnection(mysqlConfig);
    const [rows] = await connection.execute('SELECT * FROM usuarios WHERE correo = ?', [correo]);
    await connection.end();

    if (rows.length === 0) {
      return res.render('loginRegistr', { title: 'Login', mensaje: 'Correo no registrado' });
    }

    const usuario = rows[0];
    const coincide = await bcrypt.compare(password, usuario.password);

    if (coincide) {
      req.session.usuario = usuario;
      res.redirect('/productos');
    } else {
      res.render('loginRegistr', { title: 'Login', mensaje: 'password incorrecta' });
    }
  } catch (error) {
    console.error('Error en login:', error);
    res.send('Error del servidor');
  }
});

// Vista registro
router.get('/register', (req, res) => {
  res.render('register', {
    title: 'Registro',
    mensaje: null
  });
});

// Procesar registro
router.post('/register', async (req, res) => {
  const { nombre, correo, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const connection = await mysql.createConnection(mysqlConfig);

    // Validar si ya existe el correo
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
});

// Cerrar sesión
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.log(err);
    res.redirect('/login');
  });
});



router.get('/productos', async (req, res) => {
    try {
        const connection = await mysql.createConnection(mysqlConfig);
        const [products] = await connection.execute('SELECT id, name, price, image_url FROM products');
        await connection.end();

        res.render('productos', {
            title: 'Productos',
            products
        });
    } catch (err) {
        console.error('Error al obtener productos:', err);
        res.status(500).send('Error al obtener productos');
    }
});

router.get('/citas', (req,res) => {
    res.render('citas', {
        title: 'citas',
    });
})

router.get('/ticket-cita', (req, res) => {
  const appointment = req.session.lastAppointment;

  if (!appointment) {
    return res.redirect('/citas'); // si no hay info, redirige
  }

  res.render('ticketCita', {
    title: 'Ticket de Cita',
    appointment
  });
});

router.get('/consultor', (req,res) => {
    res.render('consultorDB', {
        title: 'consultor',
    });
});


router.post('/agregar-carrito', (req, res) => {
    const { id, name, price } = req.body;
  
    // Inicializa el carrito si no existe
    if (!req.session.cart) {
      req.session.cart = [];
    }
  
    // Verifica si el producto ya está en el carrito
    const index = req.session.cart.findIndex(p => p.id == id);
  
    if (index !== -1) {
      // Si ya existe, incrementa la cantidad
      req.session.cart[index].qty += 1;
    } else {
      // Si no existe, agrega nuevo producto
      req.session.cart.push({ id, name, price, qty: 1 });
    }
  
    res.redirect('/carrito');
});

// Mostrar carrito
router.get('/carrito', (req, res) => {
  const cart = req.session.cart || []; // asegúrate de que la variable esté definida
  res.render('carrito', {
    title: 'Carrito',
    cart: cart
  });
});

// Eliminar producto del carrito
router.post('/eliminar-producto', (req, res) => {
  const { id } = req.body;
  req.session.cart = req.session.cart.filter(p => p.id != id);
  res.redirect('/carrito');
});

// Vaciar carrito
router.post('/vaciar-carrito', (req, res) => {
  req.session.cart = [];
  res.redirect('/carrito');
});

router.post('/actualizar-cantidad', (req, res) => {
  const { id, qty } = req.body;
  if (!req.session.cart) return res.redirect('/carrito');

  const product = req.session.cart.find(p => p.id == id);
  if (product) {
    product.qty = parseInt(qty);
    if (product.qty < 1) {
      // opcional: eliminar si la cantidad es menor a 1
      req.session.cart = req.session.cart.filter(p => p.id != id);
    }
  }
  res.redirect('/carrito');
});

router.post('/finalizar-compra', (req, res) => {
  const cart = req.session.cart || [];

  if (cart.length === 0) {
    return res.redirect('/carrito');
  }

  const ticketId = 'TCKT-' + Date.now(); // Generar ID único simple
  const fecha = new Date().toLocaleString('es-MX'); // Fecha legible
  let total = 0;

  cart.forEach(item => {
    total += item.price * item.qty;
  });

  const ticket = {
    id: ticketId,
    fecha,
    productos: cart,
    total
  };

  // Limpia el carrito
  req.session.cart = [];

  // Muestra el ticket al usuario
  res.render('ticket', {
    title: 'Ticket de Compra',
    ticket
  });
});





module.exports = router;