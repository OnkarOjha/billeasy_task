const Joi = require("joi");
const constants = require("../constants/constants");
const { password, objectId } = require("./custom.validation");

const createUser = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    role: Joi.string().required().valid("user", "admin"),
  }),
};

const getUsers = {
  query: Joi.object().keys({
    name: Joi.string(),
    role: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      password: Joi.string().custom(password),
      name: Joi.string(),
    })
    .min(1),
};

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

function validateUserVerificationData({
  country,
  nationality,
  dateOfBirth,
  documentName,
  documentNumber,
}) {
  // Validation for country
  if (!constants.COUNTRY_CODES.includes(country)) {
    throw new Error("Invalid country code");
  }

  // Validation for nationality
  if (!constants.SUPPORTED_NATIONALITIES.includes(nationality)) {
    throw new Error("Invalid nationality");
  }

  // Validation for date of birth
  const dateOfBirthRegex = /^\d{2}-\d{2}-\d{4}$/;
  if (!dateOfBirth.match(dateOfBirthRegex)) {
    throw new Error("Invalid date of birth format. Use DD-MM-YYYY");
  }

  // Validation for documentName
  if (!constants.USER_VERIFICATION_DOCUMENT_TYPE.includes(documentName)) {
    throw new Error("Invalid document type");
  }

  const alphanumericRegex = /^[a-zA-Z0-9]+$/;

  switch (documentName) {
    case "aadhar":
      // Aadhar card validation (12 digits, alphanumeric)
      if (
        documentNumber.length !== 12 ||
        !alphanumericRegex.test(documentNumber)
      ) {
        throw new Error("Invalid Aadhar card number");
      }
      break;
    case "driving_licence":
      // Driving license validation (alphanumeric, customize as per norms)
      if (
        documentNumber.length !== 16 ||
        !alphanumericRegex.test(documentNumber)
      ) {
        throw new Error("Invalid driving license number");
      }
      break;
    case "pan_card":
      // PAN card validation (alphanumeric, customize as per norms)
      if (
        documentNumber.length !== 10 ||
        !alphanumericRegex.test(documentNumber)
      ) {
        throw new Error("Invalid PAN card number");
      }
      break;
    default:
      throw new Error("Invalid document type");
  }

  return true;
}

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  validateUserVerificationData,
};
