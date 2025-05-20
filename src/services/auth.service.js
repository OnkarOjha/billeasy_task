const httpStatus = require("http-status");
const tokenService = require("./token.service");
const userService = require("./user.service");
const Token = require("../models/session.model");
const ApiError = require("../utils/ApiError");
const { tokenTypes } = require("../config/tokens");
const constants = require("../constants/constants");
const User = require("../models/user.model");
const moment = require("moment");
require("dotenv").config();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const axios = require("axios");
const OTP = require("../models/otp.model");

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await userService.getUserByEmail(email);
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect email or password");
  }
  user.is_logged_in = true;
  await user.save();
  return user;
};

const loginUserWithPhoneNumber = async (phone, password) => {
  const user = await userService.getUserByPhoneNumber(phone);
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect phone or password");
  }
  user.is_logged_in = true;
  await user.save();
  return user;
};

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise}
 */
const logout = async (refreshToken) => {
  const refreshTokenDoc = await Token.findOne({
    token: refreshToken,
    type: tokenTypes.REFRESH,
    blacklisted: false,
  });
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, "Not found");
  }
  await refreshTokenDoc.remove();
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
const refreshAuth = async (refreshToken) => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(
      refreshToken,
      tokenTypes.REFRESH
    );
    const user = await userService.getUserById(refreshTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await refreshTokenDoc.remove();
    return tokenService.generateAuthTokens(user);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate");
  }
};

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @returns {Promise}
 */
const resetPassword = async (code, newPassword) => {
  try {
    const isCode = await OTP.findOne({ code: code });
    if (!isCode) {
      throw new Error();
    }
    const user = await userService.getUserById(isCode.user);
    if (!user) {
      throw new Error();
    }
    const res = await userService.updateUserById(user.id, {
      password: newPassword,
    });
    return res;
    // await Token.deleteMany({ user: user.id, type: tokenTypes.RESET_PASSWORD });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Password reset failed");
  }
};

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise}
 */
const verifyEmail = async (verifyEmailToken) => {
  try {
    const verifyEmailTokenDoc = await tokenService.verifyToken(
      verifyEmailToken,
      tokenTypes.VERIFY_EMAIL
    );
    const user = await userService.getUserById(verifyEmailTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await Token.deleteMany({ user: user.id, type: tokenTypes.VERIFY_EMAIL });
    await userService.updateUserById(user.id, { isEmailVerified: true });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Email verification failed");
  }
};

// oauth login flow

async function exchangeCodeForTokens(code) {
  console.log(
    "[[Auth Service] Oauth Login service] : Exchange Code For Tokens initiated"
  );

  try {
    const tokenEndpoint = process.env.OAUTH_TOKEN_ENDPOINT;

    const response = await axios.post(tokenEndpoint, {
      code,
      client_id: process.env.OAUTH_CLIENT_ID,
      client_secret: process.env.OAUTH_CLIENT_SECRET,
      redirect_uri: process.env.OAUTH_CALLBACK_URL,
      grant_type: constants.AUTHORIZATION_CODE,
    });

    return response.data;
  } catch (error) {
    throw error;
  }
}

async function getUserInfo(access_token) {
  console.log(
    "[[Auth Service] Oauth Login service] : Accessing User Info initiated"
  );

  try {
    const userinfoEndpoint = process.env.OAUTH_USER_INFO_ENDPOINT;
    const userinfoResponse = await axios.get(userinfoEndpoint, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    return userinfoResponse.data;
  } catch (error) {
    throw error;
  }
}

async function oauthLogin(code, res) {
  try {
    console.log("[[Auth Service] Oauth Login service] : Outh Login initiated");

    // Exchange code for tokens
    const tokenResponse = await exchangeCodeForTokens(code);
    const { access_token, refresh_token, id_token } = tokenResponse;

    // Use access token to fetch user info
    const userInfo = await getUserInfo(access_token);
    const { email, picture } = userInfo;

    //check if user already has an entry in table
    const isEmailTaken = await User.isEmailTaken(email);

    if (isEmailTaken) {
      console.log("[[Auth Service] Email is already taken");

      // Find the existing user by email
      const existingUser = await User.findOne({ email });

      const updatedJwtAccessToken = await userService.userOauthUpdate(
        res,
        existingUser.user_id,
        tokenResponse,
        userInfo
      );
      return { updatedJwtAccessToken };
    } else {
      //save user and session information in DB
      console.log("[[Auth Service] New User Logging In");

      const loginInfo = await userService.userOauthLogin(
        res,
        tokenResponse,
        userInfo
      );

      return { loginInfo };
    }
  } catch (error) {
    console.error("[[Auth Service] User Oauth Login] Error:", error.message);
    throw error;
  }
}

const oauthUrl = async () => {
  try {
    const clientId = process.env.OAUTH_CLIENT_ID;
    const redirectUri = process.env.OAUTH_CALLBACK_URL;
    const scope = encodeURIComponent(constants.OAUTH_SCOPE);
    const responseType = constants.OAUTH_RESPONSE_TYPE_CODE;
    const accessType = constants.OAUTH_ACCESS_TYPE_OFFLINE;
    const prompt = constants.OAUTH_PROMPT_CONSENT;

    const url = `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=${responseType}&access_type=${accessType}&prompt=${prompt}`;

    return url;
  } catch (error) {
    console.error("[[Auth Service] Oauth Url] Error:", error.message);
    throw error;
  }
};

const refreshToken = async (req, res) => {
  console.log("[[Auth Service] Refresh Token Service] : initiated");
  try {
    // Step 1: Extract the refresh token from the refresh cookie
    const refreshCookie = req.cookies[constants.REFRESH_COOKIE_NAME];
    if (!refreshCookie) {
      throw new Error("Refresh token not found");
    }

    const accessCookie = req.cookies[constants.ACCESS_COOKIE_NAME];
    if (!accessCookie) {
      throw new Error("Access token not found");
    }

    // Step 2: Verify the extracted refresh token
    const decodedRefreshToken = await tokenService.verifyToken(
      refreshCookie, // Use the actual variable here
      process.env.JWT_SECRET,
      tokenTypes.REFRESH
    );

    // Step 3: Extract user information from the refresh token payload
    const userId = decodedRefreshToken.sub;
    const userEmail = decodedRefreshToken.email;
    const userRole = decodedRefreshToken.role;

    // Step 4: Verify the extracted access token
    const decodedAccessToken = await tokenService.verifyToken(
      accessCookie, // Use the actual variable here
      process.env.JWT_SECRET,
      tokenTypes.ACCESS
    );

    // Check if access token expiration is less than 1 minute
    const remainingAccessTokenTime = moment(decodedAccessToken.exp * 1000).diff(
      moment(),
      "seconds"
    );
    if (remainingAccessTokenTime < constants.ACCESS_COOKIE_EXPIRATION_BUFFER) {
      // Step 4: Generate new access and refresh tokens
      const jwtTokens = await tokenService.generateAuthTokens({
        user_id: userId,
        email: userEmail,
        role: userRole,
      });

      // Step 5: Update cookies with the new tokens
      res.cookie(constants.ACCESS_COOKIE_NAME, jwtTokens.access.token, {
        expires: jwtTokens.access.expires,
        httpOnly: true,
      });

      res.cookie(constants.REFRESH_COOKIE_NAME, jwtTokens.refresh.token, {
        expires: jwtTokens.refresh.expires,
        httpOnly: true,
      });

      return "[[Auth Service] Refresh Token Service] : tokens refreshed successfully";
    } else {
      return "Token hasn't expired yet";
    }
  } catch (error) {
    console.error(
      "[Auth Service] Refresh Token Service] Error:",
      error.message
    );
    throw error;
  }
};

module.exports = {
  loginUserWithEmailAndPassword,
  logout,
  refreshAuth,
  resetPassword,
  verifyEmail,
  oauthLogin,
  oauthUrl,
  refreshToken,
  loginUserWithPhoneNumber,
};
