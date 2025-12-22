import { setLogin, setLogout } from "../../slice + storage/userSlice";
import { useDispatch, useSelector } from "react-redux";
import "../css/customer/MenuPage.css";
import logo from "../../asset/logo.png";
import CardMenu from "../../component/CardMenu/CardMenu";
import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import menuSlice from "../../slice + storage/menuSlice";
import { AppShell, Button, Container, Group, Image } from "@mantine/core";
import GambarBuLis from "../../asset/bu-Lis-Ask-NoBg.png";
import { useSetState } from "@mantine/hooks";
import qris from "../../asset/qris.jpg";
import { motion, AnimatePresence } from "framer-motion";

// === Help Lihat Riwayat ===
import lihathistory from "../../asset/CaraLihatRiwayatPesanan/1_KlikHistory.png";
import masukanemail from "../../asset/CaraLihatRiwayatPesanan/2_MasukanEmail.png";
import pesananmuncul from "../../asset/CaraLihatRiwayatPesanan/3_PesananTelahMuncul.png";

// === Help Cara Pesan ===
import pilihmenu from "../../asset/CaraPesan/1_PilihMenuYangAkanDibeli.png";
import isiinfo from "../../asset/CaraPesan/2_IsiInformasi.png";
import klikcekout from "../../asset/CaraPesan/3_KlikCheckOut.png";
import downloadnota from "../../asset/CaraPesan/4_KlikDownloadNota.png";

const MenuPage = () => {
  // === VARIABEL ===
  let navigate = useNavigate();
  let dispatch = useDispatch();
  let menuTerpesan = useSelector((state) => state.menu.menuTerpilih);
  const API_BASE = import.meta.env.VITE_API_BASE;

  // === USE STATE ===
  const [menu, setmenu] = useState([]);
  const [showHelp, setshowHelp] = useState(false);
  const [showHelpDetail, setshowHelpDetail] = useState("none");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);

  // === USE EFFECT ===
  useEffect(() => {
    getMenu();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // === FUNCTION ===
  const getMenu = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/menu_management/customer/getall`
      );
      setmenu(res.data);
      console.log("Data menu:", res.data);
    } catch (err) {
      console.error("Gagal get menu:", err.response?.data || err.message);
    }
  };

  const showHelpPanel = () => {
    setshowHelp(!showHelp);
    if (showHelp) {
      setshowHelpDetail("none");
    }
  };

  const renderDetailHelp = () => {
    if (showHelpDetail == "none") {
      return (
        <motion.div
          className="panelInfo"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}>
          <h3 style={{ marginBottom: "20px", color: "#333" }}>
            Informasi Umum Warung
          </h3>
          <div style={{ display: "flex", gap: "30px", flexWrap: "wrap" }}>
            <motion.div
              className="untukqris"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}>
              <img src={qris} alt="" className="setGambarQris" />
              <div className="setMiddleText" style={{ marginTop: "15px" }}>
                <span
                  style={{
                    fontWeight: "bold",
                    fontSize: "14px",
                    color: "black",
                  }}>
                  Nomer/Link Virtual Account Pembayaran
                </span>
                <br />
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#2563eb",
                  }}>
                  1152-2363-7412-3455
                </span>
              </div>
            </motion.div>
            <motion.div
              className="untukinfowarung"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}>
              <div
                className="cardInfoWarung"
                style={{
                  padding: "20px",
                  backgroundColor: "#f3f4f6",
                  borderRadius: "8px",
                }}>
                <div style={{ marginBottom: "15px" }}>
                  <span style={{ fontWeight: "bold", color: "black" }}>
                    Telpon
                  </span>{" "}
                  📞
                  <br />
                  <span style={{ color: "#0369a1", fontWeight: "500" }}>
                    +62 0895-3377-5527
                  </span>
                </div>
                <div>
                  <span style={{ fontWeight: "bold", color: "black" }}>
                    Email
                  </span>{" "}
                  📨
                  <br />
                  <span style={{ color: "#0369a1", fontWeight: "500" }}>
                    bulis123@gmail.com
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      );
    } else if (showHelpDetail == "pesan_menu") {
      return (
        <motion.div
          className="panelInfo"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}>
          <h2 style={{ marginBottom: "20px", color: "#333" }}>Cara Memesan</h2>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
            {[
              {
                step: "1",
                title: "Klik Add to Cart Pada Menu yang Akan Dipilih",
                img: pilihmenu,
              },
              {
                step: "2",
                title: "Isi Informasi Pemesanan",
                img: isiinfo,
              },
              {
                step: "3",
                title: "Atur Jumlah & Klik Check Out",
                img: klikcekout,
              },
              {
                step: "4",
                title: "Lakukan Pembayaran & Download Nota",
                img: downloadnota,
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "10px",
                  }}>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "32px",
                      height: "32px",
                      backgroundColor: "#10b981",
                      color: "white",
                      borderRadius: "50%",
                      fontWeight: "bold",
                      fontSize: "16px",
                      flexShrink: 0,
                    }}>
                    {item.step}
                  </span>
                  <h5 style={{ margin: 0, color: "#333" }}>{item.title}</h5>
                </div>
                <img
                  src={item.img}
                  alt=""
                  className="setGambarHelpMenu"
                  style={{
                    borderRadius: "8px",
                    maxWidth: "100%",
                    height: "auto",
                  }}
                />
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              style={{
                backgroundColor: "#fef3c7",
                padding: "15px",
                borderRadius: "8px",
                borderLeft: "4px solid #f59e0b",
                marginTop: "10px",
              }}>
              <h5 style={{ margin: "0 0 5px 0", color: "#92400e" }}>
                💡 Catatan:
              </h5>
              <p style={{ margin: 0, color: "#b45309", fontSize: "14px" }}>
                Untuk melihat pesanan Anda, gunakan fitur 'Cara Melihat Orderan'
              </p>
            </motion.div>
          </div>
        </motion.div>
      );
    } else {
      return (
        <motion.div
          className="panelInfo"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}>
          <h2 style={{ marginBottom: "20px", color: "#333" }}>
            Cara Melihat Riwayat Pesanan
          </h2>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
            {[
              {
                step: "1",
                title: "Klik Tombol History",
                img: lihathistory,
              },
              {
                step: "2",
                title: "Masukan Email & Klik Cari",
                img: masukanemail,
              },
              {
                step: "3",
                title: "Pesanan Akan Ditampilkan",
                img: pesananmuncul,
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "10px",
                  }}>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "32px",
                      height: "32px",
                      backgroundColor: "#3b82f6",
                      color: "white",
                      borderRadius: "50%",
                      fontWeight: "bold",
                      fontSize: "16px",
                      flexShrink: 0,
                    }}>
                    {item.step}
                  </span>
                  <h5 style={{ margin: 0, color: "#333" }}>{item.title}</h5>
                </div>
                <img
                  src={item.img}
                  alt=""
                  className="setGambarHelpMenu"
                  style={{
                    borderRadius: "8px",
                    maxWidth: "100%",
                    height: "auto",
                  }}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      );
    }
  };

  const renderShowHelpPanel = () => {
    return (
      <AnimatePresence>
        {showHelp && (
          <motion.div
            className="getHelp"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => {
              setshowHelp(false);
              setshowHelpDetail("none");
            }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
            }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                maxWidth: "900px",
                width: "100%",
                maxHeight: "85vh",
                display: "flex",
                overflow: "hidden",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                flexDirection: isMobile ? "column" : "row",
              }}>
              {/* Left Panel - Content */}
              <div
                style={{
                  flex: 1,
                  padding: isMobile ? "20px" : "30px",
                  overflowY: "auto",
                  backgroundColor: "#ffffff",
                }}>
                {renderDetailHelp()}
              </div>

              {/* Right Panel - Navigation & Image */}
              <div
                style={{
                  width: isMobile ? "100%" : "300px",
                  backgroundColor: "#f9fafb",
                  padding: isMobile ? "20px" : "30px",
                  display: "flex",
                  flexDirection: "column",
                  borderLeft: isMobile ? "none" : "1px solid #e5e7eb",
                  borderTop: isMobile ? "1px solid #e5e7eb" : "none",
                }}>
                <h3
                  style={{
                    margin: "0 0 25px 0",
                    color: "#111827",
                    fontSize: "16px",
                    fontWeight: "600",
                  }}>
                  Apa yang Bisa Kami Bantu?
                </h3>

                <div
                  style={{
                    display: "flex",
                    flexDirection: isMobile ? "row" : "column",
                    gap: isMobile ? "8px" : "12px",
                    flexWrap: isMobile ? "wrap" : "nowrap",
                  }}>
                  {[
                    { label: "Cara Memesan", value: "pesan_menu" },
                    { label: "Cara Melihat Orderan", value: "lihat_riwayat" },
                    { label: "Informasi Umum", value: "none" },
                  ].map((item) => (
                    <motion.button
                      key={item.value}
                      className="btnHelp"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setshowHelpDetail(item.value)}
                      style={{
                        padding: isMobile ? "8px 10px" : "12px 16px",
                        border: "none",
                        borderRadius: "8px",
                        backgroundColor:
                          showHelpDetail === item.value ? "#10b981" : "#e5e7eb",
                        color:
                          showHelpDetail === item.value ? "white" : "#374151",
                        fontWeight: "500",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        fontSize: isMobile ? "11px" : "14px",
                        flex: isMobile ? "1 1 auto" : "auto",
                        whiteSpace: "nowrap",
                      }}>
                      {item.label}
                    </motion.button>
                  ))}
                </div>

                <div
                  style={{
                    flex: 1,
                    display: isMobile ? "none" : "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: "30px",
                  }}>
                  <motion.img
                    src={GambarBuLis}
                    alt="Bantuan"
                    style={{
                      width: "100%",
                      maxWidth: "200px",
                      opacity: 0.9,
                    }}
                    animate={{ y: [0, -10, 0] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btnHelp setRedBtn"
                  onClick={() => {
                    setshowHelp(false);
                    setshowHelpDetail("none");
                  }}
                  style={{
                    padding: isMobile ? "8px 10px" : "12px 16px",
                    border: "none",
                    borderRadius: "8px",
                    backgroundColor: "#ef4444",
                    color: "white",
                    fontWeight: "500",
                    cursor: "pointer",
                    marginTop: isMobile ? "12px" : "15px",
                    fontSize: isMobile ? "11px" : "14px",
                    width: "100%",
                  }}>
                  Tutup
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  const goToCart = () => {
    if (menuTerpesan.length === 0) {
      window.alert("Anda Belum Memilih Menu");
    } else {
      navigate("/customer/cart");
    }
  };

  return (
    <>
      {renderShowHelpPanel()}
      <AppShell header={{ height: 70 }} padding="">
        <AppShell.Header>
          <Container
            fluid
            h="100%"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingLeft: "16px",
              paddingRight: "16px",
            }}>
            <Group h="100%">
              <Link to="/" style={{ textDecoration: "none" }}>
                <Image src={logo} alt="Logo" h={65} fit="contain" />
              </Link>
            </Group>
            <Group
              style={{
                display: "flex",
                gap: isMobile ? "6px" : "12px",
                flexWrap: "nowrap",
              }}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}>
                <Button
                  size={isMobile ? "sm" : "xl"}
                  radius="xl"
                  onClick={() => {
                    showHelpPanel();
                  }}
                  style={{
                    color: "white",
                    border: `1px solid white`,
                    backgroundColor: "lime",
                    cursor: "pointer",
                  }}>
                  Help
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}>
                <Button
                  size={isMobile ? "sm" : "xl"}
                  radius="xl"
                  onClick={() => {
                    navigate(`/customer/history`);
                  }}
                  style={{
                    color: "white",
                    border: `1px solid white`,
                    backgroundColor: "blue",
                    cursor: "pointer",
                  }}>
                  History
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}>
                <Button
                  size={isMobile ? "sm" : "xl"}
                  radius="xl"
                  onClick={goToCart}
                  style={{
                    color: "white",
                    border: `1px solid white`,
                    backgroundColor: "#CC0000",
                    cursor: "pointer",
                  }}>
                  Cart
                </Button>
              </motion.div>
            </Group>
          </Container>
        </AppShell.Header>
        <AppShell.Main>
          <div className="menuList">
            {menu
              .filter((d) => d.menu_status_aktif === 1)
              .map((d) => (
                <CardMenu
                  key={d.menu_id}
                  img={d.menu_gambar}
                  harga={d.menu_harga}
                  nama={d.menu_nama}
                  id={d.menu_id}
                />
              ))}
          </div>
        </AppShell.Main>
      </AppShell>
    </>
  );
};

export default MenuPage;
