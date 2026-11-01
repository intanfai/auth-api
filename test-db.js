require('dotenv').config();
const pool = require('./src/db');

pool.query('SELECT NOW()')
  .then((r) => { console.log('Koneksi OK:', r.rows[0]); return pool.end(); })
  .catch((e) => { console.error('Koneksi GAGAL:', e.message); pool.end(); });