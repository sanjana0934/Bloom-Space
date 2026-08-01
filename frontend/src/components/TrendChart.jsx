import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

export default function TrendChart({ data }) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={formatted} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--ink-faint)" }} />
        <YAxis domain={[0, 30]} tick={{ fontSize: 11, fill: "var(--ink-faint)" }} />
        <ReferenceLine y={13} stroke="var(--rose)" strokeDasharray="4 4" label={{ value: "high", fontSize: 10, fill: "var(--rose)" }} />
        <ReferenceLine y={10} stroke="var(--amber)" strokeDasharray="4 4" label={{ value: "moderate", fontSize: 10, fill: "var(--amber)" }} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }}
          labelFormatter={(l) => `Score: ${l}`}
        />
        <Line type="monotone" dataKey="score" stroke="var(--teal)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--teal)" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
