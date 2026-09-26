import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "../firebase-config";

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
          conversationsById.set(data.conversationId, {
            id: data.conversationId,
            lastMessage: data.text || "",
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

export async function sendDirectMessage({
  conversationId,
  sender,
  recipient,
  text,
}) {
  const trimmedText = text.trim();
  if (!trimmedText) throw new Error("Message cannot be empty.");
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
    createdAt: serverTimestamp(),
  });
}