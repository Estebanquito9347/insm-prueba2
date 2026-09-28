const { cookieSesion } = require('./_auth');

module.exports = (req, res) => {
  res.setHeader('Set-Cookie', cookieSesion('', 0));
  return res.status(200).json({ ok: true });
};