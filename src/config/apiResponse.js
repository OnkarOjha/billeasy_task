const apiResponse = async (res, statusCode, success, message, payload) =>
  new Promise((resolve) => {
    res.status(statusCode).send({
      success,
      message,
      data: payload,
    });
    resolve(statusCode);
  });

module.exports = apiResponse;
