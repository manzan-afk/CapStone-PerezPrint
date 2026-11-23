import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./SalesOrderChart.css";

const RANGES = [
  { key: "7d", label: "Last 7 Days" },
  { key: "30d", label: "Last 30 Days" },
  { key: "month", label: "This Month" },
  { key: "all", label: "All Time" },
];

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getOrderDate(order) {
  const createdAt = order?.createdAt;
  if (!createdAt) return null;
  if (typeof createdAt.toDate === "function") return createdAt.toDate();
  if (createdAt instanceof Date) return createdAt;
  if (typeof createdAt.seconds === "number") return new Date(createdAt.seconds * 1000);
  return null;
}

function formatPeso(value) {
  return `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPesoShort(value) {
  const amount = Number(value) || 0;
  if (amount >= 1e6) return `₱${(amount / 1e6).toFixed(1)}M`;
  if (amount >= 1e3) return `₱${(amount / 1e3).toFixed(amount % 1e3 === 0 ? 0 : 1)}k`;
  return `₱${amount}`;
}

function formatShortDate(date, withYear) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "2-digit" } : {}),
  });
}

function formatLongDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// Groups orders per day for the selected range. Cancelled orders count as orders but add no revenue.
function buildSeries(orders, range) {
  const today = startOfDay(new Date());
  const dated = [];
  for (const order of orders) {
    const date = getOrderDate(order);
    if (!date || Number.isNaN(date.getTime())) continue;
    dated.push({ order, day: startOfDay(date) });
  }

  let start;
  if (range === "7d") start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
  else if (range === "30d") start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29);
  else if (range === "month") start = new Date(today.getFullYear(), today.getMonth(), 1);
  else {
    if (dated.length === 0) return { points: [], totalOrders: 0, totalRevenue: 0 };
    start = dated.reduce((earliest, item) => (item.day < earliest ? item.day : earliest), dated[0].day);
  }

  const buckets = new Map();
  let totalOrders = 0;
  let totalRevenue = 0;
  for (const { order, day } of dated) {
    if (day < start || day > today) continue;
    const key = dayKey(day);
    const bucket = buckets.get(key) || { revenue: 0, orders: 0 };
    const revenue = order.status === "cancelled" ? 0 : Number(order.totalPrice) || 0;
    bucket.orders += 1;
    bucket.revenue += revenue;
    buckets.set(key, bucket);
    totalOrders += 1;
    totalRevenue += revenue;
  }

  if (totalOrders === 0) return { points: [], totalOrders: 0, totalRevenue: 0 };

  const withYear = start.getFullYear() !== today.getFullYear();
  const points = [];
  for (const cursor = new Date(start); cursor <= today; cursor.setDate(cursor.getDate() + 1)) {
    const key = dayKey(cursor);
    const bucket = buckets.get(key);
    points.push({
      dateKey: key,
      label: formatShortDate(cursor, withYear),
      fullDate: formatLongDate(cursor),
      revenue: bucket ? Number(bucket.revenue.toFixed(2)) : 0,
      orders: bucket ? bucket.orders : 0,
    });
  }

  return { points, totalOrders, totalRevenue: Number(totalRevenue.toFixed(2)) };
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="soc-tooltip" role="status">
      <div className="soc-tooltip__date">{point.fullDate}</div>
      <div className="soc-tooltip__row">
        <span className="soc-tooltip__label">
          <span className="soc-swatch soc-swatch--revenue" aria-hidden="true" />
          Revenue
        </span>
        <strong className="soc-tooltip__val">{formatPeso(point.revenue)}</strong>
      </div>
      <div className="soc-tooltip__row">
        <span className="soc-tooltip__label">
          <span className="soc-swatch soc-swatch--orders" aria-hidden="true" />
          Orders
        </span>
        <strong className="soc-tooltip__val">
          {point.orders} {point.orders === 1 ? "order" : "orders"}
        </strong>
      </div>
    </div>
  );
}

export default function SalesOrderChart({ orders = [], loading = false, error = "" }) {
  const [range, setRange] = useState("7d");
  const { points, totalOrders, totalRevenue } = useMemo(
    () => buildSeries(orders, range),
    [orders, range],
  );

  return (
    <section className="soc-card" aria-label="Sales revenue and order activity">
      <div className="soc-header">
        <div className="soc-header__info">
          <span className="soc-eyebrow">Analytics</span>
          <h3 className="soc-title">Sales Revenue &amp; Order Activity</h3>
          {!loading && !error && totalOrders > 0 && (
            <p className="soc-summary">
              <span>Period revenue: <strong>{formatPeso(totalRevenue)}</strong></span>
              <span className="soc-summary__sep" aria-hidden="true">·</span>
              <span>Period orders: <strong>{totalOrders}</strong></span>
            </p>
          )}
        </div>

        <div className="soc-header__controls">
          <div className="soc-legend" aria-label="Chart legend">
            <span className="soc-legend__item">
              <span className="soc-swatch soc-swatch--revenue" aria-hidden="true" />
              Revenue (₱)
            </span>
            <span className="soc-legend__item">
              <span className="soc-swatch soc-swatch--orders" aria-hidden="true" />
              Orders
            </span>
          </div>
          <div className="soc-range-group" role="group" aria-label="Date range filter">
            {RANGES.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`soc-range-btn${range === item.key ? " soc-range-btn--active" : ""}`}
                onClick={() => setRange(item.key)}
                aria-pressed={range === item.key}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="soc-body">
        {loading ? (
          <div className="soc-state" role="status">
            <span className="soc-spinner" aria-hidden="true" />
            <span>Loading sales &amp; order data...</span>
          </div>
        ) : error ? (
          <div className="soc-state soc-state--error" role="alert">
            <p>{error}</p>
          </div>
        ) : points.length === 0 ? (
          <div className="soc-state">
            <p>No sales data available for this period.</p>
          </div>
        ) : (
          <div className="soc-chart-wrap">
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={points} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9edf3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#6b7488", fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e5ea" }}
                  minTickGap={20}
                />
                <YAxis
                  yAxisId="revenue"
                  orientation="left"
                  tickFormatter={formatPesoShort}
                  tick={{ fill: "#6b7488", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={64}
                />
                <YAxis
                  yAxisId="orders"
                  orientation="right"
                  allowDecimals={false}
                  tick={{ fill: "#6b7488", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(27, 36, 54, 0.04)" }} />
                <Bar
                  yAxisId="orders"
                  dataKey="orders"
                  name="Orders"
                  fill="#3b82f6"
                  fillOpacity={0.82}
                  radius={[5, 5, 0, 0]}
                  maxBarSize={32}
                />
                <Line
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#ff8a1e"
                  strokeWidth={2.75}
                  dot={{ r: 3.5, fill: "#ff8a1e", stroke: "#ffffff", strokeWidth: 1.5 }}
                  activeDot={{ r: 5.5, fill: "#ff8a1e", stroke: "#ffffff", strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}
