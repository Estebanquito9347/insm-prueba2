const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (para que cargue admin.html y los uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Conexión a MariaDB local
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'esteban',
    password: process.env.DB_PASSWORD || 'waza2026',
    database: process.env.DB_NAME || 'inscripciones_db'
});

db.connect((err) => {
    if (err) {
        console.error('Error conectando a MariaDB:', err);
    } else {
        console.log('Conectado exitosamente a MariaDB (inscripciones_db)');
    }
});

// Configuración de Multer para subir el boletín
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Ruta GET para obtener las inscripciones (movida antes del listen)
app.get('/api/inscripciones', (req, res) => {
    const query = `SELECT * FROM inscripciones ORDER BY id DESC`;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener inscripciones:', err);
            return res.status(500).json({ error: 'Error al obtener registros' });
        }
        res.json(results);
    });
});

// Ruta POST para procesar el formulario con 1 tutor
app.post('/api/inscripciones', upload.single('boletin'), (req, res) => {
    const {
        nombre,
        apellido,
        dni,
        fecha_nacimiento,
        nivel_id,
        anio_id,
        orientacion_id,
        tutor_nombre,
        tutor_apellido,
        tutor_dni,
        tutor_telefono,
        tutor_email, // Añadido para que coincida con el formulario
        ciclo_lectivo
    } = req.body;

    // Se añadió tutor_email a las columnas y valores para que coincidan (14 columnas / 14 valores)
    const query = `
        INSERT INTO inscripciones 
        (nombre, apellido, dni, fecha_nacimiento, nivel_id, anio_id, orientacion_id, 
         tutor_nombre, tutor_apellido, tutor_dni, tutor_telefono, tutor_email, boletin_path, ciclo_lectivo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        nombre,
        apellido,   
        dni,
        fecha_nacimiento,
        nivel_id,
        anio_id,
        orientacion_id || null,
        tutor_nombre,
        tutor_apellido,
        tutor_dni,
        tutor_telefono,
        tutor_email || null,
        req.file ? req.file.filename : null,
        ciclo_lectivo || '2027'
    ];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error al insertar en MySQL:', err);
            return res.status(500).json({ error: 'Error al registrar en la base de datos.' });
        }
        res.json({ mensaje: 'Inscripción registrada correctamente', id: result.insertId });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});