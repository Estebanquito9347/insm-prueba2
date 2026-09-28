const { tokenValido, leerCookie, COOKIE_NAME } = require('./_auth');

module.exports = (req, res) => {
  if (tokenValido(leerCookie(req, COOKIE_NAME))) return res.status(200).json({ ok: true });
  return res.status(401).json({ ok: false });
};