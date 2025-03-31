const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true,
        unique: true
    },
    newUser: {
        type: Boolean,
        required: false,
        default: true
    },
    username: { type: String, required: false },
});

module.exports = mongoose.model('User', UserSchema);