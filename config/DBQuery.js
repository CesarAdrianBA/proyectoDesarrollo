const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const mysqlConfig = require('./mysqlConfig');
const mysql = require('mysql2/promise'); // conexión manual
const { connectSQL, sql } = require('./dbSQL'); // SQL Server
require('dotenv').config();

const router = express.Router();

router.use(express.json());
router.use(cors());

// Ruta para obtener los nombres de las tablas
router.post('/schema', async (req, res) => {
    const { database } = req.body;

    try {
        let tables = [];

        switch (database) {
            case 'mysql':
                const mysqlConn = await mysql.createConnection(mysqlConfig);
                const [rows] = await mysqlConn.query("SHOW TABLES");
                await mysqlConn.end();
                tables = rows.map(row => Object.values(row)[0]);
                console.log(tables)
                break;
            case 'sqlserver':
                const pool = await connectSQL();
                const result = await pool.request().query(`
                    SELECT TABLE_NAME 
                    FROM INFORMATION_SCHEMA.TABLES 
                    WHERE TABLE_TYPE = 'BASE TABLE'
                `);
                tables = result.recordset.map(row => row.TABLE_NAME);
                break;

            case 'mongodb':
                const client = new MongoClient(mongoURI);
                await client.connect();
                const db = client.db();
                const collections = await db.listCollections().toArray();
                tables = collections.map(c => c.name);
                await client.close();
                break;

            default:
                return res.status(400).json({ error: 'Base de datos no soportada' });
        }

        res.json({ success: true, schema: tables });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//Ruta para obtener las columnas de las tablas
router.post('/columns', async (req, res) => {
    const { database, tableOrCollection } = req.body;

    try {
        let columns = [];

        switch (database) {
            case 'mysql':
                const mysqlConn = await mysql.createConnection(mysqlConfig);
                const [rows] = await mysqlConn.query(`SHOW COLUMNS FROM ${tableOrCollection}`);
                await mysqlConn.end();
                // Extraemos los nombres de las columnas
                columns = rows.map(row => row.Field);
                console.log(columns);
                break;

            case 'sqlserver':
                const pool = await connectSQL();
                const result = await pool.request().query(`
                    SELECT COLUMN_NAME
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = '${tableOrCollection}'
                `);
                columns = result.recordset.map(row => row.COLUMN_NAME);
                break;

            case 'mongodb':
                const client = new MongoClient(mongoURI);
                await client.connect();
                const db = client.db();
                const collection = db.collection(tableOrCollection);
                const document = await collection.findOne();
                columns = document ? Object.keys(document) : []; // Obtenemos las keys del primer documento
                await client.close();
                break;

            default:
                return res.status(400).json({ error: 'Base de datos no soportada' });
        }

        res.json({ success: true, columns });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


const mongoURI = process.env.MONGO_URI;

router.post('/query', async (req, res) => {
    const { database, collection, columns, filter, operation } = req.body;
    let query;
    try {
        let results;
        switch (database) {
            case 'mysql':
               
                if (columns) {
                    query = `SELECT ${columns} FROM ${collection}`;
                } else {
                    query = `SELECT * FROM ${collection}`;
                }

                if (filter) {
                    query += ` WHERE ${filter}`;
                }
                console.log(query);
                const mysqlConn = await mysql.createConnection(mysqlConfig);
                const [rows] = await mysqlConn.query(query); 
                await mysqlConn.end();

                results = rows; 
                break;

            case 'sqlserver':
                const pool = await connectSQL();

                if (columns) {
                    query = `SELECT ${columns} FROM ${collection}`;
                } else {
                    query = `SELECT * FROM ${collection}`;
                }

                if (filter) {
                    query += ` WHERE ${filter}`;
                }
                console.log(query);

                const sqlResult = await pool.request().query(query);
                
                
                results = sqlResult.recordset;
                break;
                case 'mongodb':
                    const client = new MongoClient(mongoURI);
                    await client.connect();
                
                    const db = client.db(); // Usará la base por defecto de la URI
                    const collectionRef = db.collection(collection);
                
                    // Convertimos el filtro a objeto
                    let parsedFilter = {};
                    try {
                        if (filter) {
                            parsedFilter = JSON.parse(filter);
                        }
                    } catch (err) {
                        console.error("Error al parsear el filtro:", err);
                        return res.status(400).json({ error: 'Filtro inválido (debe ser JSON válido)' });
                    }
                
                    // Proyección de campos (qué columnas mostrar)
                    let projection = {};
                    if (columns && Array.isArray(columns)) {
                        columns.forEach(col => {
                            projection[col] = 1;
                        });
                    }
                
                    // Ejecutamos la consulta
                    const cursor = collectionRef.find(parsedFilter, columns.length > 0 ? { projection } : {});
                    results = await cursor.toArray();
                
                    await client.close();
                    break;
                
            default:
                return res.status(400).json({ error: 'Base de datos no soportada' });
        }
        console.log(results)
        res.json({ success: true, results: results || [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



module.exports = router;
