const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const VALID_GENDERS = ['male', 'female'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, gender, password } = req.body;

    // 1. Validasi input
    if (!name || !email || !gender || !password) {
      return res.status(400).json({ message: 'name, email, gender, dan password wajib diisi' });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Format email tidak valid' });
    }
    if (!VALID_GENDERS.includes(gender)) {
      return res.status(400).json({ message: "gender harus 'male' atau 'female'" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter' });
    }

    // 2. Cek email sudah dipakai atau belum
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ message: 'Email sudah terdaftar' });
    }

    // 3. Hash password (JANGAN simpan password asli)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Simpan ke database
    const result = await pool.query(
      `INSERT INTO users (name, email, gender, password)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, gender, created_at`,
      [name, email, gender, hashedPassword]
    );

    return res.status(201).json({
      message: 'Registrasi berhasil',
      data: result.rows[0],
    });
  } catch (err) {
    next(err); // lempar ke error handler
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email dan password wajib diisi' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    // Pesan sengaja sama untuk email salah / password salah (keamanan)
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    // Buat token: payload berisi id user, ditandatangani JWT_SECRET
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    });

    return res.json({ message: 'Login berhasil', token });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };