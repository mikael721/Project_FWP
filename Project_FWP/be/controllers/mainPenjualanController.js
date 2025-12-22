const HeaderPenjualan = require("../models/headerPenjualanModel");
const Penjualan = require("../models/penjualanModel");
const Menu = require("../models/menuModels");
const DetailMenu = require("../models/detailMenu");
const BahanBaku = require("../models/bahanBakuModel");
const {
  headerPenjualanSchema,
  detailPenjualanSchema,
} = require("../validations/mainPenjualanValidation");

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

    // Add pegawai_id dari token
    const pegawai_id = req.hasil?.pegawai_id || null;
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

    // Get menu ingredients to check and deduct stock
    const ingredients = await DetailMenu.findAll({
      where: { menu_id: value.menu_id },
    });

    // Check if all ingredients have sufficient stock
    const stockChecks = await Promise.all(
      ingredients.map(async (ingredient) => {
        const bahanBaku = await BahanBaku.findOne({
          where: { bahan_baku_nama: ingredient.detail_menu_nama_bahan },
        });

        const requiredQuantity =
          ingredient.detail_menu_jumlah * value.penjualan_jumlah;

        return {
          bahanBaku,
          ingredient,
          requiredQuantity,
          hasEnoughStock:
            bahanBaku && bahanBaku.bahan_baku_jumlah >= requiredQuantity,
          isZeroStock: bahanBaku && bahanBaku.bahan_baku_jumlah === 0,
        };
      })
    );

    // Check for zero stock
    const hasZeroStockIngredient = stockChecks.some(
      (check) => check.isZeroStock
    );
    if (hasZeroStockIngredient) {
      const zeroStockItems = stockChecks
        .filter((check) => check.isZeroStock)
        .map((check) => check.ingredient.detail_menu_nama_bahan);

      return res.status(400).json({
        message: "Menu tidak bisa dipilih karena bahan baku habis",
        zeroStockIngredients: zeroStockItems,
      });
    }

    // Check if all have sufficient stock
    const insufficientStock = stockChecks.some(
      (check) => !check.hasEnoughStock
    );
    if (insufficientStock) {
      const insufficientItems = stockChecks
        .filter((check) => !check.hasEnoughStock)
        .map(
          (check) =>
            `${check.ingredient.detail_menu_nama_bahan} (butuh: ${
              check.requiredQuantity
            }, tersedia: ${check.bahanBaku?.bahan_baku_jumlah || 0})`
        );

      return res.status(400).json({
        message: "Stok bahan baku tidak cukup untuk order ini",
        insufficientIngredients: insufficientItems,
      });
    }

    // Create penjualan record
    const penjualan = await Penjualan.create(value);

    // Deduct stock for each ingredient AFTER successful creation
    await Promise.all(
      stockChecks.map(async (check) => {
        if (check.bahanBaku) {
          const newStock =
            check.bahanBaku.bahan_baku_jumlah - check.requiredQuantity;
          await check.bahanBaku.update({
            bahan_baku_jumlah: newStock,
          });
        }
      })
    );

    return res.status(201).json({
      message:
        "Detail penjualan berhasil dibuat dan stok bahan baku diperbarui",
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
    const { error, value } = headerPenjualanSchema.validate(req.body);

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

module.exports = {
  createHeaderPenjualan,
  createDetailPenjualan,
  getAllPenjualan,
  getPenjualanById,
  updateHeaderPenjualan,
};
