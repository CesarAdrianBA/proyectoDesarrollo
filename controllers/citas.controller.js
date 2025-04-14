const mostrarFormularioCita = (req, res) => {
    res.render('citas', {
      title: 'Citas'
    });
  };
  
const mostrarTicketCita = (req, res) => {
  const appointment = req.session.lastAppointment;

  if (!appointment) {
    return res.redirect('/citas'); // Si no hay cita, redirige
  }

  res.render('ticketCita', {
    title: 'Ticket de Cita',
    appointment
  });
};

  // controllers/citas.controller.js
const mysql = require('mysql2/promise');
const mysqlConfig = require('../config/mysqlConfig');

const registrarCita = async (req, res) => {
  const { pet_name, owner_name, service_type, appointment_date, appointment_time } = req.body;

  if (!pet_name || !owner_name || !service_type || !appointment_date || !appointment_time) {
    return res.status(400).send('Faltan campos obligatorios');
  }

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
      `SELECT * FROM citas WHERE fecha_cita = ? AND hora_cita = ?`,
      [appointment_date, appointment_time]
    );

    if (existing.length > 0) {
      await mysqlConn.end();
      return res.status(409).send('Ya hay una cita registrada en ese horario');
    }

    const [result] = await mysqlConn.execute(
      `INSERT INTO citas (nombre_mascota, nombre_dueño, servicio, fecha_cita, hora_cita) VALUES (?, ?, ?, ?, ?)`,
      [pet_name, owner_name, service_type, appointment_date, appointment_time]
    );

    req.session.lastAppointment = {
      pet_name,
      owner_name,
      service_type,
      appointment_date,
      appointment_time
    };

    await mysqlConn.end();
    res.redirect('/ticket-cita');

  } catch (err) {
    console.error(err);
    res.status(500).send('Error al registrar la cita');
  }
};

const consultarHorasDisponibles = async (req, res) => {
  const appointment_date = req.params.date;

  const allHours = [
    '09:00:00', '10:00:00', '11:00:00', '12:00:00',
    '13:00:00', '14:00:00', '15:00:00', '16:00:00',
    '17:00:00', '18:00:00'
  ];

  try {
    const mysqlConn = await mysql.createConnection(mysqlConfig);

    const [results] = await mysqlConn.execute(
      `SELECT hora_cita FROM citas WHERE fecha_cita = ?`,
      [appointment_date]
    );

    const takenHours = results.map(row => row.hora_cita.slice(0, 8));

    const availableHours = allHours.filter(hour => !takenHours.includes(hour));

    await mysqlConn.end();
    res.json({ availableHours });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al consultar disponibilidad');
  }
};
  
module.exports = {
  mostrarFormularioCita,
  mostrarTicketCita,
  registrarCita,
  consultarHorasDisponibles
};
  