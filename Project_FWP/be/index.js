const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const bahanBakuRoutes = require("./routes/bahanBakuRoutes");
const login = require("./routes/loginRoutes");
const menuManagement = require("./routes/menuManagement");
const detailMenuRoutes = require("./routes/detailMenuRoutes");
const pesananDetailRoutes = require("./routes/pesananDetailRoutes");
const detailPenjualanRoutes = require("./routes/detailPenjualanRoutes");
const mainPenjualanRoutes = require("./routes/mainPenjualanRoutes");
const laporanKeuanganRoutes = require("./routes/laporanKeuanganRoutes");
const historyRoutes = require("./routes/historyRoutes");

/* =========================
   MONGODB CONFIG & MODELS
========================= */
const { connectMongoDB } = require("./config/sequelize");

/* =========================
   EXPRESS SETUP
========================= */
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// login
app.use("/api/login", login);

// decrypt token
app.use("/api/decrypt", login);

// menu management
app.use("/api/menu_management", menuManagement);

// menu detail
app.use("/api/menu_management/detail", detailMenuRoutes);

// bahan baku
app.use("/api/bahan_Baku", bahanBakuRoutes);

// pesanan detail
app.use("/api/pesanan_detail/detail", pesananDetailRoutes);

// detail penjualan
app.use("/api/detail_penjualan", detailPenjualanRoutes);

//history
app.use("/api/history/", historyRoutes);

// main penjualan
app.use("/api/main_penjualan", mainPenjualanRoutes);

// laporan keuangan
app.use("/api/laporan_keuangan", laporanKeuanganRoutes);

/* =========================
   SERVER START
========================= */
const PORT = 3000;

app.listen(PORT, async () => {
  try {
    await connectMongoDB();
    console.log("✅ MongoDB connected");
    console.log(`🚀 Server running on port ${PORT}`);
  } catch (err) {
    console.error("❌ Startup error:", err);
  }
});
