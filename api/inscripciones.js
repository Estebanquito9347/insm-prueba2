// /api/inscripciones.js
// Función serverless de Vercel. Recibe el formulario de Inscripcion2027.html
// en formato JSON (incluye el boletín adjunto en base64) y envía un mail
// usando una cuenta de Gmail vía Nodemailer.

const nodemailer = require('nodemailer');

// Campos que son obligatorios en el formulario (deben coincidir con el HTML)
const CAMPOS_OBLIGATORIOS = [
	'Alumno - Nombre y Apellido',
	'Alumno - DNI',
	'Alumno - Fecha de Nacimiento',
	'Nivel al que aspira',
	'Responsable 1 - Nombre y Apellido',
	'Responsable 1 - DNI',
	'Responsable 1 - Teléfono',
	'Responsable 1 - Correo Electrónico',
];

// Orden en el que se muestran todos los campos dentro del mail
const ORDEN_CAMPOS = [
	'Alumno - Nombre y Apellido',
	'Alumno - DNI',
	'Alumno - Fecha de Nacimiento',
	'Nivel al que aspira',
	'Año',
	'Orientación',
	'Alumno - Correo Institucional',
	'Responsable 1 - Nombre y Apellido',
	'Responsable 1 - DNI',
	'Responsable 1 - Teléfono',
	'Responsable 1 - Correo Electrónico',
	'Responsable 2 - Nombre y Apellido',
	'Responsable 2 - DNI',
	'Responsable 2 - Teléfono',
	'Responsable 2 - Correo Electrónico',
	'Observaciones',
];

function escapeHtml(valor) {
	return String(valor)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

module.exports = async function handler(req, res) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(405).json({ ok: false, error: 'Método no permitido' });
	}

	try {
		const body = req.body || {};

		// Validación básica de campos obligatorios
		for (const campo of CAMPOS_OBLIGATORIOS) {
			if (!body[campo] || String(body[campo]).trim() === '') {
				return res.status(400).json({ ok: false, error: `Falta el campo obligatorio: ${campo}` });
			}
		}

		if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
			console.error('Faltan variables de entorno GMAIL_USER / GMAIL_APP_PASSWORD');
			return res.status(500).json({ ok: false, error: 'El servidor no tiene configurado el envío de mails.' });
		}

		const transporter = nodemailer.createTransport({
			service: 'gmail',
			auth: {
				user: process.env.GMAIL_USER,
				pass: process.env.GMAIL_APP_PASSWORD, // Contraseña de aplicación de 16 dígitos, NO la contraseña normal
			},
		});

		// Armamos las filas de la tabla del mail con los campos que vinieron completos
		const filasHtml = ORDEN_CAMPOS.filter((campo) => body[campo] && String(body[campo]).trim() !== '')
			.map(
				(campo) => `
				<tr>
					<td style="padding:8px 12px;font-weight:bold;border-bottom:1px solid #eee;white-space:nowrap;">${escapeHtml(campo)}</td>
					<td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(body[campo])}</td>
				</tr>`
			)
			.join('');

		const htmlBody = `
			<div style="font-family:Arial,Helvetica,sans-serif;color:#333;">
				<h2 style="color:#cf0621;margin-bottom:4px;">Nueva inscripción 2027</h2>
				<p style="color:#888;margin-top:0;">Instituto Nuestra Señora de la Merced</p>
				<table style="border-collapse:collapse;width:100%;max-width:640px;">
					${filasHtml}
				</table>
			</div>
		`;

		// Adjuntamos el boletín si vino en el payload
		const attachments = [];
		if (body.boletinBase64) {
			attachments.push({
				filename: body.boletinNombre || 'boletin-adjunto',
				content: Buffer.from(body.boletinBase64, 'base64'),
				contentType: body.boletinTipo || undefined,
			});
		}

		// Si el alumno es de un año con correo institucional (4to, 5to, 6to), también le va una copia
		const mailAlumno = body['Alumno - Correo Institucional'] && String(body['Alumno - Correo Institucional']).trim() !== ''
			? body['Alumno - Correo Institucional'].trim()
			: undefined;

		await transporter.sendMail({
			from: `"Inscripciones INSM" <${process.env.GMAIL_USER}>`,
			to: process.env.MAIL_TO || process.env.GMAIL_USER,
			cc: mailAlumno,
			replyTo: body['Responsable 1 - Correo Electrónico'] || undefined,
			subject: `Nueva inscripción 2027 - ${body['Alumno - Nombre y Apellido']}`,
			html: htmlBody,
			attachments,
		});

		return res.status(200).json({ ok: true });
	} catch (error) {
		console.error('Error al enviar la inscripción:', error);
		return res.status(500).json({ ok: false, error: 'No se pudo enviar el correo. Intentá nuevamente más tarde.' });
	}
};