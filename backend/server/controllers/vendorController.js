import { v4 as uuid } from "uuid";

import { uploadBufferToCloudinary } from "../utils/cloudinary.js";
import { AppError } from "../utils/errors.js";
import { sendSuccess } from "../utils/response.js";

const sanitizeVendor = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  university: user.university,
  role: user.role,
  brandName: user.brandName,
  brandDescription: user.brandDescription,
  socialLink: user.socialLink,
  bankName: user.bankName,
  accountHolderName: user.accountHolderName,
  accountNumber: user.accountNumber,
  storeImage: user.storeImage,
  rating: user.rating,
  vendorStatus: user.vendorStatus,
  vendorApprovedAt: user.vendorApprovedAt,
  vendorRejectedAt: user.vendorRejectedAt,
  vendorRejectionReason: user.vendorRejectionReason,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const getVendorProfile = async (req, res) => {
  if (req.user.role !== "vendor") {
    throw new AppError("Only vendors can access this resource", 403);
  }

  sendSuccess(res, {
    message: "Vendor profile fetched",
    data: { vendor: sanitizeVendor(req.user) },
  });
};

export const updateVendorProfile = async (req, res) => {
  if (req.user.role !== "vendor") {
    throw new AppError("Only vendors can update this resource", 403);
  }

  const allowedFields = [
    "brandName",
    "brandDescription",
    "phone",
    "bankName",
    "accountHolderName",
    "accountNumber",
    "socialLink",
  ];

  for (const field of allowedFields) {
    if (field in req.body) {
      req.user[field] = req.body[field];
    }
  }

  await req.user.save();

  sendSuccess(res, {
    message: "Vendor profile updated",
    data: { vendor: sanitizeVendor(req.user) },
  });
};

export const uploadVendorProfilePicture = async (req, res) => {
  if (req.user.role !== "vendor") {
    throw new AppError("Only vendors can update this resource", 403);
  }

  if (!req.file) {
    throw new AppError("No file uploaded", 400);
  }

  const uploadResult = await uploadBufferToCloudinary({
    buffer: req.file.buffer,
    folder: "campusthread/vendors/store",
    publicId: `vendor-profile-${req.user._id}-${uuid()}`,
    resourceType: "image",
  });

  req.user.storeImage = uploadResult.url;
  await req.user.save();

  sendSuccess(res, {
    message: "Vendor profile picture updated",
    data: {
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      vendor: sanitizeVendor(req.user),
    },
  });
};
