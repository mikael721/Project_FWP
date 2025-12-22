import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Stack,
  Text,
  Button,
  Group,
  Divider,
  Radio,
  TextInput,
  NumberInput,
  Table,
  Paper,
  LoadingOverlay,
  Modal,
} from "@mantine/core";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
} from "../../slice + storage/cartSlice";
import axios from "axios";

export const DetailPenjualanPage = () => {
  const API_BASE = import.meta.env.VITE_API_BASE;

  const { id } = useParams(); // Ambil header_penjualan_id dari URL
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);

  const [loading, setLoading] = useState(false);
  const [headerData, setHeaderData] = useState(null);
  const [detailData, setDetailData] = useState([]);
  const [jenisPenjualan, setJenisPenjualan] = useState("offline");
  const [keterangan, setKeterangan] = useState("");
  const [biayaTambahan, setBiayaTambahan] = useState(0);
  const [uangMuka, setUangMuka] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [ingredientsByMenu, setIngredientsByMenu] = useState({}); // Store ingredients for each menu
  const [selectedMenuDetails, setSelectedMenuDetails] = useState(null); // Show details for a menu
  const [stockValidationErrors, setStockValidationErrors] = useState([]);
  const [insufficientStockModalOpen, setInsufficientStockModalOpen] =
    useState(false);

  // === FETCH DATA FROM DATABASE ===
  useEffect(() => {
    if (id) {
      fetchPenjualanData();
    }
  }, [id]);

  const userToken = useSelector((state) => state.user.userToken);

  // === Lifecycle ===
  useEffect(() => {
    cekSudahLogin();
  }, []);

  // === Cek login dan ambil data menu ===
  const cekSudahLogin = () => {
    if (!userToken) {
      navigate("/pegawai");
    }
  };

  const fetchPenjualanData = async () => {
    try {
      setLoading(true);

      // Fetch data penjualan berdasarkan header_penjualan_id
      const response = await axios.get(
        `${API_BASE}/api/detail_penjualan/${id}`,
        {
          headers: { "x-auth-token": userToken },
        }
      );

      console.log("Data penjualan:", response.data);

      if (response.data && response.data.data) {
        const data = response.data.data;
        setHeaderData(data);
        setDetailData(data.penjualans || []);

        // Set form values dari header data
        setJenisPenjualan(data.header_penjualan_jenis);
        setKeterangan(data.header_penjualan_keterangan);
        setBiayaTambahan(data.header_penjualan_biaya_tambahan);
        setUangMuka(data.header_penjualan_uang_muka);
      }
    } catch (err) {
      console.error("Gagal fetch data:", err.response?.data || err.message);
      alert("Gagal memuat data penjualan");
    } finally {
      setLoading(false);
    }
  };

  // === HANDLE JENIS PENJUALAN CHANGE ===
  const handleJenisPenjualanChange = (value) => {
    setJenisPenjualan(value);
    // Reset fields berdasarkan jenis
    if (value === "offline") {
      setUangMuka(0);
    } else {
      setUangMuka(0);
    }
  };

  // === UPDATE QUANTITY ===
  const updateQuantity = (menuId, newQuantity) => {
    if (newQuantity <= 0) {
      dispatch(removeCartItem(menuId));
    } else {
      dispatch(
        updateCartItemQuantity({
          menu_id: menuId,
          penjualan_jumlah: newQuantity,
        })
      );
    }
  };

  // === REMOVE FROM CART ===
  const removeFromCart = (menuId) => {
    dispatch(removeCartItem(menuId));
  };

  // === FETCH INGREDIENTS FOR A MENU ===
  const fetchMenuIngredients = async (menuId) => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/menu_management/detail/${menuId}`,
        {
          headers: { "x-auth-token": userToken },
        }
      );

      if (response.data && response.data.data) {
        // Fetch stock info for each ingredient
        const ingredientsWithStock = await Promise.all(
          response.data.data.map(async (ingredient) => {
            try {
              // Try to find bahan baku by matching the name
              const allBahanBaku = await axios.get(
                `${API_BASE}/api/bahan_Baku`,
                {
                  headers: { "x-auth-token": userToken },
                }
              );

              const bahanBaku = allBahanBaku.data.find(
                (bb) => bb.bahan_baku_nama === ingredient.detail_menu_nama_bahan
              );

              return {
                ...ingredient,
                bahan_baku_id: bahanBaku?.bahan_baku_id || null,
                bahan_baku_stock: bahanBaku?.bahan_baku_jumlah || 0,
                stockWarning: bahanBaku && bahanBaku.bahan_baku_jumlah === 0,
              };
            } catch (err) {
              console.error("Error fetching bahan baku:", err);
              return {
                ...ingredient,
                bahan_baku_id: null,
                bahan_baku_stock: 0,
                stockWarning: true,
              };
            }
          })
        );

        setIngredientsByMenu((prev) => ({
          ...prev,
          [menuId]: ingredientsWithStock,
        }));

        // Show selected menu details in modal
        setSelectedMenuDetails({
          menuId,
          ingredients: ingredientsWithStock,
          canOrder: true,
          warnings: [],
        });
      }
    } catch (err) {
      console.error(
        "Gagal fetch ingredients:",
        err.response?.data || err.message
      );
      alert(
        "Gagal memuat data bahan baku: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  // === CALCULATE TOTAL FROM DATABASE ===
  const calculateTotalFromDB = () => {
    if (!detailData || detailData.length === 0) return 0;

    return detailData.reduce((sum, item) => {
      const harga = item.menu?.menu_harga || 0;
      const jumlah = item.penjualan_jumlah || 0;
      return sum + harga * jumlah;
    }, 0);
  };

  // === CALCULATE TOTAL FROM CART ===
  const calculateTotalFromCart = () => {
    return cartItems.reduce(
      (sum, item) => sum + item.menu_harga * item.penjualan_jumlah,
      0
    );
  };

  // === GENERATE NOTA HTML ===
  const generateNotaHTML = () => {
    const totalDB = calculateTotalFromDB();
    const totalCart = calculateTotalFromCart();
    const totalKeseluruhan = totalDB + totalCart + (biayaTambahan || 0);

    const currentDate = new Date();
    const formattedCurrentDate = currentDate.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Combine detailData and cartItems for the table
    const allItems = [
      ...detailData.map((item) => ({
        name: item.menu?.menu_nama || "N/A",
        harga: item.menu?.menu_harga || 0,
        jumlah: item.penjualan_jumlah,
      })),
      ...cartItems.map((item) => ({
        name: item.menu_nama,
        harga: item.menu_harga,
        jumlah: item.penjualan_jumlah,
      })),
    ];

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Nota Penjualan #${id}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            color: #333;
            line-height: 1.6;
            padding: 20px;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #ddd;
            padding: 30px;
            background: #fff;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
          }
          .header h2 {
            font-size: 20px;
            color: #d32f2f;
            margin-bottom: 5px;
          }
          .invoice-number {
            font-size: 14px;
            color: #666;
          }
          .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            gap: 40px;
          }
          .info-section {
            flex: 1;
          }
          .info-section h3 {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
            text-transform: uppercase;
            color: #333;
          }
          .info-section p {
            font-size: 14px;
            margin-bottom: 5px;
          }
          .table-section {
            margin-bottom: 30px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background-color: #f5f5f5;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            border-bottom: 2px solid #333;
            font-size: 14px;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
            font-size: 14px;
          }
          tr:last-child td {
            border-bottom: 2px solid #333;
          }
          .text-right {
            text-align: right;
          }
          .summary {
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
          }
          .summary-content {
            width: 300px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
          }
          .summary-row.total {
            font-weight: bold;
            font-size: 18px;
            border-top: 2px solid #333;
            padding-top: 10px;
            color: #d32f2f;
          }
          .summary-row.biaya-tambahan {
            font-size: 14px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
          }
          .summary-row.uang-muka {
            font-size: 14px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .status {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            padding: 10px;
            border-radius: 4px;
            margin-top: 20px;
            text-align: center;
            font-weight: bold;
            color: #856404;
          }
          @media print {
            body {
              padding: 0;
            }
            .container {
              border: none;
              max-width: 100%;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>NOTA PENJUALAN</h1>
            <h2>#${id}</h2>
            <div class="invoice-number">Tanggal: ${formattedCurrentDate}</div>
          </div>

          <div class="invoice-info">
            <div class="info-section">
              <h3>Informasi Transaksi</h3>
              <p><strong>Header ID:</strong> ${id}</p>
              <p><strong>Jenis Penjualan:</strong> ${
                jenisPenjualan.charAt(0).toUpperCase() + jenisPenjualan.slice(1)
              }</p>
              ${
                keterangan
                  ? `<p><strong>Keterangan:</strong> ${keterangan}</p>`
                  : ""
              }
            </div>
          </div>

          <div class="table-section">
            <table>
              <thead>
                <tr>
                  <th>Produk</th>
                  <th class="text-right">Harga</th>
                  <th class="text-right">Jumlah</th>
                  <th class="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${allItems
                  .map(
                    (item) => `
                  <tr>
                    <td>${item.name}</td>
                    <td class="text-right">Rp ${item.harga.toLocaleString(
                      "id-ID"
                    )}</td>
                    <td class="text-right">${item.jumlah}</td>
                    <td class="text-right">Rp ${(
                      item.harga * item.jumlah
                    ).toLocaleString("id-ID")}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <div class="summary">
            <div class="summary-content">
              ${
                biayaTambahan > 0
                  ? `
                <div class="summary-row biaya-tambahan">
                  <span>Biaya Tambahan:</span>
                  <span>Rp ${biayaTambahan.toLocaleString("id-ID")}</span>
                </div>
              `
                  : ""
              }
              ${
                jenisPenjualan === "online" && uangMuka > 0
                  ? `
                <div class="summary-row uang-muka">
                  <span>Uang Muka (${uangMuka}%):</span>
                  <span>Rp ${(
                    ((totalDB + totalCart) * uangMuka) /
                    100
                  ).toLocaleString("id-ID")}</span>
                </div>
              `
                  : ""
              }
              <div class="summary-row total">
                <span>TOTAL:</span>
                <span>Rp ${totalKeseluruhan.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>


          <div class="footer">
            <p>Warung Bu Lis. Jln penataran no 1, 087851868</p>
            <p style="margin-top: 10px; color: #999;">Harap simpan nota ini untuk referensi Anda.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return htmlContent;
  };

  // === DOWNLOAD NOTA ===
  const downloadNota = () => {
    const htmlContent = generateNotaHTML();
    const blob = new Blob([htmlContent], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Nota_Penjualan_${id}_${
      new Date().toISOString().split("T")[0]
    }.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  // === SAVE DETAIL PENJUALAN ===
  const handleSaveDetails = async () => {
    try {
      if (cartItems.length === 0) {
        alert("Tidak ada item untuk disimpan!");
        return;
      }

      setLoading(true);

      // Save each cart item as detail penjualan
      // The backend will automatically deduct stock after creation
      const detailPromises = cartItems.map((item) =>
        axios.post(
          `${API_BASE}/api/detail_penjualan/detail`,
          {
            header_penjualan_id: parseInt(id),
            menu_id: item.menu_id,
            penjualan_jumlah: item.penjualan_jumlah,
          },
          {
            headers: { "x-auth-token": userToken },
          }
        )
      );

      await Promise.all(detailPromises);

      // Refresh data
      await fetchPenjualanData();

      // Clear cart
      dispatch(clearCart());
    } catch (err) {
      console.error(
        "Gagal menyimpan detail:",
        err.response?.data || err.message
      );

      // Check if error is about stock issues
      const errorMsg = err.response?.data?.message || err.message;
      if (
        errorMsg.includes("stok") ||
        errorMsg.includes("bahan baku") ||
        errorMsg.includes("habis")
      ) {
        alert(
          "Gagal menyimpan: " +
            (err.response?.data?.message || err.message) +
            "\n\nHarap periksa stok bahan baku untuk menu yang dipilih"
        );
      } else {
        alert(
          "Gagal menyimpan detail penjualan: " +
            (err.response?.data?.message || err.message)
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // === UPDATE HEADER PENJUALAN ===
  const handleUpdateHeader = async () => {
    try {
      setLoading(true);

      const updatePayload = {
        header_penjualan_tanggal: new Date().toISOString(),
        header_penjualan_jenis: jenisPenjualan,
        header_penjualan_keterangan: keterangan,
        header_penjualan_biaya_tambahan: biayaTambahan || 0,
        header_penjualan_uang_muka:
          jenisPenjualan === "online" ? uangMuka || 0 : 0,
      };

      await axios.put(
        `${API_BASE}/api/detail_penjualan/header/${id}`,
        updatePayload,
        {
          headers: { "x-auth-token": userToken },
        }
      );

      await fetchPenjualanData();
    } catch (err) {
      console.error("Gagal update header:", err.response?.data || err.message);
      alert(
        "Gagal update header: " + (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // === FINALIZE TRANSACTION ===
  const handleFinalize = async () => {
    try {
      if (cartItems.length === 0) {
        alert(
          "Tidak ada item yang dipesan! Silahkan tambahkan item sebelum menyelesaikan transaksi."
        );
        return;
      }
      // Validasi stok sebelum finalisasi
      const validationErrors = await validateAllStocks();

      if (validationErrors.length > 0) {
        setStockValidationErrors(validationErrors);
        setInsufficientStockModalOpen(true);
        return;
      }

      // Save cart items first if any
      if (cartItems.length > 0) {
        await handleSaveDetails();
      }

      // Update header
      await handleUpdateHeader();

      // Download nota
      downloadNota();

      alert("Transaksi berhasil diselesaikan! Nota telah diunduh.");

      // Clear cart and navigate back
      dispatch(clearCart());
      navigate("/pegawai/penjualan");
    } catch (err) {
      console.error("Gagal finalize:", err);
    }
  };

  // === VALIDATE ALL STOCKS ===
  const validateAllStocks = async () => {
    const errors = [];

    try {
      // Check combined cart items (both new items and database details)
      const allItems = [
        ...cartItems.map((item) => ({
          menu_id: item.menu_id,
          menu_nama: item.menu_nama,
          quantity: item.penjualan_jumlah,
          isNew: true,
        })),
        ...detailData.map((item) => ({
          menu_id: item.menu_id,
          menu_nama: item.menu?.menu_nama,
          quantity: item.penjualan_jumlah,
          isNew: false,
        })),
      ];

      // For each menu item, check ingredients
      for (const menuItem of allItems) {
        try {
          const response = await axios.get(
            `${API_BASE}/api/menu_management/detail/${menuItem.menu_id}`,
            {
              headers: { "x-auth-token": userToken },
            }
          );

          if (response.data && response.data.data) {
            // For each ingredient in the menu
            for (const ingredient of response.data.data) {
              try {
                // Get all bahan baku to find stock
                const allBahanBaku = await axios.get(
                  `${API_BASE}/api/bahan_Baku`,
                  {
                    headers: { "x-auth-token": userToken },
                  }
                );

                const bahanBaku = allBahanBaku.data.find(
                  (bb) =>
                    bb.bahan_baku_nama === ingredient.detail_menu_nama_bahan
                );

                const requiredAmount =
                  ingredient.detail_menu_jumlah * menuItem.quantity;
                const availableStock = bahanBaku?.bahan_baku_jumlah || 0;

                if (availableStock < requiredAmount) {
                  errors.push({
                    menu_nama: menuItem.menu_nama,
                    bahan_baku_nama: ingredient.detail_menu_nama_bahan,
                    required: requiredAmount,
                    available: availableStock,
                    satuan: ingredient.detail_menu_satuan,
                  });
                }
              } catch (err) {
                console.error("Error checking ingredient stock:", err);
                errors.push({
                  menu_nama: menuItem.menu_nama,
                  bahan_baku_nama: ingredient.detail_menu_nama_bahan,
                  error: "Gagal mengecek stok",
                });
              }
            }
          }
        } catch (err) {
          console.error("Error fetching menu details:", err);
        }
      }
    } catch (err) {
      console.error("Error validating stocks:", err);
    }

    return errors;
  };

  return (
    <Box
      style={{
        minHeight: "100vh",
        paddingTop: "24px",
        paddingBottom: "24px",
        position: "relative",
      }}>
      <LoadingOverlay visible={loading} />

      <Container size="lg">
        <Stack gap="md">
          <Group justify="space-between">
            <Text size="xl" fw={700} style={{ color: "white" }}>
              Header Penjualan #{id}
            </Text>
            <Button
              variant="default"
              onClick={() => navigate("/pegawai/penjualan")}>
              Kembali
            </Button>
          </Group>

          {/* Header Information */}
          {headerData && (
            <Paper shadow="sm" p="md" radius="md">
              <Stack gap="xs">
                <Text fw={600} size="lg">
                  Informasi Header
                </Text>
                <Group gap="xl">
                  <div>
                    <Text size="sm" c="gold">
                      Tanggal
                    </Text>
                    <Text fw={500}>
                      {new Date(
                        headerData.header_penjualan_tanggal
                      ).toLocaleString("id-ID")}
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" c="gold">
                      Jenis
                    </Text>
                    <Text fw={500} tt="capitalize">
                      {headerData.header_penjualan_jenis}
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" c="gold">
                      Pegawai ID
                    </Text>
                    <Text fw={500}>
                      {headerData.pegawai?.pegawai_id ||
                        headerData.pegawai_id ||
                        "-"}
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" c="gold">
                      Status
                    </Text>
                    <Text fw={500}>
                      {detailData.length > 0
                        ? "Sudah ada detail"
                        : "Belum ada detail"}
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" c="gold">
                      Keterangan
                    </Text>
                    <Text fw={500}>
                      {headerData.header_penjualan_keterangan || "-"}
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" c="gold">
                      Biaya Tambahan
                    </Text>
                    <Text fw={500}>
                      Rp{" "}
                      {(
                        headerData.header_penjualan_biaya_tambahan || 0
                      ).toLocaleString("id-ID")}
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" c="gold">
                      Uang Muka
                    </Text>
                    <Text fw={500}>
                      {headerData.header_penjualan_uang_muka || 0}%
                    </Text>
                  </div>
                </Group>
              </Stack>
            </Paper>
          )}

          {/* Detail Penjualan dari Database */}
          {detailData && detailData.length > 0 && (
            <Paper shadow="sm" p="md" radius="md">
              <Stack gap="md">
                <Text fw={600} size="lg">
                  Detail Penjualan (Database)
                </Text>
                <Table striped highlightOnHover>
                  <Table.Thead style={{ color: "gold" }}>
                    <Table.Tr>
                      <Table.Th>ID</Table.Th>
                      <Table.Th>Nama Menu</Table.Th>
                      <Table.Th>Harga</Table.Th>
                      <Table.Th>Jumlah</Table.Th>
                      <Table.Th>Subtotal</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody style={{ color: "black" }}>
                    {detailData.map((item) => (
                      <Table.Tr key={item.penjualan_id}>
                        <Table.Td>{item.penjualan_id}</Table.Td>
                        <Table.Td>{item.menu?.menu_nama || "N/A"}</Table.Td>
                        <Table.Td>
                          Rp{" "}
                          {(item.menu?.menu_harga || 0).toLocaleString("id-ID")}
                        </Table.Td>
                        <Table.Td>{item.penjualan_jumlah}</Table.Td>
                        <Table.Td>
                          Rp{" "}
                          {(
                            (item.menu?.menu_harga || 0) * item.penjualan_jumlah
                          ).toLocaleString("id-ID")}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
                <Group justify="flex-end">
                  <Text fw={600} size="lg">
                    Total: Rp {calculateTotalFromDB().toLocaleString("id-ID")}
                  </Text>
                </Group>
              </Stack>
            </Paper>
          )}

          <Divider my="md" label="Tambah Item Baru" labelPosition="center" />

          {/* Cart Items (untuk menambah detail baru) */}
          {cartItems.length > 0 && (
            <Paper shadow="sm" p="md" radius="md">
              <Stack gap="md">
                <Text fw={600} size="lg">
                  Item di Keranjang
                </Text>
                {cartItems.map((item) => (
                  <Box key={item.menu_id}>
                    <Group justify="space-between" align="flex-start">
                      <Box style={{ flex: 1 }}>
                        <Text fw={700}>{item.menu_nama}</Text>
                        <Text size="lg" c="white">
                          Rp {item.menu_harga.toLocaleString("id-ID")}
                        </Text>
                      </Box>
                      <Group gap="xs">
                        <Button
                          size="xs"
                          color="blue"
                          onClick={() => fetchMenuIngredients(item.menu_id)}>
                          Lihat Bahan
                        </Button>
                        <Button
                          size="xs"
                          color="red"
                          onClick={() =>
                            updateQuantity(
                              item.menu_id,
                              item.penjualan_jumlah - 1
                            )
                          }>
                          -
                        </Button>
                        <Text
                          fw={600}
                          style={{
                            minWidth: "30px",
                            textAlign: "center",
                          }}>
                          {item.penjualan_jumlah}
                        </Text>
                        <Button
                          size="xs"
                          color="green"
                          onClick={() =>
                            updateQuantity(
                              item.menu_id,
                              item.penjualan_jumlah + 1
                            )
                          }>
                          +
                        </Button>
                        <Button
                          size="xs"
                          color="gray"
                          onClick={() => removeFromCart(item.menu_id)}>
                          Hapus
                        </Button>
                      </Group>
                    </Group>
                    <Text size="xl" c="white">
                      Subtotal: Rp{" "}
                      {(item.menu_harga * item.penjualan_jumlah).toLocaleString(
                        "id-ID"
                      )}
                    </Text>
                    <Divider my="sm" />
                  </Box>
                ))}
                <Group justify="flex-end">
                  <Text fw={600} size="lg">
                    Total Cart: Rp{" "}
                    {calculateTotalFromCart().toLocaleString("id-ID")}
                  </Text>
                </Group>
              </Stack>
            </Paper>
          )}
          <Divider
            my="md"
            label="Bagian Konfirmasi Transaksi"
            labelPosition="center"
          />
          {/* Form Edit Header */}
          <Paper shadow="sm" p="md" radius="md">
            <Stack gap="md">
              <Text fw={600} size="lg">
                Edit Informasi Transaksi
              </Text>

              <Radio.Group
                value={jenisPenjualan}
                onChange={handleJenisPenjualanChange}
                label="Jenis Penjualan"
                required>
                <Group mt="xs">
                  <Radio value="offline" label="Offline" />
                  <Radio value="online" label="Online" />
                </Group>
              </Radio.Group>

              <TextInput
                label="Keterangan Transaksi"
                placeholder="Masukkan keterangan"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
              />

              <NumberInput
                label="Biaya Tambahan"
                placeholder="0"
                min={0}
                value={biayaTambahan}
                onChange={(val) => setBiayaTambahan(val || 0)}
                description="Biaya tambahan untuk transaksi"
              />

              {jenisPenjualan === "online" && (
                <NumberInput
                  label="Persentase Uang Muka (%)"
                  placeholder="0"
                  min={0}
                  max={100}
                  value={uangMuka}
                  onChange={(val) => setUangMuka(val || 0)}
                  description="Persentase uang muka untuk transaksi online"
                />
              )}

              <Divider my="md" />

              <Group justify="space-between">
                <Text fw={600} size="lg">
                  Total Keseluruhan
                </Text>
                <Text fw={700} style={{ fontSize: "1.5rem" }} c="white">
                  Rp{" "}
                  {(
                    calculateTotalFromDB() +
                    calculateTotalFromCart() +
                    (biayaTambahan || 0)
                  ).toLocaleString("id-ID")}
                </Text>
              </Group>

              {jenisPenjualan === "online" && uangMuka > 0 && (
                <Group justify="space-between">
                  <Text fw={500} size="md">
                    Uang Muka ({uangMuka}%)
                  </Text>
                  <Text fw={600} size="lg" c="blue">
                    Rp{" "}
                    {(
                      ((calculateTotalFromDB() + calculateTotalFromCart()) *
                        uangMuka) /
                      100
                    ).toLocaleString("id-ID")}
                  </Text>
                </Group>
              )}

              <Group grow>
                <Button
                  color="blue"
                  size="lg"
                  onClick={handleUpdateHeader}
                  loading={loading}>
                  Update Header
                </Button>
                <Button
                  color="green"
                  size="lg"
                  onClick={() => setConfirmOpen(true)}
                  loading={loading}>
                  Selesaikan Transaksi
                </Button>
              </Group>

              <Modal
                opened={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                title="Konfirmasi Transaksi"
                centered
                styles={{
                  content: {
                    backgroundColor: "#007bff",
                    color: "white",
                  },
                  header: {
                    backgroundColor: "#007bff",
                    color: "white",
                  },
                  title: {
                    color: "white",
                    fontWeight: 700,
                  },
                }}>
                <Text mb="md" fw={500}>
                  Apakah Anda yakin untuk menyelesaikan transaksi ini?
                </Text>

                <Group justify="flex-end">
                  <Button
                    variant="default"
                    onClick={() => setConfirmOpen(false)}>
                    Tidak
                  </Button>
                  <Button
                    color="green"
                    onClick={async () => {
                      setConfirmOpen(false);
                      await handleFinalize();
                    }}>
                    Ya
                  </Button>
                </Group>
              </Modal>

              {/* Modal untuk menampilkan Bahan Baku */}
              <Modal
                opened={!!selectedMenuDetails}
                onClose={() => setSelectedMenuDetails(null)}
                title={`Bahan Baku - ${
                  cartItems.find(
                    (item) => item.menu_id === selectedMenuDetails?.menuId
                  )?.menu_nama || "Menu"
                }`}
                centered
                size="lg"
                styles={{
                  content: {
                    backgroundColor: "#f5f5f5",
                  },
                  header: {
                    backgroundColor: "#8B7355",
                    color: "white",
                  },
                  title: {
                    color: "white",
                    fontWeight: 700,
                  },
                }}>
                {selectedMenuDetails && (
                  <Stack gap="md">
                    {/* Warning Messages */}
                    {selectedMenuDetails.warnings &&
                      selectedMenuDetails.warnings.length > 0 && (
                        <Box
                          p="md"
                          style={{
                            backgroundColor: "#ffe0e0",
                            borderRadius: "8px",
                          }}>
                          <Text fw={600} c="red" mb="xs">
                            ⚠️ Peringatan:
                          </Text>
                          {selectedMenuDetails.warnings.map((warning, idx) => (
                            <Text key={idx} c="red" size="sm">
                              • {warning}
                            </Text>
                          ))}
                        </Box>
                      )}

                    {/* Can Order Status */}
                    <Group
                      justify="space-between"
                      p="md"
                      style={{
                        backgroundColor: selectedMenuDetails.canOrder
                          ? "#e0f7e0"
                          : "#ffe0e0",
                        borderRadius: "8px",
                      }}>
                      <Text fw={600} style={{ color: "green" }}>
                        Status Pemesanan:
                      </Text>
                      <Text
                        fw={700}
                        c={selectedMenuDetails.canOrder ? "green" : "red"}>
                        {selectedMenuDetails.canOrder
                          ? "✓ Bisa Dipesan"
                          : "✗ Tidak Bisa Dipesan"}
                      </Text>
                    </Group>

                    {/* Ingredients Table */}
                    <Text fw={600} size="lg" style={{ color: "brown" }}>
                      Komposisi Bahan Baku:
                    </Text>
                    <Table striped highlightOnHover size="sm">
                      <Table.Thead style={{ backgroundColor: "#8B7355" }}>
                        <Table.Tr>
                          <Table.Th style={{ color: "white" }}>
                            Bahan Baku
                          </Table.Th>
                          <Table.Th
                            style={{ color: "white", textAlign: "center" }}>
                            Jumlah Dipakai
                          </Table.Th>
                          <Table.Th
                            style={{ color: "white", textAlign: "center" }}>
                            Satuan
                          </Table.Th>
                          <Table.Th
                            style={{ color: "white", textAlign: "right" }}>
                            Stok Tersedia
                          </Table.Th>
                          <Table.Th
                            style={{ color: "white", textAlign: "center" }}>
                            Status
                          </Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {selectedMenuDetails.ingredients.map((ing, idx) => (
                          <Table.Tr key={idx} style={{ color: "brown" }}>
                            <Table.Td fw={500}>
                              {ing.detail_menu_nama_bahan}
                            </Table.Td>
                            <Table.Td style={{ textAlign: "center" }}>
                              {ing.detail_menu_jumlah}
                            </Table.Td>
                            <Table.Td style={{ textAlign: "center" }}>
                              {ing.detail_menu_satuan}
                            </Table.Td>
                            <Table.Td style={{ textAlign: "right" }} fw={500}>
                              {ing.bahan_baku_stock} {ing.detail_menu_satuan}
                            </Table.Td>
                            <Table.Td style={{ textAlign: "center" }}>
                              <Text
                                fw={600}
                                c={
                                  ing.bahan_baku_stock > 0
                                    ? ing.bahan_baku_stock >=
                                      ing.detail_menu_jumlah
                                      ? "green"
                                      : "orange"
                                    : "red"
                                }>
                                {ing.stockWarning
                                  ? "⚠️ Habis"
                                  : ing.bahan_baku_stock >=
                                    ing.detail_menu_jumlah
                                  ? "✓ OK"
                                  : "⚠️ Kurang"}
                              </Text>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>

                    {/* Legend */}
                    <Box
                      p="md"
                      style={{
                        backgroundColor: "lightblue",
                        borderRadius: "8px",
                      }}>
                      <Text
                        fw={700}
                        mb="xs"
                        size="sm"
                        style={{ color: "turquoise" }}>
                        Keterangan:
                      </Text>
                      <Stack gap="xs">
                        <Text size="sm" style={{ color: "green" }} fw={500}>
                          ✓ OK = Stok cukup untuk memenuhi pesanan
                        </Text>
                        <Text size="sm" style={{ color: "orange" }} fw={500}>
                          ⚠️ Kurang = Stok tidak cukup untuk memenuhi pesanan
                        </Text>
                        <Text size="sm" style={{ color: "red" }} fw={500}>
                          ⚠️ Habis = Stok habis (0) sehingga menu tidak bisa
                          dipesan
                        </Text>
                      </Stack>
                    </Box>

                    <Group justify="flex-end">
                      <Button
                        variant="default"
                        onClick={() => setSelectedMenuDetails(null)}>
                        Tutup
                      </Button>
                    </Group>
                  </Stack>
                )}
              </Modal>

              {/* Modal untuk Peringatan Stok Tidak Mencukupi */}
              <Modal
                opened={insufficientStockModalOpen}
                onClose={() => {
                  setInsufficientStockModalOpen(false);
                  setStockValidationErrors([]);
                }}
                title="⚠️ Stok Bahan Baku Tidak Mencukupi"
                centered
                size="lg"
                styles={{
                  content: {
                    backgroundColor: "#fff5f5",
                  },
                  header: {
                    backgroundColor: "#d32f2f",
                    color: "white",
                  },
                  title: {
                    color: "white",
                    fontWeight: 700,
                  },
                }}>
                <Stack gap="md">
                  <Box
                    p="md"
                    style={{
                      backgroundColor: "#ffe0e0",
                      borderRadius: "8px",
                    }}>
                    <Text fw={600} c="red" mb="sm">
                      Transaksi TIDAK BISA DIPROSES karena stok bahan baku tidak
                      mencukupi:
                    </Text>
                  </Box>

                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr style={{ backgroundColor: "#d32f2f" }}>
                        <Table.Th style={{ color: "white" }}>Menu</Table.Th>
                        <Table.Th style={{ color: "white" }}>
                          Bahan Baku
                        </Table.Th>
                        <Table.Th
                          style={{ color: "white", textAlign: "center" }}>
                          Dibutuhkan
                        </Table.Th>
                        <Table.Th
                          style={{ color: "white", textAlign: "center" }}>
                          Tersedia
                        </Table.Th>
                        <Table.Th
                          style={{ color: "white", textAlign: "center" }}>
                          Kurang
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {stockValidationErrors.map((error, idx) => (
                        <Table.Tr key={idx} style={{ color: "red" }}>
                          <Table.Td fw={500}>{error.menu_nama}</Table.Td>
                          <Table.Td>{error.bahan_baku_nama}</Table.Td>
                          <Table.Td style={{ textAlign: "center" }}>
                            {error.required} {error.satuan}
                          </Table.Td>
                          <Table.Td style={{ textAlign: "center" }}>
                            {error.available} {error.satuan}
                          </Table.Td>
                          <Table.Td style={{ textAlign: "center" }}>
                            <Text fw={600} c="red">
                              {error.required - error.available} {error.satuan}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>

                  <Box
                    p="md"
                    style={{
                      backgroundColor: "#fff3cd",
                      borderRadius: "8px",
                    }}>
                    <Text size="sm" fw={500} style={{ color: "#856404" }}>
                      Silakan periksa dan perbarui stok bahan baku di Menu
                      Manajemen Stok sebelum menyelesaikan transaksi.
                    </Text>
                  </Box>

                  <Group justify="flex-end">
                    <Button
                      color="red"
                      onClick={() => {
                        setInsufficientStockModalOpen(false);
                        setStockValidationErrors([]);
                      }}>
                      Tutup
                    </Button>
                  </Group>
                </Stack>
              </Modal>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
};

export default DetailPenjualanPage;
