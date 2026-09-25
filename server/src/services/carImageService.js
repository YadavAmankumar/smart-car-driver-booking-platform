const cloudinary = require("../config/cloudinary");

const uploadCarImage = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "smartdrive/cars",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          imageUrl: result.secure_url,
          imagePublicId: result.public_id,
        });
      }
    );

    stream.end(buffer);
  });

const deleteCarImage = async (publicId) => {
  if (!publicId) return;

  await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });
};

module.exports = {
  uploadCarImage,
  deleteCarImage,
};
