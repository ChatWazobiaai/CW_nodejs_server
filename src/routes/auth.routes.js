const express = require("express");
const { authenticateToken } = require("../utils/tokenUtils");
const authController = require("../controllers/auth.controller");

const router = express.Router();

// No authentication middleware for these routes
router.post("/send-otp", authController.sendOTP);
router.post("/resend-otp", authController.resendOTP);
router.post("/verify-otp", authController.verifyOTP);

// Authentication middleware added here for updating username
router.put("/update",authenticateToken,  authController.updateUsername);

module.exports = router;
