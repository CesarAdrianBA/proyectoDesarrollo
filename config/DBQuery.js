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
                columns = document ? Object.keys(document) : []; 
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
    let { database, collection, columns, filter } = req.body;
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
                    } catch (err) {2
                        console.error("Error al parsear el filtro:", err);
                        return res.status(400).json({ error: 'Filtro inválido (debe ser JSON válido)' });
                    }
                
                    // Proyección de campos (qué columnas mostrar)
                    let projection = {};
                    if (typeof columns === 'string') {
                        columns = columns.split(',').map(c => c.trim());
                    }
                    
                    // Si columns es un array de strings
                    if (columns && Array.isArray(columns)) {
                        columns.forEach(col => {
                            projection[col] = 1; 
                        });
                    }
                    // if para excluir _id en caso de que no se encuentre en el arreglo columns
                    if (columns && columns.indexOf('_id') === -1) {
                        projection["_id"] = 0;
                    }
                    const cursor = collectionRef.find(parsedFilter, columns.length > 0 ? { projection } : {});
                    results = await cursor.toArray();
                    
                    break;
                
            default:
                return res.status(400).json({ error: 'Base de datos no soportada' });
        }
        res.json({ success: true, results: results || [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/add', async (req, res) => {
    const { database, collection, data } = req.body;

    try {
        switch (database) {
            case 'mysql': {
                const conn = await mysql.createConnection(mysqlConfig);

                const columns = Object.keys(data).join(", ");
                const values = Object.values(data);
                const placeholders = values.map(() => "?").join(", ");

                const query = `INSERT INTO ${collection} (${columns}) VALUES (${placeholders})`;
                await conn.query(query, values);
                await conn.end();
                break;
            }

            case 'sqlserver': {
                const pool = await connectSQL();

                const columns = Object.keys(data);
                const values = columns.map(col => `'${data[col]}'`).join(", ");
                const query = `INSERT INTO ${collection} (${columns.join(", ")}) VALUES (${values})`;
                await pool.request().query(query);
                break;
            }

            case 'mongodb': {
                const client = new MongoClient(mongoURI);
                await client.connect();

                const db = client.db();
                const collectionRef = db.collection(collection);
                await collectionRef.insertOne(data);

                await client.close();
                break;
            }

            default:
                return res.status(400).json({ error: 'Base de datos no soportada' });
        }

        res.json({ success: true, message: 'Registro agregado correctamente' });
    } catch (error) {
        console.error("Error en /add:", error);
        res.status(500).json({ error: error.message });
    }
});


router.post('/update', async (req, res) => {
    const { selectedDatabase, selectedTable, filter, data } = req.body;

    const safeData = {};
    Object.entries(data).forEach(([key, value]) => {
    if (key !== 'id' && key !=='ID' &&key !== 'Id' && key!== 'iD' && key !== '_id') {
        safeData[key] = value;
    }
});


    try {
        switch (selectedDatabase) {
            case 'mysql':
                const mysqlConn = await mysql.createConnection(mysqlConfig);
                const updates = Object.entries(safeData)
                    .map(([key, value]) => `${key} = ${mysqlConn.escape(value)}`)
                    .join(', ');
                const query = `UPDATE ${selectedTable} SET ${updates} WHERE ${filter}`;
                await mysqlConn.query(query);
                await mysqlConn.end();
                break;

            case 'sqlserver':
                const pool = await connectSQL();
                const updatesSQL = Object.entries(safeData)
                    .map(([key, value]) => `${key} = '${value}'`)
                    .join(', ');
                const sqlQuery = `UPDATE ${selectedTable} SET ${updatesSQL} WHERE ${filter}`;
                await pool.request().query(sqlQuery);
                break;

            case 'mongodb':
                const client = new MongoClient(mongoURI);
                await client.connect();
                const db = client.db();
                const colRef = db.collection(selectedTable);
                const parsedFilter = JSON.parse(filter);
                if (parsedFilter._id) {
                    const { ObjectId } = require('mongodb');
                    parsedFilter._id = new ObjectId(parsedFilter._id);
                }
                await colRef.updateOne(parsedFilter, { $set: safeData });
                await client.close();
                break;

            default:
                return res.status(400).json({ error: "Base de datos no soportada." });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.post('/delete', async (req, res) => {
    const { selectedDatabase, selectedTable, filter } = req.body;
    try {
        let result;

        switch (selectedDatabase) {
            case 'mysql':
                if (!filter) return res.status(400).json({ error: 'Se requiere un filtro para eliminar' });

                const mysqlConn = await mysql.createConnection(mysqlConfig);
                const deleteQuery = `DELETE FROM ${selectedTable} WHERE ${filter}`;
                const [deleteResult] = await mysqlConn.query(deleteQuery);
                await mysqlConn.end();
                result = { affectedRows: deleteResult.affectedRows };
                break;

            case 'sqlserver':
                if (!filter) return res.status(400).json({ error: 'Se requiere un filtro para eliminar' });

                const pool = await connectSQL();
                const sqlDeleteQuery = `DELETE FROM ${selectedTable} WHERE ${filter}`;
                const sqlDeleteResult = await pool.request().query(sqlDeleteQuery);
                result = { rowsAffected: sqlDeleteResult.rowsAffected[0] };
                break;

            case 'mongodb':
                const client = new MongoClient(mongoURI);
                await client.connect();
                const db = client.db();
                const collectionRef = db.collection(selectedTable);

                let parsedFilter = {};
                try {
                    parsedFilter = JSON.parse(filter);
                    
                    // Conversión especial para _id si es string
                    if (parsedFilter._id && typeof parsedFilter._id === 'string') {
                        const { ObjectId } = require('mongodb');
                        parsedFilter._id = new ObjectId(parsedFilter._id);
                    }

                } catch (err) {
                    return res.status(400).json({ error: 'Filtro inválido (debe ser JSON válido)' });
                }

                const deleteMongoResult = await collectionRef.deleteMany(parsedFilter);
                await client.close();

                result = { deletedCount: deleteMongoResult.deletedCount };

                break;

            default:
                return res.status(400).json({ error: 'Base de datos no soportada' });
        }

        res.json({ success: true, result });
    } catch (error) {
        console.error('Error al eliminar:', error);
        res.status(500).json({ error: error.message });
    }
});



module.exports = router;
