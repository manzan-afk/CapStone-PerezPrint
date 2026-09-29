import { useEffect, useState } from "react";
import { subscribeUnreadMessageCount } from "../services/messagingService";
import SidebarCountBadge from "./SidebarCountBadge";

export default function UnreadMessageBadge({ uid }) {
  const [unreadState, setUnreadState] = useState({ uid: null, count: 0 });

  useEffect(() => {
    if (!uid) return undefined;

    return subscribeUnreadMessageCount(
      uid,
      (count) => setUnreadState({ uid, count }),
      (error) => console.error("Failed to load unread message count:", error)
    );
  }, [uid]);

  const unreadCount = unreadState.uid === uid ? unreadState.count : 0;

  return (
    <SidebarCountBadge
      count={unreadCount}
      label={`unread message${unreadCount === 1 ? "" : "s"}`}
    />
  );
}