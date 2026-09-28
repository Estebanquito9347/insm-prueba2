// Utilidades de autenticación compartidas.
// El guion bajo inicial evita que Vercel lo exponga como ruta pública.
const crypto = require('crypto');

const COOKIE_NAME = 'insm_admin';
const DURACION_SEG = 60 * 60 * 8; // 8 horas

function secreto() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error('Falta SESSION_SECRET (mínimo 16 caracteres)');
  return s;
}

function firmar(texto) {
  return crypto.createHmac('sha256', secreto()).update(texto).digest('hex');
}

function crearToken() {
  const exp = Date.now() + DURACION_SEG * 1000;
  return `${exp}.${firmar(String(exp))}`;
}

function tokenValido(token) {
  if (!token) return false;
  const [exp, firma] = token.split('.');
  if (!exp || !firma || Number(exp) < Date.now()) return false;
  const esperada = firmar(exp);
  const a = Buffer.from(firma);
  const b = Buffer.from(esperada);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function leerCookie(req, nombre) {
  const header = req.headers.cookie || '';
  for (const parte of header.split(';')) {
    const [k, ...v] = parte.trim().split('=');
    if (k === nombre) return decodeURIComponent(v.join('='));
  }
  return null;
}

function cookieSesion(token, maxAge) {
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

// Usar en las demás rutas: if (!requireAuth(req, res)) return;
function requireAuth(req, res) {
  if (tokenValido(leerCookie(req, COOKIE_NAME))) return true;
  res.status(401).json({ error: 'No autorizado' });
  return false;
}

module.exports = { crearToken, tokenValido, leerCookie, cookieSesion, requireAuth, COOKIE_NAME, DURACION_SEG };