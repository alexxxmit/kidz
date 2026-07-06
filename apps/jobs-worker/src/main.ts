import { Worker } from "bullmq";

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) throw new Error("REDIS_URL is required");

const parsedRedisUrl = new URL(redisUrl);
const connection = {
  host: parsedRedisUrl.hostname,
  port: Number(parsedRedisUrl.port || 6379),
  ...(parsedRedisUrl.username ? { username: decodeURIComponent(parsedRedisUrl.username) } : {}),
  ...(parsedRedisUrl.password ? { password: decodeURIComponent(parsedRedisUrl.password) } : {}),
  ...(parsedRedisUrl.protocol === "rediss:" ? { tls: {} } : {}),
  maxRetriesPerRequest: null,
};
const worker = new Worker(
  "kidz-jobs",
  async (job) => {
    if (job.name === "prepare-daily-outfits") {
      console.log(JSON.stringify({ event: "daily_outfits_requested", jobId: job.id, payload: job.data }));
      return { accepted: true };
    }
    if (job.name === "delete-expired-media") {
      console.log(JSON.stringify({ event: "expired_media_cleanup", jobId: job.id }));
      return { accepted: true };
    }
    console.log(JSON.stringify({ event: "unknown_job", name: job.name, jobId: job.id }));
    return { ignored: true };
  },
  { connection, concurrency: Number(process.env.JOBS_CONCURRENCY ?? 4) },
);

worker.on("ready", () => console.log("Kidz jobs worker is ready"));
worker.on("failed", (job, error) => {
  console.error(JSON.stringify({ event: "job_failed", jobId: job?.id, message: error.message }));
});

const shutdown = async () => {
  await worker.close();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
