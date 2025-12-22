import "../css/pegawai/Pesanan.css";

import React, { useEffect, useState } from "react";
import { DataTable } from "mantine-datatable";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { useForm } from "react-hook-form";
import { useSetState } from "@mantine/hooks";

const Pesanan = () => {
  const API_BASE = import.meta.env.VITE_API_BASE;
  const navigate = useNavigate();
  const userToken = useSelector((state) => state.user.userToken);

  // form handling
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = (data) => {
    setShowPassPanel(false);
    reset();
    const result = {
      password: data.password,
      pesan: data.pesan,
      token: userToken,
    };
    cekPass(result);
    console.log("Pesan Jalan");
  };

  const cekPass = async (result) => {
    try {
      const res = await axios.post(
        `${API_BASE}/api/pesanan_detail/detail/passcek`,
        result
      );
      if (res.data.status) {
        let userIDNama = `[${res.data.data.pegawai_id}][${res.data.data.pegawai_nama}] : `;

        // Check if current status is "diproses" before adding to header and detail
        const currentPesanan = allDetailMenu.find(
          (p) => p.pesanan_id === idRubah
        );

        if (currentPesanan && currentPesanan.pesanan_status === "diproses") {
          const stockValidation = await validateStokBahanBaku(
            idRubah,
            currentPesanan
          );

          if (!stockValidation.isValid) {
            // Jika stok tidak mencukupi, tampilkan error
            showStockErrorModal(stockValidation.errors);
            return;
          }

          await addToHeaderAndDetail(idRubah, currentPesanan);
        }

        nowChangePesananStatus(result.pesan, userIDNama);
        console.log("Berhasil Cek Pass : " + userIDNama);
      } else {
        window.alert("Password Anda Salah !!!");
      }
    } catch (error) {
      console.error(error);
      window.alert("Terjadi kesalahan saat verifikasi password");
    }
  };

  // === VALIDASI STOK BAHAN BAKU ===
  const validateStokBahanBaku = async (pesananId, pesananData) => {
    try {
      // Get detailed order menu data
      const detailRes = await axios.get(
        `${API_BASE}/api/pesanan_detail/detail/showdetail/${pesananId}`
      );

      const orderDetails = detailRes.data;
      const errors = [];

      // For each menu item in the order
      for (const item of orderDetails) {
        const menuId = item.menu_id;
        const quantityOrdered = item.pesanan_detail_jumlah;

        try {
          // Get menu ingredients
          const menuResponse = await axios.get(
            `${API_BASE}/api/menu_management/detail/${menuId}`,
            {
              headers: { "x-auth-token": userToken },
            }
          );

          if (menuResponse.data && menuResponse.data.data) {
            // Get all bahan baku untuk cek stok
            const bahanBakuResponse = await axios.get(
              `${API_BASE}/api/bahan_Baku`,
              {
                headers: { "x-auth-token": userToken },
              }
            );

            const allBahanBaku = bahanBakuResponse.data;

            // Check each ingredient
            for (const ingredient of menuResponse.data.data) {
              const bahanBaku = allBahanBaku.find(
                (bb) => bb.bahan_baku_nama === ingredient.detail_menu_nama_bahan
              );

              const requiredAmount =
                ingredient.detail_menu_jumlah * quantityOrdered;
              const availableStock = bahanBaku?.bahan_baku_jumlah || 0;

              if (availableStock < requiredAmount) {
                errors.push({
                  menu_nama: item.menu.menu_nama,
                  bahan_baku_nama: ingredient.detail_menu_nama_bahan,
                  required: requiredAmount,
                  available: availableStock,
                  satuan: ingredient.detail_menu_satuan,
                  kurang: requiredAmount - availableStock,
                });
              }
            }
          }
        } catch (err) {
          console.error(`Error validating menu ${menuId}:`, err);
          errors.push({
            menu_nama: item.menu.menu_nama,
            error: "Gagal mengecek stok bahan baku",
          });
        }
      }

      return {
        isValid: errors.length === 0,
        errors: errors,
      };
    } catch (error) {
      console.error("Error during stock validation:", error);
      return {
        isValid: false,
        errors: [{ error: "Gagal melakukan validasi stok" }],
      };
    }
  };

  // === TAMPILKAN MODAL ERROR STOK ===
  const showStockErrorModal = (errors) => {
    const errorMessage = errors
      .map((err) => {
        if (err.error) {
          return `• ${err.error}`;
        }
        return `• Menu: ${err.menu_nama}\n  Bahan: ${err.bahan_baku_nama}\n  Dibutuhkan: ${err.required} ${err.satuan}, Tersedia: ${err.available} ${err.satuan}\n  Kurang: ${err.kurang} ${err.satuan}`;
      })
      .join("\n\n");

    window.alert(
      `❌ STOK BAHAN BAKU TIDAK MENCUKUPI!\n\nDetail:\n${errorMessage}\n\nSilakan periksa dan perbarui stok di menu Manajemen Stok sebelum melanjutkan.`
    );
  };

  // Add to header_penjualan and detail_penjualan
  const addToHeaderAndDetail = async (pesananId, pesananData) => {
    try {
      // Get detailed order menu data
      const detailRes = await axios.get(
        `${API_BASE}/api/pesanan_detail/detail/showdetail/${pesananId}`
      );

      const orderDetails = detailRes.data;

      // Calculate total
      let total = 0;
      orderDetails.forEach((item) => {
        total += item.pesanan_detail_jumlah * item.menu.menu_harga;
      });

      const biayaTambahan = total * 0.1; // 10% dari total
      const uangMuka = 50; // 50% dari total

      // Create header payload
      const tanggalDibuat =
        pesananData.data[0]?.pesanan?.pesanan_tanggal ||
        new Date().toISOString();
      const tanggalDiantar =
        pesananData.data[0]?.pesanan?.pesanan_tanggal_pengiriman || "-";

      const keterangan = `Pesanan atas nama ${
        pesananData.pesanan_nama
      } dengan id ${pesananId} dibuat tanggal ${perapiTanggal(
        tanggalDibuat
      )} diantar pada ${perapiTanggal(tanggalDiantar)}`;

      const headerPayload = {
        header_penjualan_tanggal: new Date().toISOString(),
        header_penjualan_jenis: "online",
        header_penjualan_keterangan: keterangan,
        header_penjualan_biaya_tambahan: biayaTambahan,
        header_penjualan_uang_muka: uangMuka,
      };

      // Insert header
      const headerRes = await axios.post(
        `${API_BASE}/api/detail_penjualan/header`,
        headerPayload,
        {
          headers: { "x-auth-token": userToken },
        }
      );

      const headerId = headerRes.data.data.header_penjualan_id;

      // Insert each detail
      for (const item of orderDetails) {
        await axios.post(
          `${API_BASE}/api/detail_penjualan/detail`,
          {
            header_penjualan_id: parseInt(headerId),
            menu_id: item.menu_id,
            penjualan_jumlah: item.pesanan_detail_jumlah,
          },
          {
            headers: { "x-auth-token": userToken },
          }
        );
      }

      window.alert(
        "✓ Berhasil menambah header_penjualan dan detail_penjualan ke laporan keuangan"
      );
    } catch (error) {
      console.error("Error adding to header and detail:", error);
      window.alert("❌ Gagal menambahkan ke database penjualan!");
    }
  };

  // state utama
  const [allDetailMenu, setAllDetailMenu] = useState([]);
  const [showPassPanel, setShowPassPanel] = useState(false);
  const [idRubah, setIdRubah] = useState(null);
  const [pesan, setpesan] = useState("");

  // sorting mantine
  const [sortStatus, setSortStatus] = useState({
    columnAccessor: "pesanan_id",
    direction: "asc",
  });

  // cek login
  useEffect(() => {
    cekSudahLogin();
  }, []);

  const cekSudahLogin = () => {
    if (!userToken) {
      navigate("/pegawai");
    } else {
      getDataDetailPesanan();
    }
  };

  // ambil data
  const getDataDetailPesanan = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/pesanan_detail/detail/showspesifik`
      );

      const sorted = res.data.sort((a, b) => {
        if (a.pesanan_status === "terkirim" && b.pesanan_status !== "terkirim")
          return 1;
        if (a.pesanan_status !== "terkirim" && b.pesanan_status === "terkirim")
          return -1;
        return 0;
      });

      setAllDetailMenu(sorted);
    } catch (error) {
      console.error(error);
    }
  };

  // format tanggal
  const perapiTanggal = (tanggal) => {
    if (!tanggal) return "-";
    const bulanIndo = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    const d = new Date(tanggal);
    const jam = d.getHours().toString().padStart(2, "0");
    const menit = d.getMinutes().toString().padStart(2, "0");
    return `${d.getDate()} ${
      bulanIndo[d.getMonth()]
    } ${d.getFullYear()}  ${jam}:${menit} `;
  };

  // panel password
  const cancelChangeStatus = () => {
    reset();
    setShowPassPanel(false);
  };

  const PasswordPanel = () => {
    if (!showPassPanel) return null;
    return (
      <div className="passPanel">
        <div className="passPanelForm">
          <form onSubmit={handleSubmit(onSubmit)}>
            <h3 style={{ color: "black" }}>Masukan Password dan Pesan</h3>
            <span style={{ color: "black" }}>Password :</span>
            <input
              type="password"
              className="inputBarPASS"
              {...register("password")}
              required
            />

            {/* Masukin Pesan Di Sini */}
            <span style={{ color: "black" }}>Pesan :</span>
            <textarea
              className="textPesan"
              placeholder="*catatan: id dan nama anda akan tercatat dalam pesan"
              {...register("pesan")}
              required
            />

            <button
              type="button"
              className="buttonStyling cm"
              onClick={cancelChangeStatus}>
              Cancel
            </button>
            <button type="submit" className="buttonStyling cm">
              Send
            </button>
          </form>
        </div>
      </div>
    );
  };

  const nowChangePesananStatus = async (pesan, userInfo) => {
    try {
      console.log(`Pesan : ${pesan} || UserInfo : ${userInfo}`);

      await axios.post(
        `${API_BASE}/api/pesanan_detail/detail/update/${idRubah}`,
        { pesan, userInfo }
      );
      getDataDetailPesanan();
      setIdRubah(null);
    } catch (error) {
      console.error(error);
    }
  };

  // update status
  const updateStatusPesanan = (id, status) => {
    if (status === "terkirim") {
      window.alert("Pesanan Telah Terkirim");
    } else {
      setShowPassPanel(true);
      setIdRubah(id);
    }
  };

  // buat itung subtotal
  const pesananDetailTotal = (id_pesanan) => {
    let total = 0;
    const pesanan = allDetailMenu.find((p) => p.pesanan_id === id_pesanan);
    if (!pesanan) return 0;
    pesanan.data.forEach((item) => {
      total += item.pesanan_detail_jumlah * item.menu.menu_harga;
    });
    return total;
  };

  // lihat detail
  const lihatDetailPesanan = (id) => {
    navigate(`/pegawai/pesanan/${id}`);
  };

  const lihatPesan = (id_pesan) => {
    setpesan(id_pesan);
  };

  const renderPesan = () => {
    if (pesan != "") {
      return (
        <div className="pesan">
          <div className="panelPesan">
            <h2>Pesan</h2>
            <div className="textfield">
              {!pesan ? "(Belum Ada Pesan)" : pesan}
            </div>
            <button
              type="button"
              className="buttonStyling cm"
              onClick={() => setpesan("")}>
              Cancel
            </button>
          </div>
        </div>
      );
    }
  };

  // ========= SORTING OTOMATIS (Mantine) =========

  const sortedRecords = React.useMemo(() => {
    const data = [...allDetailMenu];

    const col = sortStatus.columnAccessor;
    const dir = sortStatus.direction;

    data.sort((a, b) => {
      let A, B;

      // nested key handler
      switch (col) {
        case "email":
          A = a.data[0].pesanan.pesanan_email;
          B = b.data[0].pesanan.pesanan_email;
          break;
        case "tanggal_dibuat":
          A = new Date(a.data[0].pesanan.pesanan_tanggal);
          B = new Date(b.data[0].pesanan.pesanan_tanggal);
          break;
        case "tanggal_kirim":
          A = new Date(a.data[0].pesanan.pesanan_tanggal_pengiriman);
          B = new Date(b.data[0].pesanan.pesanan_tanggal_pengiriman);
          break;
        case "subtotal":
          A = pesananDetailTotal(a.pesanan_id);
          B = pesananDetailTotal(b.pesanan_id);
          break;

        default:
          A = a[col];
          B = b[col];
      }

      if (A < B) return dir === "asc" ? -1 : 1;
      if (A > B) return dir === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [allDetailMenu, sortStatus]);

  // warna tombol
  const setColor = (status) => {
    if (status === "pending") return { backgroundColor: "red" };
    if (status === "diproses") return { backgroundColor: "orange" };
    if (status === "terkirim") return { backgroundColor: "green" };
    return { backgroundColor: "gray" };
  };

  return (
    <>
      {PasswordPanel()}
      {renderPesan()}
      <div>
        <div className="barTitle">
          <h2>Dalam Proses</h2>
        </div>

        <DataTable
          withBorder
          borderRadius="md"
          striped
          highlightOnHover
          records={sortedRecords}
          sortStatus={sortStatus}
          onSortStatusChange={setSortStatus}
          noRecordsText=""
          noRecordsIcon={<></>}
          // === Kolomnya ===
          columns={[
            { accessor: "pesanan_id", title: "ID_Pesanan", sortable: true },
            { accessor: "pesanan_nama", title: "Atas_Nama", sortable: true },

            {
              accessor: "pesanan_status",
              title: "Status",
              sortable: true,
              render: (d) => (
                <button
                  className="buttonStyling"
                  style={setColor(d.pesanan_status)}
                  onClick={() =>
                    updateStatusPesanan(d.pesanan_id, d.pesanan_status)
                  }>
                  {d.pesanan_status}
                </button>
              ),
            },

            {
              accessor: "email",
              title: "Email",
              sortable: true,
              render: (d) => d.data[0].pesanan.pesanan_email,
            },
            {
              accessor: "Telpon",
              title: "Telpon",
              sortable: false,
              render: (d) => d.data[0].pesanan.nomer_telpon,
            },

            {
              accessor: "tanggal_dibuat",
              title: "Pesanan_Dibuat",
              sortable: true,
              render: (d) => perapiTanggal(d.data[0].pesanan.pesanan_tanggal),
            },

            {
              accessor: "tanggal_kirim",
              title: "Pesanan_Diantar",
              sortable: true,
              render: (d) =>
                perapiTanggal(d.data[0].pesanan.pesanan_tanggal_pengiriman),
            },
            {
              accessor: "pesan",
              title: "Pesan",
              render: (d) => (
                <button
                  className="buttonStyling lime"
                  onClick={() => lihatPesan(d.data[0].pesanan.pesan)}>
                  Lihat Pesan
                </button>
              ),
            },
            {
              accessor: "detail",
              title: "Detail_Pesanan",
              render: (d) => (
                <button
                  className="buttonStyling sky"
                  onClick={() => lihatDetailPesanan(d.pesanan_id)}>
                  Lihat Detail
                </button>
              ),
            },
            {
              accessor: "subtotal",
              title: "Subtotal",
              sortable: true,
              render: (d) => pesananDetailTotal(d.pesanan_id),
            },
          ]}
        />
      </div>
    </>
  );
};

export default Pesanan;
