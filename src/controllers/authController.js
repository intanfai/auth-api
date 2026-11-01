const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

// POST /api/auth/register
// req.body sudah divalidasi dan dirapikan oleh middleware validate
const register = async (req, res, next) => {
  try {
    const { name, email, gender, password } = req.body;

    // Cek email sudah dipakai atau belum
    const existing = await userModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email sudah terdaftar' });
    }

    // Hash password (JANGAN simpan password asli)
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({ name, email, gender, hashedPassword });

    return res.status(201).json({ message: 'Registrasi berhasil', data: user });
  } catch (err) {
    // 23505 = kode PostgreSQL untuk pelanggaran UNIQUE (email sudah ada).
    // Menangani kasus dua request dengan email sama yang masuk bersamaan
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Email sudah terdaftar' });
    }
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findByEmail(email);

    // Pesan sengaja sama untuk email salah / password salah,
    // supaya penyerang tidak bisa tahu email mana yang terdaftar
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    // Payload berisi id user, ditandatangani dengan JWT_SECRET
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    });

    return res.json({ message: 'Login berhasil', token });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };