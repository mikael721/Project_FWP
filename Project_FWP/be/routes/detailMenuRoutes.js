const express = require("express");
const router = express.Router();
const detailMenuController = require("../controllers/detailMenuController");
const { isAuthenticate, isManager } = require("../middleware/middleware");

router.post("/",isAuthenticate, isManager, detailMenuController.createDetailMenu);
router.get("/",isAuthenticate, detailMenuController.getAllDetailMenu);
router.get("/:id",isAuthenticate, detailMenuController.getDetailMenuById);
router.put("/:id",isAuthenticate, isManager, detailMenuController.updateDetailMenu);
router.delete("/:id",isAuthenticate, isManager, detailMenuController.deleteDetailMenu);

module.exports = router;
