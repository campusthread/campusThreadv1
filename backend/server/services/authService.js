import jwt from "jsonwebtoken";
import { z } from "zod";

import User from "../models/User.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().trim().optional().default(""),
  university: z.string().min(2),
  department: z.string().trim().optional().default(""),
  password: z.string().min(6),
  role: z.enum(["customer", "vendor", "admin"]).default("customer"),
  brandName: z.string().trim().optional(),
  socialLink: z.string().trim().optional(),
}).superRefine((data, ctx) => {
  if (data.role === "vendor") {
    if (!data.brandName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["brandName"],
        message: "Brand name is required for vendors",
      });
    }

    if (!data.socialLink) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["socialLink"],
        message: "Social link is required for vendors",
      });
    }
  }
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

const sanitizeUser = (user) => ({
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
  profileImage: user.profileImage,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const getAuthCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure: env.isProduction,
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

export const authService = {
  async register(payload) {
    const input = registerSchema.parse(payload);

    const existingUser = await User.findOne({ email: input.email });
    if (existingUser) {
      throw new AppError("Email already in use", 409);
    }

    const user = await User.create(input);
    const token = signToken(user);

    return {
      token,
      user: sanitizeUser(user),
    };
  },

  async login(payload) {
    const input = loginSchema.parse(payload);

    const user = await User.findOne({ email: input.email }).select("+password");
    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    const isValid = await user.comparePassword(input.password);
    if (!isValid) {
      throw new AppError("Invalid credentials", 401);
    }

    const token = signToken(user);

    return {
      token,
      user: sanitizeUser(user),
    };
  },

  async refresh(token) {
    try {
      const decoded = jwt.verify(token, env.jwtSecret, { ignoreExpiration: true });
      const user = await User.findById(decoded.sub);

      if (!user) {
        throw new AppError('User not found', 401);
      }

      const newToken = signToken(user);

      return {
        token: newToken,
        user: sanitizeUser(user),
      };
    } catch (err) {
      throw new AppError('Invalid token', 401);
    }
  },

  sanitizeUser,
};
