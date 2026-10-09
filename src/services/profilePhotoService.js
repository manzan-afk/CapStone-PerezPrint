const CLOUDINARY_CLOUD_NAME = "fl6yl7z7";
const CLOUDINARY_UPLOAD_PRESET = "PerezMessages";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Uploads a profile photo to Cloudinary.
 * @returns {Promise<string>} the secure URL of the uploaded image
 */
export async function uploadProfilePhoto(uid, file) {
  if (!uid || !file) {
    throw new Error("User and image are required.");
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Please choose a JPG, PNG, or WebP image.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Maximum image size is 5 MB.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", `profiles/${uid}`);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Profile photo upload failed.");
  }

  return data.secure_url;
}
