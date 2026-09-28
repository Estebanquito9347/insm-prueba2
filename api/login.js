const crypto = require('crypto');
const { crearToken, cookieSesion, DURACION_SEG } = require('./_auth');

function iguales(a, b) {
  // Se comparan hashes para que la longitud no filtre información.
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const esperada = process.env.ADMIN_PASSWORD;
  if (!esperada) return res.status(500).json({ error: 'Servidor sin contraseña configurada' });

  const { password } = req.body || {};
  if (!password || !iguales(password, esperada)) {
    await new Promise(r => setTimeout(r, 800)); // frena fuerza bruta
    return res.status(401).json({ error: 'Contraseña incorrecta.' });
  }

  res.setHeader('Set-Cookie', cookieSesion(crearToken(), DURACION_SEG));
  return res.status(200).json({ ok: true });
};