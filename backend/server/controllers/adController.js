import { v4 as uuid } from "uuid";
import Ad from "../models/Ad.js";
import { AppError } from "../utils/errors.js";
import { sendSuccess } from "../utils/response.js";
import { uploadBufferToCloudinary } from "../utils/cloudinary.js";

export const getAds = async (req, res) => {
  const ads = await Ad.find().sort({ createdAt: -1 });
  sendSuccess(res, { data: { ads } });
};

export const createAd = async (req, res) => {
  const title = (req.body.title || "").trim();
  const description = (req.body.description || "").trim();
  const ctaText = (req.body.ctaText || "Learn more").trim();
  const link = (req.body.link || "/shop").trim();

  if (!title || !description) {
    throw new AppError("Title and description are required", 400);
  }

  if (!req.file) {
    throw new AppError("Ad image is required", 400);
  }

  const uploadResult = await uploadBufferToCloudinary({
    buffer: req.file.buffer,
    folder: "campusthread/ads",
    publicId: `ad-${uuid()}`,
    resourceType: "image",
  });

  const ad = await Ad.create({
    title,
    description,
    ctaText,
    link,
    imageUrl: uploadResult.url,
  });

  sendSuccess(res, { statusCode: 201, message: "Ad created", data: { ad } });
};

export const deleteAd = async (req, res) => {
  const ad = await Ad.findById(req.params.id);
  if (!ad) {
    throw new AppError("Ad not found", 404);
  }
  await ad.deleteOne();
  sendSuccess(res, { message: "Ad deleted" });
};
