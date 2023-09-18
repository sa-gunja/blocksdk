const express = require("express");
const router = express.Router();
const controller = require("./user.controller");

router.get("/", controller.main);
router.get("/list", controller.list);
router.get("/info/:id", controller.userInfo);
router.get("/history/:userId", controller.history);

router.post("/createUser", controller.createUser);
router.post("/send", controller.send);

module.exports = router;
