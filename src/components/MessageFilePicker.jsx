import { useRef, useState } from "react";
import { uploadMessageFile } from "../services/messageUploadService";

export default function MessageFilePicker({ uid, conversationId, onUploaded }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError("");
    setUploading(true);
    try {
      onUploaded(await uploadMessageFile(uid, conversationId, file));
    } catch (err) {
      setError(err.message || "File upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf,.doc,.docx"
        onChange={handleChange}
        hidden
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? "Uploading…" : "Attach file"}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}