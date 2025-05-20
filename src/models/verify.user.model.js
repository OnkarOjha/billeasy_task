const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const documentVerificationOptions = ["ADHAR_CARD", "DL", "PASSPORT"];

const verifiedUserSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
      required: true,
    },
    full_name: {
      type: String,
      required: true,
    },
    nationality: {
      type: String,
      required: true,
    },
    dob: {
      type: Date,
      required: true,
    },
    unique_entity: {
      type: String,
      unique: true,
      required: true,
    },
    document_verification_option: {
      type: String,
      enum: documentVerificationOptions,
      required: true,
    },
    verification_number: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
// verifiedUserSchema.plugin(toJSON);
// verifiedUserSchema.plugin(paginate);

/**
 * @typedef VerifiedUser
 */

const VerifiedUser = mongoose.model("VerifiedUser", verifiedUserSchema);

module.exports = VerifiedUser;
