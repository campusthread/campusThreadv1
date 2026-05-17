import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false },
);

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    comment: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true },
);

const productSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    brand: {
      type: String,
      trim: true,
      default: "",
    },
    university: {
      type: String,
      trim: true,
      default: "",
    },
    images: {
      type: [mediaSchema],
      default: [],
    },
    videos: {
      type: [mediaSchema],
      default: [],
    },
    reviews: {
      type: [reviewSchema],
      default: [],
    },
  },
  { timestamps: true },
);

export default mongoose.model("Product", productSchema);
