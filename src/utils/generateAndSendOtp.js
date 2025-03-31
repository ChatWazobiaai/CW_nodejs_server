const OTP = require('../models/otp.model');
const User = require('../models/user.model');
const { generateAccessToken, generateRefreshToken } = require('./tokenUtils');

const createUser = async (phoneNumber, name) => {
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
        throw new Error('User already exists with this phone number');
    }

    const user = new User({ phoneNumber, name });
    await user.save();
    console.log('User created successfully:', user);
};

const generateAndSendOtp = async (phoneNumber) => {
    // Check if user exists
    const existingUser = await User.findOne({ phoneNumber });

    if (existingUser) {
        // If user exists, generate and send OTP
        console.log('User already exists. Sending OTP...');

        const generateOtp = (length) => {
            let otp = '';
            for (let i = 0; i < length; i++) {
                otp += Math.floor(Math.random() * 10);
            }
            return otp;
        };

        const otp = generateOtp(6);
        const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000); // OTP expires in 3 hours
        const currentTime = Date.now();

        console.log('OTP Sent Successfully:', phoneNumber, otp);

        let existingOTP = await OTP.findOne({ phoneNumber });

        if (existingOTP) {
            if (existingOTP.count >= 5 && currentTime < existingOTP.expiresAt.getTime()) {
                const waitTime = Math.ceil((existingOTP.expiresAt.getTime() - currentTime) / (60 * 1000)); // in minutes
                throw new Error(`You have exceeded the maximum OTP attempts. Please try again in ${waitTime} minutes.`);
            } else {
                if (currentTime >= existingOTP.expiresAt.getTime()) {
                    existingOTP.count = 0;
                }

                existingOTP.otp = otp;
                existingOTP.expiresAt = expiresAt;
                existingOTP.count += 1;
                await existingOTP.save();
            }
        } else {
            await OTP.create({ phoneNumber, otp, expiresAt, count: 1 });
        }

        console.log(`OTP for ${phoneNumber}: ${otp}`);
    } else {
        // If user doesn't exist, create a new user and then send OTP
        console.log('User not found. Creating new user and sending OTP...');
        
        await createUser(phoneNumber, 'Default Name'); // Replace 'Default Name' with actual name if needed

        const generateOtp = (length) => {
            let otp = '';
            for (let i = 0; i < length; i++) {
                otp += Math.floor(Math.random() * 10);
            }
            return otp;
        };

        const otp = generateOtp(6);
        const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000); // OTP expires in 3 hours
        const currentTime = Date.now();

        console.log('OTP Sent Successfully:', phoneNumber, otp);

        let existingOTP = await OTP.findOne({ phoneNumber });

        if (existingOTP) {
            if (existingOTP.count >= 5 && currentTime < existingOTP.expiresAt.getTime()) {
                const waitTime = Math.ceil((existingOTP.expiresAt.getTime() - currentTime) / (60 * 1000)); // in minutes
                throw new Error(`You have exceeded the maximum OTP attempts. Please try again in ${waitTime} minutes.`);
            } else {
                if (currentTime >= existingOTP.expiresAt.getTime()) {
                    existingOTP.count = 0;
                }

                existingOTP.otp = otp;
                existingOTP.expiresAt = expiresAt;
                existingOTP.count += 1;
                await existingOTP.save();
            }
        } else {
            await OTP.create({ phoneNumber, otp, expiresAt, count: 1 });
        }

        console.log(`OTP for ${phoneNumber}: ${otp}`);
    }
};

const verifyOtp = async (phoneNumber, otp) => {
    const existingOTP = await OTP.findOne({ phoneNumber });

    if (!existingOTP) {
        throw new Error('OTP not found or expired');
    }

    if (existingOTP.otp !== otp) {
        throw new Error('Invalid OTP');
    }

    if (Date.now() > existingOTP.expiresAt.getTime()) {
        throw new Error('OTP has expired');
    }

    // OTP is valid, generate access and refresh tokens
    const user = await User.findOne({ phoneNumber });
    if (!user) {
        throw new Error('User not found');
    }

    // Generate JWT tokens
    const accessToken = generateAccessToken(user._id.toString()); // Generate Access Token
    const refreshToken = generateRefreshToken(user._id.toString()); // Generate Refresh Token

    // Delete OTP after successful verification
    await OTP.deleteOne({ phoneNumber });

    console.log('Tokens generated successfully:', { accessToken, refreshToken });

    return accessToken; // You can send both access and refresh tokens in the response, or just the access token if needed
};

module.exports = { createUser, generateAndSendOtp, verifyOtp };