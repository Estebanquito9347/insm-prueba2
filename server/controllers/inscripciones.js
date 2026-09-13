const db = require('../config/db');

const crearInscripcion = async (req, res) => {
    let connection;

    try {
        connection = await db.getConnection();

        const {
            dni,
            nombre,
            apellido,
            fecha_nacimiento,
            ciclo_lectivo,
            nivel_id,
            anio_id,
            orientacion_id
        } = req.body;

        // Datos del Responsable 1 (nombres de campo con espacios -> notación de corchetes)
        const tutorNombre = req.body['Responsable 1 - Nombre'];
        const tutorApellido = req.body['Responsable 1 - Apellido'];
        const tutorDni = req.body['Responsable 1 - DNI'];
        const tutorTelefono = req.body['Responsable 1 - Teléfono'];
        const tutorEmail = req.body['Responsable 1 - Correo Electrónico'];

        // El boletín es obligatorio (columna boletin_path es NOT NULL)
        if (!req.file) {
            return res.status(400).json({ error: 'Debe adjuntar el boletín o comprobante de regularidad.' });
        }
        const boletinPath = `/uploads/${req.file.filename}`;

        // Regla de negocio: Secundario (nivel_id 3) en 4to o 5to año requiere orientación.
        // No hay tabla anios_cursado en este esquema, así que la regla queda fija acá,
        // igual que la lógica que ya tiene el formulario en el frontend.
        const requiereOrientacion = nivel_id === '3' && ['4', '5'].includes(anio_id);

        if (requiereOrientacion && (!orientacion_id || orientacion_id === '')) {
            return res.status(400).json({
                error: 'Para el año seleccionado es obligatorio elegir una orientación (ej. Informática o Humanidades).'
            });
        }

        const valorOrientacion = requiereOrientacion ? orientacion_id : null;

        await connection.query(
            `INSERT INTO inscripciones
             (nombre, apellido, dni, fecha_nacimiento, nivel_id, anio_id, orientacion_id,
              tutor_nombre, tutor_apellido, tutor_dni, tutor_telefono, tutor_email,
              boletin_path, ciclo_lectivo)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nombre,
                apellido,
                dni,
                fecha_nacimiento,
                nivel_id,
                anio_id,
                valorOrientacion,
                tutorNombre,
                tutorApellido,
                tutorDni,
                tutorTelefono,
                tutorEmail,
                boletinPath,
                ciclo_lectivo || '2027'
            ]
        );

        return res.status(201).json({
            ok: true,
            mensaje: 'Inscripción registrada con éxito.',
            instrucciones: 'Acérquese a la secretaría del instituto para validar la documentación original.'
        });

    } catch (error) {
        console.error('Error al guardar inscripción:', error);
        return res.status(500).json({
            error: 'Ocurrió un error interno al procesar la solicitud.'
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

module.exports = {
    crearInscripcion
};