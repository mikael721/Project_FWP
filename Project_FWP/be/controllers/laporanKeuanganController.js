const HeaderPenjualan = require("../models/headerPenjualanModel");
const Penjualan = require("../models/penjualanModel");
const Menu = require("../models/menuModels");
const BahanBaku = require("../models/bahanBakuModel");
const Pembelian = require("../models/pembelianModel");
const Pesanan = require("../models/Pesanan");
const PesananDetail = require("../models/PesananDetail");
const Pegawai = require("../models/pegawai");

const getLaporanPenjualan = async (req, res) => {
  try {
    const penjualan = await Penjualan.find({ deletedAt: null }).sort({
      createdAt: 1,
    });

    const enhancedPenjualan = [];
    for (const item of penjualan) {
      const header = await HeaderPenjualan.findOne({
        header_penjualan_id: item.header_penjualan_id,
        deletedAt: null,
      });

      if (header) {
        const menu = await Menu.findOne({
          menu_id: item.menu_id,
          deletedAt: null,
        });
        const pegawai = await Pegawai.findOne({
          pegawai_id: header.pegawai_id,
          deletedAt: null,
        });

        enhancedPenjualan.push({
          ...item.toObject(),
          header: header.toObject(),
          menu: menu ? menu.toObject() : null,
          pegawai: pegawai ? pegawai.toObject() : null,
        });
      }
    }

    const groupedData = {};

    enhancedPenjualan.forEach((item) => {
      const pesananNama = "Walk-in";
      const key = `${item.header_penjualan_id}`;

      if (!groupedData[key]) {
        groupedData[key] = {
          header_penjualan_id: item.header_penjualan_id,
          tanggal: item.header.header_penjualan_tanggal,
          jenis: item.header.header_penjualan_jenis,
          biaya_tambahan: item.header.header_penjualan_biaya_tambahan || 0,
          persentase_dp: item.header.header_penjualan_uang_muka || 0,
          pegawai_id: item.header.pegawai_id,
          pegawai_nama: item.pegawai?.pegawai_nama,
          pesanan_nama: [],
          items: [],
        };
      }

      if (!groupedData[key].pesanan_nama.includes(pesananNama)) {
        groupedData[key].pesanan_nama.push(pesananNama);
      }

      groupedData[key].items.push({
        penjualan_id: item.penjualan_id,
        menu_id: item.menu_id,
        menu_nama: item.menu?.menu_nama,
        menu_harga: item.menu?.menu_harga,
        penjualan_jumlah: item.penjualan_jumlah,
        pesanan_nama: pesananNama,
        subtotal: (item.menu?.menu_harga || 0) * item.penjualan_jumlah,
      });
    });

    const transformedData = Object.values(groupedData).map((group) => {
      const totalSubtotal = group.items.reduce(
        (sum, item) => sum + item.subtotal,
        0
      );
      const totalBiayaTambahan = group.biaya_tambahan || 0;
      const persentaseDP = group.persentase_dp || 0;

      const totalDP = totalSubtotal * (persentaseDP / 100);
      const grandTotal = totalSubtotal + totalBiayaTambahan;
      const sisaPembayaran = grandTotal - totalDP;

      return {
        header_penjualan_id: group.header_penjualan_id,
        pesanan_nama: group.pesanan_nama,
        pegawai_id: group.pegawai_id,
        pegawai_nama: group.pegawai_nama,
        tanggal: group.tanggal,
        jenis: group.jenis,
        items: group.items,
        totalSubtotal,
        totalBiayaTambahan,
        persentaseDP,
        totalDP,
        grandTotal,
        sisaPembayaran,
      };
    });

    return res.status(200).json({
      message: "Berhasil mengambil laporan penjualan",
      data: transformedData,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Gagal mengambil laporan penjualan",
      error: err.message,
    });
  }
};

const getLaporanPembelian = async (req, res) => {
  try {
    const pembelian = await Pembelian.find({ deletedAt: null }).sort({
      createdAt: 1,
    });

    const transformedData = await Promise.all(
      pembelian.map(async (item) => {
        const bahanBaku = await BahanBaku.findOne({
          bahan_baku_id: item.bahan_baku_id,
          deletedAt: null,
        });

        return {
          pembelian_id: item.pembelian_id,
          tanggal: item.createdAt,
          bahan_baku_id: item.bahan_baku_id,
          bahan_baku_nama: bahanBaku?.bahan_baku_nama,
          pembelian_jumlah: item.pembelian_jumlah,
          pembelian_satuan: item.pembelian_satuan,
          pembelian_harga_satuan: item.pembelian_harga_satuan,
          subtotal: item.pembelian_jumlah * item.pembelian_harga_satuan,
          bahan_baku_jumlah: bahanBaku?.bahan_baku_jumlah || 0,
        };
      })
    );

    return res.status(200).json({
      message: "Berhasil mengambil laporan pembelian",
      data: transformedData,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Gagal mengambil laporan pembelian",
      error: err.message,
    });
  }
};

const getLaporanPesanan = async (req, res) => {
  try {
    const pesananList = await Pesanan.find({ deletedAt: null }).sort({
      createdAt: 1,
    });

    const transformedData = await Promise.all(
      pesananList.map(async (pes) => {
        const details = await PesananDetail.find({
          pesanan_id: pes.pesanan_id,
          deletedAt: null,
        });

        const pesananItems = await Promise.all(
          details.map(async (detail) => {
            const menu = await Menu.findOne({
              menu_id: detail.menu_id,
              deletedAt: null,
            });

            return {
              menu_id: detail.menu_id,
              menu_nama: menu?.menu_nama || null,
              menu_harga: menu?.menu_harga || 0,
              pesanan_detail_jumlah: detail.pesanan_detail_jumlah,
              subtotal: (menu?.menu_harga || 0) * detail.pesanan_detail_jumlah,
            };
          })
        );

        const totalSubtotal = pesananItems.reduce(
          (sum, item) => sum + item.subtotal,
          0
        );

        return {
          pesanan_id: pes.pesanan_id,
          pesanan_nama: pes.pesanan_nama,
          pesanan_email: pes.pesanan_email,
          pesanan_lokasi: pes.pesanan_lokasi,
          pesanan_status: pes.pesanan_status,
          tanggal: pes.pesanan_tanggal,
          tanggal_pengiriman: pes.pesanan_tanggal_pengiriman,
          items: pesananItems,
          total: totalSubtotal,
        };
      })
    );

    return res.status(200).json({
      message: "Berhasil mengambil laporan pesanan",
      data: transformedData,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Gagal mengambil laporan pesanan",
      error: err.message,
    });
  }
};

module.exports = {
  getLaporanPenjualan,
  getLaporanPembelian,
  getLaporanPesanan,
};
