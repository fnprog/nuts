import { useSuspenseQuery } from "@tanstack/react-query";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, Dot } from "recharts";
import { getAllAccountsBalanceTimeline } from "../services/account.queries";

const DUMMY_DATA = [
  { balance: 35000, month: "2024-01-01" },
  { balance: 38500, month: "2024-02-01" },
  { balance: 42000, month: "2024-03-01" },
  { balance: 45500, month: "2024-04-01" },
  { balance: 49000, month: "2024-05-01" },
  { balance: 52350, month: "2024-06-01" },
];

export function AccountBalanceChart({ hasAccounts }: { hasAccounts?: boolean }) {
  const { data: realData, isError } = useSuspenseQuery({
    ...getAllAccountsBalanceTimeline(),
    enabled: hasAccounts === true,
  });

  const data = hasAccounts ? realData : DUMMY_DATA;

  if (hasAccounts && isError) {
    return <div className="flex h-[180px] items-center justify-center">Failed to load...</div>;
  }

  if (hasAccounts && (!data || data.length === 0)) {
    return (
      <div className="flex h-[180px] items-center justify-center text-center">
        <p className="text-sm text-muted-foreground">
          No transactions yet. Start adding transactions to see them reflect here.
        </p>
      </div>
    );
  }

  const formattedData = data.map(({ balance, month }) => ({
    date: new Date(month).toLocaleString("en-US", { month: "short" }),
    balance,
  }));

  // 1. Calculate the offset for the gradient
  const balances = formattedData.map((item) => item.balance);
  const max = Math.max(...balances);
  const min = Math.min(...balances);
  const gradientOffset = () => {
    if (max < 0) {
      // If all values are negative, the whole chart should be red
      return 0;
    }
    if (min >= 0) {
      // If all values are positive, the whole chart should be blue
      return 1;
    }
    // Calculate the point where the data crosses the zero line
    return max / (max - min);
  };

  const off = gradientOffset();
  const positiveColor = "var(--primary)";
  const negativeColor = "var(--destructive)";

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={formattedData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
        {/* 2. Define the gradient */}
        <defs>
          <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
            <stop offset={off} stopColor={positiveColor} stopOpacity={1} />
            <stop offset={off} stopColor={negativeColor} stopOpacity={1} />
          </linearGradient>
          <linearGradient id="splitColorOpacity" x1="0" y1="0" x2="0" y2="1">
            <stop offset={off} stopColor={positiveColor} stopOpacity={0.2} />
            <stop offset={off} stopColor={negativeColor} stopOpacity={0.2} />
          </linearGradient>
        </defs>
        <XAxis padding="no-gap" dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} tickMargin={10} />
        <YAxis
          hide={true}
          tickFormatter={(value) => `$${value / 1000}k`}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
          tickMargin={10}
          domain={[min, max]} // It's good practice to set the domain
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length && typeof payload[0].value === "number") {
              const balance = payload[0].value;
              const balanceColor = balance >= 0 ? "text-primary" : "text-destructive"; // Using semantic colors is good practice

              return (
                <div className="bg-background rounded-lg border p-2 shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-[0.70rem] uppercase">Date</span>
                      <span className="text-sm font-bold">{payload[0].payload.date}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-[0.70rem] uppercase">Balance</span>
                      {/* 5. Conditional coloring in the tooltip */}
                      <span className={`text-sm font-bold ${balanceColor}`}>{balance.toLocaleString("en-US", { style: "currency", currency: "USD" })}</span>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Area
          type="monotone"
          dataKey="balance"
          // 3. Apply the gradient to stroke and fill
          stroke="url(#splitColor)"
          fill="url(#splitColor)"
          fillOpacity={0.2}
          strokeWidth={2}
          // 4. Make the active dot color conditional
          activeDot={(props) => {
            const { cx, cy, payload } = props;
            if (typeof payload.balance !== "number") {
              return <></>;
            }
            return (
              <Dot
                cx={cx}
                cy={cy}
                r={6}
                fill={payload.balance >= 0 ? positiveColor : negativeColor}
                stroke={payload.balance >= 0 ? positiveColor : negativeColor}
              />
            );
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
