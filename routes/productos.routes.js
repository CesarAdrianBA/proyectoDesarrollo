const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productos.controller');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/productos', authMiddleware, productoController.mostrarProductos);

module.exports = router;
