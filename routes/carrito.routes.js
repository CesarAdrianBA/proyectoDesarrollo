const express = require('express');
const router = express.Router();
const carritoController = require('../controllers/carrito.controller');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/carrito', authMiddleware, carritoController.mostrarCarrito);
router.post('/agregar-carrito', authMiddleware, carritoController.agregarCarrito);
router.post('/eliminar-producto', authMiddleware, carritoController.eliminarProducto);
router.post('/vaciar-carrito', authMiddleware, carritoController.vaciarCarrito);
router.post('/actualizar-cantidad', authMiddleware, carritoController.actualizarCantidad);
router.post('/finalizar-compra', authMiddleware, carritoController.finalizarCompra);

module.exports = router;
