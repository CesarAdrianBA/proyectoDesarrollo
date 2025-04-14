const express = require('express');
const bodyParser = require("body-parser");
const session = require('express-session');
const router = require('./routes/index'); 
const app = express();
const port = 4000;

const dbMySQL = require('./config/dbMySQL'); //Conexión MySQL
const dbQuery = require('./config/DBQuery'); // Conexion DBS
const { connectSQL } = require('./config/dbSQL'); // Conexion SQL

// Middlewares
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

app.set('view engine', 'ejs');

// Session
app.use(session({
  secret: 'secret', 
  resave: false,
  saveUninitialized: true
}));

app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  next();
});

// Conexiones
dbMySQL.authenticate()
  .then(() => console.log('Conexión Exitosa MySQL'))
  .catch((err) => console.log('Error de Conexión a MySQL:', err));

connectSQL()
  .catch(err => console.error('No se pudo conectar a SQL Server', err));

// Rutas externas
app.use('/database', dbQuery);

// Rutas internas centralizadas
app.use('/', router);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
