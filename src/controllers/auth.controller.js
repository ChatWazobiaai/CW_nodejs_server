const {
  generateAndSendOtp,
  verifyOtp,
} = require("../utils/generateAndSendOtp");
const { sendResponse } = require("../utils/responseUtils");
const userModel = require("../models/user.model");
const {
  generateAccessToken,
  authenticateToken,
  generateRefreshToken,
} = require("../utils/tokenUtils");

exports.sendOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return sendResponse(res, false, "Phone number is required", 400);
    }

    await generateAndSendOtp(phoneNumber);

    return sendResponse(res, true, "OTP sent successfully", 200);
  } catch (error) {
    return sendResponse(res, false, "Internal server error", 500, null, error);
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    console.log("OTP Sent Successfully:", phoneNumber);

    if (!phoneNumber) {
      return sendResponse(res, false, "Phone number is required", 400);
    }

    await generateAndSendOtp(phoneNumber);

    return sendResponse(res, true, "OTP resent successfully", 200);
  } catch (error) {
    return sendResponse(res, false, "Internal server error", 500, null, error);
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return sendResponse(res, false, "Phone number and OTP are required", 400);
    }

    const isValid = await verifyOtp(phoneNumber, otp);

    if (isValid) {
      const user = await userModel.findOne({ phoneNumber });

      if (!user) {
        return sendResponse(res, false, "User not found", 404);
      }

      const accessToken = generateAccessToken(user._id.toString());
      const refreshToken = generateRefreshToken(user._id.toString());
      return sendResponse(res, true, "OTP verified successfully", 200, {
        accessToken,
        refreshToken,
        user,
      });
    } else {
      return sendResponse(res, false, "Invalid OTP", 400);
    }
  } catch (error) {
    return sendResponse(res, false, "Internal server error", 500, null, error);
  }
};

exports.updateUsername = async (req, res) => {
    try {
      const { username } = req.body;
      console.log(username, req.user, "username");
      const userId = req.user.id;
  
      if (!userId || !username) {
        return sendResponse(res, false, "UserId and Username are required", 400);
      }
  
      // Find the user by ID
      const user = await userModel.findById(userId);
  
      if (!user) {
        return sendResponse(res, false, "User not found", 404);
      }
  
      // Update the username
      user.username = username;
  
      // Toggle the 'newUser' field to false, indicating that the user is no longer new
      user.newUser = false;
  
      // Save the updated user
      await user.save();
  
      // Respond with success and updated user data
      return sendResponse(res, true, "Username updated successfully", 200, {
        user,
      });
    } catch (error) {
      return sendResponse(res, false, "Internal server error", 500, null, error);
    }
  };