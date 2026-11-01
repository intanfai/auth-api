// Menangkap semua error tak terduga, supaya server tidak crash
const errorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Terjadi kesalahan pada server' });
};

module.exports = errorHandler;