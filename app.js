const express = require('express');
const bodyParser = require("body-parser");
const session = require('express-session');
const router = require('./routes/rutas')
const app = express();
const port = 4000;
const dbMySQL = require('./config/dbMySQL');
const dbQuery = require('./config/DBQuery'); // Conexion DBS
const { connectSQL } = require('./config/dbSQL'); // Conexion SQL

const citas = require('./routes/citas');

app.use(bodyParser.json());

dbMySQL.authenticate()
    .then(() => {console.log('Conexión Exitosa MySQL')})
    .catch((err) => {console.log('Error de Conexión a MySQL:', err)});

connectSQL()
    .catch(err => console.error('No se pudo conectar a SQL Server', err));


app.use(express.static('public'));

app.set('view engine', 'ejs');

app.use(session({
    secret: 'secret', 
    resave: false,
    saveUninitialized: true
  }));

  app.use((req, res, next) => {
    res.locals.usuario = req.session.usuario || null;
    next();
  });


app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use('/database', dbQuery);

app.use('/citas', citas);

app.use('/', router);

app.listen(port, ()=> {
    console.log(`Server is running on port ${port}`);
});

