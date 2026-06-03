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

export const sendPasswordResetEmail = async (user, resetUrl) => {
    return safeSendEmail({
        to: user.email,
        subject: `Reset your CampusThread password`,
        template: "password-reset",
        context: {
            name: user.name,
            resetUrl,
        },
    });
};

export const sendPasswordResetConfirmation = async (user) => {
    return safeSendEmail({
        to: user.email,
        subject: `Your CampusThread password has been updated`,
        template: "password-reset-confirmation",
        context: {
            name: user.name,
        },
    });
};

export const sendGeneralReminderEmail = async (user, { headline, message, ctaUrl, ctaText, imageUrl } = {}) => {
    return safeSendEmail({
        to: user.email,
        subject: "Reminder from CampusThread",
        template: "general-reminder",
        context: {
            name: user.name,
            headline: headline || "A quick reminder from CampusThread",
            message: message || "This is a friendly reminder from CampusThread. Please take a look when you have a moment.",
            ctaUrl: ctaUrl || `${appUrl}`,
            ctaText: ctaText || "Open CampusThread",
            imageUrl,
        },
    });
};

export const sendBuyerPromotionEmail = async (buyer, { headline, message, ctaUrl, ctaText, imageUrl } = {}) => {
    return safeSendEmail({
        to: buyer.email,
        subject: `New deals and campus picks just for you`,
        template: "buyer-reminder",
        context: {
            name: buyer.name,
            headline: headline || "Fresh campus deals are waiting",
            message: message || "Discover trending products and exclusive offers from student vendors on CampusThread.",
            ctaUrl: ctaUrl || `${appUrl}/shop`,
            ctaText: ctaText || "Browse products",
            imageUrl,
        },
    });
};

export const sendVendorUploadReminderEmail = async (vendor, { headline, message, ctaUrl, ctaText, imageUrl } = {}) => {
    return safeSendEmail({
        to: vendor.email,
        subject: `Upload new products and boost your CampusThread sales`,
        template: "vendor-reminder",
        context: {
            name: vendor.name,
            brandName: vendor.brandName || vendor.name,
            headline: headline || "Keep your store fresh with new products",
            message: message || "Students are browsing right now — upload your latest items to reach more buyers.",
            ctaUrl: ctaUrl || `${appUrl}/vendor-admin`,
            ctaText: ctaText || "Upload product",
            imageUrl,
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

export const sendBroadcastMessageEmail = async (user, { subject, message, imageUrl, ctaUrl, ctaText } = {}) => {
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; margin-bottom: 20px;">${subject || 'Message from CampusThread'}</h2>
            ${imageUrl ? `<img src="${imageUrl}" alt="Message Image" style="width: 100%; max-width: 500px; height: auto; margin-bottom: 20px; border-radius: 8px;">` : ''}
            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">${message || ''}</p>
            ${ctaUrl && ctaText ? `<a href="${ctaUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 10px;">${ctaText}</a>` : ''}
        </div>
    `;

    return safeSendEmail({
        to: user.email,
        subject: subject || 'Message from CampusThread',
        htmlContent,
        context: {
            name: user.name,
        },
    });
};

