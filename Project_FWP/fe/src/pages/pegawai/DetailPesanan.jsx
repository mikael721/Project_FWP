import "../css/pegawai/DetailPenjualan.css"; // salah nama ati ati !!!
import CardMenu from "../../component/CardMenu/CardMenu";
import { useEffect, useState } from "react";

import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";

const DetailPesanan = () => {
  const navigate = useNavigate();
  const userToken = useSelector((state) => state.user.userToken);
  let { id } = useParams();

  const [allMenu, setallMenu] = useState([]);
  const [isManager, setisManager] = useState(false);
  

  // === Lifecycle ===
  useEffect(() => {
    cekSudahLogin();
    cekManager();
  }, []);

  // === buat cek manager ===
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

  // === Cek login dan ambil data menu ===
  const cekSudahLogin = () => {
    if (!userToken) {
      navigate("/pegawai");
    } else {
      getAllDetailMenu(id);
    }
  };
  const API_BASE = import.meta.env.VITE_API_BASE;

  const returnSubtotal = () => {
    let total = 0;
    allMenu.forEach(i => {
      total += i.menu.menu_harga * i.pesanan_detail_jumlah
    });
    return total;
  }

  const getAllDetailMenu = async (id) => {
    await axios
      .get(`${API_BASE}/api/pesanan_detail/detail/showdetail/${id}`)
      .then((res) => {
        setallMenu(res.data);
      });
  };

  return (
    <div>
      <div className="detailMenuByIDPesanan">
        {allMenu.map((d, i) => {
          return (
            <CardMenu
              key={d.menu.menu_id}
              img={d.menu.menu_gambar}
              harga={d.menu.menu_harga}
              nama={d.menu.menu_nama}
              id={d.menu.menu_id}
              jumlah={d.pesanan_detail_jumlah}
              isManager={isManager}
            />
          );
        })}
      </div>
      <div className="setedit2">
        <h1>Total : {returnSubtotal()}</h1>
      </div>
    </div>
  );
};

export default DetailPesanan;
