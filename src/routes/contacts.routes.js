const express = require("express");
const {
  addOrUpdateContacts,
  getContacts,
} = require("../controllers/contacts.controller");

const router = express.Router();

router.post("/index", addOrUpdateContacts);
router.get("/index", getContacts);

module.exports = router;
