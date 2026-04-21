/**
 * Client-safe helper: Cloudinary full URL → thumbnail URL (200px fill).
 * Use for list/card; use full URL for modal/detail.
 */
export function getThumbnailUrl(
  fullUrl: string | undefined
): string | undefined {
  if (!fullUrl || !fullUrl.includes("res.cloudinary.com")) return fullUrl;
  return fullUrl.replace("/upload/", "/upload/w_200,h_200,c_fill/");
}
