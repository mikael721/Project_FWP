import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  AppShell,
  Burger,
  Button,
  Container,
  Group,
  Image,
  Menu,
} from "@mantine/core";
import { useDisclosure, useSetState } from "@mantine/hooks";
import logo from "../asset/logo.png";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import axios from "axios";
import { set } from "react-hook-form";

const PageLayoutPegawai = () => {
  const [opened, { toggle, close }] = useDisclosure(false);
  const location = useLocation();
  const [isManager, setisManager] = useState(false);
  const isActive = (path) => location.pathname === path;
  const API_BASE = import.meta.env.VITE_API_BASE;


  useEffect(() => {
    cekManager();
  },[])

  // === cek role
  const cekManager = async () => {
    await axios.post(`${API_BASE}/api/decrypt/dodecrypt`,
      {}, // ini body
      {
        headers:{
          token: userToken
        }
      }).then((res) => {
        try {
          // cek admin pa bukan
          if(res.data.data.pegawai_role === "manager") {            
            setisManager(true);
          }
          else{
            setisManager(false);
          }
        } catch (error) {
          return res.status(400).send({
            message: `Gagal : ${error.message}`
          })
        }
    });
  }

  // === ini buat token user ===
  const userToken = useSelector((state) => state.user.userToken);

  const getLinkStyle = (path) => ({
    textDecoration: "none",
    color: isActive(path) ? "#FFD700" : "white",
    fontWeight: isActive(path) ? "bold" : "normal",
    borderBottom: isActive(path) ? "3px solid #FFD700" : "none",
    paddingBottom: isActive(path) ? "5px" : "0px",
    transition: "all 0.3s ease",
  });

  return (
    <AppShell header={{ height: 70 }} padding="md">
      <AppShell.Header>
        <Container
          fluid
          h="100%"
          style={{ display: "flex", alignItems: "center" }}>
          <Group h="100%" justify="space-between" style={{ flex: 1 }}>
            <Link to="/" style={{ textDecoration: "none" }}>
              <Image src={logo} alt="Logo" h={65} fit="contain" />
            </Link>

            <Group visibleFrom="sm">
              
              <Link
                to="/pegawai/pesanan"
                style={getLinkStyle("/pegawai/pesanan")}>
                Pesanan
              </Link>
              
              <Link
                to="/pegawai/penjualan"
                style={getLinkStyle("/pegawai/penjualan")}>
                Penjualan
              </Link>

              {/* === manager only === */}
              {isManager && (
                <Link to="/pegawai/menu" style={getLinkStyle("/pegawai/menu")}>
                  Menu
                </Link>
              )}
              
              {/* === manager only === */}
              {isManager && (
                <Link to="/pegawai/stok" style={getLinkStyle("/pegawai/stok")}>
                  Stok
                </Link>
              )}

              {/* === manager only === */}
              {isManager && (
                <Link
                  to="/pegawai/laporan"
                  style={getLinkStyle("/pegawai/laporan")}>
                  Laporan
                </Link>
              )}
              
              <Link
                to="/pegawai"
                style={{
                  backgroundColor: "red",
                  borderRadius: "10px",
                  border: "1px solid black",
                  color: "white",
                  fontWeight: "bolder",
                  padding: "5px 10px",
                  textDecoration: "none",
                }}>
                Log Out
              </Link>
            
            </Group>

            <Menu
              opened={opened}
              onClose={close}
              position="bottom-end"
              offset={15}
              transitionProps={{ transition: "pop", duration: 150 }}
              middlewares={{ shift: true, flip: true }}
              shadow="md"
              width={200}>
              <Menu.Target>
                <Burger
                  opened={opened}
                  onClick={toggle}
                  hiddenFrom="sm"
                  size="sm"
                  color="white"
                />
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item
                  component={Link}
                  to="/pegawai/pesanan"
                  onClick={close}
                  style={
                    isActive("/pegawai/pesanan")
                      ? { backgroundColor: "#e0e0e0", fontWeight: "bold" }
                      : {}
                  }>
                  Pesanan
                </Menu.Item>
                <Menu.Item
                  component={Link}
                  to="/pegawai/penjualan"
                  onClick={close}
                  style={
                    isActive("/pegawai/penjualan")
                      ? { backgroundColor: "#e0e0e0", fontWeight: "bold" }
                      : {}
                  }>
                  Penjualan
                </Menu.Item>
                <Menu.Item
                  component={Link}
                  to="/pegawai/menu"
                  onClick={close}
                  style={
                    isActive("/pegawai/menu")
                      ? { backgroundColor: "#e0e0e0", fontWeight: "bold" }
                      : {}
                  }>
                  Menu
                </Menu.Item>
                <Menu.Item
                  component={Link}
                  to="/pegawai/stok"
                  onClick={close}
                  style={
                    isActive("/pegawai/stok")
                      ? { backgroundColor: "#e0e0e0", fontWeight: "bold" }
                      : {}
                  }>
                  Stok
                </Menu.Item>
                <Menu.Item
                  component={Link}
                  to="/pegawai/laporan"
                  onClick={close}
                  style={
                    isActive("/pegawai/laporan")
                      ? { backgroundColor: "#e0e0e0", fontWeight: "bold" }
                      : {}
                  }>
                  Laporan
                </Menu.Item>
                <Menu.Item
                  component={Link}
                  to="/pegawai"
                  onClick={close}
                  style={{
                    backgroundColor: "red",
                    color: "white",
                    fontWeight: "bolder",
                  }}>
                  Log Out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
};

export default PageLayoutPegawai;
