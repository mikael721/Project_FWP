const DetailMenu = require("../mongodb/models/DetailMenu");
const Menu = require("../mongodb/models/Menu");

exports.createDetailMenu = async (req, res) => {
  try {
    const {
      detail_menu_nama_bahan,
      detail_menu_jumlah,
      detail_menu_satuan,
      detail_menu_harga,
      menu_id,
    } = req.body;

    // Verify menu exists
    const menuExists = await Menu.findOne({
      menu_id: parseInt(menu_id),
      deletedAt: null,
    });

    if (!menuExists) {
      return res.status(404).json({ message: "Menu tidak ditemukan" });
    }

    // Get next DetailMenu ID
    const lastDetailMenu = await DetailMenu.findOne().sort({ detail_menu_id: -1 });
    const nextId = (lastDetailMenu?.detail_menu_id || 0) + 1;

    const detailMenu = await DetailMenu.create({
      detail_menu_id: nextId,
      detail_menu_nama_bahan,
      detail_menu_jumlah,
      detail_menu_satuan,
      detail_menu_harga,
      menu_id: parseInt(menu_id),
    });

    return res.status(201).json({
      message: "Detail menu berhasil ditambahkan.",
      data: detailMenu,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getAllDetailMenu = async (req, res) => {
  try {
    const detailMenus = await DetailMenu.find({ deletedAt: null }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      message: "Detail menu berhasil diambil.",
      data: detailMenus,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getDetailMenuById = async (req, res) => {
  try {
    const { id } = req.params;

    const detailMenus = await DetailMenu.find({
      menu_id: parseInt(id),
      deletedAt: null,
    });

    if (!detailMenus.length) {
      return res.status(404).json({ message: "Detail pada menu ini kosong" });
    }

    return res.status(200).json({
      message: "Detail menu berhasil diambil.",
      data: detailMenus,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.updateDetailMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      detail_menu_nama_bahan,
      detail_menu_jumlah,
      detail_menu_satuan,
      detail_menu_harga,
    } = req.body;

    const detailMenu = await DetailMenu.findOne({
      detail_menu_id: parseInt(id),
      deletedAt: null,
    });

    if (!detailMenu) {
      return res.status(404).json({ message: "Detail menu tidak ditemukan!" });
    }

    const updatedDetailMenu = await DetailMenu.findOneAndUpdate(
      { detail_menu_id: parseInt(id) },
      {
        detail_menu_nama_bahan,
        detail_menu_jumlah,
        detail_menu_satuan,
        detail_menu_harga,
        updatedAt: new Date(),
      },
      { new: true }
    );

    return res.status(200).json({
      message: "Detail menu berhasil diperbarui.",
      data: updatedDetailMenu,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteDetailMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedDetailMenu = await DetailMenu.findOneAndUpdate(
      { detail_menu_id: parseInt(id), deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );

    if (!deletedDetailMenu) {
      return res.status(404).json({ message: "Detail menu tidak ditemukan!" });
    }

    return res.status(200).json({ message: "Detail menu berhasil dihapus." });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
