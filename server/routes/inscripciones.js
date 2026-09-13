const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { crearInscripcion } = require('../controllers/inscripciones');

// Configuración de guardado de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `boletin-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

// POST /api/inscripciones
router.post('/', upload.single('boletin'), crearInscripcion);

module.exports = router;