const express = require("express");
const router = express.Router();
const login = require("../controllers/loginController");

router.post("/" , login.doLogin);
router.post("/dodecrypt", login.decryptToken);

module.exports = router;