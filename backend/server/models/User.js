import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    university: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["customer", "vendor", "admin"],
      default: "customer",
      index: true,
    },
    brandName: {
      type: String,
      trim: true,
      default: "",
    },
    brandDescription: {
      type: String,
      trim: true,
      default: "",
    },
    socialLink: {
      type: String,
      trim: true,
      default: "",
    },
    department: {
      type: String,
      trim: true,
      default: "",
    },
    bankName: {
      type: String,
      trim: true,
      default: "",
    },
    accountHolderName: {
      type: String,
      trim: true,
      default: "",
    },
    accountNumber: {
      type: String,
      trim: true,
      default: "",
    },
    storeImage: {
      type: String,
      trim: true,
      default: "",
    },
    profileImage: {
      type: String,
      trim: true,
      default: "",
    },
    cart: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        name: {
          type: String,
          trim: true,
          default: "",
        },
        price: {
          type: Number,
          default: 0,
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
        category: {
          type: String,
          trim: true,
          default: "",
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
        media: {
          type: String,
          trim: true,
          default: "",
        },
        mediaType: {
          type: String,
          trim: true,
          default: "",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    favorites: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        name: {
          type: String,
          trim: true,
          default: "",
        },
        price: {
          type: Number,
          default: 0,
        },
        category: {
          type: String,
          trim: true,
          default: "",
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
        media: {
          type: String,
          trim: true,
          default: "",
        },
        mediaType: {
          type: String,
          trim: true,
          default: "",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    vendorStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    vendorApprovedAt: {
      type: Date,
      default: null,
    },
    vendorRejectedAt: {
      type: Date,
      default: null,
    },
    vendorRejectionReason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

userSchema.pre("validate", function syncVendorFields(next) {
  if (this.role !== "vendor") {
    this.brandName = "";
    this.brandDescription = "";
    this.socialLink = "";
    this.bankName = "";
    this.accountHolderName = "";
    this.accountNumber = "";
    this.storeImage = "";
    this.rating = 0;
  }

  next();
});

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);
