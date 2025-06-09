const Admin = require("../models/admin.model");
const jwt = require("jsonwebtoken");

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

// @desc    Register new admin
exports.registerAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin)
      return res.status(400).json({ message: "Admin already exists" });

    const newAdmin = await Admin.create({ email, password });
    res.status(201).json({ message: "Admin created successfully" , newAdmin});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc    Login admin
exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(admin._id);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc    Update password
exports.updatePassword = async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin || !(await admin.comparePassword(oldPassword))) {
      return res.status(401).json({ message: "Old password is incorrect" });
    }

    admin.password = newPassword;
    await admin.save();
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
