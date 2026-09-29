import { useEffect, useState } from "react";
import {
  getConversationId,
  markAllUnreadMessagesRead,
  sendDirectMessage,
  subscribeConversations,
  subscribeDirectMessages,
  subscribeMessageProfiles,
} from "../services/messagingService";
import MessageFilePicker from "./MessageFilePicker";
import "./DirectMessages.css";

function formatTimestamp(value) {
  const date = value?.toDate ? value.toDate() : null;
  if (!date) return "";
  return date.toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

function roleLabel(role) {
  return role ? role.charAt(0).toUpperCase() + role.slice(1) : "User";
}

export default function DirectMessages({ uid, displayName, role }) {
  const [profiles, setProfiles] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeUid, setActiveUid] = useState("");
  const [messages, setMessages] = useState([]);
const [attachment, setAttachment] = useState(null);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!uid) return undefined;

    const onError = (subscriptionError) => {
      console.error("Failed to load direct messages:", subscriptionError);
      setError(subscriptionError.code === "permission-denied"
        ? "Messaging access is not enabled in the Firestore security rules."
        : "Could not load messages. Please try again.");
      setLoadingProfiles(false);
      setLoadingMessages(false);
    };

    const stopProfiles = subscribeMessageProfiles((nextProfiles) => {
      setProfiles(nextProfiles);
      setLoadingProfiles(false);
      setError("");
    }, onError);
    const stopConversations = subscribeConversations(uid, setConversations, onError);

    return () => {
      stopProfiles();
      stopConversations();
    };
  }, [uid]);

  useEffect(() => {
    if (!uid || !activeUid) return undefined;

    const conversationId = getConversationId(uid, activeUid);
    const loadingTimeout = window.setTimeout(() => {
      setLoadingMessages((isLoading) => {
        if (isLoading) {
          setError("The conversation is taking too long to load. Check your Firestore connection and security rules.");
        }
        return false;
      });
    }, 8000);
    const stopMessages = subscribeDirectMessages(
      uid,
      conversationId,
      (nextMessages) => {
        window.clearTimeout(loadingTimeout);
        setMessages(nextMessages);
        setLoadingMessages(false);
        setError("");
      },
      (subscriptionError) => {
        window.clearTimeout(loadingTimeout);
        console.error("Failed to load conversation:", subscriptionError);
        setError(subscriptionError.code === "permission-denied"
          ? "Messaging access is not enabled in the Firestore security rules."
          : "Could not load this conversation. Please try again.");
        setLoadingMessages(false);
      }
    );
    return () => {
      window.clearTimeout(loadingTimeout);
      stopMessages();
    };
  }, [activeUid, uid]);

  const conversationsById = new Map(conversations.map((conversation) => [
    conversation.id,
    conversation,
  ]));
  const visibleProfiles = profiles
    .filter((profile) => profile.id !== uid)
    .filter((profile) => role !== "customer" || profile.role !== "customer")
    .filter((profile) => {
      const searchValue = search.trim().toLowerCase();
      return !searchValue
        || profile.displayName?.toLowerCase().includes(searchValue)
        || profile.role?.toLowerCase().includes(searchValue);
    })
    .sort((first, second) => {
      const firstConversation = conversationsById.get(getConversationId(uid, first.id));
      const secondConversation = conversationsById.get(getConversationId(uid, second.id));
      const firstTime = firstConversation?.updatedAt?.toDate?.()?.getTime() || 0;
      const secondTime = secondConversation?.updatedAt?.toDate?.()?.getTime() || 0;
      return secondTime - firstTime
        || (first.displayName || "").localeCompare(second.displayName || "");
    });
  const activeProfile = profiles.find((profile) => profile.id === activeUid);

function selectContact(profile) {
  setActiveUid(profile.id);
  setMessages([]);
  setDraft("");
  setAttachment(null);
  setError("");
  setLoadingMessages(true);
  markAllUnreadMessagesRead(uid).catch((readError) => {
    console.error("Failed to mark messages as read:", readError);
    setError(readError.code === "permission-denied"
      ? "Messaging read status could not be saved to your profile."
      : "Could not update message read status.");
  });
}

async function handleSend(event) {
  event.preventDefault();
  const text = draft.trim();
  if ((!text && !attachment) || !activeProfile || sending) return;

  setSending(true);
  setError("");
  try {
    await sendDirectMessage({
      conversationId: getConversationId(uid, activeProfile.id),
      sender: { id: uid, name: displayName, role },
      recipient: {
        id: activeProfile.id,
        name: activeProfile.displayName,
        role: activeProfile.role,
      },
      text,
      attachment,
    });
    setDraft("");
    setAttachment(null);
  } catch (sendError) {
    console.error("Failed to send message:", sendError);
    setError(sendError.message === "Customers can only message staff or administrators."
      ? sendError.message
      : sendError.code === "permission-denied"
        ? "Messaging access is not enabled in the Firestore security rules."
        : "Message could not be sent. Please try again.");
  } finally {
    setSending(false);
  }
}

  function handleComposerKeyDown(event) {
    if (event.key !== "Enter" || event.shiftKey) return;

    event.preventDefault();
    if (event.currentTarget.form) {
      event.currentTarget.form.requestSubmit();
    }
  }

  if (!uid) {
    return <div className="dashboard-content">Loading your messages...</div>;
  }

  return (
    <div className="dashboard-content">
      {error && <div className="um-error">{error}</div>}

      <section className="direct-messages" aria-label="Direct messages">
        <aside className="direct-messages__contacts">
          <label className="direct-messages__search-label" htmlFor="message-contact-search">
            Find a person
          </label>
          <input
            id="message-contact-search"
            className="direct-messages__search"
            type="search"
            placeholder="Search names or roles"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <div className="direct-messages__contact-list">
            {loadingProfiles ? (
              <p className="direct-messages__empty">Loading people...</p>
            ) : visibleProfiles.length === 0 ? (
              <p className="direct-messages__empty">No people found.</p>
            ) : visibleProfiles.map((profile) => {
              const conversation = conversationsById.get(getConversationId(uid, profile.id));
              return (
                <button
                  type="button"
                  className={`direct-messages__contact ${activeUid === profile.id ? "direct-messages__contact--active" : ""}`}
                  key={profile.id}
                  onClick={() => selectContact(profile)}
                  aria-pressed={activeUid === profile.id}
                >
                  <span className="direct-messages__contact-name">
                    {profile.displayName || "User"}
                  </span>
                  <span className="direct-messages__contact-meta">
                    {roleLabel(profile.role)}
                    {conversation?.lastMessage ? ` · ${conversation.lastMessage}` : ""}
                  </span>
                  {conversation?.updatedAt && (
                    <time className="direct-messages__contact-time">
                      {formatTimestamp(conversation.updatedAt)}
                    </time>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

<div className="direct-messages__thread">
  {activeProfile ? (
    <>
      <header className="direct-messages__thread-header">
        <h2>{activeProfile.displayName || "User"}</h2>
        <span>{roleLabel(activeProfile.role)}</span>
      </header>

      <div className="direct-messages__history" aria-live="polite">
        {loadingMessages ? (
          <p className="direct-messages__empty">
            Loading conversation...
          </p>
        ) : messages.length === 0 ? (
          <p className="direct-messages__empty">
            Start the conversation.
          </p>
        ) : (
          messages.map((message) => (
            <div
              className={`direct-messages__message ${
                message.senderId === uid
                  ? "direct-messages__message--sent"
                  : "direct-messages__message--received"
              }`}
              key={message.id}
            >
              {message.text && <p>{message.text}</p>}

              {message.attachment && (
                <div className="direct-messages__message-attachment">
                  {message.attachment.type?.startsWith("image/") ? (
                    <a
                      href={message.attachment.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={message.attachment.url}
                        alt={message.attachment.name || "Attachment"}
                        style={{
                          maxWidth: "220px",
                          borderRadius: "8px",
                        }}
                      />
                    </a>
                  ) : (
                    <a
                      href={message.attachment.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {message.attachment.name || "Open attachment"}
                    </a>
                  )}
                </div>
              )}

              <time>{formatTimestamp(message.createdAt)}</time>
            </div>
          ))
        )}
      </div>

      <form
        className="direct-messages__composer"
        onSubmit={handleSend}
      >
        <div className="direct-messages__attachment-row">
          <MessageFilePicker
            uid={uid}
            conversationId={getConversationId(uid, activeUid)}
            onUploaded={setAttachment}
          />

          {attachment && (
            <div className="direct-messages__attachment-preview">
              <span title={attachment.name}>{attachment.name}</span>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                disabled={sending}
              >
                Remove
              </button>
            </div>
          )}
        </div>

        <div className="direct-messages__message-entry">
          <textarea
            aria-label="Write a message"
            placeholder={`Message ${activeProfile.displayName || "user"}`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleComposerKeyDown}
            maxLength={2000}
            rows={2}
          />

          <button
            type="submit"
            disabled={(!draft.trim() && !attachment) || sending}
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </>
  ) : (
    <div className="direct-messages__welcome">
      <h2>Your messages</h2>
      <p>Select a person to open a conversation.</p>
    </div>
  )}
</div>
      </section>
    </div>
  );
  

}