const pool = require('../db');

// GET /api/profile
const getProfile = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, gender, created_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    return res.json({ data: result.rows[0] }); // password tidak ikut dikirim
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile };