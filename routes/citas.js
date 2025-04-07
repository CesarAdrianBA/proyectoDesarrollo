const db = require('./mysqlConfig');

app.post('/appointments', (req, res) => {
  const { pet_name, owner_name, service_type, appointment_date, appointment_time } = req.body;

  const checkQuery = `
    SELECT * FROM appointments 
    WHERE appointment_date = ? AND appointment_time = ?
  `;

  db.query(checkQuery, [appointment_date, appointment_time], (err, results) => {
    if (err) return res.status(500).send('Error en el servidor');

    if (results.length > 0) {
      return res.send('Ya hay una cita registrada en ese horario');
    }

    const insertQuery = `
      INSERT INTO appointments (pet_name, owner_name, service_type, appointment_date, appointment_time)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(insertQuery, [pet_name, owner_name, service_type, appointment_date, appointment_time], (err2) => {
      if (err2) return res.status(500).send('Error al registrar la cita');
      res.send('Cita registrada correctamente');
    });
  });
});
