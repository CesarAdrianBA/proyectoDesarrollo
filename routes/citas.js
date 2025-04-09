const express = require('express');
const cors = require('cors');
const db = require('../config/mysqlConfig');
const mysqlConfig = require('../config/mysqlConfig');
const mysql = require('mysql2/promise'); 


const router = express.Router();

router.use(express.json());
router.use(cors());



router.post('/appointments', async (req, res) => {
    const { pet_name, owner_name, service_type, appointment_date, appointment_time } = req.body;

    const allowedHours = [
        '09:00:00', '10:00:00', '11:00:00', '12:00:00',
        '13:00:00', '14:00:00', '15:00:00', '16:00:00',
        '17:00:00', '18:00:00'
      ];
      
      if (!allowedHours.includes(appointment_time)) {
        return res.status(400).send('Hora de cita no permitida');
      }
  
    try {
      const mysqlConn = await mysql.createConnection(mysqlConfig);
  
      const [existing] = await mysqlConn.execute(
        `SELECT * FROM appointments WHERE appointment_date = ? AND appointment_time = ?`,
        [appointment_date, appointment_time]
      );
  
      if (existing.length > 0) {
        await mysqlConn.end();
        return res.status(409).send('Ya hay una cita registrada en ese horario');
      }
  
      const [result] = await mysqlConn.execute(
        `INSERT INTO appointments (pet_name, owner_name, service_type, appointment_date, appointment_time) VALUES (?, ?, ?, ?, ?)`,
        [pet_name, owner_name, service_type, appointment_date, appointment_time]
      );
  
      await mysqlConn.end();
      res.send('Cita registrada correctamente');
  
    } catch (err) {
      console.error(err);
      res.status(500).send('Error al registrar la cita');
    }
  });

  router.get('/available-hours/:date', async (req, res) => {
    const appointment_date = req.params.date;
  
    // Rango de horas posibles (hora exacta, formato HH:MM:SS)
    const allHours = [
      '09:00:00', '10:00:00', '11:00:00', '12:00:00',
      '13:00:00', '14:00:00', '15:00:00', '16:00:00',
      '17:00:00', '18:00:00'
    ];
  
    try {
      const mysqlConn = await mysql.createConnection(mysqlConfig);
  
      const [results] = await mysqlConn.execute(
        `SELECT appointment_time FROM appointments WHERE appointment_date = ?`,
        [appointment_date]
      );
  
      const takenHours = results.map(row => row.appointment_time.slice(0, 8)); // HH:MM:SS
  
      const availableHours = allHours.filter(hour => !takenHours.includes(hour));
  
      await mysqlConn.end();
      res.json({ availableHours });
    } catch (err) {
      console.error(err);
      res.status(500).send('Error al consultar disponibilidad');
    }
  });
  

  module.exports = router;