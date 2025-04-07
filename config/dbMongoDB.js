// mongo.js
const { MongoClient } = require('mongodb');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI;
const client = new MongoClient(mongoURI);

async function connectMongo() {
    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB');
        return client;
    } catch (err) {
        console.error('❌ Error al conectar a MongoDB:', err);
        return null;
    }
}

module.exports = { connectMongo, client };
