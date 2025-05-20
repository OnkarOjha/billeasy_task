const constants = require("../constants/constants");

const setAuthCookies = (res, accessToken, refreshToken) => {
  // Set Access Token as a cookie
  res.cookie("BIGFINANCE_ACCESS_T", accessToken, {
    httpOnly: true,
    maxAge: constants.ACCESS_COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
    sameSite: constants.SAME_SITE_STRICT,
  });

  // Set Refresh Token as a cookie
  res.cookie("BIGFINANCE_REFRESH_T", refreshToken, {
    httpOnly: true,
    maxAge: constants.REFRESH_COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
    sameSite: constants.SAME_SITE_STRICT,
  });
};

const deleteCookie = (res, cookieName) => {
  res.cookie(cookieName, "", {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === "production",
    sameSite: constants.SAME_SITE_STRICT,
  });
};

module.exports = { setAuthCookies, deleteCookie };
