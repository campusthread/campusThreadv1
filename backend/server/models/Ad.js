import mongoose from "mongoose";

const adSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    ctaText: {
      type: String,
      trim: true,
      default: "Learn more",
    },
    link: {
      type: String,
      trim: true,
      default: "/shop",
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Ad", adSchema);
