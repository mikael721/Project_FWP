const BahanBaku = require("../mongodb/models/BahanBaku");
const Pembelian = require("../mongodb/models/Pembelian");
const {
  addBahanBakuSchema,
  updateBahanBakuSchema,
  addPembelianSchema,
} = require("../validations/bahanBakuValidation");

// GET ALL
exports.getAllBahanBaku = async (req, res) => {
  try {
    const bahanBakuList = await BahanBaku.find({ deletedAt: null }).sort({ createdAt: -1 });
    return res.status(200).json(bahanBakuList);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// GET ONE
exports.getBahanBakuById = async (req, res) => {
  try {
    const bahanBaku = await BahanBaku.findOne({
      bahan_baku_id: parseInt(req.params.id),
      deletedAt: null,
    });
    if (!bahanBaku) {
      return res.status(404).json({ message: "Bahan baku tidak ditemukan!" });
    }
    return res.status(200).json(bahanBaku);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ADD
exports.addBahanBaku = async (req, res) => {
  try {
    const { error } = addBahanBakuSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Get next ID
    const lastBahan = await BahanBaku.findOne().sort({ bahan_baku_id: -1 });
    const nextId = (lastBahan?.bahan_baku_id || 0) + 1;

    const newBahanBaku = await BahanBaku.create({
      bahan_baku_id: nextId,
      ...req.body,
    });
    return res
      .status(201)
      .json({ message: "Bahan baku berhasil ditambahkan!", data: newBahanBaku });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// UPDATE
exports.updateBahanBaku = async (req, res) => {
  try {
    const { error } = updateBahanBakuSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { id } = req.params;
    const bahanBaku = await BahanBaku.findOneAndUpdate(
      { bahan_baku_id: parseInt(id), deletedAt: null },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );

    if (!bahanBaku) {
      return res.status(404).json({ message: "Bahan baku tidak ditemukan!" });
    }

    return res
      .status(200)
      .json({ message: "Bahan baku berhasil diperbarui!", data: bahanBaku });
  } catch (error) {
    console.error("Update error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// DELETE (Soft Delete)
exports.deleteBahanBaku = async (req, res) => {
  try {
    const { id } = req.params;
    const bahanBaku = await BahanBaku.findOneAndUpdate(
      { bahan_baku_id: parseInt(id), deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );

    if (!bahanBaku) {
      return res.status(404).json({ message: "Bahan baku tidak ditemukan!" });
    }

    return res.status(200).json({ message: "Bahan baku berhasil dihapus." });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ADD PEMBELIAN
exports.addPembelian = async (req, res) => {
  try {
    const { error } = addPembelianSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const {
      bahan_baku_id,
      pembelian_jumlah,
      pembelian_satuan,
      pembelian_harga_satuan,
    } = req.body;

    const bahan = await BahanBaku.findOne({
      bahan_baku_id: parseInt(bahan_baku_id),
      deletedAt: null,
    });
    if (!bahan) {
      return res.status(404).json({ message: "Bahan baku tidak ditemukan." });
    }

    // Get next Pembelian ID
    const lastPembelian = await Pembelian.findOne().sort({ pembelian_id: -1 });
    const nextId = (lastPembelian?.pembelian_id || 0) + 1;

    const newPembelian = await Pembelian.create({
      pembelian_id: nextId,
      bahan_baku_id: parseInt(bahan_baku_id),
      pembelian_jumlah,
      pembelian_satuan,
      pembelian_harga_satuan,
    });

    return res.status(201).json({
      message: "Pembelian berhasil ditambahkan!",
      data: newPembelian,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
