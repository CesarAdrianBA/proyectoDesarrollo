const express = require('express');
const router = express.Router();
const mysqlConfig = require('../config/mysqlConfig');
const mysql = require('mysql2/promise'); 



router.get('/', (req,res) => {
    res.render('inicio', {
        title: 'Inicio',
    });
});

router.get('/registro', (req,res) => {
    res.render('registro', {
        title: 'registro',
    });
});

router.get('/login', (req,res) => {
    res.render('loginRegistr', {
        title: 'login',
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