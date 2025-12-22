import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  TextInput,
  Button,
  Group,
  Text,
  Card,
  Image,
  Grid,
  NumberInput,
  ActionIcon,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setCartItems, clearCart } from "../../slice + storage/cartSlice";
import axios from "axios";

export const MainPenjualanPage = () => {
  const API_BASE = import.meta.env.VITE_API_BASE;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userToken = useSelector((state) => state.user.userToken);
  const cartItems = useSelector((state) => state.cart.items);

  const [searchQuery, setSearchQuery] = useState("");
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quantities, setQuantities] = useState({});
  const [currentHeaderId, setCurrentHeaderId] = useState(null);

  // === REDIRECT LOGIN ===
  useEffect(() => {
    cekSudahLogin();
  }, []);

  const cekSudahLogin = () => {
    if (!userToken) {
      navigate("/pegawai");
    } else {
      getMenu();
    }
  };

  // === GET MENU ===
  const getMenu = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/menu_management/getall`, {
        headers: { "x-auth-token": userToken },
      });
      setMenuItems(res.data);
    } catch (err) {
      console.error("Gagal get menu:", err.response?.data || err.message);
      alert("Gagal memuat menu");
    } finally {
      setLoading(false);
    }
  };

  // === HANDLE SEARCH ===
  const handleSearch = () => {
    // Filter will be applied in filteredMenu
  };

  // === ADD TO CART ===
  const handleAddToCart = (item) => {
    const quantity = quantities[item.menu_id] || 1;

    const cartItem = {
      menu_id: item.menu_id,
      menu_nama: item.menu_nama,
      menu_harga: item.menu_harga,
      menu_gambar: item.menu_gambar,
      penjualan_jumlah: quantity,
    };

    dispatch(setCartItems(cartItem));

    // Reset quantity input
    setQuantities((prev) => ({
      ...prev,
      [item.menu_id]: 1,
    }));
  };

  // === UPDATE QUANTITY INPUT ===
  const updateQuantityInput = (menuId, value) => {
    setQuantities((prev) => ({
      ...prev,
      [menuId]: value || 1,
    }));
  };

  // === CALCULATE TOTAL ===
  const calculateTotal = () => {
    return cartItems.reduce(
      (sum, item) => sum + item.menu_harga * item.penjualan_jumlah,
      0
    );
  };

  // === CREATE HEADER AND GO TO DETAIL ===
  const goToCart = async () => {
    if (cartItems.length === 0) {
      alert("Keranjang masih kosong!");
      return;
    }

    try {
      setLoading(true);

      // Create header penjualan terlebih dahulu
      const headerPayload = {
        header_penjualan_tanggal: new Date().toISOString(),
        header_penjualan_jenis: "offline", // default
        header_penjualan_keterangan: "Penjualan menu offline",
        header_penjualan_biaya_tambahan: 0,
        header_penjualan_uang_muka: 0,
      };

      const headerRes = await axios.post(
        `${API_BASE}/api/detail_penjualan/header`,
        headerPayload,
        {
          headers: { "x-auth-token": userToken },
        }
      );

      const headerId = headerRes.data.data.header_penjualan_id;

      // Navigate ke detail page dengan header_penjualan_id
      navigate(`/pegawai/penjualan/detail/${headerId}`);
    } catch (err) {
      console.error("Gagal membuat header:", err.response?.data || err.message);
      alert(
        "Gagal membuat transaksi: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // === FILTER MENU ===
  const filteredMenu = menuItems.filter(
    (item) =>
      item.menu_status_aktif === 1 &&
      item.menu_nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box
      style={{
        minHeight: "100vh",
        paddingTop: "24px",
        paddingBottom: "24px",
      }}
    >
      <Container size="xl">
        {/* Header Section */}
        <Box
          style={{
            backgroundColor: "rgba(140, 98, 52, 0.8)",
            borderRadius: "50px",
            padding: "20px 40px",
            marginBottom: "30px",
          }}
        >
          <Group justify="space-between" align="center">
            {/* Cart Button */}
            <Button
              size="lg"
              color="red"
              radius="xl"
              onClick={goToCart}
              loading={loading}
              disabled={loading}
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                paddingLeft: "40px",
                paddingRight: "40px",
              }}
            >
              Cart ({cartItems.length})
            </Button>

            {/* Total and Search Section */}
            <Group gap="xl" align="center">
              {/* Total Display */}
              <Group gap="md" align="center">
                <Text size="lg" fw={500} style={{ color: "white" }}>
                  Total:
                </Text>
                <Text size="xl" fw={700} style={{ color: "white" }}>
                  Rp {calculateTotal().toLocaleString("id-ID")}
                </Text>
              </Group>

              {/* Search Box */}
              <Group gap="xs" wrap="nowrap">
                <TextInput
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                  styles={{
                    input: {
                      backgroundColor: "white",
                      color: "black",
                      borderRadius: "20px",
                      width: "200px",
                    },
                  }}
                />
              </Group>
            </Group>
          </Group>
        </Box>

        {/* Menu Grid */}
        <Grid gutter="lg">
          {filteredMenu.map((item) => (
            <Grid.Col key={item.menu_id} span={{ base: 12, sm: 6, md: 4 }}>
              <Card
                shadow="md"
                padding="lg"
                radius="md"
                style={{
                  backgroundColor: "rgba(140, 98, 52, 0.6)",
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                  transition: "transform 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <Card.Section>
                  <Image
                    src={item.menu_gambar}
                    height={180}
                    alt={item.menu_nama}
                    fit="cover"
                  />
                </Card.Section>

                <Box mt="md" mb="xs">
                  <Text fw={700} size="xl" style={{ color: "white" }}>
                    Rp {item.menu_harga.toLocaleString("id-ID")}
                  </Text>
                  <Text size="md" style={{ color: "white" }}>
                    {item.menu_nama}
                  </Text>
                </Box>

                <NumberInput
                  mt="sm"
                  placeholder="Jumlah"
                  min={1}
                  value={quantities[item.menu_id] || 1}
                  onChange={(val) => updateQuantityInput(item.menu_id, val)}
                  styles={{
                    input: {
                      backgroundColor: "white",
                      color: "black",
                      borderRadius: "10px",
                    },
                  }}
                />

                <Button
                  fullWidth
                  mt="md"
                  radius="md"
                  color="red"
                  size="md"
                  onClick={() => handleAddToCart(item)}
                  style={{
                    fontWeight: "bold",
                    fontSize: "16px",
                  }}
                >
                  Add to cart
                </Button>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default MainPenjualanPage;
