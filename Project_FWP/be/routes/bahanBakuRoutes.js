const express = require("express");
const router = express.Router();
const bahanBakuController = require("../controllers/bahanBakuController");
const { isAuthenticate, isManager } = require("../middleware/middleware");

router.get("/",isAuthenticate, bahanBakuController.getAllBahanBaku);
router.get("/:id", isAuthenticate, bahanBakuController.getBahanBakuById);
router.post("/new",isAuthenticate, isManager, bahanBakuController.addBahanBaku);
router.put("/:id",isAuthenticate, isManager, bahanBakuController.updateBahanBaku);
router.delete("/:id",isAuthenticate, isManager, bahanBakuController.deleteBahanBaku);
router.post("/newPembelian",isAuthenticate, isManager, bahanBakuController.addPembelian);

module.exports = router;
