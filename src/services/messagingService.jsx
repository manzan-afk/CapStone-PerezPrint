import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
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
    collection(db, "messageProfiles"),
    (snapshot) => {
      onProfiles(snapshot.docs.map((profile) => ({ id: profile.id, ...profile.data() })));
    },
    onError
  );
}

export function subscribeConversations(uid, onConversations, onError) {
  const conversationsQuery = query(
    collection(db, "conversations"),
    where("participants", "array-contains", uid)
  );
  return onSnapshot(
    conversationsQuery,
    (snapshot) => {
      const conversations = snapshot.docs.map((conversation) => ({
        id: conversation.id,
        ...conversation.data(),
      }));
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

export function subscribeDirectMessages(conversationId, onMessages, onError) {
  const messagesQuery = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      onMessages(snapshot.docs.map((message) => ({
        id: message.id,
        ...message.data(),
      })));
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

  const conversationRef = doc(db, "conversations", conversationId);
  const messageRef = doc(collection(conversationRef, "messages"));
  const batch = writeBatch(db);

  batch.set(conversationRef, {
    participants: [sender.id, recipient.id].sort(),
    participantNames: {
      [sender.id]: sender.name,
      [recipient.id]: recipient.name,
    },
    participantRoles: {
      [sender.id]: sender.role,
      [recipient.id]: recipient.role,
    },
    lastMessage: trimmedText,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  batch.set(messageRef, {
    senderId: sender.id,
    senderName: sender.name,
    text: trimmedText,
    createdAt: serverTimestamp(),
  });

  await batch.commit();
}