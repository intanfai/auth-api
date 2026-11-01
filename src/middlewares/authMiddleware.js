const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization; // "Bearer <token>"

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub; // diteruskan ke controller
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token tidak valid atau sudah kedaluwarsa' });
  }
};

module.exports = authenticate;