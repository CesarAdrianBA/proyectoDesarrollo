const express = require('express');
const router = express.Router();
const db = require('../config/dbMySQL');

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
    res.render('login', {
        title: 'login',
    });
});

router.get('/productos', (req,res) => {
    res.render('productos', {
        title: 'productos',
    });
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

router.get('/carrito', (req,res) => {
    res.render('carrito', {
        title: 'carrito',
    });
});


router.post('/appointments', (req, res) => {

//   const checkQuery = "SELECT * FROM appointments WHERE appointment_date = ? AND appointment_time = ?";


//   db.query(checkQuery, [appointment_date, appointment_time], (err, results) => {
//     if (err) return res.status(500).send('Error en el servidor');

//     if (results.length > 0) {
//       return res.send('Ya hay una cita registrada en ese horario');
//     }

//     const insertQuery = `
//       INSERT INTO appointments (pet_name, owner_name, service_type, appointment_date, appointment_time)
//       VALUES (?, ?, ?, ?, ?)
//     `;

//     db.query(insertQuery, [pet_name, owner_name, service_type, appointment_date, appointment_time], (err2) => {
//       if (err2) return res.status(500).send('Error al registrar la cita');
//       res.send('Cita registrada correctamente');
//     });
//   });
});


module.exports = router;