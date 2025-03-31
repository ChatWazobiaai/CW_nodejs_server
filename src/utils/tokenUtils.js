const jwt = require("jsonwebtoken");
const { Request, Response, NextFunction } = require("express");

const JWT_ACCESS_TOKEN_SECRET =
  process.env.JWT_ACCESS_TOKEN_SECRET || "your-access-token-secret";
const JWT_REFRESH_TOKEN_SECRET =
  process.env.JWT_REFRESH_TOKEN_SECRET || "your-refresh-token-secret";

// Function to generate Access Token
const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, JWT_ACCESS_TOKEN_SECRET, { expiresIn: "2000d" });
};

// Function to generate Refresh Token
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, JWT_REFRESH_TOKEN_SECRET, { expiresIn: "20000d" });
};

// Function to verify Access Token
const verifyAccessToken = (token) => {
  try {
    // jwt.verify() returns the decoded payload
    const decoded = jwt.verify(token, JWT_ACCESS_TOKEN_SECRET);
    return decoded;
  } catch (error) {
    throw new Error("Invalid or expired access token");
  }
};

// Function to verify Refresh Token
const verifyRefreshToken = (token) => {
  try {
    // jwt.verify() returns the decoded payload
    const decoded = jwt.verify(token, JWT_REFRESH_TOKEN_SECRET);
    return decoded;
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
};

const authenticateToken = (req, res, next) => {

  const token = req.headers["authorization"]?.split(" ")[1]; // Get token from Authorization header
  console.log(token, "token");
  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  jwt.verify(token, JWT_ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    console.log(decoded, "user");
    req.user = { id: decoded.userId }; // Save user ID to request object
    next();
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  authenticateToken,
};
