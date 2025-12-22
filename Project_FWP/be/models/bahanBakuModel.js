const mongoose = require("mongoose");

const bahanBakuSchema = new mongoose.Schema(
  {
    bahan_baku_id: {
      type: Number,
      unique: true,
    },
    bahan_baku_nama: {
      type: String,
      required: true,
    },
    bahan_baku_jumlah: {
      type: Number,
      required: true,
    },
    bahan_baku_harga: {
      type: Number,
      required: true,
    },
    bahan_baku_satuan: {
      type: String,
      required: true,
    },
    bahan_baku_harga_satuan: {
      type: Number,
      required: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "bahan_baku",
  }
);

module.exports = mongoose.model("BahanBaku", bahanBakuSchema);
