const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const {
  authService,
  userService,
  tokenService,
  emailService,
  otpService,
} = require("../services");
const apiResponse = require("../utils/apiResponse");

const register = catchAsync(async (req, res) => {
  const result = await userService.createUser(req.body);
  // const tokens = await tokenService.generateAuthTokens(result);
  res.status(httpStatus.CREATED).send(result);
});

const registerWithPhoneNo = catchAsync(async (req, res) => {
  const result = await userService.registerWithPhoneNo(req.body);
  res.status(httpStatus.CREATED).send(result);
});

const loginWithPhoneNumber = catchAsync(async (req, res) => {
  const { phone, password } = req.body;
  const user = await authService.loginUserWithPhoneNumber(phone, password);
  const token = await tokenService.generateAuthTokens(user);
  res.send({ user, token });
});

const forgotPasswordByPhoneNumber = catchAsync(async (req, res) => {
  const forgotPasswordToken =
    await otpService.generateResetPasswordTokenByPhone(req.body.phone);
  const result = await otpService.sendSMS(req.body.phone, forgotPasswordToken);
  if (result.success == false) {
    res
      .status(httpStatus.BAD_REQUEST)
      .send({ message: "Please resend your Phoen Number" });
  }
  res.status(httpStatus.OK).send({ message: "Message sent successfuly" });
});

const login = catchAsync(async (req, res) => {
  const { email, phone, password } = req.body;

  let user;

  if (phone) {
    // Login with phone number and password
    user = await authService.loginUserWithPhoneNumber(phone, password);
  } else if (email) {
    // Login with email and password
    user = await authService.loginUserWithEmailAndPassword(email, password);
  } else {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Either email or phone must be provided"
    );
  }

  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await otpService.generateResetPasswordToken(
    req.body.email
  );
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.OK).send({ message: "Email sent successfuly" });
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.body.code, req.body.password);
  res.status(httpStatus.OK).send({ message: "Password reset Successfully" });
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(httpStatus.NO_CONTENT).send();
});

const oauthUrl = catchAsync(async (req, res) => {
  try {
    const url = await authService.oauthUrl();

    apiResponse(res, 200, true, "OAuth URL generated successfully", { url });
  } catch (error) {
    console.error(error);
    apiResponse(res, 500, false, "Internal Server Error", null);
  }
});

// auth added

const oauthLogin = catchAsync(async (req, res) => {
  try {
    const { code } = req.query;
    const loginResponse = await authService.oauthLogin(code, res);

    apiResponse(res, 200, true, "User Login Successful", {
      loginResponse,
    });
  } catch (error) {
    console.error("[[Auth Login] User Oauth Login] Error:", error.message);
    apiResponse(res, 500, false, "Internal Server Error");
  }
});

const refreshToken = catchAsync(async (req, res) => {
  console.log("[[Auth Controller] Refresh Token Controller] : initiated");

  try {
    const refreshResponse = await authService.refreshToken(req, res);

    apiResponse(res, 200, true, "User Token Refresh Successful", {
      refreshResponse,
    });
  } catch (error) {
    console.error(
      "[[Auth Controller] Refresh Token Controller]  Error:",
      error.message
    );
    apiResponse(res, 500, false, "Internal Server Error");
  }
});

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  verifyEmail,
  oauthLogin,
  oauthUrl,
  refreshToken,
  registerWithPhoneNo,
  loginWithPhoneNumber,
  forgotPasswordByPhoneNumber,
};
