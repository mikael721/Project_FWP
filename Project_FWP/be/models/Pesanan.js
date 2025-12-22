const mongoose = require("mongoose");

const pesananSchema = new mongoose.Schema(
  {
    pesanan_id: {
      type: Number,
      unique: true,
    },
    pesanan_nama: {
      type: String,
      required: true,
    },
    pesanan_lokasi: {
      type: String,
      required: true,
    },
    pesan: {
      type: String,
      default: null,
    },
    nomer_telpon: {
      type: String,
      default: null,
    },
    pesanan_email: {
      type: String,
      required: true,
    },
    pesanan_status: {
      type: String,
      enum: ["pending", "diproses", "terkirim"],
      default: "pending",
      required: true,
    },
    pesanan_tanggal: {
      type: Date,
      default: null,
    },
    pesanan_tanggal_pengiriman: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "pesanan",
  }
);

module.exports = mongoose.model("Pesanan", pesananSchema);
