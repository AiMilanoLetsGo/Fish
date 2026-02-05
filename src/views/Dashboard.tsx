import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { db } from "../db";

export default function Dashboard() {
  const inventory = useLiveQuery(() => db.inventory.toArray(), []);
  const transactions = useLiveQuery(() => db.transactions.toArray(), []);

  const expensesByCategory = useMemo(() => {
    const totals: Record<string, number> = {};
    inventory?.forEach((item) => {
      totals[item.category] = (totals[item.category] ?? 0) + item.currentStock * item.lastPrice;
    });
    return Object.entries(totals).map(([category, total]) => ({
      category,
      total: Number(total.toFixed(2)),
    }));
  }, [inventory]);

  const beefHistory = useMemo(() => {
    const beefTransactions = (transactions ?? [])
      .filter((txn) => txn.items.some((item) => item.itemId === "inv-1"))
      .map((txn) => ({
        date: txn.date,
        price: txn.items.find((item) => item.itemId === "inv-1")?.price ?? 0,
      }));

    if (beefTransactions.length === 0 && inventory?.length) {
      return [
        {
          date: format(new Date(), "MMM d"),
          price: inventory.find((item) => item.id === "inv-1")?.lastPrice ?? 0,
        },
      ];
    }

    return beefTransactions.map((entry) => ({
      date: format(new Date(entry.date), "MMM d"),
      price: entry.price,
    }));
  }, [transactions, inventory]);

  const totalInventoryValue = useMemo(() => {
    return inventory?.reduce((sum, item) => sum + item.currentStock * item.lastPrice, 0) ?? 0;
  }, [inventory]);

  const monthlyWaste = useMemo(() => {
    return (
      transactions
        ?.filter((txn) => txn.type === "WASTE")
        .reduce((sum, txn) => sum + txn.items.reduce((s, item) => s + item.price, 0), 0) ?? 0
    );
  }, [transactions]);

  const inflationAlerts = useMemo(() => {
    if (!inventory) {
      return 0;
    }
    return inventory.filter((item) => item.lastPrice > 12).length;
  }, [inventory]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Total Inventory Value", value: `$${totalInventoryValue.toFixed(2)}` },
          { label: "Monthly Waste Cost", value: `$${monthlyWaste.toFixed(2)}` },
          { label: "Inflation Alerts", value: inflationAlerts.toString() },
        ].map((card) => (
          <div key={card.label} className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Expenses by Category</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expensesByCategory}>
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Beef Price History</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={beefHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="price" stroke="#f97316" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
