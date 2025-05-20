const httpStatus = require("http-status");
const pick = require("../utils/pick");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const apiResponse = require("../utils/apiResponse");
const { userService } = require("../services");

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ["name", "role"]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  res.send(user);
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  res.send(user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

const userLogout = catchAsync(async (req, res) => {
  try {
    // Access userId from the request object
    const userId = req.userId;

    // Call userLogout function from userService
    const logoutResponse = await userService.userLogout(res, userId);

    // Send a success response
    apiResponse(res, 200, true, "User Logout Successful", {
      logoutResponse,
    });
  } catch (error) {
    // Handle any errors and send an error response
    console.error("[[User Controller] User Logout] User Logout failed:", error);

    // Send an appropriate error response
    if (error instanceof YourCustomError) {
      apiResponse(res, 400, false, "User Logout Failed", {
        error: error.message,
      });
    } else {
      apiResponse(res, 500, true, "User Logout Failed", {
        error: "Internal Server Error",
      });
    }
  }
});

const userVerification = catchAsync(async (req, res) => {
  console.log("[[User Controller] User Verification Controller] : initiated");

  try {
    // Extract necessary information from the request body
    const { country, nationality, dateOfBirth, documentName, documentNumber } =
      req.body;

    // Validate user verification data
    validation.validateUserVerificationData({
      country,
      nationality,
      dateOfBirth,
      documentName,
      documentNumber,
    });

    // Call the mediaService.userVerification function
    const verificationResponse = await userService.userVerification(
      req,
      country,
      nationality,
      dateOfBirth,
      documentName,
      documentNumber,
      res
    );
    // Send a success response with the verification response
    apiResponse(res, 200, true, "User Verification Successfull", {
      verificationResponse,
    });
  } catch (error) {
    // Handle any errors and send an error response
    console.error(
      "[[User Controller] User Verification] User Verification failed:",
      error
    );

    // Send an appropriate error response
    if (error instanceof YourCustomError) {
      apiResponse(res, 400, false, "User Verification Failed", {
        error: error.message,
      });
    } else {
      apiResponse(res, 500, false, "User Verification Failed", {
        error: "Internal Server Error",
      });
    }
  }
});

const userDashboard = catchAsync(async (req, res) => {
  console.log("[[User Controller] User Dashboard Controller] : initiated");

  try {
    const dashboardResponse = await userService.userDashboard(req, res);
    // Send a success response with the verification response
    apiResponse(res, 200, false, "User Dashboard Successfull", {
      dashboardResponse,
    });
  } catch (error) {
    // Handle any errors and send an error response
    console.error(
      "[[User Controller] User Dashboard] User Verification failed:",
      error
    );

    // Send an appropriate error response
    if (error instanceof YourCustomError) {
      apiResponse(res, 400, false, "User Dashboard Failed", {
        error: error.message,
      });
    } else {
      apiResponse(res, 500, false, "User Dashboard Failed", {
        error: "Internal Server Error",
      });
    }
  }
});

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  userLogout,
  userVerification,
  userDashboard,
};
