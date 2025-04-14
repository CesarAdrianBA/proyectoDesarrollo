const mysql = require('mysql2/promise');
const mysqlConfig = require('../config/mysqlConfig');

const mostrarProductos = async (req, res) => {
  try {
    const connection = await mysql.createConnection(mysqlConfig);
    const [products] = await connection.execute('SELECT id, name, price, image_url FROM products');
    await connection.end();

    res.render('productos', {
      title: 'Productos',
      products
    });
  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.status(500).send('Error al obtener productos');
  }
};

module.exports = {
  mostrarProductos
};
