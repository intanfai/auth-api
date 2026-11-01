// Tes integrasi API: HTTP -> route -> validator -> controller.
// Lapisan model di-mock, jadi tes ini TIDAK menyentuh database sungguhan.
process.env.JWT_SECRET = 'test-secret';

jest.mock('../src/models/userModel', () => ({
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
}));

const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../src/models/userModel');
const app = require('../src/app');

const validUser = {
  name: 'Budi',
  email: 'budi@mail.com',
  gender: 'male',
  password: 'rahasia123',
};

const savedUser = {
  id: 1,
  name: 'Budi',
  email: 'budi@mail.com',
  gender: 'male',
  created_at: '2026-11-01T00:00:00.000Z',
};

beforeEach(() => {
  jest.resetAllMocks(); // bersihkan pemanggilan dan isi mock dari tes sebelumnya
});

describe('POST /api/auth/register', () => {
  test('201: registrasi berhasil, password disimpan dalam bentuk hash', async () => {
    userModel.findByEmail.mockResolvedValue(undefined);
    userModel.create.mockResolvedValue(savedUser);

    const res = await request(app).post('/api/auth/register').send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.data).toEqual(savedUser);
    expect(res.body.data).not.toHaveProperty('password');

    const saved = userModel.create.mock.calls[0][0];
    expect(saved.hashedPassword).not.toBe(validUser.password);
    expect(saved.hashedPassword).toMatch(/^\$2[aby]\$/); // format hash bcrypt
  });

  test('400: name tidak diisi', async () => {
    const { name, ...tanpaName } = validUser;
    const res = await request(app).post('/api/auth/register').send(tanpaName);

    expect(res.status).toBe(400);
    expect(res.body.errors[0]).toContain('name');
    expect(userModel.create).not.toHaveBeenCalled();
  });

  test('400: gender tidak valid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, gender: 'lainnya' });

    expect(res.status).toBe(400);
    expect(res.body.errors[0]).toContain('gender');
  });

  test('400: password kurang dari 6 karakter', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, password: '12345' });

    expect(res.status).toBe(400);
    expect(res.body.errors[0]).toContain('password');
  });

  test('409: email sudah terdaftar', async () => {
    userModel.findByEmail.mockResolvedValue({ id: 1 });

    const res = await request(app).post('/api/auth/register').send(validUser);

    expect(res.status).toBe(409);
    expect(userModel.create).not.toHaveBeenCalled();
  });

  test('409: email bentrok saat INSERT (race condition, kode 23505)', async () => {
    userModel.findByEmail.mockResolvedValue(undefined);
    userModel.create.mockRejectedValue(Object.assign(new Error('duplicate'), { code: '23505' }));

    const res = await request(app).post('/api/auth/register').send(validUser);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Email sudah terdaftar');
  });

  test('email dinormalisasi: spasi dibuang dan jadi huruf kecil', async () => {
    userModel.findByEmail.mockResolvedValue(undefined);
    userModel.create.mockResolvedValue(savedUser);

    await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, email: '  Budi@Mail.COM  ' });

    expect(userModel.findByEmail).toHaveBeenCalledWith('budi@mail.com');
  });

  test('field tambahan (id, role) dibuang, tidak sampai ke model', async () => {
    userModel.findByEmail.mockResolvedValue(undefined);
    userModel.create.mockResolvedValue(savedUser);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, id: 999, role: 'admin' });

    expect(res.status).toBe(201);
    const saved = userModel.create.mock.calls[0][0];
    expect(saved).not.toHaveProperty('id');
    expect(saved).not.toHaveProperty('role');
  });
});

describe('POST /api/auth/login', () => {
  let passwordHash;

  beforeAll(async () => {
    passwordHash = await bcrypt.hash('rahasia123', 4); // cost kecil supaya tes cepat
  });

  test('200: login berhasil, token valid dan berisi id user', async () => {
    userModel.findByEmail.mockResolvedValue({ ...savedUser, password: passwordHash });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'budi@mail.com', password: 'rahasia123' });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');

    const payload = jwt.verify(res.body.token, 'test-secret');
    expect(payload.sub).toBe(1);
  });

  test('401: password salah', async () => {
    userModel.findByEmail.mockResolvedValue({ ...savedUser, password: passwordHash });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'budi@mail.com', password: 'salah' });

    expect(res.status).toBe(401);
    expect(res.body).not.toHaveProperty('token');
  });

  test('401: email tidak terdaftar, pesannya sama dengan password salah', async () => {
    userModel.findByEmail.mockResolvedValueOnce({ ...savedUser, password: passwordHash });
    const passwordSalah = await request(app)
      .post('/api/auth/login')
      .send({ email: 'budi@mail.com', password: 'salah' });

    userModel.findByEmail.mockResolvedValueOnce(undefined);
    const emailTakAda = await request(app)
      .post('/api/auth/login')
      .send({ email: 'hantu@mail.com', password: 'apa-saja' });

    expect(emailTakAda.status).toBe(401);
    // supaya penyerang tidak bisa menebak email mana yang terdaftar
    expect(emailTakAda.body.message).toBe(passwordSalah.body.message);
  });

  test('400: request tanpa body sama sekali', async () => {
    const res = await request(app).post('/api/auth/login');

    expect(res.status).toBe(400);
  });
});

describe('GET /api/profile', () => {
  const tokenValid = () => jwt.sign({ sub: 1 }, 'test-secret');

  test('200: token valid, data profile tanpa password', async () => {
    userModel.findById.mockResolvedValue(savedUser);

    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${tokenValid()}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(savedUser);
    expect(res.body.data).not.toHaveProperty('password');
    expect(userModel.findById).toHaveBeenCalledWith(1);
  });

  test('401: tanpa header Authorization', async () => {
    const res = await request(app).get('/api/profile');

    expect(res.status).toBe(401);
  });

  test('401: token ngawur', async () => {
    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', 'Bearer token-ngawur');

    expect(res.status).toBe(401);
  });

  test('401: token sudah kedaluwarsa', async () => {
    const expired = jwt.sign(
      { sub: 1, exp: Math.floor(Date.now() / 1000) - 10 },
      'test-secret'
    );

    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${expired}`);

    expect(res.status).toBe(401);
  });

  test('401: token ditandatangani dengan secret lain (token palsu)', async () => {
    const palsu = jwt.sign({ sub: 1 }, 'secret-milik-penyerang');

    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${palsu}`);

    expect(res.status).toBe(401);
  });

  test('404: token valid tapi user sudah tidak ada', async () => {
    userModel.findById.mockResolvedValue(undefined);

    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${tokenValid()}`);

    expect(res.status).toBe(404);
  });
});

describe('Umum', () => {
  test('GET / berjalan dan header X-Powered-By disembunyikan helmet', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  test('404: endpoint tidak dikenal', async () => {
    const res = await request(app).get('/api/tidak-ada');

    expect(res.status).toBe(404);
  });

  test('500: error tak terduga ditangani errorHandler, detailnya tidak bocor', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {}); // diamkan log
    userModel.findByEmail.mockRejectedValue(new Error('database mati'));

    const res = await request(app).post('/api/auth/register').send(validUser);

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Terjadi kesalahan pada server');
    expect(JSON.stringify(res.body)).not.toContain('database mati');
    spy.mockRestore();
  });
});