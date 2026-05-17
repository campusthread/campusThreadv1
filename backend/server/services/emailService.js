import { sendEmail } from "../utils/email.js";
import { logger } from "../utils/logger.js";

const sender = process.env.EMAIL_FROM || "no-reply@campusthread.com";
const appUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5173";
const appName = "CampusThread";

const safeSendEmail = async (options) => {
    try {
        return await sendEmail({
            ...options,
            from: sender,
            context: {
                appUrl,
                appName,
                ...options.context,
            },
        });
    } catch (error) {
        logger.error("Email service failed", {
            to: options?.to,
            subject: options?.subject,
            template: options?.template,
            message: error?.message,
        });
        return null;
    }
};

export const sendWelcomeEmail = async (user) => {
    const role = user.role === "vendor" ? "Vendor" : "Buyer";
    return safeSendEmail({
        to: user.email,
        subject: `Welcome to CampusThread ${role}`,
        template: "welcome",
        context: { name: user.name, role },
    });
};

export const sendVendorApprovalEmail = async (vendor) => {
    return safeSendEmail({
        to: vendor.email,
        subject: "Your CampusThread vendor account has been approved",
        template: "vendor-approved",
        context: {
            name: vendor.name,
            brandName: vendor.brandName || vendor.name,
        },
    });
};

export const sendVendorRejectionEmail = async (vendor, reason) => {
    return safeSendEmail({
        to: vendor.email,
        subject: "Your CampusThread vendor account has been rejected",
        template: "vendor-rejected",
        context: {
            name: vendor.name,
            brandName: vendor.brandName || vendor.name,
            reason,
        },
    });
};

export const sendProductPublishedEmail = async (vendor, product) => {
    return safeSendEmail({
        to: vendor.email,
        subject: `Your product "${product.name}" is now live on CampusThread`,
        template: "product-created",
        context: {
            name: vendor.name,
            brandName: vendor.brandName || vendor.name,
            productName: product.name,
            productDescription: product.description || "No description provided.",
            productPrice: product.price,
        },
    });
};

export const sendBuyerOrderConfirmation = async (order, buyer) => {
    return safeSendEmail({
        to: buyer.email,
        subject: `Order ${order.orderNumber} confirmed on CampusThread`,
        template: "order-confirmation",
        context: {
            name: buyer.name,
            orderNumber: order.orderNumber,
            items: order.items.map((item) => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
            })),
            totalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod,
            status: order.status,
            shippingAddress: order.shippingAddress,
        },
    });
};

export const sendVendorOrderNotification = async (vendor, order, items, buyerName = "Customer") => {
    return safeSendEmail({
        to: vendor.email,
        subject: `New order received: ${order.orderNumber}`,
        template: "vendor-order",
        context: {
            name: vendor.name,
            brandName: vendor.brandName || vendor.name,
            orderNumber: order.orderNumber,
            buyerName,
            items,
            totalAmount: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
            status: order.status,
        },
    });
};

export const sendOrderStatusUpdateEmail = async (order, buyer) => {
    return safeSendEmail({
        to: buyer.email,
        subject: `Order ${order.orderNumber} status updated to ${order.status}`,
        template: "order-status-update",
        context: {
            name: buyer.name,
            orderNumber: order.orderNumber,
            status: order.status,
            items: order.items.map((item) => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
            })),
            totalAmount: order.totalAmount,
        },
    });
};

