"use client";

import { useEffect, useState, useMemo } from "react";
import { useFinance } from "@/store/useFinance";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import dayjs from "dayjs";

const COLORS = [
  "#ec4899", // pink-500
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#06b6d4", // cyan-500
  "#14b8a6", // teal-500
  "#84cc16", // lime-500
  "#6366f1", // indigo-500
  "#f43f5e", // rose-500
  "#64748b", // slate-500
];

export default function StatsPage() {
  const { expenses, fetch } = useFinance();
  const [mounted, setMounted] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() =>
    dayjs().format("YYYY-MM"),
  );

  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    fetch();
  }, [fetch]);

  // Lọc chi tiêu "chung" trong tháng được chọn
  const sharedExpenses = useMemo(() => {
    return expenses.filter(
      (e) =>
        e.source === "shared_fund" && // chi tiêu chung
        (e.month === selectedMonth ||
          (!e.month &&
            dayjs(e.created_at).format("YYYY-MM") === selectedMonth)),
    );
  }, [expenses, selectedMonth]);

  // Data cho Pie Chart: Tổng chi tiêu theo Category
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    sharedExpenses.forEach((e) => {
      const cat = e.category || "Khác";
      map.set(cat, (map.get(cat) || 0) + Number(e.amount));
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [sharedExpenses]);

  // Data cho Line Chart: Biến động chi tiêu theo ngày theo từng danh mục
  const { dailyData, allCategories } = useMemo(() => {
    const map = new Map<string, Record<string, number>>();
    const categoriesSet = new Set<string>();

    sharedExpenses.forEach((e) => {
      const date = dayjs(e.created_at).format("DD/MM");
      const cat = e.category || "Khác";
      categoriesSet.add(cat);

      if (!map.has(date)) {
        map.set(date, {});
      }

      const dateObj = map.get(date)!;
      dateObj[cat] = (dateObj[cat] || 0) + Number(e.amount);
    });

    const sortedDates = Array.from(map.keys()).sort((a, b) => {
      const [d1] = a.split("/");
      const [d2] = b.split("/");
      return Number(d1) - Number(d2);
    });

    const dailyData = sortedDates.map((date) => ({
      date,
      ...map.get(date),
    }));

    return { dailyData, allCategories: Array.from(categoriesSet) };
  }, [sharedExpenses]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toggleCategory = (e: any) => {
    const dataKey = String(e.dataKey);
    if (!dataKey || dataKey === "undefined") return;
    setHiddenCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dataKey)) {
        newSet.delete(dataKey);
      } else {
        newSet.add(dataKey);
      }
      return newSet;
    });
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-4 pb-10">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-2xl shadow-sm border border-pink-50">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-600 active:scale-95 transition-all font-bold"
          >
            ◀
          </Link>
          <h1 className="text-xl font-extrabold bg-linear-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent drop-shadow-sm">
            Thống kê chi tiêu
          </h1>
        </div>
      </div>

      {/* MONTH SELECTOR */}
      <div className="flex items-center justify-between mb-4 bg-white/60 p-2 rounded-2xl shadow-sm border border-gray-100">
        <button
          onClick={() =>
            setSelectedMonth(
              dayjs(selectedMonth).subtract(1, "month").format("YYYY-MM"),
            )
          }
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-gray-500 hover:text-pink-500 shadow-sm active:scale-95 transition-all text-lg"
        >
          ◀
        </button>
        <span className="font-bold text-gray-700 tracking-wide text-[15px]">
          Tháng {dayjs(selectedMonth).format("MM/YYYY")}
        </span>
        <button
          onClick={() =>
            setSelectedMonth(
              dayjs(selectedMonth).add(1, "month").format("YYYY-MM"),
            )
          }
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-gray-500 hover:text-pink-500 shadow-sm active:scale-95 transition-all text-lg"
        >
          ▶
        </button>
      </div>

      {/* TỔNG QUAN */}
      <div className="mb-4 bg-white p-6 rounded-3xl shadow-sm border border-pink-50 text-center">
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
          Tổng chi tiêu chung tháng
        </p>
        <p className="text-3xl font-extrabold bg-linear-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent drop-shadow-sm">
          {sharedExpenses
            .reduce((sum, e) => sum + Number(e.amount), 0)
            .toLocaleString()}
          đ
        </p>
      </div>

      <div className="mb-4 bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-sm font-bold text-gray-600 mb-4 pl-1">
          Cơ cấu danh mục
        </h2>
        {categoryData.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-4">
            Chưa có dữ liệu
          </p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  label={({
                    name,
                    percent,
                  }: {
                    name?: string;
                    percent?: number;
                  }) =>
                    `${name || "Khác"} ${((percent || 0) * 100).toFixed(0)}%`
                  }
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) =>
                    Number(value || 0).toLocaleString() + "đ"
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-10">
        <h2 className="text-sm font-bold text-gray-600 mb-4 pl-1">
          Biến động chi tiêu theo ngày
        </h2>
        {dailyData.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-4">
            Chưa có dữ liệu
          </p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dailyData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f3f4f6"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(val: number) => `${val / 1000}k`}
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) =>
                    Number(value || 0).toLocaleString() + "đ"
                  }
                />
                <Legend
                  onClick={toggleCategory}
                  wrapperStyle={{
                    cursor: "pointer",
                    fontSize: 12,
                    paddingTop: 10,
                  }}
                />
                {allCategories.map((cat, index) => (
                  <Line
                    key={cat}
                    type="monotone"
                    dataKey={cat}
                    name={cat}
                    hide={hiddenCategories.has(cat)}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={{
                      r: 3,
                      fill: COLORS[index % COLORS.length],
                      strokeWidth: 2,
                      stroke: "#fff",
                    }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
