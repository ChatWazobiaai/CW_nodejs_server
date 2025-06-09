const express = require('express');
const router = express.Router();
const {
  registerAdmin,
  loginAdmin,
  updatePassword
} = require('../controllers/admin.controllers');

router.post('/register', registerAdmin);
router.post('/login', loginAdmin);
router.put('/update-password', updatePassword);

module.exports = router;