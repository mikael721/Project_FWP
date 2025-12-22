const MenuManagement = require("../models/menuModels");
const {
  addBahanBakuSchema,
  updateBahanBakuSchema,
  message,
} = require("../validations/menuManagementValidation");

// === UNTUK PEGAWAI (PAKAI TOKEN) ===
exports.addMenu = async(req,res) => {
    try {
        // Ambil Semua Data Body
        let {menu_nama,menu_harga,menu_gambar} = req.body;
        if(!menu_nama || !menu_harga || !menu_gambar){
            return res.status(200).send({
                messages: 'Salah Satu Data Kosong !!!'
            });
        }
        // Lakukan Insert
        let insertMakanan = await MenuManagement.create({
            menu_nama,menu_harga,menu_gambar
        })

        // Return
        return res.status(200).send({
            messages: 'Berhasil Menambahkan Menu',
        });
    } catch (error) {
        return res.status(500).send({
            messages: 'Internal Server Error',
            error: error.messages
        });
    }
}
exports.getMenu = async (req,res) => {
    try {
        
        let getAllMenu = await MenuManagement.findAll();
        return res.status(200).json(getAllMenu);

    } catch (error) {
        return res.status(500).send({
            messages: 'Internal Server Error',
            error: error.messages
        });
    }
}
exports.ubahStatus = async (req,res) => {
    let { id } = req.params;
    try {
        let findMenu = await MenuManagement.findByPk(id);
        if(findMenu.menu_status_aktif == 1){
            findMenu.menu_status_aktif = 0
        }
        else{
            findMenu.menu_status_aktif = 1
        }
        await findMenu.save();
        return res.status(201).send({
            message: 'Berhasil Mengupdate',
            hasil: findMenu
        })
    } catch (error) {
        return res.status(500).send({
            messages: 'Internal Server Error',
            error: error.message
        });
    }
}

// === Edit Menu ===
exports.editMenuManagement = async(req,res) => {
    let {menu_nama,menu_harga,menu_gambar} = req.body;
    let {id} = req.params;
    try {
        let findMenu = await MenuManagement.findByPk(id);
        
        await findMenu.update({
            menu_nama: menu_nama ?? findMenu.menu_nama,
            menu_harga: menu_harga ?? findMenu.menu_harga,
            menu_gambar: menu_gambar ?? findMenu.menu_gambar,
        });

        return res.status(200).send({
            message: "Menu berhasil diperbarui",
            data: findMenu,
            status: true
        });

    } catch (error) {
        console.error("Error fetching pesanan:", error);
        return res.status(500).json({
        success: false,
        message: "Failed to fetch pesanan",
        error: error.message,
        });
  }
}

// === TEMPLATE ===
exports.template = async (req,res) => {
    try {
        let getAllMenu = await MenuManagement.findAll();
        return res.status(200).json(getAllMenu);

    } catch (error) {
        return res.status(500).send({
            messages: 'Internal Server Error',
            error: error.message
        });
    }
}