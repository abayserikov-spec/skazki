import { supabase } from "./supabase.js";

/**
 * Convert a base64 data URI to a Blob.
 * Handles "data:image/png;base64,..." format from Gemini NB2.
 */
function dataUriToBlob(dataUri) {
  const [header, b64] = dataUri.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/png";
  const bytes = atob(b64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/**
 * Resolve source (URL or base64 data URI) to a Blob for upload.
 */
async function sourceToBlob(source) {
  if (source.startsWith("data:")) {
    return dataUriToBlob(source);
  }
  const res = await fetch(source);
  if (!res.ok) return null;
  return res.blob();
}

/**
 * Download image from URL (or base64 data URI) and upload to Supabase Storage.
 * Returns the public URL of the uploaded file.
 * Supports both HTTP URLs (legacy Replicate) and base64 data URIs (Gemini NB2).
 */
export async function uploadIllustration(sourceUrl, bookId, pageNumber) {
  if (!supabase || !sourceUrl) return sourceUrl;
  try {
    const blob = await sourceToBlob(sourceUrl);
    if (!blob) return sourceUrl;
    const ext = blob.type === "image/png" ? "png" : "webp";
    const path = `${bookId}/page_${pageNumber}.${ext}`;

    const { error } = await supabase.storage
      .from("illustrations")
      .upload(path, blob, { contentType: blob.type, upsert: true });

    if (error) {
      console.error("Upload illustration error:", error);
      return sourceUrl;
    }

    const { data } = supabase.storage.from("illustrations").getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.error("uploadIllustration failed:", err);
    return sourceUrl;
  }
}

/**
 * Upload character portrait to Supabase Storage.
 * Supports both HTTP URLs and base64 data URIs (Gemini NB2).
 */
export async function uploadPortrait(sourceUrl, childId, characterId) {
  if (!supabase || !sourceUrl) return sourceUrl;
  try {
    const blob = await sourceToBlob(sourceUrl);
    if (!blob) return sourceUrl;
    const ext = blob.type === "image/png" ? "png" : "webp";
    const path = `${childId}/${characterId}.${ext}`;

    const { error } = await supabase.storage
      .from("portraits")
      .upload(path, blob, { contentType: blob.type, upsert: true });

    if (error) {
      console.error("Upload portrait error:", error);
      return sourceUrl;
    }

    const { data } = supabase.storage.from("portraits").getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.error("uploadPortrait failed:", err);
    return sourceUrl;
  }
}
