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
    res.render('loginRegistr', {
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


module.exports = router;