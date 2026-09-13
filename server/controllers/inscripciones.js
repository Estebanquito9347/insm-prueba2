const db = require('../config/db');

const crearInscripcion = async (req, res) => {
    // Transacción para asegurar que se guarde el estudiante y la inscripción
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const {
            dni,
            nombre,
            apellido,
            fecha_nacimiento,
            email,
            telefono,
            ciclo_lectivo,
            nivel_id,
            anio_id,
            orientacion_id
        } = req.body;

        // Comprobación de archivo adjunto (Boletín/Comprobante)
        const documento_boleta_url = req.file ? `/uploads/${req.file.filename}` : null;

        // 1. VALIDACIÓN DE NEGOCIO:
        // Consultar en la BD si el año seleccionado exige orientación
        const [anioRows] = await connection.query(
            'SELECT requiere_orientacion FROM anios_cursado WHERE anio_id = ?',
            [anio_id]
        );

        if (anioRows.length === 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'El año seleccionado no existe.' });
        }

        const requiereOrientacion = anioRows[0].requiere_orientacion;

        // Si exige orientación (ej: 4to año) y no mandaron orientacion_id, rechazamos
        if (requiereOrientacion && (!orientacion_id || orientacion_id === '')) {
            await connection.rollback();
            return res.status(400).json({ 
                error: 'Para el año seleccionado es obligatorio elegir una orientación (ej. Informática o Humanidades).' 
            });
        }

        // 2. REGISTRO O ACTUALIZACIÓN DEL ESTUDIANTE
        let estudiante_id;
        const [estudianteExistente] = await connection.query(
            'SELECT estudiante_id FROM estudiantes WHERE dni = ?',
            [dni]
        );

        if (estudianteExistente.length > 0) {
            estudiante_id = estudianteExistente[0].estudiante_id;
        } else {
            const [nuevoEstudiante] = await connection.query(
                `INSERT INTO estudiantes (dni, nombre, apellido, fecha_nacimiento, email, telefono) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [dni, nombre, apellido, fecha_nacimiento, email, telefono]
            );
            estudiante_id = nuevoEstudiante.insertId;
        }

        // 3. REGISTRO DE LA INSCRIPCIÓN (Estado por defecto: PENDIENTE)
        const valorOrientacion = requiereOrientacion ? orientacion_id : null;

        await connection.query(
            `INSERT INTO inscripciones 
             (estudiante_id, ciclo_lectivo, nivel_id, anio_id, orientacion_id, estado, documento_boleta_url) 
             VALUES (?, ?, ?, ?, ?, 'PENDIENTE', ?)`,
            [
                estudiante_id,
                ciclo_lectivo || 2027,
                nivel_id,
                anio_id,
                valorOrientacion,
                documento_boleta_url
            ]
        );

        await connection.commit();

        return res.status(201).json({
            ok: true,
            mensaje: 'Preinscripción registrada con éxito. Estado: PENDIENTE DE VERIFICACIÓN.',
            instrucciones: 'Acérquese a la secretaría del instituto para validar la documentación original.'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error al guardar inscripción:', error);
        return res.status(500).json({ 
            error: 'Ocurrió un error interno al procesar la solicitud.' 
        });
    } finally {
        connection.release();
    }
};

module.exports = {
    crearInscripcion
};