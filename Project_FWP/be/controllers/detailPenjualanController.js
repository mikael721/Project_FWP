const HeaderPenjualan = require("../models/headerPenjualanModel");
const Penjualan = require("../models/penjualanModel");
const Menu = require("../models/menuModels");
const DetailMenu = require("../models/detailMenu");
const BahanBaku = require("../models/bahanBakuModel");
const Pegawai = require("../models/pegawai");
const {
  headerPenjualanSchema,
  updateHeaderPenjualanSchema,
  detailPenjualanSchema,
} = require("../validations/detailPenjualanValidation");

// Create Header Penjualan
const createHeaderPenjualan = async (req, res) => {
  try {
    const { error, value } = headerPenjualanSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details[0].message,
      });
    }

    // Extract pegawai_id dari token yang sudah di-decode oleh middleware
    const pegawai_id = req.hasil?.pegawai_id || null;

    // Get next Header Penjualan ID
    const lastHeader = await HeaderPenjualan.findOne().sort({
      header_penjualan_id: -1,
    });
    const nextId = (lastHeader?.header_penjualan_id || 0) + 1;

    // Add pegawai_id ke value sebelum create
    const headerPayload = {
      header_penjualan_id: nextId,
      ...value,
      pegawai_id: pegawai_id,
    };

    const headerPenjualan = await HeaderPenjualan.create(headerPayload);

    return res.status(201).json({
      message: "Header penjualan berhasil dibuat",
      data: headerPenjualan,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Gagal membuat header penjualan",
      error: err.message,
    });
  }
};

// Create Detail Penjualan
const createDetailPenjualan = async (req, res) => {
  try {
    const { error, value } = detailPenjualanSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details[0].message,
      });
    }

    // Verify header penjualan exists
    const headerExists = await HeaderPenjualan.findOne({
      header_penjualan_id: value.header_penjualan_id,
      deletedAt: null,
    });
    if (!headerExists) {
      return res.status(404).json({
        message: "Header penjualan tidak ditemukan",
      });
    }

    // Verify menu exists
    const menuExists = await Menu.findOne({
      menu_id: value.menu_id,
      deletedAt: null,
    });
    if (!menuExists) {
      return res.status(404).json({
        message: "Menu tidak ditemukan",
      });
    }

    // Get next Penjualan ID
    const lastPenjualan = await Penjualan.findOne().sort({ penjualan_id: -1 });
    const nextId = (lastPenjualan?.penjualan_id || 0) + 1;

    const penjualan = await Penjualan.create({
      penjualan_id: nextId,
      ...value,
    });

    // Reduce bahan_baku stock based on menu recipe
    try {
      const detailMenus = await DetailMenu.find({
        menu_id: value.menu_id,
        deletedAt: null,
      });

      // For each ingredient in the menu recipe
      for (const detail of detailMenus) {
        // Find bahan_baku by name match
        const bahanBaku = await BahanBaku.findOne({
          bahan_baku_nama: detail.detail_menu_nama_bahan,
          deletedAt: null,
        });

        if (bahanBaku) {
          // Calculate total amount to reduce (detail amount * quantity sold)
          const amountToReduce =
            detail.detail_menu_jumlah * value.penjualan_jumlah;

          // Update bahan_baku stock
          await BahanBaku.findOneAndUpdate(
            { bahan_baku_id: bahanBaku.bahan_baku_id },
            {
              bahan_baku_jumlah: bahanBaku.bahan_baku_jumlah - amountToReduce,
              updatedAt: new Date(),
            },
            { new: true }
          );
        }
      }
    } catch (stockErr) {
      console.error("Error reducing bahan_baku stock:", stockErr);
      // Log the error but don't fail the penjualan creation
    }

    return res.status(201).json({
      message: "Detail penjualan berhasil dibuat",
      data: penjualan,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Gagal membuat detail penjualan",
      error: err.message,
    });
  }
};

// Get All Penjualan dengan Header
const getAllPenjualan = async (req, res) => {
  try {
    const headers = await HeaderPenjualan.find({ deletedAt: null }).sort({
      createdAt: -1,
    });

    // Enhance dengan penjualan dan menu data
    const enhancedData = await Promise.all(
      headers.map(async (header) => {
        const penjualanItems = await Penjualan.find({
          header_penjualan_id: header.header_penjualan_id,
          deletedAt: null,
        });

        const enhancedItems = await Promise.all(
          penjualanItems.map(async (item) => {
            const menu = await Menu.findOne({
              menu_id: item.menu_id,
              deletedAt: null,
            });
            return {
              ...item.toObject(),
              menu: menu || null,
            };
          })
        );

        return {
          ...header.toObject(),
          penjualans: enhancedItems,
        };
      })
    );

    return res.status(200).json({
      message: "Berhasil mengambil data penjualan",
      data: enhancedData,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Gagal mengambil data penjualan",
      error: err.message,
    });
  }
};

// Get Penjualan by ID
const getPenjualanById = async (req, res) => {
  try {
    const { id } = req.params;

    const penjualan = await HeaderPenjualan.findOne({
      header_penjualan_id: parseInt(id),
      deletedAt: null,
    });

    if (!penjualan) {
      return res.status(404).json({
        message: "Penjualan tidak ditemukan",
      });
    }

    // Get related penjualan items
    const penjualanItems = await Penjualan.find({
      header_penjualan_id: parseInt(id),
      deletedAt: null,
    });

    // Enhance dengan menu dan pegawai data
    const enhancedItems = await Promise.all(
      penjualanItems.map(async (item) => {
        const menu = await Menu.findOne({
          menu_id: item.menu_id,
          deletedAt: null,
        });
        return {
          ...item.toObject(),
          menu: menu || null,
        };
      })
    );

    const pegawai = await Pegawai.findOne({
      pegawai_id: penjualan.pegawai_id,
      deletedAt: null,
    });

    return res.status(200).json({
      message: "Berhasil mengambil data penjualan",
      data: {
        ...penjualan.toObject(),
        penjualans: enhancedItems,
        pegawai: pegawai || null,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Gagal mengambil data penjualan",
      error: err.message,
    });
  }
};

// Update Header Penjualan
const updateHeaderPenjualan = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateHeaderPenjualanSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details[0].message,
      });
    }

    const headerPenjualan = await HeaderPenjualan.findOneAndUpdate(
      { header_penjualan_id: parseInt(id), deletedAt: null },
      { ...value, updatedAt: new Date() },
      { new: true }
    );

    if (!headerPenjualan) {
      return res.status(404).json({
        message: "Header penjualan tidak ditemukan",
      });
    }

    return res.status(200).json({
      message: "Header penjualan berhasil diupdate",
      data: headerPenjualan,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Gagal update header penjualan",
      error: err.message,
    });
  }
};

// Delete Detail Penjualan (Soft Delete)
const deleteDetailPenjualan = async (req, res) => {
  try {
    const { id } = req.params;

    const penjualan = await Penjualan.findOneAndUpdate(
      { penjualan_id: parseInt(id), deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );

    if (!penjualan) {
      return res.status(404).json({
        message: "Detail penjualan tidak ditemukan",
      });
    }

    return res.status(200).json({
      message: "Detail penjualan berhasil dihapus",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Gagal menghapus detail penjualan",
      error: err.message,
    });
  }
};

// Get Detail Penjualan by Header ID
const getDetailByHeaderId = async (req, res) => {
  try {
    const { headerId } = req.params;

    const details = await Penjualan.find({
      header_penjualan_id: parseInt(headerId),
      deletedAt: null,
    });

    // Enhance dengan menu data
    const enhancedDetails = await Promise.all(
      details.map(async (detail) => {
        const menu = await Menu.findOne({
          menu_id: detail.menu_id,
          deletedAt: null,
        });
        return {
          ...detail.toObject(),
          menu: menu || null,
        };
      })
    );

    return res.status(200).json({
      message: "Berhasil mengambil detail penjualan",
      data: enhancedDetails,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Gagal mengambil detail penjualan",
      error: err.message,
    });
  }
};

module.exports = {
  createHeaderPenjualan,
  createDetailPenjualan,
  getAllPenjualan,
  getPenjualanById,
  updateHeaderPenjualan,
  deleteDetailPenjualan,
  getDetailByHeaderId,
};
