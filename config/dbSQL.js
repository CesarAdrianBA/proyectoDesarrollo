require('dotenv').config();
const sql = require('mssql');

// Configuración de SQL Server desde el .env
const sqlConfig = {
    user: process.env.SQLSERVER_USER,
    password: process.env.SQLSERVER_PASSWORD,
    database: process.env.SQLSERVER_DATABASE,
    server: process.env.SQLSERVER_HOST,
    options: {
        instanceName: process.env.SQLSERVER_INSTANCE,
        encrypt: false,
        trustServerCertificate: true
    }
};

// Función para conectar a SQL Server
async function connectSQL() {
    try {
        const pool = await sql.connect(sqlConfig);
        return pool;
    } catch (err) {
        console.error('Error al conectar SQL Server:', err);
        throw err;
    }
}

module.exports = { connectSQL, sql };