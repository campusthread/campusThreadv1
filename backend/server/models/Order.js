import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

const shippingSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      default: [],
    },
    shippingAddress: {
      type: shippingSchema,
      default: {},
    },
    paymentMethod: {
      type: String,
      default: "paystack",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    paymentReference: {
      type: String,
      default: "",
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

orderSchema.virtual("total").get(function totalGetter() {
  return this.totalAmount;
});

export default mongoose.model("Order", orderSchema);
