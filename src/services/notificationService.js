import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase-config";

function timestampMillis(value) {
  return value?.toMillis?.() ?? value?.toDate?.()?.getTime() ?? 0;
}

export function subscribeNotifications(uid, onNotifications, onError) {
  if (!uid) return () => {};
  const notificationsQuery = query(
    collection(db, "notifications"),
    where("recipientId", "==", uid)
  );
  return onSnapshot(
    notificationsQuery,
    (snapshot) => {
      const notifications = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((first, second) => {
          return timestampMillis(second.createdAt) - timestampMillis(first.createdAt);
        });
      onNotifications(notifications);
    },
    onError
  );
}

export function subscribeUnreadNotificationCount(uid, onCount, onError) {
  return subscribeNotifications(
    uid,
    (notifications) => onCount(notifications.filter((item) => item.read !== true).length),
    onError
  );
}

export async function markNotificationRead(uid, notificationId) {
  if (!uid || !notificationId) return;
  await updateDoc(doc(db, "notifications", notificationId), {
    read: true,
    readAt: serverTimestamp(),
  });
}

export async function markNotificationUnread(uid, notificationId) {
  if (!uid || !notificationId) return;
  await updateDoc(doc(db, "notifications", notificationId), {
    read: false,
    readAt: null,
  });
}

export async function deleteNotification(uid, notificationId) {
  if (!uid || !notificationId) return;
  await deleteDoc(doc(db, "notifications", notificationId));
}

export async function createNotification({
  recipientId,
  senderId = "",
  senderName = "",
  title,
  message,
  type = "general",
  orderId = "",
  paymentId = "",
}) {
  if (!recipientId || !title || !message) return;

  const batch = writeBatch(db);
  batch.set(doc(collection(db, "notifications")), {
    recipientId,
    senderId,
    senderName,
    title,
    message,
    type,
    orderId,
    paymentId,
    read: false,
    readAt: null,
    createdAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function notifyUserRole({
  role,
  senderId = "",
  senderName = "",
  title,
  message,
  type = "general",
  orderId = "",
  paymentId = "",
}) {
  if (!role || !title || !message) return;
  const users = await getDocs(query(collection(db, "users"), where("role", "==", role)));
  const batch = writeBatch(db);
  users.docs.forEach((userDoc) => {
    if (userDoc.id === senderId) return;
    batch.set(doc(collection(db, "notifications")), {
      recipientId: userDoc.id,
      senderId,
      senderName,
      title,
      message,
      type,
      orderId,
      paymentId,
      read: false,
      readAt: null,
      createdAt: serverTimestamp(),
    });
  });
  if (users.docs.length === 0) return;
  await batch.commit();
}
