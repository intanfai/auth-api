const express = require('express');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(express.json()); // supaya req.body bisa dibaca

app.get('/', (req, res) => res.json({ message: 'Auth API is running' }));
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

app.use((req, res) => res.status(404).json({ message: 'Endpoint tidak ditemukan' }));
app.use(errorHandler); // harus paling akhir

module.exports = app;