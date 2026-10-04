import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase-config";
import { lineOptionsSuffix } from "../utils/orderLines";

export function getConversationId(firstUid, secondUid) {
  return [firstUid, secondUid]
    .sort()
    .map((uid) => `${uid.length}-${uid}`)
    .join("_");
}

export function subscribeMessageProfiles(onProfiles, onError) {
  return onSnapshot(
    collection(db, "users"),
    (snapshot) => {
      onProfiles(snapshot.docs.map((profile) => {
        const data = profile.data();
        return {
          id: profile.id,
          displayName: [data.firstName, data.lastName].filter(Boolean).join(" ")
            || data.email?.split("@")[0]
            || "User",
          role: data.role || "customer",
        };
      }));
    },
    onError
  );
}

export function subscribeConversations(uid, onConversations, onError) {
  const messagesQuery = query(
    collection(db, "messages"),
    where("participants", "array-contains", uid)
  );
  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const conversationsById = new Map();
      snapshot.docs.forEach((message) => {
        const data = message.data();
        if (!data.conversationId) return;

        const currentConversation = conversationsById.get(data.conversationId);
        const currentTime = currentConversation?.updatedAt?.toDate?.()?.getTime() || 0;
        const messageTime = data.createdAt?.toDate?.()?.getTime() || 0;
        if (!currentConversation || messageTime >= currentTime) {
    // ...existing code...
conversationsById.set(data.conversationId, {
  id: data.conversationId,
  lastMessage: data.text || (data.attachment ? `📎 ${data.attachment.name}` : ""),
  updatedAt: data.createdAt,
});

        }
      });
      const conversations = [...conversationsById.values()];
      conversations.sort((first, second) => {
        const firstTime = first.updatedAt?.toDate?.()?.getTime() || 0;
        const secondTime = second.updatedAt?.toDate?.()?.getTime() || 0;
        return secondTime - firstTime;
      });
      onConversations(conversations);
    },
    onError
  );
}

export function subscribeDirectMessages(uid, conversationId, onMessages, onError) {
  const messagesQuery = query(
    collection(db, "messages"),
    where("conversationId", "==", conversationId),
    where("participants", "array-contains", uid)
  );
  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages = snapshot.docs.map((message) => ({
        id: message.id,
        ...message.data(),
      }));
      messages.sort((first, second) => {
        const firstTime = first.createdAt?.toDate?.()?.getTime() || 0;
        const secondTime = second.createdAt?.toDate?.()?.getTime() || 0;
        return firstTime - secondTime;
      });
      onMessages(messages);
    },
    onError
  );
}

function timestampMillis(timestamp) {
  return timestamp?.toMillis?.() || timestamp?.toDate?.()?.getTime() || 0;
}

/**
 * Subscribes to unread incoming message counts, keyed by conversation id.
 * A message is unread until its conversation has been opened after it arrived.
 */
export function subscribeUnreadByConversation(uid, onCounts, onError) {
  const unreadQuery = query(
    collection(db, "messages"),
    where("recipientId", "==", uid)
  );
  let messages = [];
  let allReadAt = 0;
  let conversationReadAt = {};
  const emitCounts = () => {
    const counts = {};
    messages.forEach((message) => {
      const data = message.data();
      if (data.readAt) return;
      const readAt = Math.max(allReadAt, timestampMillis(conversationReadAt[data.conversationId]));
      if (timestampMillis(data.createdAt) > readAt) {
        counts[data.conversationId] = (counts[data.conversationId] || 0) + 1;
      }
    });
    onCounts(counts);
  };

  const stopMessages = onSnapshot(
    unreadQuery,
    (snapshot) => {
      messages = snapshot.docs;
      emitCounts();
    },
    onError
  );
  const stopReadState = onSnapshot(
    doc(db, "users", uid),
    (snapshot) => {
      const data = snapshot.data();
      allReadAt = timestampMillis(data?.messagesReadAt);
      conversationReadAt = data?.conversationReadAt || {};
      emitCounts();
    },
    onError
  );

  return () => {
    stopMessages();
    stopReadState();
  };
}

export function subscribeUnreadMessageCount(uid, onCount, onError) {
  return subscribeUnreadByConversation(
    uid,
    (counts) => onCount(Object.values(counts).reduce((sum, count) => sum + count, 0)),
    onError
  );
}

export async function markConversationRead(uid, conversationId) {
  if (!uid || !conversationId) return;
  await setDoc(
    doc(db, "users", uid),
    { conversationReadAt: { [conversationId]: serverTimestamp() } },
    { merge: true }
  );
}

// ...existing code...
export async function sendDirectMessage({
  conversationId,
  sender,
  recipient,
  text,
  attachment = null,
}) {
  const trimmedText = (text || "").trim();
  if (!trimmedText && !attachment) {
    throw new Error("Message cannot be empty.");
  }
  if (sender.id === recipient.id) throw new Error("You cannot message yourself.");
  if (sender.role === "customer" && recipient.role === "customer") {
    throw new Error("Customers can only message staff or administrators.");
  }

  await addDoc(collection(db, "messages"), {
    conversationId,
    participants: [sender.id, recipient.id].sort(),
    senderId: sender.id,
    senderName: sender.name,
    senderRole: sender.role,
    recipientId: recipient.id,
    recipientName: recipient.name,
    recipientRole: recipient.role,
    text: trimmedText,
    attachment,
    readAt: null,
    createdAt: serverTimestamp(),
  });
}

export function sendOrderRevisionMessage({ order, sender, note }) {
  const trimmedNote = (note || "").trim();
  if (!sender?.id) throw new Error("Staff account is unavailable.");
  if (!order?.customerId) throw new Error("Customer account is unavailable.");
  if (!trimmedNote) throw new Error("Revision note cannot be empty.");

  const lines = order.items?.length
    ? order.items
    : order.serviceName
    ? [order]
    : [];
  const orderLines = lines.length
    ? lines.map((line) => {
        const service = line.serviceName || "Service";
        const variety = `${line.varietyName ? ` (${line.varietyName})` : ""}${lineOptionsSuffix(line)}`;
        const quantity = line.quantity || 1;
        const lineTotal = line.lineTotal != null
          ? ` - ₱${Number(line.lineTotal).toFixed(2)}`
          : "";
        return `- ${service}${variety} x${quantity}${lineTotal}`;
      })
    : ["- Order items unavailable"];
  const messageLines = [
    `Order${order.referenceId ? ` ${order.referenceId}` : ""} needs revision`,
    "",
    "Order details:",
    ...orderLines,
  ];

  if (order.description) messageLines.push(`Specifications: ${order.description}`);
  if (order.files?.length) {
    const fileNames = order.files.map((file) => file.name).filter(Boolean);
    if (fileNames.length) messageLines.push(`Files: ${fileNames.join(", ")}`);
  }
  if (order.totalPrice != null) {
    messageLines.push(`Total: ₱${Number(order.totalPrice).toFixed(2)}`);
  }
  messageLines.push("", `Problem reported: ${trimmedNote}`);

  return sendDirectMessage({
    conversationId: getConversationId(sender.id, order.customerId),
    sender,
    recipient: {
      id: order.customerId,
      name: order.customerEmail || "Customer",
      role: "customer",
    },
    text: messageLines.join("\n"),
  });
}