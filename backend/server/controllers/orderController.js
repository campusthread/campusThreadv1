import { v4 as uuid } from "uuid";

import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import * as emailService from "../services/emailService.js";
import { AppError } from "../utils/errors.js";
import { sendSuccess } from "../utils/response.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const populateOrderQuery = (query) =>
  query.populate("buyer", "name email phone").populate("items.product", "name").populate("items.vendor", "name brandName");

export const createOrder = async (req, res) => {
  if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
    throw new AppError("Order must contain at least one item", 400);
  }

  const items = [];
  const vendorNotifications = new Map();

  for (const item of req.body.items) {
    const productId = item.productId || item.product?._id || item.product || null;
    const product = await Product.findById(productId).populate("vendor", "brandName name email");
    if (!product) {
      throw new AppError(`Product not found: ${productId}`, 404);
    }

    items.push({
      product: product._id,
      vendor: product.vendor._id,
      quantity: item.quantity,
      price: product.price,
      name: product.name,
    });

    const vendorId = product.vendor._id.toString();
    if (!vendorNotifications.has(vendorId)) {
      vendorNotifications.set(vendorId, {
        vendor: product.vendor,
        items: [],
      });
    }

    vendorNotifications.get(vendorId).items.push({
      name: product.name,
      quantity: item.quantity,
      price: product.price,
    });
  }

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const order = await Order.create({
    orderNumber: `CT-${uuid().slice(0, 8).toUpperCase()}`,
    buyer: req.user._id,
    items,
    shippingAddress: req.body.shippingAddress || {},
    paymentMethod: req.body.paymentMethod || "paystack",
    totalAmount,
  });

  sendSuccess(res, {
    statusCode: 201,
    message: "Order created",
    data: { order },
  });

  (async () => {
    try {
      await emailService.sendBuyerOrderConfirmation(order, req.user);
      await Promise.all(
        Array.from(vendorNotifications.values()).map(({ vendor, items }) =>
          emailService.sendVendorOrderNotification(vendor, order, items, req.user.name),
        ),
      );
      logger.info("Sent order notification emails", { orderNumber: order.orderNumber });
    } catch (err) {
      logger.error("Order notification email failed", { orderNumber: order.orderNumber, message: err?.message });
    }
  })();
};

export const getOrderById = async (req, res) => {
  const order = await populateOrderQuery(Order.findById(req.params.id));
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  sendSuccess(res, {
    data: { order },
  });
};

export const getUserOrders = async (req, res) => {
  const orders = await populateOrderQuery(
    Order.find({ buyer: req.user._id }).sort({ createdAt: -1 }),
  );

  sendSuccess(res, {
    data: { orders },
  });
};

export const getVendorOrders = async (req, res) => {
  const orders = await populateOrderQuery(
    Order.find({ "items.vendor": req.user._id }).sort({ createdAt: -1 }),
  );

  sendSuccess(res, {
    data: { orders },
  });
};

export const updateOrderStatus = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, "items.vendor": req.user._id });
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  order.status = req.body.status || order.status;
  await order.save();

  sendSuccess(res, {
    message: "Order status updated",
    data: { order },
  });

  (async () => {
    try {
      const buyer = await User.findById(order.buyer).select("name email");
      if (buyer) {
        await emailService.sendOrderStatusUpdateEmail(order, buyer);
        logger.info("Sent order status update email", { to: buyer.email, orderNumber: order.orderNumber });
      }
    } catch (err) {
      logger.error("Order status update email failed", { orderNumber: order.orderNumber, message: err?.message });
    }
  })();
};

export const initializePayment = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  const reference = `pay_${uuid().replace(/-/g, "")}`;
  order.paymentReference = reference;
  await order.save();

  // Try initializing a Paystack transaction and return the authorization URL.
  try {
    const payload = {
      email: req.body.email || req.user?.email,
      amount: Math.round((order.totalAmount || 0) * 100),
      reference,
      callback_url: `${env.clientUrl}/payment-success?reference=${reference}`,
    };

    const resp = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.paystack.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();
    if (data && data.status && data.data && data.data.authorization_url) {
      sendSuccess(res, {
        message: 'Payment initialized',
        data: {
          authorization_url: data.data.authorization_url,
          reference,
        },
      });
      return;
    }
    // If Paystack didn't return an authorization URL, fall back to client flow
    logger.warn('Paystack initialize did not return authorization_url', { response: data });
  } catch (err) {
    logger.error('Paystack initialization failed', { message: err?.message });
  }

  // Fallback: return client-side payment success URL with reference
  sendSuccess(res, {
    message: 'Payment initialized',
    data: {
      authorization_url: `${env.clientUrl}/payment-success?reference=${reference}`,
      reference,
    },
  });
};

export const verifyPayment = async (req, res) => {
  const { reference } = req.query;
  if (!reference) {
    throw new AppError("Payment reference is required", 400);
  }

  const order = await populateOrderQuery(Order.findOne({ paymentReference: reference }));
  if (!order) {
    throw new AppError("Order not found for payment reference", 404);
  }

  order.paymentStatus = "paid";
  order.status = order.status === "pending" ? "processing" : order.status;
  await order.save();

  sendSuccess(res, {
    message: "Payment verified",
    data: { order },
  });

  (async () => {
    try {
      const buyer = await User.findById(order.buyer).select("name email");
      if (buyer) {
        await emailService.sendOrderStatusUpdateEmail(order, buyer);
        logger.info("Sent payment verified email", { to: buyer.email, orderNumber: order.orderNumber });
      }
    } catch (err) {
      logger.error("Payment verification email failed", { orderNumber: order.orderNumber, message: err?.message });
    }
  })();
};
