const Pesanan = require("../models/Pesanan");
const PesananDetail = require("../models/PesananDetail");
const Menu = require("../models/menuModels");

exports.getHistoryByEmail = async (req, res) => {
  try {
    const { pesanan_email } = req.query;

    // Get all pesanan for the email
    const pesananList = await Pesanan.find({
      pesanan_email: pesanan_email,
      deletedAt: null,
    }).sort({ pesanan_tanggal: -1 });

    const formattedData = [];

    // Loop through each pesanan
    for (const pesanan of pesananList) {
      // Get details for this pesanan
      const pesananDetails = await PesananDetail.find({
        pesanan_id: pesanan.pesanan_id,
        deletedAt: null,
      });

      const details = [];

      // Loop through each detail
      for (const detail of pesananDetails) {
        // Get menu info for this detail
        const menuInfo = await Menu.findOne({
          menu_id: detail.menu_id,
          deletedAt: null,
        });

        details.push({
          pesanan_detail_id: detail.pesanan_detail_id,
          menu_id: detail.menu_id,
          menu_nama: menuInfo?.menu_nama || null,
          menu_harga: menuInfo?.menu_harga || null,
          pesanan_detail_jumlah: detail.pesanan_detail_jumlah,
        });
      }

      formattedData.push({
        pesanan_id: pesanan.pesanan_id,
        pesanan_nama: pesanan.pesanan_nama,
        pesanan_lokasi: pesanan.pesanan_lokasi,
        pesanan_email: pesanan.pesanan_email,
        pesanan_status: pesanan.pesanan_status,
        pesanan_tanggal: pesanan.pesanan_tanggal,
        pesanan_tanggal_pengiriman: pesanan.pesanan_tanggal_pengiriman,
        details: details,
      });
    }

    return res.status(200).json({
      message: "History pesanan berhasil diambil.",
      data: formattedData,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
