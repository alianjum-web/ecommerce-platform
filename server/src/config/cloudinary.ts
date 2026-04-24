import { v2 as cloudinary } from "cloudinary";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`[Cloudinary] Missing required environment variable: ${name}`);
  }
  return value;
}

const cloudName = getRequiredEnv("CLOUDINARY_CLOUD_NAME");
const apiKey = getRequiredEnv("CLOUDINARY_API_KEY");
const apiSecret = getRequiredEnv("CLOUDINARY_API_SECRET");

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export default cloudinary;
