import { useState } from "react";
import MessageFilePicker from "./MessageFilePicker";

export default function MessageComposer({
  uid,
  conversationId,
  onSendMessage,
}) {
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [sending, setSending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!text.trim() && !attachment) return;

    setSending(true);
    try {
      await onSendMessage({ text: text.trim(), attachment });
      setText("");
      setAttachment(null);
    } finally {
      setSending(false);
    }
  }

  return (
<form className="direct-messages__composer" onSubmit={handleSubmit}>
  <MessageFilePicker
    uid={uid}
    conversationId={conversationId}
    onUploaded={setAttachment}
  />

  {attachment && (
    <div>
      <a href={attachment.url} target="_blank" rel="noreferrer">
        {attachment.name}
      </a>
      <button type="button" onClick={() => setAttachment(null)} disabled={sending}>
        Remove
      </button>
    </div>
  )}

  <textarea
    aria-label="Write a message"
    placeholder="Type a message..."
    value={text}
    onChange={(event) => setText(event.target.value)}
    onKeyDown={(event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        if (event.currentTarget.form) {
          event.currentTarget.form.requestSubmit();
        }
      }
    }}
    maxLength={2000}
    rows={2}
  />
  <button type="submit" disabled={(!text.trim() && !attachment) || sending}>
    {sending ? "Sending..." : "Send"}
  </button>
</form>
  );
}