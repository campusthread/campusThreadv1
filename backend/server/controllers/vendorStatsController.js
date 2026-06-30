import Order from "../models/Order.js";
import { AppError } from "../utils/errors.js";
import { sendSuccess } from "../utils/response.js";

export const getVendorStats = async (req, res) => {
    try {
        const vendorId = req.user._id;

        const agg = await Order.aggregate([
            { $match: { paymentStatus: 'paid', 'items.vendor': vendorId } },
            { $unwind: '$items' },
            { $match: { 'items.vendor': vendorId } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                    ordersSet: { $addToSet: '$_id' },
                    deliveredCount: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalRevenue: 1,
                    totalOrders: { $size: '$ordersSet' },
                    deliveredCount: 1,
                },
            },
        ]);

        const stats = agg[0] || { totalRevenue: 0, totalOrders: 0, deliveredCount: 0 };
        const commission = Math.round((stats.totalRevenue || 0) * 0.1);

        sendSuccess(res, {
            message: 'Vendor stats fetched',
            data: { stats: { ...stats, commission } },
        });
    } catch (err) {
        throw new AppError('Unable to fetch vendor stats', 500);
    }
};

export const getVendorDashboard = async (req, res) => {
    try {
        const vendorId = req.user._id;
        const orders = await Order.find({ 'items.vendor': vendorId, paymentStatus: 'paid' })
            .populate('buyer', 'name email phone')
            .populate('items.product', 'name')
            .populate('items.vendor', 'name brandName')
            .sort({ createdAt: -1 })
            .limit(500);

        sendSuccess(res, {
            message: 'Vendor dashboard fetched',
            data: { orders, total: orders.length },
        });
    } catch (err) {
        throw new AppError('Unable to fetch vendor dashboard', 500);
    }
};
