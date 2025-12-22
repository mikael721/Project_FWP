import React, { useState } from "react";
import {
  AppShell,
  Group,
  Image,
  Title,
  Button,
  TextInput,
  Container,
  Table,
  Badge,
  Stack,
  Text,
  Loader,
  Center,
  Alert,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../../asset/logo.png";

export const HistoryPage = () => {
  const API_BASE = import.meta.env.VITE_API_BASE;
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    setHistory([]);
    if (!email.trim()) {
      setError("Masukkan email terlebih dahulu");
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const response = await axios.get(
        `${API_BASE}/api/history/search?pesanan_email=${encodeURIComponent(
          email
        )}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;

      setHistory(data.data || []);
      if (data.data.length === 0) {
        setError("Tidak ada history pesanan untuk email ini");
      }
    } catch (err) {
      console.error("Error:", err);
      const errorMessage = err.response?.data?.message || err.message;
      setError("Terjadi kesalahan saat mengambil data: " + errorMessage);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "yellow";
      case "diproses":
        return "blue";
      case "terkirim":
        return "green";
      default:
        return "gray";
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case "pending":
        return "black";
      default:
        return "white";
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateTotal = (details) => {
    return details.reduce((sum, detail) => {
      return sum + (detail.menu_harga * detail.pesanan_detail_jumlah || 0);
    }, 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  return (
    <AppShell header={{ height: 70 }} padding="md">
      <AppShell.Header>
        <Group
          h="100%"
          px="md"
          justify="space-between"
          align="center"
          grow={false}>
          <Image
            src={logo}
            alt="Logo"
            h={70}
            w={70}
            fit="contain"
            style={{ flexShrink: 0 }}
          />

          <Title order={2} style={{ flex: 1, textAlign: "center" }}>
            History Pesanan
          </Title>

          <Button
            variant="default"
            size="md"
            onClick={() => navigate("/customer")}
            style={{ flexShrink: 0 }}>
            Kembali
          </Button>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="lg" py="xl">
          <Stack gap="lg">
            <Stack gap="sm">
              <Group grow>
                <TextInput
                  placeholder="nama@email.com"
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  error={error && searched ? error : ""}
                  size="md"
                />
                <Button
                  onClick={handleSearch}
                  loading={loading}
                  mt="auto"
                  size="md"
                  style={{ backgroundColor: "#CC0000" }}>
                  Cari
                </Button>
              </Group>
            </Stack>

            {loading && (
              <Center py="xl">
                <Loader size="lg" />
              </Center>
            )}

            {!loading && searched && history.length > 0 && (
              <Stack gap="md">
                <Text fw={600} size="lg">
                  Ditemukan {history.length} pesanan
                </Text>

                {history.map((pesanan) => (
                  <Stack
                    key={pesanan.pesanan_id}
                    gap="sm"
                    p="md"
                    style={{
                      border: "1px solid #dee2e6",
                      borderRadius: "8px",
                    }}>
                    <Group justify="space-between" style={{ flexWrap: "wrap" }}>
                      <div>
                        <Text size="lg">Nama: {pesanan.pesanan_nama}</Text>
                      </div>
                      <Badge
                        color={getStatusColor(pesanan.pesanan_status)}
                        style={{
                          color: getStatusTextColor(pesanan.pesanan_status),
                        }}
                        size="lg">
                        {pesanan.pesanan_status.charAt(0).toUpperCase() +
                          pesanan.pesanan_status.slice(1)}
                      </Badge>
                    </Group>

                    <Group grow style={{ flexWrap: "wrap" }}>
                      <div>
                        <Text size="sm">Lokasi</Text>
                        <Text size="lg">{pesanan.pesanan_lokasi}</Text>
                      </div>
                      <div>
                        <Text size="sm">Tanggal Pesanan</Text>
                        <Text size="lg">
                          {formatDate(pesanan.pesanan_tanggal)}
                        </Text>
                      </div>
                      <div>
                        <Text size="sm">Tanggal Pengiriman</Text>
                        <Text size="lg">
                          {formatDate(pesanan.pesanan_tanggal_pengiriman)}
                        </Text>
                      </div>
                    </Group>

                    {pesanan.details && pesanan.details.length > 0 && (
                      <Stack gap="xs">
                        <Text size="lg" fw={500}>
                          Detail Pesanan:
                        </Text>
                        <div style={{ overflowX: "auto" }}>
                          <Table size="md" style={{ minWidth: "500px" }}>
                            <Table.Thead>
                              <Table.Tr>
                                <Table.Th
                                  style={{
                                    fontSize: "16px",
                                    textAlign: "left",
                                  }}>
                                  Menu
                                </Table.Th>
                                <Table.Th
                                  style={{
                                    fontSize: "16px",
                                    textAlign: "center",
                                  }}>
                                  Harga
                                </Table.Th>
                                <Table.Th
                                  style={{
                                    fontSize: "16px",
                                    textAlign: "center",
                                  }}>
                                  Jumlah
                                </Table.Th>
                                <Table.Th
                                  style={{
                                    fontSize: "16px",
                                    textAlign: "right",
                                  }}>
                                  Subtotal
                                </Table.Th>
                              </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                              {pesanan.details.map((detail) => (
                                <Table.Tr key={detail.pesanan_detail_id}>
                                  <Table.Td
                                    style={{
                                      fontSize: "16px",
                                      textAlign: "left",
                                    }}>
                                    {detail.menu_nama}
                                  </Table.Td>
                                  <Table.Td
                                    style={{
                                      fontSize: "16px",
                                      textAlign: "center",
                                    }}>
                                    {formatCurrency(detail.menu_harga)}
                                  </Table.Td>
                                  <Table.Td
                                    style={{
                                      fontSize: "16px",
                                      textAlign: "center",
                                    }}>
                                    {detail.pesanan_detail_jumlah}
                                  </Table.Td>
                                  <Table.Td
                                    style={{
                                      fontSize: "16px",
                                      textAlign: "right",
                                    }}>
                                    {formatCurrency(
                                      detail.menu_harga *
                                        detail.pesanan_detail_jumlah
                                    )}
                                  </Table.Td>
                                </Table.Tr>
                              ))}
                            </Table.Tbody>
                          </Table>
                        </div>
                        <Group justify="flex-end">
                          <Text fw={600} size="lg">
                            Total:{" "}
                            {formatCurrency(calculateTotal(pesanan.details))}
                          </Text>
                        </Group>
                      </Stack>
                    )}
                  </Stack>
                ))}
              </Stack>
            )}

            {!loading && !searched && (
              <Center py="xl">
                <Text size="lg">
                  Masukkan email untuk melihat history pesanan
                </Text>
              </Center>
            )}
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
};

export default HistoryPage;
