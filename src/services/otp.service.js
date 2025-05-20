const OTP = require("../models/otp.model");
const userService = require('./user.service');
const crypto = require('crypto');
const path = require('path');
const axios = require('axios');
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");
//const TeleSignSDK = require('telesignsdk');

/**
 * Generate code to send as veification
 * @param {number} number 
 * @returns 
 */
const generateRandomValue = (number) => {
    const bytes = crypto.randomBytes(number);
    const randomValue = bytes.toString('hex').toUpperCase();
    return randomValue;
  };
  
  /**
   * Generate Otp for the User
   * @param {string}
   */
  
  const generateOtp = async(userId) => {
      const otp = new OTP({
        code: generateRandomValue(3),
        user: userId 
      });
      const res = await otp.save();
      return res;
}



const generateResetPasswordToken = async (email) => {
    const user = await userService.getUserByEmail(email);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "No users found with this email");
    }
    const generatedOtp = await generateOtp(user.id);
    return generatedOtp.code;
  };

 const generateResetPasswordTokenByPhone = async(phone) => {
  const user = await userService.getUserByPhoneNumber(phone);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "No users found with this phoneNumber");
  }
  const generatedOtp = await generateOtp(user.id);
  return generatedOtp.code;

 }

const apiKey = '28A5C58E-78E3-4D29-9B9B-FCF1B8049A62';
const apiSecret = 'xvUDT28MJKkp5+vECUyPwHiltbxuRag4pZL3CcyHjvrwQEWa4DSlFg4MK29AslzNj3dzUhrkaWYIoNUHDSthwQ==';
const teleSignBaseUrl = 'https://rest-ww.telesign.com/v1/messaging';
const messageType = 'ARN';

async function sendSMS(phoneNumber, code) {
  try {
    const authHeader = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`;

    const headers = {
      'accept': 'application/x-www-form-urlencoded',
      'content-type': 'application/x-www-form-urlencoded',
      'Authorization': authHeader,
    };

    const data = new URLSearchParams();
    data.append('phone_number', phoneNumber);
    data.append('message', `Dear user,
    To reset your password, This is Your Otp: ${code}`);
    data.append('message_type', messageType);

    const response = await axios.post(teleSignBaseUrl, data, { headers });
    console.log(response.data, code)
    return { success: true, response: response.data };
  } catch (error) {
    console.error('Error:', error.response.data);
    return { success: false, error: error.response.data };
  }
}




module.exports = {
    generateResetPasswordToken,
    sendSMS,
    generateResetPasswordTokenByPhone
}