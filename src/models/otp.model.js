const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming you have a User model, replace 'User' with the actual model name
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // Expires after 300 seconds (5 minutes)
  },
});

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
