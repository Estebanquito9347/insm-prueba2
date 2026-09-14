const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const db = require('./config/db');
require('dotenv').config();

const app = express();
const projectRoot = path.join(__dirname, '..');
const uploadsDir = path.join(projectRoot, 'uploads');
const port = Number(process.env.PORT || 3000);

fs.mkdirSync(uploadsDir, { recursive: true });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(projectRoot));

const storage = multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadsDir),
    filename: (_req, file, callback) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        callback(null, `boletin-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

function requiresOrientation(nivelId, anioId) {
    return String(nivelId) === '3' && ['4', '5'].includes(String(anioId));
}

app.get('/api/inscripciones', async (_req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM inscripciones ORDER BY id DESC');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener inscripciones:', error);
        res.status(500).json({ error: 'Error al obtener registros.' });
    }
});

app.post('/api/inscripciones', upload.single('boletin'), async (req, res) => {
    const {
        nombre, apellido, dni, fecha_nacimiento, nivel_id, anio_id,
        orientacion_id, tutor_nombre, tutor_apellido, tutor_dni,
        tutor_telefono, tutor_email, ciclo_lectivo
    } = req.body;

    if (!req.file) {
        return res.status(400).json({ error: 'Debe adjuntar el boletín o comprobante de regularidad.' });
    }

    if (requiresOrientation(nivel_id, anio_id) && !orientacion_id) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
            error: 'Para el año seleccionado es obligatorio elegir una orientación.'
        });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO inscripciones
             (nombre, apellido, dni, fecha_nacimiento, nivel_id, anio_id, orientacion_id,
              tutor_nombre, tutor_apellido, tutor_dni, tutor_telefono, tutor_email,
              boletin_path, ciclo_lectivo)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nombre, apellido, dni, fecha_nacimiento, nivel_id, anio_id,
                requiresOrientation(nivel_id, anio_id) ? orientacion_id : null,
                tutor_nombre, tutor_apellido, tutor_dni, tutor_telefono,
                tutor_email || null, req.file.filename, ciclo_lectivo || '2027'
            ]
        );

        res.status(201).json({
            ok: true,
            mensaje: 'Inscripción registrada correctamente.',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error al insertar inscripción:', error);
        fs.unlink(req.file.path, () => {});
        res.status(500).json({ error: 'Error al registrar la inscripción en la base de datos.' });
    }
});

app.put('/api/inscripciones/:id', async (req, res) => {
    const { nombre, apellido, dni, tutor_nombre, tutor_apellido, tutor_telefono, tutor_email } = req.body;

    try {
        const [result] = await db.query(
            `UPDATE inscripciones
             SET nombre = ?, apellido = ?, dni = ?, tutor_nombre = ?,
                 tutor_apellido = ?, tutor_telefono = ?, tutor_email = ?
             WHERE id = ?`,
            [nombre, apellido, dni, tutor_nombre, tutor_apellido, tutor_telefono, tutor_email || null, req.params.id]
        );

        if (!result.affectedRows) return res.status(404).json({ error: 'Registro no encontrado.' });
        res.json({ ok: true, mensaje: 'Inscripción actualizada correctamente.' });
    } catch (error) {
        console.error('Error al actualizar inscripción:', error);
        res.status(500).json({ error: 'Error al actualizar la inscripción.' });
    }
});

app.post('/api/login', (req, res) => {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) return res.status(503).json({ error: 'ADMIN_PASSWORD no está configurada.' });
    if (req.body.password !== adminPassword) return res.status(401).json({ error: 'Contraseña incorrecta.' });
    res.json({ ok: true, mensaje: 'Autenticado correctamente.' });
});

async function startServer() {
    try {
        await db.query('SELECT 1');
        console.log('Conectado exitosamente a MariaDB (inscripciones_db)');
    } catch (error) {
        console.error('Error conectando a MariaDB:', error.message);
        console.error('Revisá DB_HOST, DB_USER, DB_PASSWORD y DB_NAME en Docker.');
    }

    app.listen(port, () => console.log(`Servidor corriendo en el puerto ${port}`));
}

startServer();
