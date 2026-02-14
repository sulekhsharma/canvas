import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import pLimit from 'p-limit';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Redis Connection
const connection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null,
});

// Setup p-limit to restrict local CPU usage for image rendering
// We allow 2 concurrent renders by default to prevent CPU spikes
const limit = pLimit(2);

// Create Queue
export const qrQueue = new Queue('qr-generation', { connection });

// Function to handle the actual generation (the Heavy Lifting)
// This will be used by the worker
export const setupWorker = (renderToCanvas) => {
    const worker = new Worker('qr-generation', async (job) => {
        const { designData, template, fileName, filePath } = job.data;

        console.log(`[Worker] Started processing job ${job.id} for ${fileName}`);

        try {
            // Use p-limit to ensure we don't start too many canvas renders at once
            const buffer = await limit(async () => {
                const canvas = await renderToCanvas(designData, template);
                return canvas.toBuffer('image/png');
            });

            // Save to disk
            fs.writeFileSync(filePath, buffer);

            console.log(`[Worker] Finished job ${job.id}`);
            return { success: true, fileName };
        } catch (error) {
            console.error(`[Worker] Failed job ${job.id}:`, error);
            throw error;
        }
    }, {
        connection,
        concurrency: 5 // BullMQ can handle 5 jobs in parallel, but p-limit restricts actual rendering
    });

    worker.on('completed', (job) => {
        console.log(`Job ${job.id} has completed!`);
    });

    worker.on('failed', (job, err) => {
        console.warn(`Job ${job.id} has failed with ${err.message}`);
    });

    return worker;
};
