// Export all MongoDB models
const Pegawai = require("../models/pegawai");
const BahanBaku = require("../models/bahanBakuModel");
const Menu = require("../models/menuModels");
const DetailMenu = require("../models/detailMenu");
const Pembelian = require("../models/pembelianModel");
const HeaderPenjualan = require("../models/headerPenjualanModel");
const Penjualan = require("../models/penjualanModel");
const Pesanan = require("../models/Pesanan");
const PesananDetail = require("../models/PesananDetail");

module.exports = {
  Pegawai,
  BahanBaku,
  Menu,
  DetailMenu,
  Pembelian,
  HeaderPenjualan,
  Penjualan,
  Pesanan,
  PesananDetail,
};
