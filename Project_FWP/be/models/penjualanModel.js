const mongoose = require("mongoose");

const penjualanSchema = new mongoose.Schema(
  {
    penjualan_id: {
      type: Number,
      unique: true,
    },
    header_penjualan_id: {
      type: Number,
      required: true,
    },
    menu_id: {
      type: Number,
      required: true,
    },
    penjualan_jumlah: {
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
    collection: "penjualan",
  }
);

module.exports = mongoose.model("Penjualan", penjualanSchema);
