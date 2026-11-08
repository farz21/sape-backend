const express = require('express');
const cors = require('cors');

// Al requerir el archivo de db, el código interno se ejecuta y se conecta a MySQL
require('./config/db'); 

const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Conectamos las rutas de autenticación
// Usamos '/' para que las URLs sigan siendo http://localhost:3000/login
app.use('/', authRoutes); 

app.listen(3000, () => {
  console.log('Servidor Express corriendo en el puerto http://localhost:3000');
});