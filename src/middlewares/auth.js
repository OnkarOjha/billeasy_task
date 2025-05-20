const passport = require("passport");
const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const constants = require("../constants/constants");
const User = require("../models/user.model");
const Session = require("../models/session.model");

const verifyCallback = (req, resolve, reject) => async (err, user, info) => {
  try {
    if (err || info || !user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate");
    }
    const user_id = user.sub;

    // Fetch user from the database based on the user ID
    const dbUser = await User.findOne({ user_id });

    if (dbUser.is_logged_in === false) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "User Logged out!! Please login back"
      );
    }

    // Check if the email in the token payload matches the 'sub' UUID from the user table
    if (!dbUser || dbUser.email !== user.email) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Token user email does not match request user email"
      );
    }

    const sessionUser = await Session.findOne({ user_id });

    const expiresAt = moment(sessionUser.jwtAccessTokenExpiresAt);

    // Check if the token has expired
    if (moment() > expiresAt) {
      // Logout if the token has expired
      // Perform logout logic here, e.g., invalidate the session
      // ...

      throw new ApiError(httpStatus.UNAUTHORIZED, "Token has expired");
    }

    // Check if the role in the token payload is "user"
    if (user.role !== dbUser.role) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    req.user = user;
    resolve();
  } catch (error) {
    reject(error);
  }
};

const auth = () => async (req, res, next) => {
  const accessTokenCookieName = constants.ACCESS_COOKIE_NAME;
  const refreshTokenCookieName = constants.REFRESH_COOKIE_NAME;

  // Check if both access and refresh cookies are present
  // if (
  //   !req.cookies[accessTokenCookieName] ||
  //   !req.cookies[refreshTokenCookieName]
  // ) {
  //   return next(new ApiError(httpStatus.UNAUTHORIZED, "Cookies not present"));
  // }
  const token = req.headers.authorization;

  if (!token) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, "Token not provided"));
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    // Assuming 'sub' is the user ID
    const user_id = decodedToken.sub;

    // Execute the verification callback with resolve and reject functions
    await new Promise((resolve, reject) => {
      verifyCallback(req, resolve, reject)(null, decodedToken, null);
    });

    // Attach userId to the request object
    req.userId = user_id;

    next(); // Continue to the next middleware or route handler
  } catch (error) {
    next(error); // Pass any errors to the next middleware or error handler
  }
};

module.exports = auth;
