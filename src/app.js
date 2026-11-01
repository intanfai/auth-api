const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Header keamanan HTTP dasar
app.use(helmet());

// Mengizinkan akses dari domain lain (browser). Untuk produksi,
// batasi ke domain frontend: cors({ origin: 'https://domain-frontend.com' })
app.use(cors());

// Supaya req.body (JSON) bisa dibaca
app.use(express.json());

// Batasi percobaan ke endpoint auth: maksimal 20 request per IP tiap 15 menit.
// Mencegah brute force pada login dan spam pembuatan akun.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
   skip: () => process.env.NODE_ENV === 'test',
  message: { message: 'Terlalu banyak percobaan, coba lagi nanti' },
});

app.get('/', (req, res) => res.json({ message: 'Auth API is running' }));
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/profile', profileRoutes);

app.use((req, res) => res.status(404).json({ message: 'Endpoint tidak ditemukan' }));
app.use(errorHandler); // harus paling akhir

module.exports = app;