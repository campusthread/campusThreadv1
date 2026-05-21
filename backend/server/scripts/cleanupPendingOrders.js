import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from '../models/Order.js';
import { env } from '../config/env.js';

dotenv.config();

// Deletes pending Paystack orders older than the configured threshold (hours)
// Usage: node backend/server/scripts/cleanupPendingOrders.js

const HOURS = process.env.CLEANUP_PENDING_HOURS ? Number(process.env.CLEANUP_PENDING_HOURS) : 2;

async function run() {
  try {
    console.log('Connecting to MongoDB...', env.mongoUri);
    await mongoose.connect(env.mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

    const cutoff = new Date(Date.now() - HOURS * 60 * 60 * 1000);
    console.log(`Removing orders with paymentStatus='pending' created before ${cutoff.toISOString()}`);

    const result = await Order.deleteMany({ paymentStatus: 'pending', createdAt: { $lt: cutoff } });

    console.log(`Deleted ${result.deletedCount} pending orders.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Cleanup failed', err);
    process.exit(1);
  }
}

run();
