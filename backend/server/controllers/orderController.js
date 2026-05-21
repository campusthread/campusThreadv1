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
    Order.find({ buyer: req.user._id, paymentStatus: 'paid' }).sort({ createdAt: -1 }),
  );

  sendSuccess(res, {
    data: { orders },
  });
};

export const getVendorOrders = async (req, res) => {
  const orders = await populateOrderQuery(
    Order.find({ "items.vendor": req.user._id, paymentStatus: 'paid' }).sort({ createdAt: -1 }),
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
    const callbackBase = req.body.callback_url || env.clientUrl;
    const payload = {
      email: req.body.email || req.user?.email,
      amount: Math.round((order.totalAmount || 0) * 100),
      reference,
      callback_url: `${callbackBase.replace(/\/+$/, '')}/payment-success?reference=${reference}`,
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

export const initializePaymentWithOrder = async (req, res) => {
  // Expect items and shippingAddress in body, but do not create DB order yet.
  if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
    throw new AppError('Order must contain at least one item', 400);
  }

  const items = [];

  for (const item of req.body.items) {
    const productId = item.productId || item.product?._id || item.product || null;
    const product = await Product.findById(productId).populate('vendor', 'brandName name');
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
  }

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const reference = `pay_${uuid().replace(/-/g, '')}`;

  // Do NOT create a persistent pending order here. The order will be
  // created by `verifyPayment` only after Paystack confirms a successful
  // transaction. This avoids dashboard counts increasing for cancelled
  // or abandoned payments.

  // Build metadata to include minimal order payload and buyer id
  const metadata = {
    buyer: String(req.user._id),
    items: items.map((it) => ({ product: String(it.product), quantity: it.quantity, price: it.price, name: it.name })),
    shippingAddress: req.body.shippingAddress || {},
    paymentMethod: req.body.paymentMethod || 'paystack',
    totalAmount,
  };

  try {
    const callbackBase = req.body.callback_url || env.clientUrl;
    const payload = {
      email: req.body.email || req.user?.email,
      amount: Math.round(totalAmount * 100),
      reference,
      callback_url: `${callbackBase.replace(/\/+$/, '')}/payment-success?reference=${reference}`,
      metadata,
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
    logger.warn('Paystack initialize did not return authorization_url', { response: data });
  } catch (err) {
    logger.error('Paystack initialization failed', { message: err?.message });
  }

  sendSuccess(res, {
    message: 'Payment initialized',
    data: {
      authorization_url: `${env.clientUrl}/payment-success?reference=${reference}`,
      reference,
    },
  });
};

export const verifyPayment = async (req, res) => {
  const reference =
    req.query.reference ||
    req.query.trxref ||
    req.query.tx_ref ||
    req.query.txref ||
    req.query.ref ||
    req.query.transaction_id

  if (!reference) {
    throw new AppError("Payment reference is required", 400);
  }

  logger.info('Payment verification initiated', { reference });

  let order = await populateOrderQuery(Order.findOne({ paymentReference: reference }));
  // Verify transaction status with Paystack before marking as paid
  try {
    const resp = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${env.paystack.secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await resp.json();

    if (!data || !data.status || !data.data) {
      // Unexpected Paystack response
      logger.warn('Paystack verify returned unexpected response', { reference, response: data });
      throw new AppError('Unable to verify payment at this time', 502);
    }

    const tx = data.data;

    // If order does not exist yet, attempt to create it from Paystack metadata
    if (!order) {
      logger.info('Order not found in database, attempting to create from Paystack metadata', { reference });
      const meta = tx.metadata || {};
      if (!meta || !meta.items || !Array.isArray(meta.items) || !meta.buyer) {
        logger.error('Invalid metadata for order creation', { reference, hasMeta: !!meta, hasItemsArray: Array.isArray(meta?.items), hasBuyer: !!meta?.buyer });
        throw new AppError('Order not found and no valid metadata to create order', 404);
      }

      // Rebuild items and validate products
      const items = [];
      const vendorNotifications = new Map();
      for (const it of meta.items) {
        const product = await Product.findById(it.product).populate('vendor', 'brandName name email');
        if (!product) throw new AppError(`Product not found: ${it.product}`, 404);
        items.push({ product: product._id, vendor: product.vendor._id, quantity: it.quantity, price: product.price, name: product.name });

        const vendorId = product.vendor._id.toString();
        if (!vendorNotifications.has(vendorId)) vendorNotifications.set(vendorId, { vendor: product.vendor, items: [] });
        vendorNotifications.get(vendorId).items.push({ name: product.name, quantity: it.quantity, price: product.price });
      }

      const totalAmountFromMeta = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const expectedAmount = Math.round(totalAmountFromMeta * 100);

      if (!(tx.status === 'success' && Number(tx.amount) === Number(expectedAmount))) {
        // Transaction not successful or amount mismatch
        sendSuccess(res, { message: 'Payment not completed', data: { paystack: tx } });
        return;
      }

      // Create the order now and mark as paid
      const buyerId = meta.buyer || (req.user && req.user._id);
      if (!buyerId) {
        logger.error('Cannot create order - no buyer ID available', { reference, hasMeta: !!meta, hasReqUser: !!req.user });
        throw new AppError('Unable to identify buyer for order', 400);
      }

      logger.info('Creating order from Paystack metadata', { reference, buyerId, itemCount: items.length });

      order = await Order.create({
        orderNumber: `CT-${uuid().slice(0, 8).toUpperCase()}`,
        buyer: buyerId,
        items,
        shippingAddress: meta.shippingAddress || {},
        paymentMethod: meta.paymentMethod || 'paystack',
        totalAmount: totalAmountFromMeta,
        paymentReference: reference,
        paymentStatus: 'paid',
        status: 'processing',
      });

      logger.info('Order created from metadata successfully', { orderNumber: order.orderNumber, orderId: order._id, reference });

      // Send notifications asynchronously
      (async () => {
        try {
          const buyer = await User.findById(order.buyer).select('name email');
          if (buyer) await emailService.sendBuyerOrderConfirmation(order, buyer);
          await Promise.all(
            Array.from(vendorNotifications.values()).map(({ vendor, items }) =>
              emailService.sendVendorOrderNotification(vendor, order, items, buyer?.name || 'Buyer'),
            ),
          );
        } catch (err) {
          logger.error('Order creation notifications failed', { orderNumber: order.orderNumber, message: err?.message });
        }
      })();

      // Populate for response
      order = await populateOrderQuery(Order.findById(order._id));
    }

    // Ensure transaction was successful and amount matches order
    const expectedAmount = Math.round((order.totalAmount || 0) * 100);
    if (tx.status === 'success' && Number(tx.amount) === Number(expectedAmount)) {
      if (order.paymentStatus === 'paid') {
        logger.info('Payment already marked as paid', { reference, orderNumber: order.orderNumber });
      } else {
        order.paymentStatus = 'paid';
        order.status = order.status === 'pending' ? 'processing' : order.status;
        await order.save();
        logger.info('Payment marked as paid', { reference, orderNumber: order.orderNumber });
      }

      sendSuccess(res, {
        message: 'Payment verified',
        data: { order, paystack: tx },
      });

      (async () => {
        try {
          const buyer = await User.findById(order.buyer).select('name email');
          if (buyer) {
            await emailService.sendOrderStatusUpdateEmail(order, buyer);
            logger.info('Sent payment verified email', { to: buyer.email, orderNumber: order.orderNumber });
          }
        } catch (err) {
          logger.error('Payment verification email failed', { orderNumber: order.orderNumber, message: err?.message });
        }
      })();
      return;
    }

    // If payment not successful, mark as failed (but don't delete the order)
    order.paymentStatus = 'failed';
    await order.save();

    sendSuccess(res, {
      message: 'Payment not completed',
      data: { order, paystack: tx },
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error('Payment verification error', { reference, message: err?.message });
    throw new AppError('Payment verification failed', 500);
  }
};
