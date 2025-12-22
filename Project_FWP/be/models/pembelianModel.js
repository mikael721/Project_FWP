const mongoose = require("mongoose");

const pembelianSchema = new mongoose.Schema(
  {
    pembelian_id: {
      type: Number,
      unique: true,
    },
    bahan_baku_id: {
      type: Number,
      required: true,
    },
    pembelian_jumlah: {
      type: Number,
      required: true,
    },
    pembelian_satuan: {
      type: String,
      required: true,
    },
    pembelian_harga_satuan: {
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
    collection: "pembelian",
  }
);

module.exports = mongoose.model("Pembelian", pembelianSchema);
