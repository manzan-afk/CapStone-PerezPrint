const CLOUDINARY_CLOUD_NAME = "fl6yl7z7";
const CLOUDINARY_UPLOAD_PRESET = "PerezMessages";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Uploads a message attachment to Cloudinary.
 * @returns {Promise<{ name: string, url: string, type: string, size: number, publicId: string }>}
 */
export async function uploadMessageFile(uid, conversationId, file) {
  if (!uid || !conversationId || !file) {
    throw new Error("User, conversation, and file are required.");
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Unsupported file type.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Maximum file size is 10 MB.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", `messages/${uid}/${conversationId}`);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
    { method: "POST", body: formData }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Message attachment upload failed.");
  }

  return {
    name: file.name,
    url: data.secure_url,
    type: file.type,
    size: file.size,
    publicId: data.public_id,
  };
}