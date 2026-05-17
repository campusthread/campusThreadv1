import Category from "../models/Category.js";
import { AppError } from "../utils/errors.js";
import { sendSuccess } from "../utils/response.js";

export const getCategories = async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  sendSuccess(res, { data: { categories } });
};

export const createCategory = async (req, res) => {
  const name = (req.body.name || "").trim();
  const icon = (req.body.icon || "").trim();

  if (!name) {
    throw new AppError("Category name is required", 400);
  }

  const existing = await Category.findOne({ name });
  if (existing) {
    throw new AppError("Category already exists", 409);
  }

  const category = await Category.create({ name, icon });
  sendSuccess(res, { statusCode: 201, message: "Category created", data: { category } });
};

export const deleteCategory = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    throw new AppError("Category not found", 404);
  }
  await category.deleteOne();
  sendSuccess(res, { message: "Category deleted" });
};
