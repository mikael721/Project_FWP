const HeaderPenjualan = require("../mongodb/models/HeaderPenjualan");
const Penjualan = require("../mongodb/models/Penjualan");
const Menu = require("../mongodb/models/Menu");
const DetailMenu = require("../mongodb/models/DetailMenu");
const BahanBaku = require("../mongodb/models/BahanBaku");
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

    // Get next Header Penjualan ID
    const lastHeader = await HeaderPenjualan.findOne().sort({ header_penjualan_id: -1 });
    const nextId = (lastHeader?.header_penjualan_id || 0) + 1;

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

    // Get menu ingredients to check and deduct stock
    const ingredients = await DetailMenu.find({
      menu_id: value.menu_id,
      deletedAt: null,
    });

    // Check if all ingredients have sufficient stock
    const stockChecks = await Promise.all(
      ingredients.map(async (ingredient) => {
        const bahanBaku = await BahanBaku.findOne({
          bahan_baku_nama: ingredient.detail_menu_nama_bahan,
          deletedAt: null,
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

    // Get next Penjualan ID
    const lastPenjualan = await Penjualan.findOne().sort({ penjualan_id: -1 });
    const nextId = (lastPenjualan?.penjualan_id || 0) + 1;

    // Create penjualan record
    const penjualan = await Penjualan.create({
      penjualan_id: nextId,
      ...value,
    });

    // Deduct stock for each ingredient AFTER successful creation
    await Promise.all(
      stockChecks.map(async (check) => {
        if (check.bahanBaku) {
          const newStock =
            check.bahanBaku.bahan_baku_jumlah - check.requiredQuantity;
          await BahanBaku.findOneAndUpdate(
            { bahan_baku_id: check.bahanBaku.bahan_baku_id },
            {
              bahan_baku_jumlah: newStock,
              updatedAt: new Date(),
            },
            { new: true }
          );
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
    const penjualan = await Penjualan.find({ deletedAt: null }).sort({
      createdAt: -1,
    });

    // Enhance dengan header dan menu data
    const enhancedPenjualan = await Promise.all(
      penjualan.map(async (item) => {
        const header = await HeaderPenjualan.findOne({
          header_penjualan_id: item.header_penjualan_id,
        });
        const menu = await Menu.findOne({
          menu_id: item.menu_id,
        });

        return {
          ...item.toObject(),
          header: header || null,
          menu: menu || null,
        };
      })
    );

    return res.status(200).json({
      message: "Berhasil mengambil data penjualan",
      data: enhancedPenjualan,
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

    const headerPenjualan = await HeaderPenjualan.findOne({
      header_penjualan_id: parseInt(id),
      deletedAt: null,
    });

    if (!headerPenjualan) {
      return res.status(404).json({
        message: "Penjualan tidak ditemukan",
      });
    }

    // Get related penjualan items
    const penjualanItems = await Penjualan.find({
      header_penjualan_id: parseInt(id),
      deletedAt: null,
    });

    // Enhance dengan menu data
    const enhancedItems = await Promise.all(
      penjualanItems.map(async (item) => {
        const menu = await Menu.findOne({
          menu_id: item.menu_id,
        });
        return {
          ...item.toObject(),
          menu: menu || null,
        };
      })
    );

    return res.status(200).json({
      message: "Berhasil mengambil data penjualan",
      data: {
        header: headerPenjualan,
        items: enhancedItems,
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
    const { error, value } = headerPenjualanSchema.validate(req.body);

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

module.exports = {
  createHeaderPenjualan,
  createDetailPenjualan,
  getAllPenjualan,
  getPenjualanById,
  updateHeaderPenjualan,
};
