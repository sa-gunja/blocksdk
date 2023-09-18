const express = require("express");
const router = express.Router();

const main = require("./main/index.js");
const user = require("./user/index.js");

router.use("/", main);
router.use("/user", user);

module.exports = router;
