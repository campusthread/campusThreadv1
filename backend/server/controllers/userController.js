import { v4 as uuid } from "uuid";

import User from "../models/User.js";
import { uploadBufferToCloudinary } from "../utils/cloudinary.js";
import { AppError } from "../utils/errors.js";
import { sendSuccess } from "../utils/response.js";

const sanitizeUserProfile = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  university: user.university,
  role: user.role,
  profileImage: user.profileImage,
  brandName: user.brandName,
  brandDescription: user.brandDescription,
  socialLink: user.socialLink,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const getUserProfile = async (req, res) => {
  sendSuccess(res, {
    message: "User profile fetched",
    data: { user: sanitizeUserProfile(req.user) },
  });
};

export const updateUserProfile = async (req, res) => {
  const allowedFields = ["name", "phone", "university", "brandName", "socialLink", "brandDescription", "bankName", "accountNumber", "accountHolderName"];

  const validationErrors = {}
  if (req.user.role === "vendor") {
    if ("bankName" in req.body && !req.body.bankName?.trim()) {
      validationErrors.bankName = "Bank name is required for vendor payout details."
    }
    if ("accountHolderName" in req.body && !req.body.accountHolderName?.trim()) {
      validationErrors.accountHolderName = "Account holder name is required."
    }
    if ("accountNumber" in req.body) {
      const accountNumber = String(req.body.accountNumber || "").trim()
      if (!accountNumber) {
        validationErrors.accountNumber = "Account number is required."
      } else if (!/^\d{8,20}$/.test(accountNumber)) {
        validationErrors.accountNumber = "Account number must be 8–20 digits."
      }
    }
  }

  if (Object.keys(validationErrors).length) {
    return sendError(res, "Validation failed", 400, validationErrors)
  }

  for (const field of allowedFields) {
    if (field in req.body) {
      req.user[field] = req.body[field]
    }
  }

  await req.user.save();

  sendSuccess(res, {
    message: "User profile updated",
    data: { user: sanitizeUserProfile(req.user) },
  });
};

export const uploadUserProfilePicture = async (req, res) => {
  if (!req.file) {
    throw new AppError("No file uploaded", 400);
  }

  const uploadResult = await uploadBufferToCloudinary({
    buffer: req.file.buffer,
    folder: "campusthread/users/profile",
    publicId: `user-profile-${req.user._id}-${uuid()}`,
    resourceType: "image",
  });

  req.user.profileImage = uploadResult.url;
  await req.user.save();

  sendSuccess(res, {
    message: "User profile picture updated",
    data: {
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      user: sanitizeUserProfile(req.user),
    },
  });
};

export const getUserCart = async (req, res) => {
  await req.user.populate("cart.product", "name brand category university price images videos media mediaType");
  const cart = req.user.cart.map(item => ({
    ...item.toObject(),
    images: item.product?.images || item.images || [],
    videos: item.product?.videos || item.videos || [],
    price: item.product?.price || item.price || 0,
    media: item.product?.media || item.media || "",
    mediaType: item.product?.mediaType || item.mediaType || "",
    _id: item.product?._id || item._id,
    id: item.product?._id || item.id,
  }));
  sendSuccess(res, { data: { cart } });
};

export const updateUserCart = async (req, res) => {
  const cart = Array.isArray(req.body.cart) ? req.body.cart : [];
  const normalizedCart = cart.map((item) => ({
    product: item.product?._id || item.product || item._id || item.id || null,
    name: item.name || "",
    price: item.price || 0,
    quantity: item.quantity || 1,
    category: item.category || "",
    brand: item.brand || "",
    university: item.university || "",
    media: item.media || "",
    mediaType: item.mediaType || "",
    addedAt: item.addedAt ? new Date(item.addedAt) : new Date(),
  }));

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { cart: normalizedCart },
    { new: true, runValidators: true },
  ).populate("cart.product", "name brand category university price images videos media mediaType");

  const processedCart = user.cart.map(item => ({
    ...item.toObject(),
    images: item.product?.images || item.images || [],
    videos: item.product?.videos || item.videos || [],
    price: item.product?.price || item.price || 0,
    media: item.product?.media || item.media || "",
    mediaType: item.product?.mediaType || item.mediaType || "",
    _id: item.product?._id || item._id,
    id: item.product?._id || item.id,
  }));
  sendSuccess(res, { message: "Cart updated", data: { cart: processedCart } });
};

export const getUserFavorites = async (req, res) => {
  await req.user.populate("favorites.product", "name brand category university price images videos media mediaType");
  const favorites = req.user.favorites.map(item => ({
    ...item.toObject(),
    images: item.product?.images || item.images || [],
    videos: item.product?.videos || item.videos || [],
    price: item.product?.price || item.price || 0,
    media: item.product?.media || item.media || "",
    mediaType: item.product?.mediaType || item.mediaType || "",
    _id: item.product?._id || item._id,
    id: item.product?._id || item.id,
  }));
  sendSuccess(res, { data: { favorites } });
};

export const updateUserFavorites = async (req, res) => {
  const favorites = Array.isArray(req.body.favorites) ? req.body.favorites : [];
  const normalizedFavorites = favorites.map((item) => ({
    product: item.product?._id || item.product || item._id || item.id || null,
    name: item.name || "",
    price: item.price || 0,
    category: item.category || "",
    brand: item.brand || "",
    university: item.university || "",
    media: item.media || "",
    mediaType: item.mediaType || "",
    addedAt: item.addedAt ? new Date(item.addedAt) : new Date(),
  }));

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { favorites: normalizedFavorites },
    { new: true, runValidators: true },
  ).populate("favorites.product", "name brand category university");

  const processedFavorites = user.favorites.map(item => ({
    ...item.toObject(),
    _id: item.product?._id || item._id,
    id: item.product?._id || item.id,
  }));
  sendSuccess(res, { message: "Favorites updated", data: { favorites: processedFavorites } });
};
