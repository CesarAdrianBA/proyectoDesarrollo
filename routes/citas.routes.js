const express = require('express');
const router = express.Router();
const citaController = require('../controllers/citas.controller');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/citas',authMiddleware, citaController.mostrarFormularioCita);
router.get('/ticket-cita',authMiddleware, citaController.mostrarTicketCita);

router.post('/appointments',authMiddleware, citaController.registrarCita);

// Consultar horas disponibles
router.get('/available-hours/:date',authMiddleware, citaController.consultarHorasDisponibles);

module.exports = router;
