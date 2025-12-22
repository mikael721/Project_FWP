const mongoose = require("mongoose");

const headerPenjualanSchema = new mongoose.Schema(
  {
    header_penjualan_id: {
      type: Number,
      unique: true,
    },
    header_penjualan_tanggal: {
      type: Date,
      required: true,
    },
    header_penjualan_jenis: {
      type: String,
      enum: ["offline", "online"],
      required: true,
    },
    header_penjualan_keterangan: {
      type: String,
      required: true,
      maxlength: 255,
    },
    header_penjualan_biaya_tambahan: {
      type: Number,
      required: true,
      default: 0,
    },
    header_penjualan_uang_muka: {
      type: Number,
      required: true,
      default: 0,
    },
    pegawai_id: {
      type: Number,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "header_penjualan",
  }
);

module.exports = mongoose.model("HeaderPenjualan", headerPenjualanSchema);
