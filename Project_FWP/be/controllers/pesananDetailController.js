// controllers/pesananDetailController.js
const PesananDetail = require("../mongodb/models/PesananDetail");
const Pesanan = require("../mongodb/models/Pesanan");
const Menu = require("../mongodb/models/Menu");
const Pegawai = require("../mongodb/models/Pegawai");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const {
  createPesananDetailSchema,
  createPesananSchema,
} = require("../validations/pesananDetailValidation");

// === CREATE PESANAN DETAIL ===
exports.createPesananDetail = async (req, res) => {
  try {
    const { error } = createPesananDetailSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { menu_id, pesanan_detail_jumlah, pesanan_id, subtotal } = req.body;

    // Get next PesananDetail ID
    const lastPesananDetail = await PesananDetail.findOne().sort({
      pesanan_detail_id: -1,
    });
    const nextId = (lastPesananDetail?.pesanan_detail_id || 0) + 1;

    const newPesananDetail = await PesananDetail.create({
      pesanan_detail_id: nextId,
      menu_id: parseInt(menu_id),
      pesanan_detail_jumlah,
      pesanan_id: parseInt(pesanan_id),
      subtotal,
    });

    return res.status(201).json({
      success: true,
      message: "Pesanan detail created successfully",
      data: newPesananDetail,
    });
  } catch (error) {
    console.error("Error creating pesanan detail:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create pesanan detail",
      error: error.message,
    });
  }
};

// === CREATE PESANAN ===
exports.createPesanan = async (req, res) => {
  try {
    const { error } = createPesananSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const {
      pesanan_nama,
      pesanan_lokasi,
      pesanan_email,
      nomer_telpon,
      pesanan_tanggal,
      pesanan_tanggal_pengiriman,
    } = req.body;

    // Get next Pesanan ID
    const lastPesanan = await Pesanan.findOne().sort({ pesanan_id: -1 });
    const nextId = (lastPesanan?.pesanan_id || 0) + 1;

    const newPesanan = await Pesanan.create({
      pesanan_id: nextId,
      pesanan_nama,
      pesanan_lokasi,
      pesanan_email,
      nomer_telpon,
      pesanan_tanggal,
      pesanan_tanggal_pengiriman,
      pesanan_status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Pesanan created successfully",
      data: newPesanan,
    });
  } catch (error) {
    console.error("Error creating pesanan:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create pesanan",
      error: error.message,
    });
  }
};

// === SHOW PESANAN DETAIL GROUPED BY PESANAN ID ===
exports.showPesananDetailSpesifik = async (req, res) => {
  try {
    const details = await PesananDetail.find({ deletedAt: null }).sort({
      pesanan_id: 1,
    });

    // Enhance dengan menu dan pesanan data
    const enhancedDetails = await Promise.all(
      details.map(async (detail) => {
        const menu = await Menu.findOne({
          menu_id: detail.menu_id,
          deletedAt: null,
        });
        const pesanan = await Pesanan.findOne({
          pesanan_id: detail.pesanan_id,
          deletedAt: null,
        });

        return {
          ...detail.toObject(),
          menu: menu || null,
          pesanan: pesanan || null,
        };
      })
    );

    // Kelompokkan hasil berdasarkan pesanan_id
    const grouped = enhancedDetails.reduce((acc, item) => {
      const pid = item.pesanan_id;
      const nama = item.pesanan?.pesanan_nama || "Tidak diketahui";
      const status = item.pesanan?.pesanan_status || "pending";

      if (!acc[pid]) {
        acc[pid] = {
          pesanan_id: pid,
          pesanan_nama: nama,
          pesanan_status: status,
          data: [],
        };
      }

      acc[pid].data.push(item);
      return acc;
    }, {});

    return res.status(200).json(Object.values(grouped));
  } catch (error) {
    console.error("Error fetching pesanan detail:", error);
    return res.status(500).json({ error: error.message });
  }
};

// === UPDATE STATUS PESANAN ===
exports.updateStatusPesanan = async (req, res) => {
  const { id } = req.params;
  const { pesan, userInfo } = req.body;
  try {
    // Cari pesanan berdasarkan ID
    const findPesanan = await Pesanan.findOne({
      pesanan_id: parseInt(id),
      deletedAt: null,
    });

    if (!findPesanan) {
      return res.status(404).json({ message: "Pesanan tidak ditemukan" });
    }

    // Update status sesuai logika
    let newStatus = findPesanan.pesanan_status;
    if (findPesanan.pesanan_status === "pending") {
      newStatus = "diproses";
    } else if (findPesanan.pesanan_status === "diproses") {
      newStatus = "terkirim";
    } else {
      newStatus = "pending";
    }

    const pesan_text = `${userInfo}${pesan}`;

    const updatedPesanan = await Pesanan.findOneAndUpdate(
      { pesanan_id: parseInt(id) },
      {
        pesanan_status: newStatus,
        pesan: pesan_text,
        updatedAt: new Date(),
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Status pesanan berhasil diperbarui",
      data: updatedPesanan,
    });
  } catch (error) {
    console.error("Error updating pesanan status:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal memperbarui status pesanan",
      error: error.message,
    });
  }
};

// === CHECK PASSWORD PEMESANAN ===
exports.cekPasswordPemesanan = async (req, res) => {
  const { password, pesan, token } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const pegawai_id = decoded.pegawai_id;

    const user = await Pegawai.findOne({
      pegawai_id: parseInt(pegawai_id),
      deletedAt: null,
    });

    if (!user) {
      return res.status(404).json({ message: "Pegawai tidak ditemukan" });
    }

    const isMatch = await bcrypt.compare(password, user.pegawai_password);
    if (!isMatch) {
      return res.status(200).json({
        message: "Password salah",
        status: false,
      });
    }

    return res.status(200).json({
      message: "Password benar, akses diizinkan",
      data: {
        pegawai_id: user.pegawai_id,
        pegawai_nama: user.pegawai_nama,
      },
      status: true,
    });
  } catch (error) {
    console.error("Error verifying token/password:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal memverifikasi password atau token tidak valid",
      error: error.message,
    });
  }
};

// === GET PESANAN BY ID ===
exports.getPesananById = async (req, res) => {
  try {
    const { pesanan_id } = req.params;

    const pesanan = await Pesanan.findOne({
      pesanan_id: parseInt(pesanan_id),
      deletedAt: null,
    });

    if (!pesanan) {
      return res.status(404).json({
        success: false,
        message: "Pesanan not found",
      });
    }

    // Get related pesanan details
    const pesananDetails = await PesananDetail.find({
      pesanan_id: parseInt(pesanan_id),
      deletedAt: null,
    });

    return res.status(200).json({
      success: true,
      data: {
        pesanan: pesanan,
        details: pesananDetails,
      },
    });
  } catch (error) {
    console.error("Error fetching pesanan:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pesanan",
      error: error.message,
    });
  }
};

// === UPDATE PESANAN STATUS ===
exports.updatePesananStatus = async (req, res) => {
  try {
    const { pesanan_id } = req.params;
    const { pesanan_status } = req.body;

    const validStatuses = ["pending", "diproses", "terkirim"];
    if (!validStatuses.includes(pesanan_status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be: pending, diproses, or terkirim",
      });
    }

    const pesanan = await Pesanan.findOneAndUpdate(
      { pesanan_id: parseInt(pesanan_id), deletedAt: null },
      { pesanan_status, updatedAt: new Date() },
      { new: true }
    );

    if (!pesanan) {
      return res.status(404).json({
        success: false,
        message: "Pesanan not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Pesanan status updated successfully",
      data: pesanan,
    });
  } catch (error) {
    console.error("Error updating pesanan status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update pesanan status",
      error: error.message,
    });
  }
};

// === GET PESANAN DETAIL BY PESANAN ID ===
exports.getPesananDetailById = async (req, res) => {
  let { id } = req.params;
  try {
    const getMenuById = await PesananDetail.find({
      pesanan_id: parseInt(id),
      deletedAt: null,
    });

    // Enhance dengan menu data
    const enhancedData = await Promise.all(
      getMenuById.map(async (detail) => {
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

    return res.status(200).json(enhancedData);
  } catch (error) {
    console.error("Error fetching pesanan:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pesanan",
      error: error.message,
    });
  }
};
