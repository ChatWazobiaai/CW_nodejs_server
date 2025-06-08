const waitlistModel = require("../models/waitlist.model");
const { sendWaitlistConfirmation } = require("../utils/sendEmail.utils");

exports.subscribe = async (req, res) => {
  let { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required." });
  }

  email = email.toLowerCase().trim();

  try {
    const existing = await waitlistModel.findOne({ email });

    if (existing) {
      return res.status(200).json({
        success: false,
        message: "Email already exists in waitlist.",
      });
    }

    await waitlistModel.create({ email });
    await sendWaitlistConfirmation(email);

    return res.status(201).json({
      success: true,
      message: "Successfully subscribed to waitlist.",
    });
  } catch (error) {
    console.error("Error subscribing:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};
