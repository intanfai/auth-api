const pool = require('../db');

// Semua query SQL untuk tabel users ada di file ini.

// Cari user berdasarkan email (termasuk password hash, dipakai untuk login)
const findByEmail = async (email) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0]; // undefined kalau tidak ada
};

// Cari user berdasarkan id (tanpa password, aman dikirim ke client)
const findById = async (id) => {
  const result = await pool.query(
    'SELECT id, name, email, gender, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
};

// Simpan user baru, kembalikan datanya tanpa password
const create = async ({ name, email, gender, hashedPassword }) => {
  const result = await pool.query(
    `INSERT INTO users (name, email, gender, password)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, gender, created_at`,
    [name, email, gender, hashedPassword]
  );
  return result.rows[0];
};

module.exports = { findByEmail, findById, create };