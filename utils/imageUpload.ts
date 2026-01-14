import { supabase } from "./supabase";

export const uploadImageToSupabase = async (uri: string) => {
  try {
    // 1. Generate a unique file name
    const fileExt = uri.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // 2. Fetch the file
    const response = await fetch(uri);

    // FIX: Get ArrayBuffer instead of Blob
    // This raw binary format is handled more reliably by Supabase in RN
    const arrayBuffer = await response.arrayBuffer();

    // 3. Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("task-media")
      .upload(filePath, arrayBuffer, {
        contentType: `image/${fileExt}`, // Explicitly set content type
        upsert: false, // Overwrite the file if it already exists
      });

    if (error) throw error;

    // 4. Get the Public URL
    const { data: urlData } = supabase.storage
      .from("task-media")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
};

export const deleteImageFromSupabase = async (fullUrl: string | null) => {
  if (!fullUrl) return;

  try {
    // 1. Extract the file path from the full URL
    // URL: https://xyz.supabase.co/.../task-media/filename.jpg
    // We just need "filename.jpg"
    const fileName = fullUrl.split("/").pop();
    console.log("fullUrl", fullUrl);
    console.log("fileName", fileName);

    if (!fileName) return;

    // 2. Call Supabase Remove
    const { error } = await supabase.storage
      .from("task-media")
      .remove([fileName]); // Expects an array of paths

    if (error) {
      console.error("Error deleting image:", error);
      throw error;
    }
    return true;
  } catch (error) {
    console.error("Failed to delete image:", error);
    // We usually don't throw here to avoid blocking the main task deletion
  }
};
