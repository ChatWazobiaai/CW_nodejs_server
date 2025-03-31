const express = require("express");
const router = express.Router();
const { getMessagesByArrayId } = require("../controllers/message.controller");


router.get("/get-messages/:messagesArrayID", getMessagesByArrayId);

module.exports = router;
