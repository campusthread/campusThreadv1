import app from '../backend/server/app.js';
import { connectToDatabase } from '../backend/server/config/db.js';
import { connectRedis } from '../backend/server/config/redis.js';

let readyPromise = null;

const ensureBackendReady = async () => {
    if (!readyPromise) {
        readyPromise = Promise.all([connectToDatabase(), connectRedis()]).catch((error) => {
            readyPromise = null;
            throw error;
        });
    }

    return readyPromise;
};

export default async function handler(req, res) {
    await ensureBackendReady();
    return app(req, res);
}
