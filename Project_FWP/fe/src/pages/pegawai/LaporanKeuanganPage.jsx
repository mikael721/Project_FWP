import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Stack,
  Title,
  Paper,
  Table,
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

export const LaporanKeuanganPage = () => {
  const API_BASE = import.meta.env.VITE_API_BASE;
  const [jenisLaporan, setJenisLaporan] = useState("penjualan");
  const [currentPage, setCurrentPage] = useState(1);
  const [dataPenjualan, setDataPenjualan] = useState([]);
  const [dataPembelian, setDataPembelian] = useState([]);
  const [dataPesanan, setDataPesanan] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tanggalStart, setTanggalStart] = useState("");
  const [jamStart, setJamStart] = useState("00:00");
  const [tanggalEnd, setTanggalEnd] = useState("");
  const [jamEnd, setJamEnd] = useState("23:59");
  const [filterNama, setFilterNama] = useState("");
  const [filterMenuId, setFilterMenuId] = useState("");
  const [filterBahanId, setFilterBahanId] = useState("");

  const navigate = useNavigate();
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

  // Fetch initial data
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

  // Fetch data penjualan fix
  const fetchPenjualan = async (filters = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.tanggalStart)
        params.append("tanggal_awal", filters.tanggalStart);
      if (filters.tanggalEnd)
        params.append("tanggal_akhir", filters.tanggalEnd);
      if (filters.jamStart) params.append("jam_awal", filters.jamStart);
      if (filters.jamEnd) params.append("jam_akhir", filters.jamEnd);

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

  // Fetch data pembelian
  const fetchPembelian = async (filters = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.tanggalStart)
        params.append("tanggal_awal", filters.tanggalStart);
      if (filters.tanggalEnd)
        params.append("tanggal_akhir", filters.tanggalEnd);
      if (filters.jamStart) params.append("jam_awal", filters.jamStart);
      if (filters.jamEnd) params.append("jam_akhir", filters.jamEnd);
      if (filters.bahanId) params.append("bahan_baku_id", filters.bahanId);

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

  // Fetch data pesanan
  const fetchPesanan = async (filters = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.tanggalStart)
        params.append("tanggal_awal", filters.tanggalStart);
      if (filters.tanggalEnd)
        params.append("tanggal_akhir", filters.tanggalEnd);
      if (filters.jamStart) params.append("jam_awal", filters.jamStart);
      if (filters.jamEnd) params.append("jam_akhir", filters.jamEnd);
      if (filters.nama && filters.nama.trim())
        params.append("nama", filters.nama.trim());
      if (filters.menuId && filters.menuId.trim())
        params.append("menu_id", filters.menuId.trim());

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

  const onApplyFilter = () => {
    const filters = {
      tanggalStart: tanggalStart || undefined,
      tanggalEnd: tanggalEnd || undefined,
      jamStart: jamStart || undefined,
      jamEnd: jamEnd || undefined,
      nama: filterNama || undefined,
      menuId: filterMenuId || undefined,
      bahanId: filterBahanId || undefined,
    };

    if (jenisLaporan === "penjualan") {
      fetchPenjualan(filters);
    } else if (jenisLaporan === "pembelian") {
      fetchPembelian(filters);
    } else if (jenisLaporan === "pesanan") {
      fetchPesanan(filters);
    } else if (jenisLaporan === "all") {
      fetchPenjualan(filters);
      fetchPembelian(filters);
      fetchPesanan(filters);
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

  // Cell styles for Pembelian table
  const headerCellStyle = {
    color: "white",
    backgroundColor: "#8B7355",
    fontWeight: "bold",
    padding: "10px",
    textAlign: "center",
  };

  const cellStyle = {
    padding: "8px",
    textAlign: "left",
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
          <Paper shadow="sm" p="md" radius="md">
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
              {/* Tanggal & Waktu Filter */}
              <Stack spacing="md">
                {/* For Penjualan, Pesanan, and All - Combined Datetime */}
                {(jenisLaporan === "penjualan" ||
                  jenisLaporan === "pesanan" ||
                  jenisLaporan === "all") && (
                  <Group spacing="md" align="flex-end">
                    <Box style={{ flex: 1 }}>
                      <Text size="sm" weight={500} mb={5}>
                        Tanggal dan Waktu
                      </Text>
                      <Group spacing="xs">
                        <TextInput
                          type="datetime-local"
                          placeholder="Tanggal & Waktu Mulai"
                          style={{ width: "220px" }}
                          value={
                            tanggalStart && jamStart
                              ? `${tanggalStart}T${jamStart}`
                              : ""
                          }
                          onChange={(e) => {
                            const [date, time] =
                              e.currentTarget.value.split("T");
                            setTanggalStart(date || "");
                            setJamStart(time || "00:00");
                          }}
                        />
                        <Text>Sampai</Text>
                        <TextInput
                          type="datetime-local"
                          placeholder="Tanggal & Waktu Akhir"
                          style={{ width: "220px" }}
                          value={
                            tanggalEnd && jamEnd
                              ? `${tanggalEnd}T${jamEnd}`
                              : ""
                          }
                          onChange={(e) => {
                            const [date, time] =
                              e.currentTarget.value.split("T");
                            setTanggalEnd(date || "");
                            setJamEnd(time || "23:59");
                          }}
                        />
                      </Group>
                    </Box>
                  </Group>
                )}

                {/* For Pembelian - Date Only */}
                {jenisLaporan === "pembelian" && (
                  <Group spacing="md" align="flex-end">
                    <Box style={{ flex: 1 }}>
                      <Text size="sm" weight={500} mb={5}>
                        Tanggal
                      </Text>
                      <Group spacing="xs">
                        <TextInput
                          type="date"
                          placeholder="Tanggal Mulai"
                          style={{ width: "180px" }}
                          value={tanggalStart}
                          onChange={(e) =>
                            setTanggalStart(e.currentTarget.value)
                          }
                        />
                        <Text>Sampai</Text>
                        <TextInput
                          type="date"
                          placeholder="Tanggal Akhir"
                          style={{ width: "180px" }}
                          value={tanggalEnd}
                          onChange={(e) => setTanggalEnd(e.currentTarget.value)}
                        />
                      </Group>
                    </Box>
                  </Group>
                )}

                {/* Conditional Filter Fields */}
                {(jenisLaporan === "pesanan" || jenisLaporan === "all") && (
                  <>
                    <TextInput
                      placeholder="Filter Nama Pemesan"
                      label="Nama Pemesan"
                      value={filterNama}
                      onChange={(e) => setFilterNama(e.currentTarget.value)}
                    />
                    <TextInput
                      placeholder="Filter Menu ID"
                      label="Menu ID"
                      value={filterMenuId}
                      onChange={(e) => setFilterMenuId(e.currentTarget.value)}
                    />
                  </>
                )}

                {(jenisLaporan === "pembelian" || jenisLaporan === "all") && (
                  <TextInput
                    placeholder="Filter Bahan Baku ID"
                    label="Bahan Baku ID"
                    value={filterBahanId}
                    onChange={(e) => setFilterBahanId(e.currentTarget.value)}
                  />
                )}
              </Stack>

              <Group position="left">
                <Button
                  color="red"
                  onClick={onApplyFilter}
                  style={{ borderRadius: "20px" }}>
                  Apply Filter
                </Button>
              </Group>
            </Stack>
          </Paper>

          {/* Penjualan Section */}
          {(jenisLaporan === "penjualan" ||
            (jenisLaporan === "all" && currentPage === 1)) && (
            <Paper shadow="sm" p="lg" radius="md">
              <Group justify="center" pb="md">
                <Title order={3}>Penjualan</Title>
              </Group>
              <Stack gap="md">
                {dataPenjualan.length > 0 ? (
                  dataPenjualan
                    .sort(
                      (a, b) => a.header_penjualan_id - b.header_penjualan_id
                    )
                    .map((item, index) => (
                      <Stack
                        key={index}
                        gap="sm"
                        p="md"
                        style={{
                          border: "1px solid #dee2e6",
                          borderRadius: "8px",
                        }}>
                        {/* Header Penjualan */}
                        <Group justify="space-between">
                          <div>
                            {item.pegawai_id && (
                              <Text size="sm" c="white" mt={5}>
                                Pegawai ID: {item.pegawai_id}
                              </Text>
                            )}
                          </div>
                          <div>
                            <Text size="sm" c="white">
                              ID Penjualan: {item.header_penjualan_id}
                            </Text>
                          </div>
                        </Group>

                        {/* Informasi Penjualan */}
                        <Group grow>
                          <div>
                            <Text size="sm" c="white">
                              Tanggal
                            </Text>
                            <Text size="lg" fw={500}>
                              {formatDateTime(item.tanggal)}
                            </Text>
                          </div>
                          <div>
                            <Text size="sm" c="white">
                              Jenis Transaksi
                            </Text>
                            <Text size="lg" fw={500}>
                              {item.jenis || "-"}
                            </Text>
                          </div>
                        </Group>

                        {/* Detail Penjualan */}
                        <Stack gap="xs">
                          <Text size="lg" fw={500}>
                            Detail Penjualan:
                          </Text>
                          <Box sx={{ overflowX: "auto" }}>
                            <Table size="sm">
                              <Table.Thead>
                                <Table.Tr
                                  style={{ backgroundColor: "#F5F5F5" }}>
                                  <Table.Th
                                    style={{
                                      fontSize: "14px",
                                      color: "brown",
                                    }}>
                                    Menu ID
                                  </Table.Th>
                                  <Table.Th
                                    style={{
                                      fontSize: "14px",
                                      color: "brown",
                                    }}>
                                    Menu
                                  </Table.Th>
                                  <Table.Th
                                    style={{
                                      fontSize: "14px",
                                      textAlign: "right",
                                      color: "brown",
                                    }}>
                                    Harga
                                  </Table.Th>
                                  <Table.Th
                                    style={{
                                      fontSize: "14px",
                                      textAlign: "center",
                                      color: "brown",
                                    }}>
                                    Jumlah
                                  </Table.Th>
                                  <Table.Th
                                    style={{
                                      fontSize: "14px",
                                      textAlign: "right",
                                      color: "brown",
                                    }}>
                                    Subtotal
                                  </Table.Th>
                                </Table.Tr>
                              </Table.Thead>

                              <Table.Tbody>
                                {item.items.map((menuItem, idx) => (
                                  <Table.Tr
                                    key={idx}
                                    style={{ backgroundColor: "#F5F5F5" }}>
                                    <Table.Td
                                      style={{
                                        fontSize: "14px",
                                        color: "brown",
                                      }}>
                                      {menuItem.menu_id}
                                    </Table.Td>

                                    <Table.Td
                                      style={{
                                        fontSize: "14px",
                                        color: "brown",
                                      }}>
                                      {menuItem.menu_nama}
                                    </Table.Td>

                                    <Table.Td
                                      style={{
                                        fontSize: "14px",
                                        textAlign: "right",
                                        color: "brown",
                                      }}>
                                      Rp{" "}
                                      {(
                                        menuItem.menu_harga || 0
                                      ).toLocaleString("id-ID")}
                                    </Table.Td>

                                    <Table.Td
                                      style={{
                                        fontSize: "14px",
                                        textAlign: "center",
                                        color: "brown",
                                      }}>
                                      {menuItem.penjualan_jumlah}
                                    </Table.Td>

                                    <Table.Td
                                      style={{
                                        fontSize: "14px",
                                        textAlign: "right",
                                        color: "brown",
                                      }}>
                                      Rp{" "}
                                      {(menuItem.subtotal || 0).toLocaleString(
                                        "id-ID"
                                      )}
                                    </Table.Td>
                                  </Table.Tr>
                                ))}
                              </Table.Tbody>
                            </Table>
                          </Box>

                          {/* Calculation Summary */}
                          <Stack
                            gap="xs"
                            p="md"
                            style={{
                              backgroundColor: "#f8f9fa",
                              borderRadius: "8px",
                            }}>
                            <Group justify="space-between">
                              <Text fw={500} c="brown">
                                Total Subtotal:
                              </Text>
                              <Text fw={500} c="brown">
                                Rp{" "}
                                {(item.totalSubtotal || 0).toLocaleString(
                                  "id-ID"
                                )}
                              </Text>
                            </Group>

                            <Group justify="space-between">
                              <Text fw={500} c="brown">
                                Total Biaya Tambahan:
                              </Text>
                              <Text fw={500} c="brown">
                                Rp{" "}
                                {(item.totalBiayaTambahan || 0).toLocaleString(
                                  "id-ID"
                                )}
                              </Text>
                            </Group>

                            <Group justify="space-between">
                              <Text fw={500} c="brown">
                                DP ({item.persentaseDP}% dari Total Subtotal):
                              </Text>
                              <Text fw={500} c="brown">
                                Rp {(item.totalDP || 0).toLocaleString("id-ID")}
                              </Text>
                            </Group>

                            <Group justify="space-between">
                              <Text fw={500} c="brown">
                                Grand Total (Subtotal + Biaya):
                              </Text>
                              <Text fw={500} c="brown">
                                Rp{" "}
                                {(item.grandTotal || 0).toLocaleString("id-ID")}
                              </Text>
                            </Group>

                            <Group
                              justify="space-between"
                              style={{
                                borderTop: "2px solid #8B7355",
                                paddingTop: "10px",
                              }}>
                              <Text fw={700} size="lg" c="brown">
                                Sisa Pembayaran (Grand Total - DP):
                              </Text>

                              <Text fw={700} size="lg" c="brown">
                                Rp{" "}
                                {(item.sisaPembayaran || 0).toLocaleString(
                                  "id-ID"
                                )}
                              </Text>
                            </Group>
                          </Stack>
                        </Stack>
                      </Stack>
                    ))
                ) : (
                  <Box style={{ textAlign: "center", padding: "20px" }}>
                    <Text>Tidak ada data penjualan</Text>
                  </Box>
                )}
              </Stack>

              {/* Total Keseluruhan */}
              <Group justify="flex-end" pt="md" mt="lg">
                <Text
                  size="xl"
                  fw={700}
                  style={{
                    borderTop: "2px solid #8B7355",
                    paddingTop: "10px",
                  }}>
                  Total Penjualan: Rp {totalPenjualan.toLocaleString("id-ID")}
                </Text>
              </Group>
            </Paper>
          )}

          {/* Pembelian Section */}
          {(jenisLaporan === "pembelian" ||
            (jenisLaporan === "all" && currentPage === 2)) && (
            <Paper shadow="sm" p="lg" radius="md">
              <Group justify="center" pb="md">
                <Title order={3}>Pembelian</Title>
              </Group>
              <Box sx={{ overflowX: "auto" }}>
                <Table>
                  <thead>
                    <tr style={{ backgroundColor: "#8B7355" }}>
                      <th style={headerCellStyle}>ID</th>
                      <th style={headerCellStyle}>Tanggal</th>
                      <th style={headerCellStyle}>Bahan Baku ID</th>
                      <th style={headerCellStyle}>Bahan Baku Nama</th>
                      <th style={headerCellStyle}>Jumlah Beli</th>
                      <th style={headerCellStyle}>Satuan</th>
                      <th style={headerCellStyle}>Harga/Satuan</th>
                      <th style={headerCellStyle}>Subtotal</th>
                      <th style={headerCellStyle}>Sisa Stok</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataPembelian.length > 0 ? (
                      dataPembelian.map((item, index) => (
                        <tr
                          key={index}
                          style={{
                            backgroundColor: "white",
                            color: "black",
                          }}>
                          <td style={cellStyle}>{item.pembelian_id}</td>
                          <td style={cellStyle}>{formatDate(item.tanggal)}</td>
                          <td style={cellStyle}>{item.bahan_baku_id}</td>
                          <td style={cellStyle}>{item.bahan_baku_nama}</td>
                          <td style={cellStyle}>{item.pembelian_jumlah}</td>
                          <td style={cellStyle}>{item.pembelian_satuan}</td>
                          <td style={cellStyle}>
                            Rp{" "}
                            {(item.pembelian_harga_satuan || 0).toLocaleString(
                              "id-ID"
                            )}
                          </td>
                          <td style={cellStyle}>
                            Rp {(item.subtotal || 0).toLocaleString("id-ID")}
                          </td>
                          <td
                            style={{
                              ...cellStyle,
                              fontWeight: "bold",
                              color:
                                item.bahan_baku_jumlah === 0
                                  ? "#d32f2f"
                                  : "#2e7d32",
                            }}>
                            {item.bahan_baku_jumlah !== undefined
                              ? `${item.bahan_baku_jumlah} ${item.pembelian_satuan}`
                              : "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr style={{ backgroundColor: "white", color: "black" }}>
                        <td
                          colSpan={9}
                          style={{ ...cellStyle, textAlign: "center" }}>
                          Tidak ada data pembelian
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Box>
              <Group justify="flex-end" pt="md">
                <Text size="xl" weight={700}>
                  Total: Rp {totalPembelian.toLocaleString("id-ID")}
                </Text>
              </Group>
            </Paper>
          )}

          {/* Pesanan Section */}
          {(jenisLaporan === "pesanan" ||
            (jenisLaporan === "all" && currentPage === 3)) && (
            <Paper shadow="sm" p="lg" radius="md">
              <Group justify="center" pb="md">
                <Title order={3}>Pesanan</Title>
              </Group>
              <Stack gap="md">
                {dataPesanan.length > 0 ? (
                  dataPesanan.map((item, index) => (
                    <Stack
                      key={index}
                      gap="sm"
                      p="md"
                      style={{
                        border: "1px solid #dee2e6",
                        borderRadius: "8px",
                      }}>
                      {/* Header Pesanan */}
                      <Group justify="space-between">
                        <div>
                          <Text size="lg" fw={600}>
                            Nama Pemesan: {item.pesanan_nama}
                          </Text>
                        </div>
                        <Badge color="blue" size="lg">
                          {item.pesanan_status}
                        </Badge>
                      </Group>

                      {/* Informasi Pesanan */}
                      <Group grow>
                        <div>
                          <Text size="sm" c="white">
                            Pesanan ID
                          </Text>
                          <Text size="lg" fw={500}>
                            {item.pesanan_id}
                          </Text>
                        </div>
                        <div>
                          <Text size="sm" c="white">
                            Tanggal Pesanan
                          </Text>
                          <Text size="lg" fw={500}>
                            {formatDateTime(item.tanggal)}
                          </Text>
                        </div>
                        <div>
                          <Text size="sm" c="white">
                            Tanggal Pengiriman
                          </Text>
                          <Text size="lg" fw={500}>
                            {formatDateTime(item.tanggal_pengiriman)}
                          </Text>
                        </div>
                      </Group>

                      {/* Detail Pesanan */}
                      <Stack gap="xs">
                        <Text size="lg" fw={500}>
                          Detail Pesanan:
                        </Text>
                        <Box sx={{ overflowX: "auto" }}>
                          <Table size="sm">
                            <Table.Thead>
                              <Table.Tr style={{ backgroundColor: "#F5F5F5" }}>
                                <Table.Th
                                  style={{ fontSize: "14px", color: "brown" }}>
                                  Menu ID
                                </Table.Th>
                                <Table.Th
                                  style={{ fontSize: "14px", color: "brown" }}>
                                  Menu
                                </Table.Th>
                                <Table.Th
                                  style={{
                                    fontSize: "14px",
                                    textAlign: "right",
                                    color: "brown",
                                  }}>
                                  Harga
                                </Table.Th>
                                <Table.Th
                                  style={{
                                    fontSize: "14px",
                                    textAlign: "center",
                                    color: "brown",
                                  }}>
                                  Jumlah
                                </Table.Th>
                                <Table.Th
                                  style={{
                                    fontSize: "14px",
                                    textAlign: "right",
                                    color: "brown",
                                  }}>
                                  Subtotal
                                </Table.Th>
                              </Table.Tr>
                            </Table.Thead>

                            <Table.Tbody>
                              {item.items.map((menuItem, idx) => (
                                <Table.Tr
                                  key={idx}
                                  style={{ backgroundColor: "#F5F5F5" }}>
                                  <Table.Td
                                    style={{
                                      fontSize: "14px",
                                      color: "brown",
                                    }}>
                                    {menuItem.menu_id}
                                  </Table.Td>

                                  <Table.Td
                                    style={{
                                      fontSize: "14px",
                                      color: "brown",
                                    }}>
                                    {menuItem.menu_nama}
                                  </Table.Td>

                                  <Table.Td
                                    style={{
                                      fontSize: "14px",
                                      textAlign: "right",
                                      color: "brown",
                                    }}>
                                    Rp{" "}
                                    {(menuItem.menu_harga || 0).toLocaleString(
                                      "id-ID"
                                    )}
                                  </Table.Td>

                                  <Table.Td
                                    style={{
                                      fontSize: "14px",
                                      textAlign: "center",
                                      color: "brown",
                                    }}>
                                    {menuItem.pesanan_detail_jumlah}
                                  </Table.Td>

                                  <Table.Td
                                    style={{
                                      fontSize: "14px",
                                      textAlign: "right",
                                      color: "brown",
                                    }}>
                                    Rp{" "}
                                    {(menuItem.subtotal || 0).toLocaleString(
                                      "id-ID"
                                    )}
                                  </Table.Td>
                                </Table.Tr>
                              ))}
                            </Table.Tbody>
                          </Table>
                        </Box>

                        {/* Total per transaksi */}
                        <Group justify="flex-end">
                          <Text fw={600} size="lg" c="white">
                            Subtotal:{" "}
                            {item.total
                              ? `Rp ${item.total.toLocaleString("id-ID")}`
                              : "Rp 0"}
                          </Text>
                        </Group>
                      </Stack>
                    </Stack>
                  ))
                ) : (
                  <Box style={{ textAlign: "center", padding: "20px" }}>
                    <Text>Tidak ada data pesanan</Text>
                  </Box>
                )}
              </Stack>

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
            </Paper>
          )}

          {/* Pagination for "all" mode */}
          {jenisLaporan === "all" && (
            <Group justify="center" mt="lg">
              <Pagination
                value={currentPage}
                onChange={setCurrentPage}
                total={3}
                siblings={1}
              />
            </Group>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default LaporanKeuanganPage;
