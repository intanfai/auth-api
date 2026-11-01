# Auth API

REST API autentikasi sederhana: registrasi, login, dan akses profile
menggunakan JWT.

## Tech Stack
- Node.js, Express
- PostgreSQL (library `pg`)
- JWT (`jsonwebtoken`), bcrypt (`bcryptjs`)

## Struktur Folder
```
src/
├── controllers/   # logika bisnis
├── models/        # query database
├── validators/    # skema validasi input (Joi)
├── middlewares/   # autentikasi JWT, error handler
├── routes/        # pemetaan URL ke controller
├── db.js          # koneksi database
├── app.js         # konfigurasi Express
└── server.js      # entry point
```

## Cara Menjalankan di Lokal
1. Clone repo dan install dependency:
   ```bash
   git clone <url-repo>
   cd auth-api
   npm install
   ```
2. Buat database PostgreSQL, lalu jalankan `schema.sql`.
3. Salin `.env.example` menjadi `.env`, lalu isi nilainya.
4. Jalankan:
   ```bash
   npm run dev
   ```
   Server berjalan di `http://localhost:3000`.

## Endpoint

| Method | Path | Auth | Fungsi |
|---|---|---|---|
| POST | /api/auth/register | - | Buat akun |
| POST | /api/auth/login | - | Login, mendapat token |
| GET | /api/profile | Bearer token | Lihat profile |

### POST /api/auth/register
Request:
```json
{ "name": "Budi", "email": "budi@mail.com", "gender": "male", "password": "rahasia123" }
```
Response 201:
```json
{ "message": "Registrasi berhasil", "data": { "id": 1, "name": "Budi", "email": "budi@mail.com", "gender": "male", "created_at": "..." } }
```

### POST /api/auth/login
Request:
```json
{ "email": "budi@mail.com", "password": "rahasia123" }
```
Response 200:
```json
{ "message": "Login berhasil", "token": "<jwt>" }
```

### GET /api/profile
Header: `Authorization: Bearer <token>`

Response 200:
```json
{ "data": { "id": 1, "name": "Budi", "email": "budi@mail.com", "gender": "male", "created_at": "..." } }
```

### Kode error
| Status | Arti |
|---|---|
| 400 | Input tidak valid |
| 401 | Kredensial salah / token tidak valid |
| 404 | User tidak ditemukan |
| 409 | Email sudah terdaftar |
| 429 | Terlalu banyak request (rate limit: 20 request/15 menit per IP pada /api/auth) |
| 500 | Kesalahan server |

## Asumsi
- Soal tidak menyebut password, jadi ditambahkan field `password`
  (disimpan sebagai hash bcrypt) agar login bisa berjalan.
- `gender` hanya menerima `male` atau `female`.
- Token JWT berlaku 1 jam.

## Dokumentasi
Postman collection ada di `docs/auth-api.postman_collection.json`.