// Admins may type "per page" or "page"; always display "per page".
export function formatPerUnit(unit) {
  return `per ${String(unit).trim().replace(/^per\s+/i, "")}`;
}

// Per-unit choices for a service; older services stored a single `unit` string.
export function getServiceUnits(service) {
  if (service.units?.length > 0) return service.units;
  return service.unit ? [service.unit] : [];
}

// Returns e.g. " [Paper Size: A4, per page]" for an order line, or "" if none.
export function lineOptionsSuffix(line) {
  const parts = (line.options || []).map((option) => `${option.name}: ${option.type}`);
  if (line.unit) parts.push(formatPerUnit(line.unit));
  return parts.length ? ` [${parts.join(", ")}]` : "";
}
