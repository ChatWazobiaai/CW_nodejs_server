const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  messageId: { type: String, required: false },
  messagesArrayID: { type: String, required: false },
  text: { type: String, required: true },
  senderId: { type: String, required: false },
  receiverId: [{ type: String, required: false }],
  status: { type: String, required: false },
  reactions: [
    {
      reactorId: { type: String },
      reaction: { type: String },
    },
  ],
  repliedMessageId: { type: String, ref: "Message" }, // Not an array anymore
  repliedMessage: { type: String, required: false },
  translations: {
    igbo: [{ type: String }],
    hausa: [{ type: String }],
    yoruba: [{ type: String }],
    pidgin: [{ type: String }],
    latin: [{ type: String }],
    spanish: [{ type: String }],
    french: [{ type: String }],
    english: [{ type: String }],
  },
  reactionTrue: { type: Boolean, default: false },
  editingTrue: { type: Boolean, default: false },
  deleteTrue: { type: Boolean, default: false },
  replyTrue: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;