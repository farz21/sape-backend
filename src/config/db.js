const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'sape_db'
});

connection.connect((error) => {
  if (error) {
    console.error('Error al conectar con la base de datos:', error.message);
    return;
  }
  console.log('Conexión exitosa a la base de datos (sape_db).');
});

// Exportamos la conexión encadenada con .promise() para usar await en los controladores
module.exports = connection.promise();