CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) UNIQUE NOT NULL,
  gender     VARCHAR(10)  NOT NULL CHECK (gender IN ('male', 'female')),
  password   VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ  DEFAULT NOW()
);