document.addEventListener('DOMContentLoaded', () => {
    const formInscripcion = document.getElementById('formInscripcion');
    const selectNivel = document.getElementById('nivel_id');
    const selectAnio = document.getElementById('anio_id');
    const selectOrientacion = document.getElementById('orientacion_id');
    const contenedorOrientacion = document.getElementById('contenedorOrientacion');

    // 1. Mostrar/Ocultar el campo de Orientación dinámicamente
    // Se activa únicamente para 4°, 5° y 6° año (IDs de años que requieren especialidad)
    selectAnio.addEventListener('change', () => {
        const anioSeleccionado = selectAnio.value;

        // Suponiendo que anio_id 4, 5 y 6 corresponden a 4to, 5to y 6to de Secundario
        const aniosConOrientacion = ['4', '5', '6'];

        if (aniosConOrientacion.includes(anioSeleccionado)) {
            contenedorOrientacion.style.display = 'block';
            selectOrientacion.setAttribute('required', 'true');
        } else {
            contenedorOrientacion.style.display = 'none';
            selectOrientacion.removeAttribute('required');
            selectOrientacion.value = ''; // Limpiar selección previa
        }
    });

    // 2. Manejar el envío del formulario mediante Fetch
    formInscripcion.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Creamos un objeto FormData para poder incluir texto y archivos (el boletín/PDF)
        const formData = new FormData(formInscripcion);

        // Agregamos el ciclo lectivo por defecto si no está en el formulario
        if (!formData.has('ciclo_lectivo')) {
            formData.append('ciclo_lectivo', '2027');
        }

        try {
            // Mostrar estado de carga en el botón
            const btnSubmit = formInscripcion.querySelector('button[type="submit"]');
            const textoOriginal = btnSubmit.textContent;
            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Enviando...';

            const response = await fetch('/api/inscripciones', {
                method: 'POST',
                body: formData // No incluir Header 'Content-Type', browser lo setea automáticamente para multipart/form-data
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Ocurrió un error al procesar el registro.');
            }

            // Éxito en la inscripción
            alert(`¡Inscripción recibida!\n\n${data.mensaje}\n${data.instrucciones}`);
            formInscripcion.reset();
            contenedorOrientacion.style.display = 'none';

        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            // Restaurar botón
            const btnSubmit = formInscripcion.querySelector('button[type="submit"]');
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.textContent = 'Enviar Inscripción';
            }
        }
    });
});