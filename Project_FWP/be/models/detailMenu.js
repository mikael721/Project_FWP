const mongoose = require("mongoose");

const detailMenuSchema = new mongoose.Schema(
  {
    detail_menu_id: {
      type: Number,
      unique: true,
    },
    detail_menu_nama_bahan: {
      type: String,
      required: true,
    },
    detail_menu_jumlah: {
      type: Number,
      required: true,
    },
    detail_menu_satuan: {
      type: String,
      required: true,
    },
    detail_menu_harga: {
      type: Number,
      required: true,
    },
    menu_id: {
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
    collection: "detail_menu",
  }
);

module.exports = mongoose.model("DetailMenu", detailMenuSchema);
