import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Stack,
  Title,
  Paper,
  Radio,
  Group,
  TextInput,
  Button,
  Text,
  LoadingOverlay,
  Badge,
  Pagination,
} from "@mantine/core";
import { useSelector } from "react-redux";
import axios from "axios";
import { DataGrid } from "@mui/x-data-grid";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import * as XLSX from "xlsx";

export const LaporanKeuanganPage = () => {
  const API_BASE = import.meta.env.VITE_API_BASE;
  const [jenisLaporan, setJenisLaporan] = useState("penjualan");
  const [currentPage, setCurrentPage] = useState(1);
  const [dataPenjualan, setDataPenjualan] = useState([]);
  const [dataPembelian, setDataPembelian] = useState([]);
  const [dataPesanan, setDataPesanan] = useState([]);
  const [loading, setLoading] = useState(false);

  // Track filtered rows
  const [filteredPenjualanRows, setFilteredPenjualanRows] = useState([]);
  const [filteredPembelianRows, setFilteredPembelianRows] = useState([]);
  const [filteredPesananRows, setFilteredPesananRows] = useState([]);

  const navigate = useNavigate();
  const userToken = useSelector((state) => state.user.userToken);

  // === Lifecycle ===
  useEffect(() => {
    cekSudahLogin();
  }, []);

  const cekSudahLogin = () => {
    if (!userToken) {
      navigate("/pegawai");
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchPenjualan(), fetchPembelian(), fetchPesanan()]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPenjualan = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      const response = await axios.get(
        `${API_BASE}/api/laporan_keuangan/penjualan`,
        {
          params: Object.fromEntries(params),
          headers: { "x-auth-token": userToken },
        }
      );
      setDataPenjualan(response.data.data || []);
    } catch (error) {
      console.error("Error fetching penjualan:", error);
      setDataPenjualan([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPembelian = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      const response = await axios.get(
        `${API_BASE}/api/laporan_keuangan/pembelian`,
        {
          params: Object.fromEntries(params),
          headers: { "x-auth-token": userToken },
        }
      );
      setDataPembelian(response.data.data || []);
    } catch (error) {
      console.error("Error fetching pembelian:", error);
      setDataPembelian([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPesanan = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      const response = await axios.get(
        `${API_BASE}/api/laporan_keuangan/pesanan`,
        {
          params: Object.fromEntries(params),
          headers: { "x-auth-token": userToken },
        }
      );
      setDataPesanan(response.data.data || []);
    } catch (error) {
      console.error("Error fetching pesanan:", error);
      setDataPesanan([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalPenjualan = dataPenjualan.reduce(
    (sum, item) => sum + (item.sisaPembayaran || 0),
    0
  );

  const totalPembelian = dataPembelian.reduce(
    (sum, item) => sum + (item.subtotal || 0),
    0
  );

  const totalPesanan = dataPesanan.reduce(
    (sum, item) => sum + (item.total || 0),
    0
  );

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Format datetime helper
  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  // Get current datetime for filename
  const getCurrentDateTimeForFilename = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return `${day}${month}${year}_${hours}${minutes}${seconds}`;
  };

  // Prepare data for Pembelian DataGrid
  const pembelianRows = dataPembelian.map((item, index) => ({
    id: index,
    pembelian_id: item.pembelian_id,
    tanggal: formatDate(item.tanggal),
    bahan_baku_id: item.bahan_baku_id,
    bahan_baku_nama: item.bahan_baku_nama,
    pembelian_jumlah: item.pembelian_jumlah,
    pembelian_satuan: item.pembelian_satuan,
    pembelian_harga_satuan: item.pembelian_harga_satuan || 0,
    subtotal: item.subtotal || 0,
    bahan_baku_jumlah: item.bahan_baku_jumlah,
  }));

  const pembelianColumns = [
    { field: "pembelian_id", headerName: "ID", width: 80 },
    { field: "tanggal", headerName: "Tanggal", width: 120 },
    { field: "bahan_baku_id", headerName: "Bahan Baku ID", width: 120 },
    { field: "bahan_baku_nama", headerName: "Bahan Baku Nama", width: 150 },
    { field: "pembelian_jumlah", headerName: "Jumlah Beli", width: 120 },
    { field: "pembelian_satuan", headerName: "Satuan", width: 100 },
    {
      field: "pembelian_harga_satuan",
      headerName: "Harga/Satuan",
      width: 130,
      renderCell: (params) => `Rp ${params.value.toLocaleString("id-ID")}`,
    },
    {
      field: "subtotal",
      headerName: "Subtotal",
      width: 130,
      renderCell: (params) => `Rp ${params.value.toLocaleString("id-ID")}`,
    },
    {
      field: "bahan_baku_jumlah",
      headerName: "Sisa Stok",
      width: 130,
      renderCell: (params) => {
        const value = params.value;
        const satuan = params.row.pembelian_satuan;
        const color = value === 0 ? "#d32f2f" : "#2e7d32";
        return (
          <span style={{ fontWeight: "bold", color }}>
            {value !== undefined ? `${value} ${satuan}` : "-"}
          </span>
        );
      },
    },
  ];

  // Prepare data for Penjualan and Pesanan detail rows
  const getPenjualanDetailRows = () => {
    const rows = [];
    dataPenjualan.forEach((penjualan, penjualanIndex) => {
      rows.push({
        id: `penjualan-header-${penjualanIndex}`,
        type: "header",
        pegawai_id: penjualan.pegawai_id,
        header_penjualan_id: penjualan.header_penjualan_id,
        tanggal: formatDateTime(penjualan.tanggal),
        jenis: penjualan.jenis,
        totalSubtotal: penjualan.totalSubtotal,
        totalBiayaTambahan: penjualan.totalBiayaTambahan,
        persentaseDP: penjualan.persentaseDP,
        totalDP: penjualan.totalDP,
        grandTotal: penjualan.grandTotal,
        sisaPembayaran: penjualan.sisaPembayaran,
      });

      penjualan.items?.forEach((item, itemIndex) => {
        rows.push({
          id: `penjualan-item-${penjualanIndex}-${itemIndex}`,
          type: "item",
          menu_id: item.menu_id,
          menu_nama: item.menu_nama,
          menu_harga: item.menu_harga,
          penjualan_jumlah: item.penjualan_jumlah,
          subtotal: item.subtotal,
        });
      });
    });
    return rows;
  };

  const getPesananDetailRows = () => {
    const rows = [];
    dataPesanan.forEach((pesanan, pesananIndex) => {
      rows.push({
        id: `pesanan-header-${pesananIndex}`,
        type: "header",
        pesanan_nama: pesanan.pesanan_nama,
        pesanan_status: pesanan.pesanan_status,
        pesanan_id: pesanan.pesanan_id,
        tanggal: formatDateTime(pesanan.tanggal),
        tanggal_pengiriman: formatDateTime(pesanan.tanggal_pengiriman),
        total: pesanan.total,
      });

      pesanan.items?.forEach((item, itemIndex) => {
        rows.push({
          id: `pesanan-item-${pesananIndex}-${itemIndex}`,
          type: "item",
          menu_id: item.menu_id,
          menu_nama: item.menu_nama,
          menu_harga: item.menu_harga,
          pesanan_detail_jumlah: item.pesanan_detail_jumlah,
          subtotal: item.subtotal,
        });
      });
    });
    return rows;
  };

  const penjualanRows = getPenjualanDetailRows();
  const pesananRows = getPesananDetailRows();

  const penjualanColumns = [
    {
      field: "type",
      headerName: "Type",
      width: 80,
      renderCell: (params) => (params.value === "header" ? "Header" : "Item"),
    },
    {
      field: "header_penjualan_id",
      headerName: "ID Penjualan",
      width: 120,
      renderCell: (params) =>
        params.row.type === "header" ? params.value : "-",
    },
    {
      field: "pegawai_id",
      headerName: "Pegawai ID",
      width: 110,
      renderCell: (params) =>
        params.row.type === "header" ? params.value : "-",
    },
    {
      field: "tanggal",
      headerName: "Tanggal",
      width: 180,
      renderCell: (params) =>
        params.row.type === "header" ? params.value : "-",
    },
    {
      field: "jenis",
      headerName: "Jenis Transaksi",
      width: 130,
      renderCell: (params) =>
        params.row.type === "header" ? params.value || "-" : "-",
    },
    {
      field: "menu_id",
      headerName: "Menu ID",
      width: 100,
      renderCell: (params) => (params.row.type === "item" ? params.value : "-"),
    },
    {
      field: "menu_nama",
      headerName: "Menu",
      width: 150,
      renderCell: (params) => (params.row.type === "item" ? params.value : "-"),
    },
    {
      field: "menu_harga",
      headerName: "Harga",
      width: 130,
      renderCell: (params) =>
        params.row.type === "item"
          ? `Rp ${(params.value || 0).toLocaleString("id-ID")}`
          : "-",
    },
    {
      field: "penjualan_jumlah",
      headerName: "Jumlah",
      width: 100,
      renderCell: (params) => (params.row.type === "item" ? params.value : "-"),
    },
    {
      field: "subtotal",
      headerName: "Subtotal Item",
      width: 130,
      renderCell: (params) =>
        params.row.type === "item"
          ? `Rp ${(params.value || 0).toLocaleString("id-ID")}`
          : "-",
    },
    {
      field: "totalSubtotal",
      headerName: "Total Subtotal",
      width: 140,
      renderCell: (params) =>
        params.row.type === "header"
          ? `Rp ${(params.value || 0).toLocaleString("id-ID")}`
          : "-",
    },
    {
      field: "totalBiayaTambahan",
      headerName: "Total Biaya Tambahan",
      width: 160,
      renderCell: (params) =>
        params.row.type === "header"
          ? `Rp ${(params.value || 0).toLocaleString("id-ID")}`
          : "-",
    },
    {
      field: "totalDP",
      headerName: "DP",
      width: 130,
      renderCell: (params) =>
        params.row.type === "header"
          ? `Rp ${(params.value || 0).toLocaleString("id-ID")}`
          : "-",
    },
    {
      field: "grandTotal",
      headerName: "Grand Total",
      width: 140,
      renderCell: (params) =>
        params.row.type === "header"
          ? `Rp ${(params.value || 0).toLocaleString("id-ID")}`
          : "-",
    },
    {
      field: "sisaPembayaran",
      headerName: "Sisa Pembayaran",
      width: 150,
      renderCell: (params) =>
        params.row.type === "header"
          ? `Rp ${(params.value || 0).toLocaleString("id-ID")}`
          : "-",
    },
  ];

  const pesananColumns = [
    {
      field: "type",
      headerName: "Type",
      width: 80,
      renderCell: (params) => (params.value === "header" ? "Header" : "Item"),
    },
    {
      field: "pesanan_nama",
      headerName: "Nama Pemesan",
      width: 150,
      renderCell: (params) =>
        params.row.type === "header" ? params.value : "-",
    },
    {
      field: "pesanan_status",
      headerName: "Status",
      width: 120,
      renderCell: (params) =>
        params.row.type === "header" ? params.value : "-",
    },
    {
      field: "pesanan_id",
      headerName: "Pesanan ID",
      width: 120,
      renderCell: (params) =>
        params.row.type === "header" ? params.value : "-",
    },
    {
      field: "tanggal",
      headerName: "Tanggal Pesanan",
      width: 180,
      renderCell: (params) =>
        params.row.type === "header" ? params.value : "-",
    },
    {
      field: "tanggal_pengiriman",
      headerName: "Tanggal Pengiriman",
      width: 180,
      renderCell: (params) =>
        params.row.type === "header" ? params.value : "-",
    },
    {
      field: "menu_id",
      headerName: "Menu ID",
      width: 100,
      renderCell: (params) => (params.row.type === "item" ? params.value : "-"),
    },
    {
      field: "menu_nama",
      headerName: "Menu",
      width: 150,
      renderCell: (params) => (params.row.type === "item" ? params.value : "-"),
    },
    {
      field: "menu_harga",
      headerName: "Harga",
      width: 130,
      renderCell: (params) =>
        params.row.type === "item"
          ? `Rp ${(params.value || 0).toLocaleString("id-ID")}`
          : "-",
    },
    {
      field: "pesanan_detail_jumlah",
      headerName: "Jumlah",
      width: 100,
      renderCell: (params) => (params.row.type === "item" ? params.value : "-"),
    },
    {
      field: "subtotal",
      headerName: "Subtotal Item",
      width: 140,
      renderCell: (params) =>
        params.row.type === "item"
          ? `Rp ${(params.value || 0).toLocaleString("id-ID")}`
          : "-",
    },
    {
      field: "total",
      headerName: "Total Pesanan",
      width: 150,
      renderCell: (params) =>
        params.row.type === "header"
          ? `Rp ${(params.value || 0).toLocaleString("id-ID")}`
          : "-",
    },
  ];

  const theme = createTheme({
    palette: {
      primary: {
        main: "#8B7355",
      },
    },
    components: {
      MuiDataGrid: {
        styleOverrides: {
          root: {
            "& .MuiDataGrid-columnHeader": {
              backgroundColor: "#ADD8E6",
              color: "black",
              fontWeight: "bold",
            },
            "& .header-row": {
              backgroundColor: "#FFFF00 !important",
            },
          },
        },
      },
    },
  });

  const getRowClassName = (params) => {
    if (params.row.type === "header") {
      return "header-row";
    }
    return "";
  };

  // Get data to download - use filtered rows if available, otherwise use all rows
  const getDownloadData = (filtered, all) => {
    return filtered.length > 0 ? filtered : all;
  };

  // Download Excel functions
  const downloadPenjualanExcel = () => {
    const dataToDownload = getDownloadData(
      filteredPenjualanRows,
      penjualanRows
    );
    const exportData = dataToDownload.map((row) => ({
      Tipe: row.type === "header" ? "Header" : "Item",
      "ID Penjualan": row.type === "header" ? row.header_penjualan_id : "-",
      "Pegawai ID": row.type === "header" ? row.pegawai_id : "-",
      Tanggal: row.type === "header" ? row.tanggal : "-",
      "Jenis Transaksi": row.type === "header" ? row.jenis || "-" : "-",
      "Menu ID": row.type === "item" ? row.menu_id : "-",
      Menu: row.type === "item" ? row.menu_nama : "-",
      Harga: row.type === "item" ? row.menu_harga || 0 : "-",
      Jumlah: row.type === "item" ? row.penjualan_jumlah : "-",
      "Subtotal Item": row.type === "item" ? row.subtotal || 0 : "-",
      "Total Subtotal": row.type === "header" ? row.totalSubtotal || 0 : "-",
      "Total Biaya Tambahan":
        row.type === "header" ? row.totalBiayaTambahan || 0 : "-",
      DP: row.type === "header" ? row.totalDP || 0 : "-",
      "Grand Total": row.type === "header" ? row.grandTotal || 0 : "-",
      "Sisa Pembayaran": row.type === "header" ? row.sisaPembayaran || 0 : "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Penjualan");
    const filename = `Laporan_Penjualan_${getCurrentDateTimeForFilename()}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const downloadPembelianExcel = () => {
    const dataToDownload = getDownloadData(
      filteredPembelianRows,
      pembelianRows
    );
    const exportData = dataToDownload.map((row) => ({
      ID: row.pembelian_id,
      Tanggal: row.tanggal,
      "Bahan Baku ID": row.bahan_baku_id,
      "Bahan Baku Nama": row.bahan_baku_nama,
      "Jumlah Beli": row.pembelian_jumlah,
      Satuan: row.pembelian_satuan,
      "Harga/Satuan": row.pembelian_harga_satuan || 0,
      Subtotal: row.subtotal || 0,
      "Sisa Stok": row.bahan_baku_jumlah,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pembelian");
    const filename = `Laporan_Pembelian_${getCurrentDateTimeForFilename()}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const downloadPesananExcel = () => {
    const dataToDownload = getDownloadData(filteredPesananRows, pesananRows);
    const exportData = dataToDownload.map((row) => ({
      Tipe: row.type === "header" ? "Header" : "Item",
      "Nama Pemesan": row.type === "header" ? row.pesanan_nama : "-",
      Status: row.type === "header" ? row.pesanan_status : "-",
      "Pesanan ID": row.type === "header" ? row.pesanan_id : "-",
      "Tanggal Pesanan": row.type === "header" ? row.tanggal : "-",
      "Tanggal Pengiriman":
        row.type === "header" ? row.tanggal_pengiriman : "-",
      "Menu ID": row.type === "item" ? row.menu_id : "-",
      Menu: row.type === "item" ? row.menu_nama : "-",
      Harga: row.type === "item" ? row.menu_harga || 0 : "-",
      Jumlah: row.type === "item" ? row.pesanan_detail_jumlah : "-",
      "Subtotal Item": row.type === "item" ? row.subtotal || 0 : "-",
      "Total Pesanan": row.type === "header" ? row.total || 0 : "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pesanan");
    const filename = `Laporan_Pesanan_${getCurrentDateTimeForFilename()}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        paddingTop: 24,
        paddingBottom: 24,
        position: "relative",
      }}>
      <LoadingOverlay visible={loading} />

      <Container size="lg">
        <Stack spacing="lg">
          {/* Filter Section */}
          <Paper shadow="sm" p="md" radius="md" pb="xl">
            <Stack spacing="md">
              <Title order={4}>Sort By:</Title>

              {/* Jenis Filter */}
              <Group spacing="xl">
                <Text weight={500}>Jenis:</Text>
                <Radio.Group
                  value={jenisLaporan}
                  onChange={(value) => {
                    setJenisLaporan(value);
                    setCurrentPage(1);
                  }}
                  name="jenisLaporan">
                  <Group spacing="md">
                    <Radio value="penjualan" label="Penjualan" />
                    <Radio value="pembelian" label="Pembelian" />
                    <Radio value="pesanan" label="Pesanan" />
                    <Radio value="all" label="All" />
                  </Group>
                </Radio.Group>
              </Group>
            </Stack>
          </Paper>
          {/* Pagination for "all" mode */}
          {jenisLaporan === "all" && (
            <Group justify="center" mt="md" mb="md">
              <Pagination
                value={currentPage}
                onChange={setCurrentPage}
                total={3}
                siblings={1}
              />
            </Group>
          )}
          {/* Penjualan Section */}
          {(jenisLaporan === "penjualan" ||
            (jenisLaporan === "all" && currentPage === 1)) && (
            <Paper shadow="sm" p="lg" radius="md">
              <Group justify="space-between" pb="md">
                <Title order={3}>Penjualan</Title>
                <Button
                  onClick={downloadPenjualanExcel}
                  disabled={penjualanRows.length === 0}>
                  Download Excel
                </Button>
              </Group>
              {dataPenjualan.length > 0 ? (
                <Stack gap="md">
                  <ThemeProvider theme={theme}>
                    <div style={{ height: 600, width: "100%" }}>
                      <DataGrid
                        rows={penjualanRows}
                        columns={penjualanColumns}
                        pageSize={10}
                        rowsPerPageOptions={[5, 10, 20]}
                        pagination
                        disableSelectionOnClick
                        density="compact"
                        getRowClassName={getRowClassName}
                        onFilterModelChange={(newFilterModel) => {
                          if (newFilterModel.items.length === 0) {
                            // No filter applied, reset to all rows
                            setFilteredPenjualanRows([]);
                          } else {
                            // Get filtered rows
                            const filteredRows = penjualanRows.filter((row) => {
                              return newFilterModel.items.every((item) => {
                                const value = row[item.field];
                                if (item.operator === "contains") {
                                  return String(value).includes(item.value);
                                }
                                if (item.operator === "equals") {
                                  return String(value) === item.value;
                                }
                                return true;
                              });
                            });
                            setFilteredPenjualanRows(filteredRows);
                          }
                        }}
                      />
                    </div>
                  </ThemeProvider>

                  {/* Total Keseluruhan */}
                  <Group justify="flex-end" pt="md" mt="lg">
                    <Text
                      size="xl"
                      fw={700}
                      style={{
                        borderTop: "2px solid #8B7355",
                        paddingTop: "10px",
                      }}>
                      Total Penjualan: Rp{" "}
                      {totalPenjualan.toLocaleString("id-ID")}
                    </Text>
                  </Group>
                </Stack>
              ) : (
                <Box style={{ textAlign: "center", padding: "20px" }}>
                  <Text>Tidak ada data penjualan</Text>
                </Box>
              )}
            </Paper>
          )}

          {/* Pembelian Section */}
          {(jenisLaporan === "pembelian" ||
            (jenisLaporan === "all" && currentPage === 2)) && (
            <Paper shadow="sm" p="lg" radius="md">
              <Group justify="space-between" pb="md">
                <Title order={3}>Pembelian</Title>
                <Button
                  onClick={downloadPembelianExcel}
                  disabled={pembelianRows.length === 0}>
                  Download Excel
                </Button>
              </Group>
              {dataPembelian.length > 0 ? (
                <Stack gap="md">
                  <ThemeProvider theme={theme}>
                    <div style={{ height: 600, width: "100%" }}>
                      <DataGrid
                        rows={pembelianRows}
                        columns={pembelianColumns}
                        pageSize={10}
                        rowsPerPageOptions={[5, 10, 20]}
                        pagination
                        disableSelectionOnClick
                        density="compact"
                        onFilterModelChange={(newFilterModel) => {
                          if (newFilterModel.items.length === 0) {
                            // No filter applied, reset to all rows
                            setFilteredPembelianRows([]);
                          } else {
                            // Get filtered rows
                            const filteredRows = pembelianRows.filter((row) => {
                              return newFilterModel.items.every((item) => {
                                const value = row[item.field];
                                if (item.operator === "contains") {
                                  return String(value).includes(item.value);
                                }
                                if (item.operator === "equals") {
                                  return String(value) === item.value;
                                }
                                return true;
                              });
                            });
                            setFilteredPembelianRows(filteredRows);
                          }
                        }}
                      />
                    </div>
                  </ThemeProvider>

                  {/* Total Keseluruhan */}
                  <Group justify="flex-end" pt="md" mt="lg">
                    <Text
                      size="xl"
                      fw={700}
                      style={{
                        borderTop: "2px solid #8B7355",
                        paddingTop: "10px",
                      }}>
                      Total: Rp {totalPembelian.toLocaleString("id-ID")}
                    </Text>
                  </Group>
                </Stack>
              ) : (
                <Box style={{ textAlign: "center", padding: "20px" }}>
                  <Text>Tidak ada data pembelian</Text>
                </Box>
              )}
            </Paper>
          )}

          {/* Pesanan Section */}
          {(jenisLaporan === "pesanan" ||
            (jenisLaporan === "all" && currentPage === 3)) && (
            <Paper shadow="sm" p="lg" radius="md">
              <Group justify="space-between" pb="md">
                <Title order={3}>Pesanan</Title>
                <Button
                  onClick={downloadPesananExcel}
                  disabled={pesananRows.length === 0}>
                  Download Excel
                </Button>
              </Group>
              {dataPesanan.length > 0 ? (
                <Stack gap="md">
                  <ThemeProvider theme={theme}>
                    <div style={{ height: 600, width: "100%" }}>
                      <DataGrid
                        rows={pesananRows}
                        columns={pesananColumns}
                        pageSize={10}
                        rowsPerPageOptions={[5, 10, 20]}
                        pagination
                        disableSelectionOnClick
                        density="compact"
                        getRowClassName={getRowClassName}
                        onFilterModelChange={(newFilterModel) => {
                          if (newFilterModel.items.length === 0) {
                            // No filter applied, reset to all rows
                            setFilteredPesananRows([]);
                          } else {
                            // Get filtered rows
                            const filteredRows = pesananRows.filter((row) => {
                              return newFilterModel.items.every((item) => {
                                const value = row[item.field];
                                if (item.operator === "contains") {
                                  return String(value).includes(item.value);
                                }
                                if (item.operator === "equals") {
                                  return String(value) === item.value;
                                }
                                return true;
                              });
                            });
                            setFilteredPesananRows(filteredRows);
                          }
                        }}
                      />
                    </div>
                  </ThemeProvider>

                  {/* Total Keseluruhan */}
                  <Group justify="flex-end" pt="md" mt="lg">
                    <Text
                      size="xl"
                      fw={700}
                      style={{
                        borderTop: "2px solid #8B7355",
                        paddingTop: "10px",
                      }}>
                      Total Pesanan: Rp {totalPesanan.toLocaleString("id-ID")}
                    </Text>
                  </Group>
                </Stack>
              ) : (
                <Box style={{ textAlign: "center", padding: "20px" }}>
                  <Text>Tidak ada data pesanan</Text>
                </Box>
              )}
            </Paper>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default LaporanKeuanganPage;
