import { v4 as uuid } from "uuid";

import Product from "../models/Product.js";
import * as emailService from "../services/emailService.js";
import { uploadBufferToCloudinary } from "../utils/cloudinary.js";
import { AppError } from "../utils/errors.js";
import { sendSuccess } from "../utils/response.js";
import { logger } from "../utils/logger.js";

const attachVendorFields = (product) => {
  const data = product.toObject ? product.toObject() : product;
  const vendor = data.vendor;

  if (vendor && typeof vendor === "object") {
    data.brand = data.brand || vendor.brandName || vendor.name || "";
    data.university = data.university || vendor.university || "";
  }

  return data;
};

export const getProducts = async (req, res) => {
  const limit = Number(req.query.limit) || 50;
  const products = await Product.find()
    .populate({
      path: "vendor",
      select: "brandName name university vendorStatus",
      match: { vendorStatus: "approved" }
    })
    .sort({ createdAt: -1 })
    .limit(limit);

  // Filter out products whose vendors didn't match the filter (unapproved vendors)
  const approvedProducts = products.filter(product => product.vendor !== null);

  sendSuccess(res, {
    data: {
      products: approvedProducts.map(attachVendorFields),
    },
  });
};

export const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id).populate("vendor", "brandName name university");
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  sendSuccess(res, {
    data: { product: attachVendorFields(product) },
  });
};

export const getVendorProducts = async (req, res) => {
  const products = await Product.find({ vendor: req.user._id }).sort({ createdAt: -1 });
  sendSuccess(res, {
    data: { products },
  });
};

export const createProduct = async (req, res) => {
  const product = await Product.create({
    ...req.body,
    vendor: req.user._id,
    brand: req.user.brandName || req.user.name,
    university: req.user.university,
  });

  sendSuccess(res, {
    statusCode: 201,
    message: "Product created",
    data: { product },
  });

  (async () => {
    try {
      await emailService.sendProductPublishedEmail(req.user, product);
      logger.info("Sent product published email", { to: req.user.email, product: product._id });
    } catch (err) {
      logger.error("Product published email failed", { to: req.user.email, message: err?.message });
    }
  })();
};

export const updateProduct = async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, vendor: req.user._id });
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const allowedFields = ["name", "description", "price", "category", "stock"];
  for (const field of allowedFields) {
    if (field in req.body) {
      product[field] = req.body[field];
    }
  }

  await product.save();

  sendSuccess(res, {
    message: "Product updated",
    data: { product },
  });
};

export const deleteProduct = async (req, res) => {
  const product = await Product.findOneAndDelete({ _id: req.params.id, vendor: req.user._id });
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  sendSuccess(res, {
    message: "Product deleted",
  });
};

export const uploadProductMedia = async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, vendor: req.user._id });
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (!req.file) {
    throw new AppError("No file uploaded", 400);
  }

  const isVideo = req.file.mimetype.startsWith("video/");
  const uploadResult = await uploadBufferToCloudinary({
    buffer: req.file.buffer,
    folder: "campusthread/products/media",
    publicId: `product-media-${product._id}-${uuid()}`,
    resourceType: isVideo ? "video" : "image",
  });
  const media = { url: uploadResult.url, publicId: uploadResult.publicId };

  if (isVideo) {
    product.videos.push(media);
  } else {
    product.images.push(media);
  }

  await product.save();

  sendSuccess(res, {
    message: "Product media uploaded",
    data: { url: uploadResult.url, publicId: uploadResult.publicId, product },
  });
};

export const addProductReview = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  product.reviews.push({
    user: req.user?._id,
    rating: req.body.rating || 5,
    comment: req.body.comment || "",
  });
  await product.save();

  sendSuccess(res, {
    statusCode: 201,
    message: "Review added",
    data: { product },
  });
};
