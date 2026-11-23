import { useEffect, useState } from "react";
import { subscribeUnreadNotificationCount } from "../services/notificationService";
import SidebarCountBadge from "./SidebarCountBadge";

export default function NotificationBadge({ uid }) {
  const [countState, setCountState] = useState({ uid: null, count: 0 });

  useEffect(() => {
    if (!uid) return undefined;
    return subscribeUnreadNotificationCount(
      uid,
      (count) => setCountState({ uid, count }),
      (error) => console.error("Failed to load unread notification count:", error)
    );
  }, [uid]);

  const count = countState.uid === uid ? countState.count : 0;
  return <SidebarCountBadge count={count} label={`unread notification${count === 1 ? "" : "s"}`} />;
}
