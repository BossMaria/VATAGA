const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
const DEFAULT_LOCAL_MAX_FILE_SIZE_MB = 10;
const DEFAULT_VERCEL_MAX_FILE_SIZE_MB = 4;
const isVercel = process.env.VERCEL === "1";

export const appConfig = {
  acceptedImageTypes: ACCEPTED_IMAGE_TYPES,
  workerUrl: process.env.WORKER_URL || "http://127.0.0.1:8000",
  maxFileSizeBytes:
    Number(
      process.env.MAX_FILE_SIZE_MB ||
        (isVercel ? DEFAULT_VERCEL_MAX_FILE_SIZE_MB : DEFAULT_LOCAL_MAX_FILE_SIZE_MB)
    ) *
    1024 *
    1024
};

export type AcceptedImageType = (typeof ACCEPTED_IMAGE_TYPES)[number];
