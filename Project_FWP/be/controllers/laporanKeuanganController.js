const {
  filterLaporanSchema,
} = require("../validations/laporanKeuanganValidation");
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
    const { tanggal_awal, tanggal_akhir, jam_awal, jam_akhir, nama } =
      req.query;

    let whereHeader = {};

    if (tanggal_awal || tanggal_akhir) {
      whereHeader.header_penjualan_tanggal = {};
      if (tanggal_awal) {
        const startTime = jam_awal ? `${jam_awal}:00:00` : "00:00:00";
        const [year, month, day] = tanggal_awal.split("-");
        whereHeader.header_penjualan_tanggal.$gte = new Date(
          `${year}-${month}-${day}T${startTime}`
        );
      }
      if (tanggal_akhir) {
        const endTime = jam_akhir ? `${jam_akhir}:59:59` : "23:59:59";
        const [year, month, day] = tanggal_akhir.split("-");
        whereHeader.header_penjualan_tanggal.$lte = new Date(
          `${year}-${month}-${day}T${endTime}`
        );
      }
    }

    // Add deletedAt filter
    whereHeader.deletedAt = null;

    const penjualan = await Penjualan.find({
      deletedAt: null,
    }).sort({ createdAt: 1 });

    // Filter and enhance dengan header data
    const filteredPenjualan = [];
    for (const item of penjualan) {
      const header = await HeaderPenjualan.findOne({
        header_penjualan_id: item.header_penjualan_id,
        deletedAt: null,
      });

      if (header) {
        // Check date filter
        let passDateFilter = true;
        if (tanggal_awal || tanggal_akhir) {
          const headerDate = new Date(header.header_penjualan_tanggal);
          if (tanggal_awal) {
            const startTime = jam_awal ? `${jam_awal}:00:00` : "00:00:00";
            const [year, month, day] = tanggal_awal.split("-");
            const startDate = new Date(`${year}-${month}-${day}T${startTime}`);
            if (headerDate < startDate) passDateFilter = false;
          }
          if (tanggal_akhir) {
            const endTime = jam_akhir ? `${jam_akhir}:59:59` : "23:59:59";
            const [year, month, day] = tanggal_akhir.split("-");
            const endDate = new Date(`${year}-${month}-${day}T${endTime}`);
            if (headerDate > endDate) passDateFilter = false;
          }
        }

        if (passDateFilter) {
          const menu = await Menu.findOne({
            menu_id: item.menu_id,
            deletedAt: null,
          });
          const pegawai = await Pegawai.findOne({
            pegawai_id: header.pegawai_id,
            deletedAt: null,
          });

          filteredPenjualan.push({
            ...item.toObject(),
            header: header.toObject(),
            menu: menu ? menu.toObject() : null,
            pegawai: pegawai ? pegawai.toObject() : null,
          });
        }
      }
    }

    const groupedData = {};

    filteredPenjualan.forEach((item) => {
      const pesananNama = "Walk-in"; // Default for penjualan
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

    let transformedData = Object.values(groupedData).map((group) => {
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
        items: group.items.map((item) => {
          return {
            penjualan_id: item.penjualan_id,
            menu_id: item.menu_id,
            menu_nama: item.menu_nama,
            menu_harga: item.menu_harga,
            penjualan_jumlah: item.penjualan_jumlah,
            pesanan_nama: item.pesanan_nama,
            subtotal: item.subtotal,
          };
        }),
        totalSubtotal,
        totalBiayaTambahan,
        persentaseDP,
        totalDP,
        grandTotal,
        sisaPembayaran,
      };
    });

    if (nama) {
      transformedData = transformedData.filter((item) =>
        item.pesanan_nama.some((name) =>
          name?.toLowerCase().includes(nama.toLowerCase())
        )
      );
    }

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
    const { tanggal_awal, tanggal_akhir, jam_awal, jam_akhir, bahan_baku_id } =
      req.query;

    let whereClause = { deletedAt: null };

    if (tanggal_awal || tanggal_akhir) {
      whereClause.createdAt = {};
      if (tanggal_awal) {
        const startTime = jam_awal ? `${jam_awal}:00:00` : "00:00:00";
        const [year, month, day] = tanggal_awal.split("-");
        whereClause.createdAt.$gte = new Date(
          `${year}-${month}-${day}T${startTime}`
        );
      }
      if (tanggal_akhir) {
        const endTime = jam_akhir ? `${jam_akhir}:59:59` : "23:59:59";
        const [year, month, day] = tanggal_akhir.split("-");
        whereClause.createdAt.$lte = new Date(
          `${year}-${month}-${day}T${endTime}`
        );
      }
    }

    // Only add bahan_baku_id filter if it's not null/undefined/empty
    if (bahan_baku_id && bahan_baku_id !== "null" && bahan_baku_id !== "") {
      whereClause.bahan_baku_id = parseInt(bahan_baku_id);
    }

    const pembelian = await Pembelian.find(whereClause).sort({
      createdAt: 1,
    });

    // Enhance dengan bahan_baku data
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

// Get Laporan Pesanan
const getLaporanPesanan = async (req, res) => {
  try {
    const { tanggal_awal, tanggal_akhir, jam_awal, jam_akhir, nama, menu_id } =
      req.query;

    console.log("Query params received:", {
      tanggal_awal,
      tanggal_akhir,
      jam_awal,
      jam_akhir,
      nama,
      menu_id,
    });

    let wherePesanan = {};
    let whereDetail = {};

    // Filter by pesanan_tanggal_pengiriman (delivery date)
    if (tanggal_awal || tanggal_akhir) {
      wherePesanan.pesanan_tanggal_pengiriman = {};
      if (tanggal_awal) {
        const startTime = jam_awal ? ` ${jam_awal}:00` : " 00:00:00";
        wherePesanan.pesanan_tanggal_pengiriman[Op.gte] = new Date(
          tanggal_awal + startTime
        );
      }
      if (tanggal_akhir) {
        const endTime = jam_akhir ? ` ${jam_akhir}:59` : " 23:59:59";
        wherePesanan.pesanan_tanggal_pengiriman[Op.lte] = new Date(
          tanggal_akhir + endTime
        );
      }
    }

    // FIX: Gunakan Op.like untuk MySQL, bukan Op.iLike
    if (
      nama &&
      String(nama).trim() !== "" &&
      String(nama) !== "null" &&
      String(nama) !== "undefined"
    ) {
      wherePesanan.pesanan_nama = {
        [Op.like]: `%${String(nama).trim()}%`, // Ubah dari Op.iLike ke Op.like
      };
      console.log("Applied nama filter:", wherePesanan.pesanan_nama);
    }

    // FIX: Properly check if menu_id exists and is not null/empty
    if (
      menu_id &&
      String(menu_id).trim() !== "" &&
      String(menu_id) !== "null" &&
      String(menu_id) !== "undefined"
    ) {
      whereDetail.menu_id = menu_id;
    }

    console.log("Final wherePesanan:", wherePesanan);
    console.log("Final whereDetail:", whereDetail);

    const pesanan = await Pesanan.findAll({
      where: Object.keys(wherePesanan).length > 0 ? wherePesanan : undefined,
      include: [
        {
          model: PesananDetail,
          as: "details",
          where: Object.keys(whereDetail).length > 0 ? whereDetail : undefined,
          include: [
            {
              model: Menu,
              as: "menu",
            },
          ],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    const transformedData = pesanan.map((pes) => {
      const pesananItems = pes.details.map((detail) => ({
        menu_id: detail.menu_id,
        menu_nama: detail.menu?.menu_nama,
        menu_harga: detail.menu?.menu_harga,
        pesanan_detail_jumlah: detail.pesanan_detail_jumlah,
        subtotal: (detail.menu?.menu_harga || 0) * detail.pesanan_detail_jumlah,
      }));

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
    });

    console.log("Transformed data count:", transformedData.length);

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

// Get All Laporan
const getAllLaporan = async (req, res) => {
  try {
    const { tanggal_awal, tanggal_akhir, menu_id, bahan_baku_id } = req.query;

    // Get all three reports
    const [penjualanRes, pembelianRes, pesananRes] = await Promise.all([
      getLaporanPenjualanData(tanggal_awal, tanggal_akhir, menu_id),
      getLaporanPembelianData(tanggal_awal, tanggal_akhir, bahan_baku_id),
      getLaporanPesananData(tanggal_awal, tanggal_akhir, menu_id),
    ]);

    return res.status(200).json({
      message: "Berhasil mengambil semua laporan",
      data: {
        penjualan: penjualanRes,
        pembelian: pembelianRes,
        pesanan: pesananRes,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Gagal mengambil laporan",
      error: err.message,
    });
  }
};

// Helper functions
const getLaporanPenjualanData = async (
  tanggal_awal,
  tanggal_akhir,
  menu_id
) => {
  let whereClause = {};
  let whereHeader = {};

  if (tanggal_awal || tanggal_akhir) {
    whereHeader.header_penjualan_tanggal = {};
    if (tanggal_awal) {
      whereHeader.header_penjualan_tanggal[Op.gte] = new Date(tanggal_awal);
    }
    if (tanggal_akhir) {
      whereHeader.header_penjualan_tanggal[Op.lte] = new Date(tanggal_akhir);
    }
  }

  if (menu_id) {
    whereClause.menu_id = menu_id;
  }

  const penjualan = await Penjualan.findAll({
    include: [
      {
        model: HeaderPenjualan,
        as: "header",
        where: Object.keys(whereHeader).length > 0 ? whereHeader : undefined,
        include: [
          {
            model: Pegawai,
            as: "pegawai",
          },
        ],
      },
      {
        model: Menu,
        as: "menu",
      },
    ],
    order: [["createdAt", "ASC"]],
  });

  // Get all pesanan details to map menu to pesanan
  const pesananDetails = await PesananDetail.findAll({
    include: [
      {
        model: Pesanan,
        as: "pesanan",
      },
    ],
  });

  // Create a map of menu_id to pesanan_nama
  const menuToPesananMap = {};
  pesananDetails.forEach((detail) => {
    if (!menuToPesananMap[detail.menu_id]) {
      menuToPesananMap[detail.menu_id] = detail.pesanan?.pesanan_nama;
    }
  });

  // Group by header_penjualan_id only
  const groupedData = {};

  penjualan.forEach((item) => {
    const pesananNama = menuToPesananMap[item.menu_id] || "unknown";
    const key = `${item.header_penjualan_id}`;

    if (!groupedData[key]) {
      groupedData[key] = {
        header_penjualan_id: item.header_penjualan_id,
        tanggal: item.header?.header_penjualan_tanggal,
        jenis: item.header?.header_penjualan_jenis,
        biaya_tambahan: item.header?.header_penjualan_biaya_tambahan || 0,
        persentase_dp: item.header?.header_penjualan_uang_muka || 0,
        pegawai_id: item.header?.pegawai_id,
        pegawai_nama: item.header?.pegawai?.pegawai_nama,
        pesanan_nama: [],
        items: [],
      };
    }

    // Add pesanan_nama if not already in array
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

  // Transform grouped data
  return Object.values(groupedData).map((group) => {
    const totalMenu = group.items.reduce((sum, item) => sum + item.subtotal, 0);
    const biayaTambahan = group.biaya_tambahan || 0;
    const persentaseDP = group.persentase_dp || 0;

    const totalSebelumDP = totalMenu + biayaTambahan;
    const totalUangMuka = totalSebelumDP * (persentaseDP / 100);
    const grandTotal = totalSebelumDP - totalUangMuka;

    return {
      header_penjualan_id: group.header_penjualan_id,
      pesanan_nama: group.pesanan_nama,
      pegawai_id: group.pegawai_id,
      pegawai_nama: group.pegawai_nama,
      tanggal: group.tanggal,
      jenis: group.jenis,
      items: group.items.map((item) => {
        return {
          penjualan_id: item.penjualan_id,
          menu_id: item.menu_id,
          menu_nama: item.menu_nama,
          menu_harga: item.menu_harga,
          penjualan_jumlah: item.penjualan_jumlah,
          pesanan_nama: item.pesanan_nama,
          subtotal: item.subtotal,
        };
      }),
      totalMenu,
      biayaTambahan,
      persentaseDP,
      totalSebelumDP,
      totalUangMuka,
      grandTotal,
    };
  });
};

const getLaporanPembelianData = async (
  tanggal_awal,
  tanggal_akhir,
  bahan_baku_id
) => {
  let whereClause = {};

  if (tanggal_awal || tanggal_akhir) {
    whereClause.createdAt = {};
    if (tanggal_awal) {
      whereClause.createdAt[Op.gte] = new Date(tanggal_awal);
    }
    if (tanggal_akhir) {
      whereClause.createdAt[Op.lte] = new Date(tanggal_akhir);
    }
  }

  if (bahan_baku_id) {
    whereClause.bahan_baku_id = bahan_baku_id;
  }

  const pembelian = await Pembelian.findAll({
    where: whereClause,
    include: [
      {
        model: BahanBaku,
        as: "bahan_baku",
      },
    ],
    order: [["createdAt", "ASC"]],
  });

  return pembelian.map((item) => ({
    pembelian_id: item.pembelian_id,
    tanggal: item.createdAt,
    bahan_baku_id: item.bahan_baku_id,
    bahan_baku_nama: item.bahan_baku?.bahan_baku_nama,
    pembelian_jumlah: item.pembelian_jumlah,
    pembelian_satuan: item.pembelian_satuan,
    pembelian_harga_satuan: item.pembelian_harga_satuan,
    subtotal: item.pembelian_jumlah * item.pembelian_harga_satuan,
    bahan_baku_jumlah: item.bahan_baku?.bahan_baku_jumlah || 0, // Current stock after deduction
  }));
};

const getLaporanPesananData = async (tanggal_awal, tanggal_akhir, menu_id) => {
  let wherePesanan = {};
  let whereDetail = {};

  // Filter by pesanan_tanggal_pengiriman (delivery date)
  if (tanggal_awal || tanggal_akhir) {
    wherePesanan.pesanan_tanggal_pengiriman = {};
    if (tanggal_awal) {
      wherePesanan.pesanan_tanggal_pengiriman[Op.gte] = new Date(tanggal_awal);
    }
    if (tanggal_akhir) {
      wherePesanan.pesanan_tanggal_pengiriman[Op.lte] = new Date(tanggal_akhir);
    }
  }

  if (menu_id && String(menu_id).trim() !== "") {
    whereDetail.menu_id = menu_id;
  }

  const pesanan = await Pesanan.findAll({
    where: Object.keys(wherePesanan).length > 0 ? wherePesanan : undefined,
    include: [
      {
        model: PesananDetail,
        as: "details",
        where: Object.keys(whereDetail).length > 0 ? whereDetail : undefined,
        include: [
          {
            model: Menu,
            as: "menu",
          },
        ],
      },
    ],
    order: [["createdAt", "ASC"]],
  });

  const transformedData = [];

  pesanan.forEach((pes) => {
    const pesananItems = pes.details.map((detail) => ({
      menu_id: detail.menu_id,
      menu_nama: detail.menu?.menu_nama,
      menu_harga: detail.menu?.menu_harga,
      pesanan_detail_jumlah: detail.pesanan_detail_jumlah,
      subtotal: (detail.menu?.menu_harga || 0) * detail.pesanan_detail_jumlah,
    }));

    const totalSubtotal = pesananItems.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    transformedData.push({
      pesanan_id: pes.pesanan_id,
      pesanan_nama: pes.pesanan_nama,
      pesanan_email: pes.pesanan_email,
      pesanan_lokasi: pes.pesanan_lokasi,
      pesanan_status: pes.pesanan_status,
      tanggal: pes.pesanan_tanggal,
      tanggal_pengiriman: pes.pesanan_tanggal_pengiriman,
      items: pesananItems,
      total: totalSubtotal,
    });
  });

  return transformedData;
};

module.exports = {
  getLaporanPenjualan,
  getLaporanPembelian,
  getLaporanPesanan,
  getAllLaporan,
};
