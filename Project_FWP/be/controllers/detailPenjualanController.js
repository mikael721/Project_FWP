const HeaderPenjualan = require("../models/headerPenjualanModel");
const Penjualan = require("../models/penjualanModel");
const Menu = require("../models/menuModels");
const DetailMenu = require("../models/detailMenu");
const BahanBaku = require("../models/bahanBakuModel");
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

    // Add pegawai_id ke value sebelum create
    const headerPayload = {
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
    const headerExists = await HeaderPenjualan.findByPk(
      value.header_penjualan_id
    );
    if (!headerExists) {
      return res.status(404).json({
        message: "Header penjualan tidak ditemukan",
      });
    }

    // Verify menu exists
    const menuExists = await Menu.findByPk(value.menu_id);
    if (!menuExists) {
      return res.status(404).json({
        message: "Menu tidak ditemukan",
      });
    }

    const penjualan = await Penjualan.create(value);

    // Reduce bahan_baku stock based on menu recipe
    try {
      const { sequelize } = require("../config/sequelize");
      const detailMenus = await DetailMenu.findAll({
        where: { menu_id: value.menu_id },
      });

      // For each ingredient in the menu recipe
      for (const detail of detailMenus) {
        // Find bahan_baku by name match
        const bahanBaku = await BahanBaku.findOne({
          where: {
            bahan_baku_nama: detail.detail_menu_nama_bahan,
          },
        });

        if (bahanBaku) {
          // Calculate total amount to reduce (detail amount * quantity sold)
          const amountToReduce =
            detail.detail_menu_jumlah * value.penjualan_jumlah;

          // Update bahan_baku stock using raw query
          await sequelize.query(
            `UPDATE bahan_baku SET bahan_baku_jumlah = bahan_baku_jumlah - :amountToReduce WHERE bahan_baku_id = :bahanBakuId`,
            {
              replacements: {
                amountToReduce: amountToReduce,
                bahanBakuId: bahanBaku.bahan_baku_id,
              },
            }
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
    const penjualan = await HeaderPenjualan.findAll({
      include: [
        {
          model: Penjualan,
          as: "penjualans",
          include: [
            {
              model: Menu,
              as: "menu",
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: "Berhasil mengambil data penjualan",
      data: penjualan,
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

    const Pegawai = require("../models/pegawai");

    const penjualan = await HeaderPenjualan.findByPk(id, {
      include: [
        {
          model: Penjualan,
          as: "penjualans",
          include: [
            {
              model: Menu,
              as: "menu",
            },
          ],
        },
        {
          model: Pegawai,
          as: "pegawai",
          attributes: ["pegawai_id", "pegawai_nama"],
        },
      ],
    });

    if (!penjualan) {
      return res.status(404).json({
        message: "Penjualan tidak ditemukan",
      });
    }

    return res.status(200).json({
      message: "Berhasil mengambil data penjualan",
      data: penjualan,
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

    const headerPenjualan = await HeaderPenjualan.findByPk(id);

    if (!headerPenjualan) {
      return res.status(404).json({
        message: "Header penjualan tidak ditemukan",
      });
    }

    await headerPenjualan.update(value);

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

// Delete Detail Penjualan
const deleteDetailPenjualan = async (req, res) => {
  try {
    const { id } = req.params;

    const penjualan = await Penjualan.findByPk(id);

    if (!penjualan) {
      return res.status(404).json({
        message: "Detail penjualan tidak ditemukan",
      });
    }

    await penjualan.destroy();

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

    const details = await Penjualan.findAll({
      where: { header_penjualan_id: headerId },
      include: [
        {
          model: Menu,
          as: "menu",
        },
      ],
    });

    return res.status(200).json({
      message: "Berhasil mengambil detail penjualan",
      data: details,
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
