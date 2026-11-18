export function getSavedStatus(order) {
  return order.savedStatus || order.status || "placed";
}

export function matchesStatusTab(order, tab) {
  return tab === "all" || getSavedStatus(order) === tab;
}
