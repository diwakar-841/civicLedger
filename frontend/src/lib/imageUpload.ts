/**
 * Shared helper for turning a gallery/camera-picked image file into a
 * compressed base64 data URL the backend can store directly (same
 * convention already used for group photos — see AdminGroupDetailPage).
 *
 * Keeping this in one place means every "upload a photo" surface (profile,
 * candidate profile, group photo) resizes and compresses consistently
 * instead of shipping full-resolution photos to the server.
 */
export async function fileToCompressedDataUrl(file: File, max = 480): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the image"));
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Unsupported image"));
    img.src = dataUrl;
  });
  const scale = Math.min(1, max / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}
