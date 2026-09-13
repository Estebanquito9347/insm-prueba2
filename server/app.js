const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const inscripcionesRoutes = require('./routes/inscripciones');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Hacer accesible la carpeta de archivos subidos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas API
app.use('/api/inscripciones', inscripcionesRoutes);

// Servidor escuchando
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});