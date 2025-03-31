const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const ContactSchema = new mongoose.Schema({
  contactName: { type: String, default: null },
  phoneNumber: { type: String, required: true },
  contactUserId: { type: String, default: null }, // Linked user ID if they exist
  recordID: { type: String, default: uuidv4, immutable: true }, // ✅ Prevents changes after creation
  updatedAt: { type: Date, default: Date.now },
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }], // ✅ Store message ObjectIds
  messagesArrayID: { type: String, default: null }, // ✅ Group chat ID or DM ID
});

ContactSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const UserContactsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  contacts: [ContactSchema],
});

const UserContacts = mongoose.model("UserContacts", UserContactsSchema);

module.exports = UserContacts;