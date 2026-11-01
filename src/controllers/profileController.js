const userModel = require('../models/userModel');

// GET /api/profile
// req.userId diisi oleh middleware authenticate (dari payload JWT)
const getProfile = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    return res.json({ data: user }); // password tidak ikut dikirim
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile };