const s3Service = require("./s3.service");
const fetch = require("node-fetch");
const sharp = require("sharp");
const multer = require("multer");
const User = require("../models/user.model");
const path = require("path");
const axios = require("axios");

async function getImageExtensionFromUrl(imageUrl) {
  try {
    // Fetch the image as a buffer
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const imageBuffer = Buffer.from(response.data);

    // Use sharp to identify the image format (extension)
    const metadata = await sharp(imageBuffer).metadata();
    if (!metadata || !metadata.format) {
      throw new Error("Could not determine image format.");
    }

    return metadata.format.toLowerCase(); // Return the format as the extension
  } catch (error) {
    console.error("Error fetching or processing image:", error.message);
    return null;
  }
}

const createThumbnail = async (originalBuffer, width, height) => {
  try {
    const resizedBuffer = await sharp(originalBuffer)
      .resize(width, height)
      .toBuffer();
    return resizedBuffer;
  } catch (error) {
    console.error("[[User Service] createThumbnail] Error:", error.message);
    throw error;
  }
};

const fetchMediaAsBuffer = async (mediaUrl) => {
  try {
    const response = await fetch(mediaUrl);
    const contentType = response.headers.get("content-type");
    const extension = contentType.split("/")[1]; // Extracting the extension

    if (!extension) {
      throw new Error("Unable to determine the image extension");
    }

    const buffer = await response.buffer();
    return { buffer, extension };
  } catch (error) {
    console.error("[[User Service] fetchMediaAsBuffer] Error:", error.message);
    throw error;
  }
};

function getFileExtension(incomingData) {
  if (incomingData && incomingData.originalname) {
    const originalname = incomingData.originalname;
    const dotIndex = originalname.lastIndexOf(".");

    if (dotIndex !== -1) {
      return originalname.substr(dotIndex + 1);
    }
  }
  return null;
}

const postImage = async function (req, file, res) {
  console.log("[[Media Service] Post Media service] : Post image initiated");
  try {
    const userId = req.userId;

    // get file extension
    const extension = await getFileExtension(file);

    // create thumbnail
    const thumbnailBuffer = await createThumbnail(file.buffer, 100, 100);

    // Save user picture in S3
    const imageUrl = await s3Service.uploadBufferToS3(
      userId,
      file.buffer,
      thumbnailBuffer,
      false,
      extension
    );

    // user id and update the mediaExtension field in db
    const user = await User.findOne({ user_id: userId });

    if (!user) {
      throw new Error("User not found");
    }

    user.mediaExtension = extension;
    await user.save();

    // fetch image signed URL
    const imageSignedUrl = await s3Service.getMediaUrl(userId, extension);

    return imageSignedUrl;
  } catch (error) {
    console.error("[[Media Service] Post Media service] Error:", error.message);
    throw error;
  }
};

// Handles the media upload using multer middleware
const upload = multer({
  storage: multer.memoryStorage(),
}).single("file");

const getMedia = async (req) => {
  console.log("[[Media Service] Get Media service] : Get image initiated");
  try {
    const userId = req.userId;

    // Fetch media extension from the database
    const user = await User.findOne({ user_id: userId });
    if (!user) {
      throw new Error("User not found");
    }

    const mediaExtension = user.mediaExtension;

    // Call S3 function for getting signed URL
    const mediaSignedUrl = await s3Service.getMediaUrl(userId, mediaExtension);

    return mediaSignedUrl;
  } catch (error) {
    console.error("[[Media Service] Get Media service] Error:", error.message);
    throw error;
  }
};

const deleteMedia = async (req) => {
  console.log("[[Media Service] Delete Media Service] : initiated");
  try {
    const userId = req.userId;

    // Fetch media extension from the database
    const user = await User.findOne({ user_id: userId });
    if (!user) {
      throw new Error("User not found");
    }

    const mediaExtension = user.mediaExtension;

    // Call S3 function for getting signed URL
    const key = await s3Service.deleteMedia(userId, mediaExtension);

    return key;
  } catch (error) {
    console.error(
      "[[Media Service] Delete Media service] Error:",
      error.message
    );
    throw error;
  }
};

module.exports = {
  upload,
  getImageExtensionFromUrl,
  fetchMediaAsBuffer,
  createThumbnail,
  postImage,
  getMedia,
  deleteMedia,
};
