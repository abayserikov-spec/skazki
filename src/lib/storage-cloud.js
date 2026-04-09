import { supabase } from "./supabase.js";

/**
 * Download image from URL and upload to Supabase Storage.
 * Returns the public URL of the uploaded file.
 * 
 * This is critical because Replicate URLs expire after a few hours.
 * We call this right after each illustration is generated.
 */
export async function uploadIllustration(sourceUrl, bookId, pageNumber) {
  if (!supabase || !sourceUrl) return sourceUrl; // fallback to original URL
  try {
    const res = await fetch(sourceUrl);
    if (!res.ok) return sourceUrl;
    const blob = await res.blob();
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
    return sourceUrl; // fallback
  }
}

/**
 * Upload character portrait to Supabase Storage.
 */
export async function uploadPortrait(sourceUrl, childId, characterId) {
  if (!supabase || !sourceUrl) return sourceUrl;
  try {
    const res = await fetch(sourceUrl);
    if (!res.ok) return sourceUrl;
    const blob = await res.blob();
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
