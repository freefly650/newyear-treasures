/**
 * Server-only Cloudinary integration. All upload/delete use API secret here,
 * never exposed to the frontend (correct practice).
 */
import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

export function isCloudinaryConfigured(): boolean {
  return !!(cloudName && apiKey && apiSecret);
}

const UPLOAD_FOLDER_BASE = "newyear-treasures";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Upload image to Cloudinary. Uses per-user folder: newyear-treasures/{userId}
 */
export async function uploadImage(
  buffer: Buffer,
  mimeType: string,
  userId: string
): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    );
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new Error("Image must be 5MB or smaller");
  }
  const folder = `${UPLOAD_FOLDER_BASE}/${userId}`;
  const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: "image",
  });
  return result.secure_url;
}

/**
 * Check if a URL is a Cloudinary image URL (same cloud or any).
 */
export function isCloudinaryUrl(url: string): boolean {
  return !!(
    url &&
    typeof url === "string" &&
    url.trim().length > 0 &&
    url.includes("res.cloudinary.com") &&
    url.includes("/image/upload/")
  );
}

/**
 * Re-upload an image from a Cloudinary URL into the target user's folder.
 * Use when restoring a backup so image_url points to the target user.
 * Returns the new secure_url, or null if fetch/upload fails (caller can keep original URL).
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  targetUserId: string
): Promise<string | null> {
  if (!isCloudinaryConfigured() || !isCloudinaryUrl(imageUrl)) return null;
  try {
    const res = await fetch(imageUrl.trim(), { method: "GET" });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const mime = contentType.split(";")[0].trim() || "image/jpeg";
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) return null;
    return await uploadImage(buffer, mime, targetUserId);
  } catch {
    return null;
  }
}

/**
 * Extract Cloudinary public_id from a secure_url (e.g. from our DB).
 * URL format: .../upload/v<version>/<public_id>.<ext>
 */
function getPublicIdFromUrl(secureUrl: string): string | null {
  if (!secureUrl || !secureUrl.includes("res.cloudinary.com")) return null;
  const match = secureUrl.match(/\/upload\/v\d+\/(.+)$/);
  const path = match?.[1];
  if (!path) return null;
  return path.replace(/\.\w+$/, "");
}

/**
 * Delete an image from Cloudinary by its stored URL. No-op if URL is not
 * Cloudinary or if Cloudinary is not configured. Logs and ignores destroy errors.
 */
export async function deleteImage(imageUrl: string | null): Promise<void> {
  if (!imageUrl || !isCloudinaryConfigured()) return;
  const publicId = getPublicIdFromUrl(imageUrl);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (err) {
    console.warn("Cloudinary destroy failed for", publicId, err);
  }
}

/**
 * Delete all assets in a user's folder (newyear-treasures/{userId}/).
 * Use when deleting a user to remove their folder and any orphaned assets.
 * No-op if Cloudinary is not configured. Logs and ignores errors.
 */
export async function deleteUserFolder(userId: string): Promise<void> {
  if (!isCloudinaryConfigured()) return;
  const prefix = `${UPLOAD_FOLDER_BASE}/${userId}/`;
  try {
    await new Promise<void>((resolve, reject) => {
      cloudinary.api.delete_resources_by_prefix(prefix, (err) => (err ? reject(err) : resolve()));
    });
  } catch (err) {
    console.warn("Cloudinary delete folder failed for prefix", prefix, err);
  }
}
