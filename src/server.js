require("dotenv").config();

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET belum diisi di .env");
  process.exit(1);
}
const app = require("./app");

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));
