// routes/index.js
const express = require('express');
const router = express.Router();

// Importar routers individuales
const authRoutes = require('./auth.routes');
const productoRoutes = require('./productos.routes');
const carritoRoutes = require('./carrito.routes');
const citaRoutes = require('./citas.routes');
const consultorRoutes = require('./consultor.routes');

// Usar los routers
router.use(authRoutes);
router.use(productoRoutes);
router.use(carritoRoutes);
router.use(citaRoutes);
router.use(consultorRoutes);

module.exports = router;
