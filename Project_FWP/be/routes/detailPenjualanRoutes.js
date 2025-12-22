const express = require("express");
const router = express.Router();
const detailPenjualanController = require("../controllers/detailPenjualanController");
const { isAuthenticate } = require("../middleware/middleware");

// Create Header Penjualan
router.post(
  "/header",
  isAuthenticate,
  detailPenjualanController.createHeaderPenjualan
);

// Update Header Penjualan
router.put(
  "/header/:id",
  isAuthenticate,
  detailPenjualanController.updateHeaderPenjualan
);

// Create Detail Penjualan
router.post(
  "/detail",
  isAuthenticate,
  detailPenjualanController.createDetailPenjualan
);

// Delete Detail Penjualan
router.delete(
  "/detail/:id",
  isAuthenticate,
  detailPenjualanController.deleteDetailPenjualan
);

// Get All Penjualan
router.get("/", isAuthenticate, detailPenjualanController.getAllPenjualan);

// Get Penjualan by ID (Header dengan detail)
router.get("/:id", isAuthenticate, detailPenjualanController.getPenjualanById);

// Get Detail by Header ID
router.get(
  "/details/:headerId",
  isAuthenticate,
  detailPenjualanController.getDetailByHeaderId
);

module.exports = router;
