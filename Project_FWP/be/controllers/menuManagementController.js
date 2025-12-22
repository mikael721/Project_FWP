const Menu = require("../models/menuModels");
const {
  addBahanBakuSchema,
  updateBahanBakuSchema,
  message,
} = require("../validations/menuManagementValidation");

// === ADD MENU ===
exports.addMenu = async (req, res) => {
  try {
    let { menu_nama, menu_harga, menu_gambar } = req.body;
    if (!menu_nama || !menu_harga || !menu_gambar) {
      return res.status(400).send({
        message: "Salah Satu Data Kosong !!!",
      });
    }

    // Get next Menu ID
    const lastMenu = await Menu.findOne().sort({ menu_id: -1 });
    const nextId = (lastMenu?.menu_id || 0) + 1;

    const insertMakanan = await Menu.create({
      menu_id: nextId,
      menu_nama,
      menu_harga,
      menu_gambar,
      menu_status_aktif: 1,
    });

    return res.status(201).send({
      message: "Berhasil Menambahkan Menu",
      data: insertMakanan,
    });
  } catch (error) {
    return res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// === GET ALL MENU ===
exports.getMenu = async (req, res) => {
  try {
    let getAllMenu = await Menu.find({ deletedAt: null }).sort({
      createdAt: -1,
    });
    return res.status(200).json(getAllMenu);
  } catch (error) {
    return res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// === TOGGLE STATUS MENU ===
exports.ubahStatus = async (req, res) => {
  let { id } = req.params;
  try {
    let findMenu = await Menu.findOne({
      menu_id: parseInt(id),
      deletedAt: null,
    });

    if (!findMenu) {
      return res.status(404).send({
        message: "Menu tidak ditemukan",
      });
    }

    findMenu.menu_status_aktif = findMenu.menu_status_aktif === 1 ? 0 : 1;

    await Menu.findOneAndUpdate(
      { menu_id: parseInt(id) },
      { menu_status_aktif: findMenu.menu_status_aktif, updatedAt: new Date() },
      { new: true }
    );

    return res.status(200).send({
      message: "Berhasil Mengupdate",
      data: findMenu,
    });
  } catch (error) {
    return res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// === EDIT MENU ===
exports.editMenuManagement = async (req, res) => {
  let { menu_nama, menu_harga, menu_gambar } = req.body;
  let { id } = req.params;
  try {
    let findMenu = await Menu.findOne({
      menu_id: parseInt(id),
      deletedAt: null,
    });

    if (!findMenu) {
      return res.status(404).send({
        message: "Menu tidak ditemukan",
      });
    }

    const updatedMenu = await Menu.findOneAndUpdate(
      { menu_id: parseInt(id) },
      {
        menu_nama: menu_nama ?? findMenu.menu_nama,
        menu_harga: menu_harga ?? findMenu.menu_harga,
        menu_gambar: menu_gambar ?? findMenu.menu_gambar,
        updatedAt: new Date(),
      },
      { new: true }
    );

    return res.status(200).send({
      message: "Menu berhasil diperbarui",
      data: updatedMenu,
      status: true,
    });
  } catch (error) {
    console.error("Error updating menu:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update menu",
      error: error.message,
    });
  }
};

// === TEMPLATE ===
exports.template = async (req, res) => {
  try {
    let getAllMenu = await Menu.find({ deletedAt: null }).sort({
      createdAt: -1,
    });
    return res.status(200).json(getAllMenu);
  } catch (error) {
    return res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
