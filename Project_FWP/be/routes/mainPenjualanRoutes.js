const express = require("express");
const router = express.Router();
const mainPenjualanController = require("../controllers/mainPenjualanController");
const { isAuthenticate } = require("../middleware/middleware");

// Create Header Penjualan
router.post(
  "/header",
  isAuthenticate,
  mainPenjualanController.createHeaderPenjualan
);

// Create Detail Penjualan
router.post(
  "/detail",
  isAuthenticate,
  mainPenjualanController.createDetailPenjualan
);

// Get All Penjualan
router.get("/", isAuthenticate, mainPenjualanController.getAllPenjualan);

// Get Penjualan by ID
router.get("/:id", isAuthenticate, mainPenjualanController.getPenjualanById);

// Update Header Penjualan
router.put(
  "/header/:id",
  isAuthenticate,
  mainPenjualanController.updateHeaderPenjualan
);

module.exports = router;
