require('dotenv').config(); // Cargamos las variables de entorno desde el archivo .env
const express = require('express');
const cors = require('cors');

require('./config/db'); // Inicializa la base de datos
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes'); // Importamos las nuevas rutas

const app = express();
app.use(cors());
app.use(express.json());

// Conectamos las rutas
app.use('/', authRoutes); // Rutas públicas (/login, /registro)
app.use('/api', userRoutes); // Rutas protegidas (/api/empleados)

app.listen(3000, () => {
  console.log('Servidor Express corriendo en el puerto http://localhost:3000');
});