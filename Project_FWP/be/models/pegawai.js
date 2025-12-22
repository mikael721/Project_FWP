const mongoose = require("mongoose");

const pegawaiSchema = new mongoose.Schema(
  {
    pegawai_id: {
      type: Number,
      unique: true,
    },
    pegawai_nama: {
      type: String,
      required: true,
    },
    pegawai_email: {
      type: String,
      required: true,
      unique: true,
    },
    pegawai_password: {
      type: String,
      required: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "pegawai",
  }
);

module.exports = mongoose.model("Pegawai", pegawaiSchema);
