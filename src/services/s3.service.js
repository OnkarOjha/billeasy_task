const AWS = require("aws-sdk");

// Configure AWS SDK with credentials and region
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.S3_REGION,
});

const s3 = new AWS.S3();

// Uploads a buffer to S3 and returns its public URL
const uploadBufferToS3 = async (
  fileId,
  filebuffer,
  thumbnailBuffer,
  isVideoThumbnail,
  extension
) => {
  var params;
  if (thumbnailBuffer != null) {
    if (isVideoThumbnail) {
      params = {
        Bucket: process.env.S3_BUCKET,
        Key: fileId.toString() + ".png",
        Body: thumbnailBuffer,
        ContentType: "image/png",
      };
    } else {
      params = {
        Bucket: process.env.S3_BUCKET,
        Key: fileId.toString() + "." + extension,
        Body: thumbnailBuffer,
        ContentType: filebuffer.mimetype,
      };
    }
  } else {
    params = {
      Bucket: process.env.S3_BUCKET,
      Key: fileId.toString() + "." + extension,
      Body: filebuffer.buffer,
      ContentType: filebuffer.mimetype,
    };
  }

  try {
    // Upload the object to S3
    await s3.putObject(params).promise();

    // Generate the public URL for the uploaded object
    const publicUrl = `https://${
      process.env.S3_BUCKET
    }.s3.amazonaws.com/${fileId.toString()}`;
    console.log("s2 public URL:", publicUrl);
    return publicUrl;
  } catch (err) {
    console.error("[[S3 Service]uploadBufferToS3] Error:", error.message);

    throw err;
  }
};

// // Uploads a buffer to S3 and returns its public URL
// const uploadUpdatedMedia = async (
//   fileId,
//   media,
//   thumbnailBuffer,
//   isVideoThumbnail
// ) => {
//   var params;
//   if (thumbnailBuffer != null) {
//     if (isVideoThumbnail) {
//       params = {
//         Bucket: process.env.S3_BUCKET,
//         Key: fileId.toString() + ".png",
//         Body: thumbnailBuffer,
//         ContentType: "image/png",
//       };
//     } else {
//       params = {
//         Bucket: process.env.S3_BUCKET,
//         Key: fileId.toString(),
//         Body: thumbnailBuffer,
//         ContentType: media.imageBuffer.mimetype,
//       };
//     }
//   } else {
//     params = {
//       Bucket: process.env.S3_BUCKET,
//       Key: fileId.toString(),
//       Body: media.imageBuffer,
//       ContentType: media.imageBuffer.mimetype,
//     };
//   }

//   try {
//     // Upload the object to S3
//     await s3.putObject(params).promise();

//     // Generate the public URL for the uploaded object
//     const publicUrl = `https://${
//       process.env.S3_BUCKET
//     }.s3.amazonaws.com/${fileId.toString()}`;
//     console.log("s2 public URL:", publicUrl);
//     return publicUrl;
//   } catch (err) {
//     console.log("error in uploadUpdatedMedia S3: ", err);

//     throw err;
//   }
// };

// Deletes a media file from S3
const deleteMedia = async (mediaId, extension) => {
  console.log("[[S3 Service] deleteMediaFromS3 ] Deleting media from S3");
  try {
    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: mediaId + "." + extension,
    };

    // Check if the object exists in S3
    const headObject = await s3.headObject(params).promise();
    if (!headObject) {
      throw new Error("Media not found in S3.");
    }

    // Delete the object from S3
    await s3.deleteObject(params).promise();

    return params.Key;
  } catch (error) {
    console.error("[[S3 Service]deleteMediaFromS3] Error:", error.message);

    throw new Error("Error deleting media from S3.");
  }
};

// Gets a signed URL for accessing a media file from S3
const getMediaUrl = async (mediaId, extension) => {
  console.log(" [[S3 Service] getMediaUrl ] Fetching media URL from S3");
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: mediaId + "." + extension,
    Expires: parseInt(process.env.S3_EXPIRES_TIME),
  };
  try {
    const url = await new Promise((resolve, reject) => {
      s3.getSignedUrl("getObject", params, (err, url) => {
        err ? reject(err) : resolve(url);
      });
    });
    return url;
  } catch (err) {
    if (err) {
      console.error("[[S3 Service] getMediaUrl ] Error:", err.message);
      throw new Error("Error fetching media url from S3.");
    }
  }
};
// Gets a media file from S3
const getMedia = async (mediaId) => {
  try {
    console.log(" [[S3 Service] getMediaUrl ] Fetching media from S3");
    // Retrieve the object from S3
    const s3Object = await s3
      .getObject({
        Bucket: process.env.S3_BUCKET,
        Key: mediaId.toString(),
      })
      .promise();
    console.log(s3Object);
    return s3Object.Body;
  } catch (error) {
    console.error("[[S3 Service] getMedia ] Error:", err.message);

    throw error;
  }
};

// Export the functions for use in other modules
module.exports = {
  getMedia,
  getMediaUrl,
  deleteMedia,
  uploadBufferToS3,
  // uploadUpdatedMedia,
};
