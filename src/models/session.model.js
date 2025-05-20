const mongoose = require("mongoose");
const { toJSON } = require("./plugins");
const { tokenTypes } = require("../config/tokens");
const sessionSchema = mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
    },
    accessToken: {
      type: String,
      // required: false,
    },
    refreshToken: {
      type: String,
      // required: false,
    },
    renewsAt: {
      type: Date,
      required: true,
    },
    deviceLoggedIn: {
      type: Number,
      required: true,
    },
    socialLogin: {
      type: Boolean,
      default: false,
    },
    jwtAccessToken: {
      type: String,
      required: true,
    },
    jwtRefreshToken: {
      type: String,
      required: true,
    },
    jwtAccessTokenExpiresAt: {
      type: Date,
      required: true,
    },
    jwtRefreshTokenExpiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
sessionSchema.plugin(toJSON);

/**
 * @typedef Session
 */
const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;
