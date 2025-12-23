const express = require("express");
const router = express.Router();
const menuManagement = require("../controllers/menuManagementController");
const { isAuthenticate, isManager } = require("../middleware/middleware");


// untuk pegawai (pakai token)
router.post("/", isAuthenticate,isManager ,menuManagement.addMenu);
router.get("/getall", isAuthenticate, menuManagement.getMenu);
router.put("/status/:id", isAuthenticate,isManager, menuManagement.ubahStatus);

// untuk customer (gk butuh token)
router.get("/customer/getall", menuManagement.getMenu);

// edit menu management
router.put("/edit/:id", isAuthenticate,isManager, menuManagement.editMenuManagement);

module.exports = router;
