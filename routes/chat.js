const express = require("express");
const MessageModel = require("../models/message");
const mongoose = require("mongoose");

const socket = require("../socket");
const fs = require("fs");
const routeController = require("../controllers/routeControllers");

const router = express.Router();

const adminController = require("../controllers/adminController");
const checkAuth = adminController.checkAuth;

router.get("/test", (req, res, next) => {
  res.json({ message: "API is working perfectly fine" });
});

router.post("/add", checkAuth, routeController.addChatMessage);
router.post("/", routeController.getClassMessages);
router.get("/loadall/:classId", routeController.loadAllClass); // This is for the web admin panel. to load all chat on server completely.
router.post("/voice", checkAuth, routeController.uploadAudio);
router.post("/image", checkAuth, routeController.uploadImage);
router.post("/video", checkAuth, routeController.uploadVideo);
router.post("/document", checkAuth, routeController.uploadDoc);
router.post("/delete", checkAuth, routeController.delete);

module.exports = router;
