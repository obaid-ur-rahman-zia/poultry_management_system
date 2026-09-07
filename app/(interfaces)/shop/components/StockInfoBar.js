"use client";

export const todayStr = () =>
  new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];

export const fmtNum = (n) =>
  typeof n === "number" ? n.toFixed(2) : Number(n || 0).toFixed(2);

export const fmtDate = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function StockInfoBar({ stock, loading }) {
  return (
    <div className="flex flex-wrap gap-4 bg-muted/30 rounded-lg px-4 py-2 border border-muted/50">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          Prev Stock
        </span>
        <span className="font-semibold text-sm">
          {loading ? "..." : fmtNum(stock.previous_stock)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          Purchase Stock
        </span>
        <span className="font-semibold text-sm">
          {loading ? "..." : fmtNum(stock.today_purchase)}
        </span>
      </div>
      <span className="text-muted-foreground">|</span>

      <span className="text-muted-foreground">|</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          Total Stock
        </span>
        <span className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">
          {loading ? "..." : fmtNum(stock.total_stock)}
        </span>
      </div>
    </div>
  );
}
