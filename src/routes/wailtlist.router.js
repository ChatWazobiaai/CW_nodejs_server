// routes/waitlistRoutes.js
const express = require("express");
const { subscribe } = require("../controllers/waitlist.controller");
const router = express.Router();

router.post("/subscribe", subscribe);

module.exports = router;
