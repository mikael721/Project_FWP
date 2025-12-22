import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  AppShell,
  Box,
  Container,
  Stack,
  Title,
  TextInput,
  Button,
  Paper,
  Group,
  Text,
  Divider,
  Image,
  Modal,
} from "@mantine/core";
import logo from "../../asset/logo.png";
import qris from "../../asset/dummy_qris.jpg";
import { useDispatch, useSelector } from "react-redux";
import { clear } from "../../slice + storage/menuSlice";

const CartPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const menuTerpilih = useSelector((state) => state.menu.menuTerpilih);
  const API_BASE = import.meta.env.VITE_API_BASE;

  const [loading, setLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingCheckoutData, setPendingCheckoutData] = useState(null);
  const [cartItems, setCartItems] = useState(() => {
    const items = menuTerpilih || [];
    return items.map((item, index) => ({
      ...item,
      tempId: `${item.menu_id}-${index}-${Date.now()}`,
    }));
  });

  const [form, setForm] = useState({
    pesanan_nama: "",
    pesanan_email: "",
    pesanan_lokasi: "",
    nomer_telpon: "",
    pesanan_tanggal_pengiriman: "",
  });

  const [errors, setErrors] = useState({});

  // now + 2
  const minDateTime = useMemo(() => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 2);
    minDate.setHours(0, 0, 0, 0);

    const year = minDate.getFullYear();
    const month = String(minDate.getMonth() + 1).padStart(2, "0");
    const day = String(minDate.getDate()).padStart(2, "0");
    const hours = String(minDate.getHours()).padStart(2, "0");
    const minutes = String(minDate.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!form.pesanan_nama.trim()) {
      newErrors.pesanan_nama = "Nama penerima wajib diisi";
    } else if (form.pesanan_nama.trim().length < 3) {
      newErrors.pesanan_nama = "Nama minimal 3 karakter";
    }

    if (!form.pesanan_email.trim()) {
      newErrors.pesanan_email = "Email wajib diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.pesanan_email)) {
      newErrors.pesanan_email = "Email harus valid";
    }

    if (!form.pesanan_lokasi.trim()) {
      newErrors.pesanan_lokasi = "Lokasi pengiriman wajib diisi";
    } else if (form.pesanan_lokasi.trim().length < 5) {
      newErrors.pesanan_lokasi = "Lokasi minimal 5 karakter";
    }

    if (!form.nomer_telpon.trim()) {
      newErrors.nomer_telpon = "Nomor telepon wajib diisi";
    } else if (form.nomer_telpon.trim().length < 9) {
      newErrors.nomer_telpon = "Nomor telepon minimal 9 karakter";
    } else if (form.nomer_telpon.trim().length > 20) {
      newErrors.nomer_telpon = "Nomor telepon maksimal 20 karakter";
    } else if (!/^\d+$/.test(form.nomer_telpon.trim())) {
      newErrors.nomer_telpon = "Nomor telepon hanya boleh berisi angka";
    }

    if (!form.pesanan_tanggal_pengiriman) {
      newErrors.pesanan_tanggal_pengiriman =
        "Tanggal dan waktu pengiriman wajib diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleQuantityChange = (tempId, delta) => {
    setCartItems((items) => {
      const updatedItems = items
        .map((item) => {
          if (item.tempId === tempId) {
            const newQuantity = Math.max(0, item.pesanan_detail_jumlah + delta);
            return {
              ...item,
              pesanan_detail_jumlah: newQuantity,
            };
          }
          return item;
        })
        .filter((item) => item.pesanan_detail_jumlah > 0);

      return updatedItems;
    });
  };

  const handleFormChange = (field, value) => {
    setForm((prevForm) => ({
      ...prevForm,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [field]: "",
      }));
    }
  };

  // generate dan download PDF invoice
  const generateInvoicePDF = (pesananId, pesananData) => {
    const totalHarga = cartItems.reduce(
      (sum, item) => sum + item.price * item.pesanan_detail_jumlah,
      0
    );

    const deliveryDate = new Date(form.pesanan_tanggal_pengiriman);
    const formattedDeliveryDate = deliveryDate.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const currentDate = new Date();
    const formattedCurrentDate = currentDate.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // HTMLnya
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Nota Pesanan #${pesananId}</title>
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
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .logo-section {
            flex-shrink: 0;
          }
          .logo-section img {
            max-width: 80px;
            height: auto;
          }
          .company-info h1 {
            font-size: 28px;
            margin-bottom: 5px;
          }
          .invoice-title {
            text-align: right;
          }
          .invoice-title h2 {
            font-size: 24px;
            margin-bottom: 10px;
            color: #d32f2f;
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
            <div class="logo-section">
              <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" alt="Logo" />
            </div>
            <div class="invoice-title">
              <h2>INVOICE</h2>
              <div class="invoice-number">#${pesananId}</div>
            </div>
          </div>

          <div class="invoice-info">
            <div class="info-section">
              <h3>Informasi Pemesan</h3>
              <p><strong>${form.pesanan_nama}</strong></p>
              <p>${form.pesanan_email}</p>
              <p>${form.nomer_telpon}</p>
            </div>
            <div class="info-section">
              <h3>Alamat Pengiriman</h3>
              <p>${form.pesanan_lokasi}</p>
            </div>
            <div class="info-section">
              <h3>Informasi Pesanan</h3>
              <p><strong>Tanggal Pesanan:</strong><br>${formattedCurrentDate}</p>
              <p><strong>Tanggal Pengiriman:</strong><br>${formattedDeliveryDate}</p>
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
                ${cartItems
                  .map(
                    (item) => `
                  <tr>
                    <td>${item.name}</td>
                    <td class="text-right">Rp ${item.price.toLocaleString(
                      "id-ID"
                    )}</td>
                    <td class="text-right">${item.pesanan_detail_jumlah}</td>
                    <td class="text-right">Rp ${(
                      item.price * item.pesanan_detail_jumlah
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
              <div class="summary-row total">
                <span>TOTAL:</span>
                <span>Rp ${totalHarga.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>

          <div class="status">
            Status: PENDING - Pesanan Anda sedang diproses
          </div>

          <div class="footer">
            <p>Terima kasih telah berbelanja. Pesanan Anda akan segera diproses.</p>
            <p>Warung Bu Lis. Jln penataran no 1. 087851868</p>
            <p style="margin-top: 10px; color: #999;">Harap simpan nota ini untuk referensi Anda.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Create blob dan download
    const blob = new Blob([htmlContent], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Nota_Pesanan_${pesananId}_${
      new Date().toISOString().split("T")[0]
    }.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const proceedWithPayment = async () => {
    if (!pendingCheckoutData) return;

    try {
      setLoading(true);
      const { currentIsoDateTime, isoDeliveryDateTime } = pendingCheckoutData;

      const pesananResponse = await axios.post(
        `${API_BASE}/api/pesanan_detail/detail/header`,
        {
          pesanan_nama: form.pesanan_nama.trim(),
          pesanan_lokasi: form.pesanan_lokasi.trim(),
          pesanan_email: form.pesanan_email.trim().toLowerCase(),
          nomer_telpon: form.nomer_telpon.trim(),
          pesanan_tanggal: currentIsoDateTime,
          pesanan_tanggal_pengiriman: isoDeliveryDateTime,
        }
      );

      const pesanan_id =
        pesananResponse.data.data?.pesanan_id || pesananResponse.data.data?.id;

      if (!pesanan_id) {
        throw new Error("Gagal mendapatkan ID pesanan dari server");
      }

      console.log("Pesanan created with ID:", pesanan_id);

      const detailPromises = cartItems.map((item) => {
        const subtotal = item.price * item.pesanan_detail_jumlah;
        console.log(subtotal);
        return axios.post(`${API_BASE}/api/pesanan_detail/detail/detail`, {
          menu_id: item.menu_id,
          pesanan_detail_jumlah: item.pesanan_detail_jumlah,
          pesanan_id: pesanan_id,
          subtotal: subtotal,
        });
      });

      const detailResponses = await Promise.all(detailPromises);
      console.log("All pesanan details created:", detailResponses);

      // Generate dan download invoice
      generateInvoicePDF(pesanan_id, {
        nama: form.pesanan_nama,
        email: form.pesanan_email,
        telepon: form.nomer_telpon,
        lokasi: form.pesanan_lokasi,
        tanggalPengiriman: form.pesanan_tanggal_pengiriman,
      });

      alert("Pesanan berhasil dibuat! Nota telah diunduh. Status: Pending");

      setCartItems([]);
      setForm({
        pesanan_nama: "",
        pesanan_email: "",
        pesanan_lokasi: "",
        nomer_telpon: "",
        pesanan_tanggal_pengiriman: "",
      });
      setErrors({});
      setPaymentModalOpen(false);
      setPendingCheckoutData(null);
    } catch (error) {
      console.error("Error during checkout:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Terjadi kesalahan saat membuat pesanan";
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      if (!validateForm()) {
        return;
      }

      if (cartItems.length === 0) {
        alert("Keranjang tidak boleh kosong");
        return;
      }

      const localDateTime = form.pesanan_tanggal_pengiriman;
      console.log(localDateTime);

      // Send datetime as-is without timezone conversion
      const deliveryDate = new Date(localDateTime);
      const isoDeliveryDateTime = deliveryDate.toISOString();

      const now = new Date();
      const currentIsoDateTime = now.toISOString();

      setPendingCheckoutData({
        currentIsoDateTime,
        isoDeliveryDateTime,
      });
      setPaymentModalOpen(true);
    } catch (error) {
      console.error("Error during checkout:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Terjadi kesalahan saat membuat pesanan";
      alert(`Error: ${errorMessage}`);
    }
  };

  const totalHarga = cartItems.reduce(
    (sum, item) => sum + item.price * item.pesanan_detail_jumlah,
    0
  );

  const logout = () => {
    dispatch(clear());
    navigate("/customer");
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

          <Title order={3} style={{ flex: 1, textAlign: "center" }}>
            Keranjang
          </Title>

          <Button
            variant="default"
            size="sm"
            onClick={logout}
            style={{ flexShrink: 0 }}>
            Kembali
          </Button>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Box style={{ minHeight: "100vh", paddingTop: 24, paddingBottom: 24 }}>
          <Container size="sm">
            <Stack gap="lg">
              <Paper shadow="sm" p="md" radius="md">
                <Stack gap="md">
                  <div>
                    <TextInput
                      label={
                        <Text fw={700} size="md">
                          Nama Penerima
                        </Text>
                      }
                      placeholder="Masukkan nama penerima"
                      value={form.pesanan_nama}
                      onChange={(e) =>
                        handleFormChange("pesanan_nama", e.target.value)
                      }
                      error={errors.pesanan_nama ? true : false}
                      required
                      styles={{
                        input: {
                          "&::placeholder": {
                            color: "white",
                            fontWeight: "700",
                            opacity: "1",
                          },
                        },
                      }}
                    />
                    {errors.pesanan_nama && (
                      <Text size="sm" c="red" fw={700} mt={4}>
                        {errors.pesanan_nama}
                      </Text>
                    )}
                  </div>

                  <div>
                    <TextInput
                      label={
                        <Text fw={700} size="md">
                          Email
                        </Text>
                      }
                      placeholder="Masukkan email Anda"
                      type="email"
                      value={form.pesanan_email}
                      onChange={(e) =>
                        handleFormChange("pesanan_email", e.target.value)
                      }
                      error={errors.pesanan_email ? true : false}
                      required
                      styles={{
                        input: {
                          "&::placeholder": {
                            color: "white",
                            fontWeight: "700",
                            opacity: "1",
                          },
                        },
                      }}
                    />
                    {errors.pesanan_email && (
                      <Text size="sm" c="red" fw={700} mt={4}>
                        {errors.pesanan_email}
                      </Text>
                    )}
                  </div>

                  <div>
                    <TextInput
                      label={
                        <Text fw={700} size="md">
                          Nomor Telepon
                        </Text>
                      }
                      placeholder="Masukkan nomor telepon Anda"
                      type="tel"
                      value={form.nomer_telpon}
                      onChange={(e) =>
                        handleFormChange("nomer_telpon", e.target.value)
                      }
                      error={errors.nomer_telpon ? true : false}
                      required
                      maxLength={20}
                      styles={{
                        input: {
                          "&::placeholder": {
                            color: "white",
                            fontWeight: "700",
                            opacity: "1",
                          },
                        },
                      }}
                    />
                    {errors.nomer_telpon && (
                      <Text size="sm" c="red" fw={700} mt={4}>
                        {errors.nomer_telpon}
                      </Text>
                    )}
                  </div>

                  <div>
                    <TextInput
                      label={
                        <Text fw={700} size="md">
                          Lokasi Pengiriman
                        </Text>
                      }
                      placeholder="Masukkan lokasi pengiriman lengkap"
                      value={form.pesanan_lokasi}
                      onChange={(e) =>
                        handleFormChange("pesanan_lokasi", e.target.value)
                      }
                      error={errors.pesanan_lokasi ? true : false}
                      required
                      styles={{
                        input: {
                          "&::placeholder": {
                            color: "white",
                            fontWeight: "700",
                            opacity: "1",
                          },
                        },
                      }}
                    />
                    {errors.pesanan_lokasi && (
                      <Text size="sm" c="red" fw={700} mt={4}>
                        {errors.pesanan_lokasi}
                      </Text>
                    )}
                  </div>

                  <div>
                    <TextInput
                      label={
                        <Text fw={700} size="md">
                          Tanggal dan Waktu Pengiriman
                        </Text>
                      }
                      placeholder="Pilih tanggal dan waktu"
                      type="datetime-local"
                      value={form.pesanan_tanggal_pengiriman}
                      onChange={(e) =>
                        handleFormChange(
                          "pesanan_tanggal_pengiriman",
                          e.target.value
                        )
                      }
                      error={errors.pesanan_tanggal_pengiriman ? true : false}
                      min={minDateTime}
                      required
                    />
                    {errors.pesanan_tanggal_pengiriman && (
                      <Text size="sm" c="red" fw={700} mt={4}>
                        {errors.pesanan_tanggal_pengiriman}
                      </Text>
                    )}
                  </div>
                </Stack>
              </Paper>

              <Paper shadow="sm" p="md" radius="md">
                <Stack gap="md">
                  {cartItems.length > 0 ? (
                    <>
                      {cartItems.map((item) => (
                        <Box key={item.tempId}>
                          <Group
                            justify="space-between"
                            align="flex-start"
                            pb="md">
                            <Box style={{ flex: 1 }}>
                              <Text fw={500}>{item.name}</Text>
                              <Text size="md">
                                Rp {item.price.toLocaleString("id-ID")}
                              </Text>
                              <Text size="lg" c="white" mt={4}>
                                Subtotal: Rp{" "}
                                {(
                                  item.price * item.pesanan_detail_jumlah
                                ).toLocaleString("id-ID")}
                              </Text>
                            </Box>

                            <Box style={{ width: 120, flexShrink: 0 }}>
                              <Image
                                src={item.image}
                                alt={item.name}
                                radius="md"
                                height={80}
                                fit="cover"
                              />
                              <Group
                                justify="center"
                                mt={6}
                                gap={2}
                                wrap="nowrap">
                                <Button
                                  size="xs"
                                  color="red"
                                  onClick={() =>
                                    handleQuantityChange(item.tempId, -1)
                                  }
                                  style={{ flex: 1 }}>
                                  -
                                </Button>
                                <Text
                                  size="sm"
                                  ta="center"
                                  fw={600}
                                  style={{
                                    flex: 1,
                                    minWidth: 24,
                                  }}>
                                  {item.pesanan_detail_jumlah}
                                </Text>
                                <Button
                                  size="xs"
                                  color="green"
                                  onClick={() =>
                                    handleQuantityChange(item.tempId, 1)
                                  }
                                  style={{ flex: 1 }}>
                                  +
                                </Button>
                              </Group>
                            </Box>
                          </Group>
                          <Divider />
                        </Box>
                      ))}

                      <Group justify="space-between" pt="md">
                        <Text fw={600} size="lg">
                          Total
                        </Text>
                        <Text fw={600} size="xl" c="white">
                          Rp {totalHarga.toLocaleString("id-ID")}
                        </Text>
                      </Group>

                      <Button
                        fullWidth
                        color="red"
                        size="md"
                        onClick={handleCheckOut}
                        loading={loading}
                        disabled={loading || cartItems.length === 0}>
                        {loading ? "Processing..." : "Check Out"}
                      </Button>
                    </>
                  ) : (
                    <Text ta="center" py="xl" c="dimmed">
                      Keranjang Anda kosong
                    </Text>
                  )}
                </Stack>
              </Paper>
            </Stack>
          </Container>
        </Box>
      </AppShell.Main>

      <Modal
        opened={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setPendingCheckoutData(null);
        }}
        title="Metode Pembayaran"
        styles={{
          header: {
            backgroundColor: "#4C2E01",
          },
          title: {
            color: "white",
          },
          close: {
            color: "white",
          },
        }}
        centered>
        <Stack gap="lg" align="center" className="mt-3">
          <Box ta="center">
            <Text fw={600} mb="md">
              Scan QRIS untuk pembayaran:
            </Text>
            <Image
              src={qris}
              alt="QRIS"
              radius="md"
              w={250}
              h={250}
              fit="contain"
            />
          </Box>

          <Box ta="center" w="100%">
            <Text fw={600} mb="sm">
              Atau gunakan Virtual Account:
            </Text>
            <Box
              p="md"
              style={{
                border: "2px solid #ddd",
                borderRadius: "8px",
                backgroundColor: "#4C2E01",
              }}>
              <Text size="lg" fw={700} style={{ letterSpacing: "2px" }}>
                1152-2363-7412-3455
              </Text>
            </Box>
          </Box>

          <Group w="100%" grow>
            <Button
              variant="default"
              onClick={() => {
                setPaymentModalOpen(false);
                setPendingCheckoutData(null);
              }}>
              Batal
            </Button>
            <Button color="red" onClick={proceedWithPayment} loading={loading}>
              Download Nota
            </Button>
          </Group>
        </Stack>
      </Modal>
    </AppShell>
  );
};

export default CartPage;
