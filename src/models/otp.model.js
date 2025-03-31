const mongoose = require('mongoose');
const { Schema } = mongoose;

const OTPSchema = new Schema({
    phoneNumber: { type: String, required: true, unique: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    count: { type: Number, default: 0 }, // Tracks OTP attempts
});

module.exports = mongoose.model('OTP', OTPSchema);