const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.get('/login', authController.loginView);
router.post('/login', authController.loginPost);
router.get('/register', authController.registerView);
router.post('/register', authController.registerPost);
router.get('/logout', authController.logout);

module.exports = router;
