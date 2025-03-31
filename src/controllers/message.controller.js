const Message = require("../models/message.model");
const { sendResponse } = require("../utils/responseUtils");

const getMessagesByArrayId = async (req, res) => {
  try {
    const { messagesArrayID } = req.params;
    console.log(messagesArrayID, " messagesArrayID");

    const messages = await Message.find({ messagesArrayID })
      .sort({ createdAt: 1 })
      .lean();

    return sendResponse(
      res,
      true,
      messages.length
        ? "Messages retrieved successfully"
        : "No messages found.",
      200,
      { messages }
    );
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    return sendResponse(
      res,
      false,
      "Server error. Please try again.",
      500,
      null,
      error
    );
  }
};

module.exports = { getMessagesByArrayId };
