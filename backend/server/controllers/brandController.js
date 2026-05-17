import Brand from "../models/Brand.js";
import { AppError } from "../utils/errors.js";
import { sendSuccess } from "../utils/response.js";

export const getBrands = async (req, res) => {
  const brands = await Brand.find().sort({ name: 1 });
  sendSuccess(res, { data: { brands } });
};

export const createBrand = async (req, res) => {
  const name = (req.body.name || "").trim();
  if (!name) {
    throw new AppError("Brand name is required", 400);
  }
  const existing = await Brand.findOne({ name });
  if (existing) {
    throw new AppError("Brand already exists", 409);
  }

  const brand = await Brand.create({ name });
  sendSuccess(res, { statusCode: 201, message: "Brand created", data: { brand } });
};

export const deleteBrand = async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) {
    throw new AppError("Brand not found", 404);
  }
  await brand.deleteOne();
  sendSuccess(res, { message: "Brand deleted" });
};
