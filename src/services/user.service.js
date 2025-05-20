const httpStatus = require("http-status");
const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const uuid = require("uuid");
const Session = require("../models/session.model");
const tokenService = require("./token.service");
const s3Service = require("./s3.service");
const mediaService = require("./media.service");
const fetch = require("node-fetch");
const sharp = require("sharp");
const cookies = require("../utils/cookies");
const constants = require("../constants/constants");

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */


const createUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }
  //save user info
  const newUser = new User({
    user_id: uuid.v4(),
    user_name: userBody.name,
    email: userBody.email,
    password: userBody.password,
    phone: userBody.phone,
   // mediaExtension: mediaExtension,
    is_logged_in: true,
    is_verified: false,
    no_of_devices: 1,
    last_login: new Date(),
  });

  //return User.create(userBody);
  const savedUser = await newUser.save();

  console.log(
    "[[User Service] User Email SignUp] : User saved to the database:",
    savedUser._id
  );
  //generate JWT

  const jwtTokens = await tokenService.generateAuthTokens(newUser);

  // Access Token
  const accessToken = jwtTokens.access.token;
  const accessTokenExpires = jwtTokens.access.expires;

  // Refresh Token
  const refreshToken = jwtTokens.refresh.token;
  const refreshTokenExpires = jwtTokens.refresh.expires;

  const expiresInMilliseconds = 3600 * 1000;
    const expirationDate = new Date(Date.now() + expiresInMilliseconds);

    // set the renews at 2 minutes before expiresIn
    const renewsAt = new Date(expirationDate);
    renewsAt.setMinutes(renewsAt.getMinutes() - 2);

    const newSession = new Session({
      user_id: savedUser.user_id,
      // accessToken: tokenResponse.access_token,
      // refreshToken: tokenResponse.refresh_token,
      renewsAt: renewsAt,
      deviceLoggedIn: savedUser.no_of_devices,
      socialLogin: false,
      jwtAccessToken: accessToken,
      jwtRefreshToken: refreshToken,
      jwtAccessTokenExpiresAt: accessTokenExpires,
      jwtRefreshTokenExpiresAt: refreshTokenExpires,
    });

  const savedSession = await newSession.save();
  console.log(
    "[[User Service] User Email SignUp : Session successfully created and saved to the database:",
    savedSession._id
  );

  return {user: savedUser, jwtTokens}

};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter, options) => {
  const users = await User.paginate(filter, options);
  return users;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  return User.findById(id);
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
  return User.findOne({ email });
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  await user.remove();
  return user;
};

const userOauthUpdate = async (res, userId, tokenResponse) => {
  try {
    // Find the user by user_id
    const existingUser = await User.findOne({ user_id: userId });

    // If the user does not exist, throw an error or handle it accordingly
    if (!existingUser) {
      throw new Error("User not found");
    }

    // Update user details
    existingUser.is_logged_in = true;
    existingUser.no_of_devices += 1;
    existingUser.last_login = new Date();

    // Save the updated user to the database
    await existingUser.save();

    // Find the session by user_id
    const existingSession = await Session.findOne({ user_id: userId });

    // If the session does not exist, throw an error or handle it accordingly
    if (!existingSession) {
      throw new Error("Session not found");
    }

    // Update session details
    existingSession.accessToken = tokenResponse.access_token;
    existingSession.refreshToken = tokenResponse.refresh_token;

    // Increment devicLoggedIn by 1
    existingSession.deviceLoggedIn += 1;

    // Update JWT details
    const jwtTokens = await tokenService.generateAuthTokens(existingUser);

    // set access and refresh cookies

    const cookiesSet = await cookies.setAuthCookies(
      res,
      jwtTokens.access.token,
      jwtTokens.refresh.token
    );

    existingSession.jwtAccessToken = jwtTokens.access.token;
    existingSession.jwtRefreshToken = jwtTokens.refresh.token;
    existingSession.jwtAccessTokenExpiresAt = jwtTokens.access.expires;
    existingSession.jwtRefreshTokenExpiresAt = jwtTokens.refresh.expires;

    // Save the updated session to the database
    await existingSession.save();

    // Return the updated JWT Access Token
    return jwtTokens.access.token;
  } catch (error) {
    console.error("[[User Service] User Oauth Update] Error:", error.message);
    throw error;
  }
};

const userOauthLogin = async (res, tokenResponse, userInfo) => {
  try {
    // fetch media extension
    const mediaExtension = await mediaService.getImageExtensionFromUrl(
      userInfo.picture
    );
    //save user info
    const newUser = new User({
      user_id: uuid.v4(),
      user_name: userInfo.name,
      email: userInfo.email,
      mediaExtension: mediaExtension,
      is_logged_in: true,
      is_verified: false,
      no_of_devices: 1,
      last_login: new Date(),
    });

    // Save the new user to the database
    const savedUser = await newUser.save();

    console.log(
      "[[User Service] User Oauth Login] : User successfully logged in and saved to the database:",
      savedUser._id
    );

    const userMongoId = savedUser._id;

    // extract https media link as buffer
    const mediaBuffer = await mediaService.fetchMediaAsBuffer(userInfo.picture);

    // create thumbnail
    const thumbnailBuffer = await mediaService.createThumbnail(
      mediaBuffer.buffer,
      100,
      100
    );

    // Save user picture in S3
    const imageUrl = await s3Service.uploadBufferToS3(
      savedUser.user_id,
      mediaBuffer,
      thumbnailBuffer,
      false,
      mediaBuffer.extension
    );

    //save session info

    //get the expires value
    const expiresInMilliseconds = tokenResponse.expires_in * 1000;
    const expirationDate = new Date(Date.now() + expiresInMilliseconds);

    // set the renews at 2 minutes before expiresIn
    const renewsAt = new Date(expirationDate);
    renewsAt.setMinutes(renewsAt.getMinutes() - 2);

    //generate JWT

    const jwtTokens = await tokenService.generateAuthTokens(newUser);

    // set access and refresh cookies

    const cookiesSet = await cookies.setAuthCookies(
      res,
      jwtTokens.access.token,
      jwtTokens.refresh.token
    );

    // Access Token
    const accessToken = jwtTokens.access.token;
    const accessTokenExpires = jwtTokens.access.expires;

    // Refresh Token
    const refreshToken = jwtTokens.refresh.token;
    const refreshTokenExpires = jwtTokens.refresh.expires;

    const newSession = new Session({
      user_id: savedUser.user_id,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      renewsAt: renewsAt,
      deviceLoggedIn: savedUser.no_of_devices,
      socialLogin: true,
      jwtAccessToken: accessToken,
      jwtRefreshToken: refreshToken,
      jwtAccessTokenExpiresAt: accessTokenExpires,
      jwtRefreshTokenExpiresAt: refreshTokenExpires,
    });

    // Save the new session to the database
    const savedSession = await newSession.save();

    const sessionMongoId = savedSession._id;

    console.log(
      "[[User Service] User Oauth Login] : Session successfully created and saved to the database:",
      savedSession._id
    );

    const imageSignedUrl = await s3Service.getMediaUrl(
      savedUser.user_id,
      mediaBuffer.extension
    );

    return { accessToken, imageSignedUrl };
  } catch (error) {
    console.error("[[User Service] User Oauth Login] Error:", error.message);
    throw error;
  }
};

// Function to update user table
const updateUserTable = async (userId) => {
  try {
    // Fetch user data
    const user = await User.findOne({ user_id: userId });

    // Update user table fields
    user.is_logged_in = false;
    user.no_of_devices = Math.max(0, user.no_of_devices - 1);

    // Save changes to the user table
    await user.save();
  } catch (error) {
    console.error("[[User Service] User Logout] User table:", error.message);
    throw error;
  }
};

// Function to update session table
const updateSessionTable = async (userId) => {
  try {
    // Fetch session data
    const session = await Session.findOne({ user_id: userId });

    // // Update session table fields
    // session.accessToken = null;
    // session.jwtAccessToken = null;
    // session.jwtAccessTokenExpiresAt = new Date();
    session.deviceLoggedIn = Math.max(0, session.deviceLoggedIn - 1);

    // Save changes to the session table
    await session.save();
  } catch (error) {
    console.error("[[User Service] User Logout] Session table:", error.message);
    throw error;
  }
};

//check whether user is logged out
const checkUserLogout = async (userId) => {
  try {
    // Fetch user data
    const user = await User.findOne({ user_id: userId });
    if (user.is_logged_in === true) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error(
      "[[User Service] User Logout] User table Logout Check:",
      error.message
    );
    throw error;
  }
};

//service for user logout
const userLogout = async (res,userId) => {
  try {
    // check first of all if user is logged out
    const useLoginValue = await checkUserLogout(userId);

    if (useLoginValue === true) {
      // Update user table
      await updateUserTable(userId);

      // Update session table
      await updateSessionTable(userId);

      // delete cookies
      await cookies.deleteCookie(res,constants.ACCESS_COOKIE_NAME);
      await cookies.deleteCookie(res,constants.REFRESH_COOKIE_NAME);


      console.log("[[User Service] User Logout] Successfull: ", userId);

      return userId;
    } else {
      console.log(
        "[[User Service] User Logout] User already logged out: ",
        userId
      );
    }
  } catch (error) {
    console.error("[[User Service] User Logout] Error:", error.message);
    throw error;
  }
};

const isPhoneNumberTaken = async(phoneNumber) => {
  const user = await User.findOne({phone: phoneNumber});
  return !!user;
};

const getUserByPhoneNumber = async(phoneNumber) => {
  const user = await User.findOne({phone: phoneNumber});
  return user;
}

/**
 * creating User With Phone No
 * @param {object}
 */

const registerWithPhoneNo = async(payload) => {
  try {
    if(await isPhoneNumberTaken(payload.phone)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Phone Number Already taken');
    }

    const newUser = new User({
      user_id: uuid.v4(),
      user_name: payload.name,
      phone: payload.phone,
      password: payload.password,
      is_logged_in: true,
      is_verified: false,
      no_of_devices: 1,
      last_login: new Date(),

    });

     //return User.create(userBody);
  const savedUser = await newUser.save();

  console.log(
    "[[User Service] User PhoneNo SignUp] : User saved to the database:",
    savedUser._id
  );
  //generate JWT

  const expiresInMilliseconds = 3600 * 1000;
    const expirationDate = new Date(Date.now() + expiresInMilliseconds);

    // set the renews at 2 minutes before expiresIn
    const renewsAt = new Date(expirationDate);
    renewsAt.setMinutes(renewsAt.getMinutes() - 2);

  const jwtTokens = await tokenService.generateAuthTokens(newUser);

  // Access Token
  const accessToken = jwtTokens.access.token;
  const accessTokenExpires = jwtTokens.access.expires;

  // Refresh Token
  const refreshToken = jwtTokens.refresh.token;
  const refreshTokenExpires = jwtTokens.refresh.expires;

  // const newSession = new Session({
  //   user_id: savedUser._id,
  //   renewsAt: new Date(),
  //   deviceLoggedIn: savedUser.no_of_devices,
  //   socialLogin: false,
  //   jwtAccessToken: accessToken,
  //   jwtRefreshToken: refreshToken,
  //   jwtAccessTokenExpiresAt: accessTokenExpires,
  //   jwtRefreshTokenExpiresAt: refreshTokenExpires,

  // });

  const newSession = new Session({
    user_id: savedUser.user_id,
    // accessToken: tokenResponse.access_token,
    // refreshToken: tokenResponse.refresh_token,
    renewsAt: renewsAt,
    deviceLoggedIn: savedUser.no_of_devices,
    socialLogin: false,
    jwtAccessToken: accessToken,
    jwtRefreshToken: refreshToken,
    jwtAccessTokenExpiresAt: accessTokenExpires,
    jwtRefreshTokenExpiresAt: refreshTokenExpires,
  });

  const savedSession = await newSession.save();
  console.log(
    "[[User Service] User PhoneNumber Signup] : Session successfully created and saved to the database:",
    savedSession._id
  );

  return {user: savedUser, jwtTokens};
    
  } catch (error) {
    console.error(error);
  }

}

const userVerification = async (
  req,
  country,
  nationality,
  dateOfBirth,
  documentName,
  documentNumber,
  res
) => {
  console.log("[[User Service] User Verification] Initiated");
  try {
    // Access userId from the request object
    const userId = req.userId;

    //check whether user is alread verified or not
    const userAlreadyVerified = await checkUserVerificationStatus(userId);

    if (userAlreadyVerified === false) {
      const verifiedUser = new UserVerification({
        user_id: userId,
        country: country,
        nationality: nationality,
        dateOfBirth: dateOfBirth,
        documentName: documentName,
        documentNumber: documentNumber,
        verificationStatus: true,
      });

      const verifyStatus = await updateUserVerificationStatus(userId);

      // Save the verification instance to the database
      const savedVerification = await verifiedUser.save();

      return savedVerification.user_id;
    } else {
      return "User already verified";
    }
  } catch (error) {
    console.error("[[User Service] User Verification] Error:", error.message);
    throw error;
  }
};

const checkUserVerificationStatus = async (userId) => {
  try {
    // Find the user by userId
    const user = await User.findOne({ user_id: userId });

    if (!user) {
      throw new Error("User not found");
    }
    if (user.is_verified === true) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error(
      "[[User Service] Check User Verification Status] Error:",
      error.message
    );
    throw error;
  }
};

const updateUserVerificationStatus = async (userId) => {
  try {
    // Find the user by userId
    const user = await User.findOne({ user_id: userId });

    if (!user) {
      throw new Error("User not found");
    }

    // Update the user's verification status
    user.is_verified = true;

    // Save the updated user instance to the database
    await user.save();

    console.log("[[User Service] Update User Verification Status] Success");

    return user.user_id;
  } catch (error) {
    console.error(
      "[[User Service] Update User Verification Status] Error:",
      error.message
    );
    throw error;
  }
};

const getUserDetails = async (userId) => {
  try {
    // Find the user by userId
    const user = await User.findOne({ user_id: userId });

    if (!user) {
      throw new Error("User not found");
    }
    var email = user.email;
    var userName = user.user_name;
    var is_verfied = user.is_verfied;

    return { email, userName, is_verfied };
  } catch (error) {
    console.error("[[User Service] Get User Details] Error:", error.message);
    throw error;
  }
};

const getVerifiedTableDetails = async (userId) => {
  try {
    const verifiedUser = await UserVerification.findOne({ user_id: userId });
    if (!verifiedUser) {
      throw new Error("User not found");
    }

    var verificationStatus = verifiedUser.verificationStatus;
    var paymentHistory = verifiedUser.paymentHistory;
    var country = verifiedUser.country;
    var nationality = verifiedUser.nationality;
    var dateOfBirth = verifiedUser.dateOfBirth;
    var documentName = verifiedUser.documentName;
    var documentNumber = verifiedUser.documentNumber;

    return {
      verificationStatus,
      paymentHistory,
      country,
      nationality,
      dateOfBirth,
      documentName,
      documentNumber,
    };
  } catch (error) {
    console.error(
      "[[User Service] Get Verified User Details] Error:",
      error.message
    );
    throw error;
  }
};

const userDashboard = async (req, res) => {
  console.log("[[User Service] User Dashboard] Initiated");

  try {
    //country ,nationality,dateOfBirth,documentName,documentNumber,user_name
    //email,is_verified

    // Access userId from the request object
    const userId = req.userId;

    const userDetails = await getUserDetails(userId);

    const verfiedDetails = await getVerifiedTableDetails(userId);

    return { userDetails, verfiedDetails };
  } catch (error) {
    console.error(
      "[[User Service] Update User Dashboard Status] Error:",
      error.message
    );
    throw error;
  }
};

module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  userOauthLogin,
  userOauthUpdate,
  userLogout,
  registerWithPhoneNo,
  userVerification,
  userDashboard,
  getUserByPhoneNumber
};
