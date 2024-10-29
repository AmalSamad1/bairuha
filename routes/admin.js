const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");

const checkAuth = adminController.checkAuth;

/* -------------------------------------------------------------------------- */
/*                               Cloud FIREBASE                               */
/* -------------------------------------------------------------------------- */

router.post("/delete", checkAuth, adminController.deleteUser);
router.post("/resetpass", checkAuth, adminController.resetUserPassword);
router.post("/resetemail", checkAuth, adminController.resetUserEmail);
router.get("/get/:uid", checkAuth, adminController.getDetails);
router.post("/send", checkAuth, adminController.sendInterviewNotification);

router.post("/order/create", checkAuth, adminController.createOrder);
router.post("/order/check-sign", adminController.checkSignature);

router.get("/check-admin/:email", adminController.checkAdmin);

router.post("/add-token", checkAuth, adminController.addToken);
router.get("/send-admin-notify", checkAuth, adminController.notifyAdmins);
router.post("/check-phone", adminController.checkPhoneNumber);

module.exports = router;
