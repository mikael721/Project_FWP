const express = require("express");
const router = express.Router();
const laporanKeuanganController = require("../controllers/laporanKeuanganController");
const { isAuthenticate, isManager } = require("../middleware/middleware");

// Get Laporan Penjualan
router.get(
  "/penjualan",
  isAuthenticate,
  isManager,
  laporanKeuanganController.getLaporanPenjualan
);

// Get Laporan Pembelian
router.get(
  "/pembelian",
  isAuthenticate,
  isManager,
  laporanKeuanganController.getLaporanPembelian
);

// Get Laporan Pesanan
router.get(
  "/pesanan",
  isAuthenticate,
  isManager,
  laporanKeuanganController.getLaporanPesanan
);

// Get All Laporan
router.get("/all", isAuthenticate, laporanKeuanganController.getAllLaporan);

module.exports = router;
