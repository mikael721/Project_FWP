const Pegawai = require("../models/pegawai");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// === POST login ===
exports.doLogin = async (req, res) => {
  try {
    // Ambil input dari body
    const { pegawai_id, password } = req.body;
    console.log("Mulai pengecekan pegawai_id:", pegawai_id);

    // Cek apakah pegawai dengan ID tsb ada di database
    const isUserAda = await Pegawai.findOne({
      pegawai_id: parseInt(pegawai_id),
      deletedAt: null,
    });

    // Jika user tidak ditemukan
    if (!isUserAda) {
      return res.status(404).send({
        message: "Pegawai tidak ditemukan",
      });
    }

    // Cek password
    const valid = await bcrypt.compare(password, isUserAda.pegawai_password);

    // Jika password tidak cocok
    if (!valid) {
      return res.status(401).send({
        message: "Password salah",
      });
    }

    // === Jika ID dan password cocok ===
    const payload = {
      pegawai_id: isUserAda.pegawai_id,
      pegawai_nama: isUserAda.pegawai_nama,
      pegawai_role: isUserAda.role,
    };

    const jwtPass = process.env.JWT_SECRET;
    const jwtExp = process.env.JWT_EXPIRES;

    // Buat token JWT
    const token = jwt.sign(payload, jwtPass, { expiresIn: jwtExp });

    // Kirim respon sukses beserta token
    return res.status(200).send({
      message: "Berhasil Login",
      token,
    });
  } catch (error) {
    console.error("Error login:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.decryptToken = (req, res) => {
  const token = req.headers.token;
  const jwtPass = process.env.JWT_SECRET;
  try{
    if(!token){
      return res.status(200).send({
        message: "Token tidak ditemukan",
        status: false
      });
    }
    const decoded = jwt.verify(token, jwtPass);
    return res.status(200).send({
      message: "Token valid",
      status: true,
      data: decoded
    });
  }
  catch(error){
    return res.status(500).send({
      message: error.message
    });
  }
}