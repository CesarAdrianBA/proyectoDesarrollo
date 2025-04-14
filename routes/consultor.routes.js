const express = require('express');
const router = express.Router();
const consultorController = require('../controllers/consultor.controller');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/consultor', authMiddleware, consultorController.mostrarVistaConsultor);

module.exports = router;
