import streamifier from "streamifier";

import cloudinary from "../config/cloudinary.js";
import { AppError } from "./errors.js";

const ensureCloudinaryConfig = () => {
  if (!cloudinary.config().cloud_name || !cloudinary.config().api_key || !cloudinary.config().api_secret) {
    throw new AppError("Cloudinary is not configured correctly", 500);
  }
};

export const uploadBufferToCloudinary = ({ buffer, folder, publicId, resourceType = "auto" }) =>
  new Promise((resolve, reject) => {
    ensureCloudinaryConfig();

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          reject(new AppError(error.message || "Cloudinary upload failed", 500));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
        });
      },
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
