const mongoose = require("mongoose");

const pesananDetailSchema = new mongoose.Schema(
  {
    pesanan_detail_id: {
      type: Number,
      unique: true,
    },
    menu_id: {
      type: Number,
      default: null,
    },
    pesanan_detail_jumlah: {
      type: Number,
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    pesanan_id: {
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
    collection: "pesanan_detail",
  }
);

module.exports = mongoose.model("PesananDetail", pesananDetailSchema);
