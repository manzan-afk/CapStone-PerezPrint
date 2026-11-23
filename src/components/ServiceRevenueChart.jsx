import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./SalesOrderChart.css";

export default function ServiceRevenueChart({ rows }) {
  const data = rows.map((row) => ({
    name: row.name,
    revenue: Number(row.revenue.toFixed(2)),
    orders: row.orderCount,
  }));

  return (
    <div className="report-service-chart" aria-label="Revenue by service chart">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 10, right: 16, left: 4, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7ebf2" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: "#5b6478" }}
            axisLine={{ stroke: "#e2e6ef" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#5b6478" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `₱${value}`}
          />
          <Tooltip
            cursor={{ fill: "rgba(255, 138, 30, 0.08)" }}
            formatter={(value, name) =>
              name === "revenue"
                ? [
                    `₱${Number(value).toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`,
                    "Revenue",
                  ]
                : [value, "Orders"]
            }
            contentStyle={{
              borderRadius: "10px",
              border: "1px solid #e2e6ef",
              boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
              fontSize: "12.5px",
            }}
          />
          <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={54}>
            {rows.map((row, index) => (
              <Cell key={row.id} fill={index % 2 === 0 ? "#ff8a1e" : "#1b2436"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
