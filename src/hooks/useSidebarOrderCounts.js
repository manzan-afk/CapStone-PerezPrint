import { useEffect, useState } from "react";
import { subscribeAllOrders, subscribeUserOrders } from "../services/ordersService";
import { markOrderNotificationsViewed, subscribeUserProfile } from "../services/userServices";

function timestampMillis(value) {
  return value?.toMillis?.() ?? value?.toDate?.()?.getTime() ?? 0;
}

export default function useSidebarOrderCounts(uid, role) {
  const [subscriptionState, setSubscriptionState] = useState({
    key: null,
    orders: [],
    notificationsViewedAt: null,
  });
  const subscriptionKey = `${uid || ""}:${role || ""}`;

  useEffect(() => {
    if (!uid) return undefined;

    const handleError = (error) => {
      console.error("Failed to load sidebar order counts:", error);
    };
    const updateState = (updates) => {
      setSubscriptionState((current) => ({
        key: subscriptionKey,
        orders: current.key === subscriptionKey ? current.orders : [],
        notificationsViewedAt: current.key === subscriptionKey
          ? current.notificationsViewedAt
          : null,
        ...updates,
      }));
    };
    const stopOrders = role === "customer"
      ? subscribeUserOrders(uid, (orders) => updateState({ orders }), handleError)
      : subscribeAllOrders((orders) => updateState({ orders }), handleError);
    let stopProfile = () => {};

    if (role === "customer") {
      let initializedReadMarker = false;
      stopProfile = subscribeUserProfile(
        uid,
        (profile) => {
          if (profile?.orderNotificationsViewedAt) {
            updateState({ notificationsViewedAt: profile.orderNotificationsViewedAt });
          } else if (!initializedReadMarker) {
            initializedReadMarker = true;
            markOrderNotificationsViewed(uid).catch(handleError);
          }
        },
        handleError
      );
    }

    return () => {
      stopOrders();
      stopProfile();
    };
  }, [uid, role, subscriptionKey]);

  const currentState = subscriptionState.key === subscriptionKey
    ? subscriptionState
    : { orders: [], notificationsViewedAt: null };
  const { orders, notificationsViewedAt } = currentState;
  const readyPickups = orders.filter((order) => order.status === "ready").length;
  const activeOrders = orders.filter((order) => order.status !== "completed").length;
  const ordersNeedingAction = orders.filter((order) => (order.status || "placed") === "placed").length;
  const unreadOrderNotifications = notificationsViewedAt
    ? orders.filter((order) => {
        const updatedAt = timestampMillis(order.statusUpdatedAt || order.createdAt);
        return updatedAt > timestampMillis(notificationsViewedAt);
      }).length
    : 0;

  return { activeOrders, readyPickups, ordersNeedingAction, unreadOrderNotifications };
}