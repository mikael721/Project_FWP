const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema(
  {
    menu_id: {
      type: Number,
      unique: true,
    },
    menu_nama: {
      type: String,
      required: true,
      maxlength: 255,
    },
    menu_harga: {
      type: Number,
      required: true,
      default: 0,
    },
    menu_gambar: {
      type: String,
      required: true,
    },
    menu_status_aktif: {
      type: Number,
      default: 1,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "menu",
  }
);

module.exports = mongoose.model("Menu", menuSchema);
