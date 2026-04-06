"use client";

import { useEffect, useState } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import dayjs from "dayjs";
import { calculateDebt, calculateSharedBalance } from "@/utils/calc";
import { useFinance } from "@/store/useFinance";

export default function Page() {
  const { expenses, contributions, fetch, addExpense, addContribution } =
    useFinance();

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState<"A" | "B">("A");
  const [source, setSource] = useState<"personal" | "shared_fund">("personal");
  const [mode, setMode] = useState<"expense" | "contribution">("expense");

  useRealtime();

  useEffect(() => {
    fetch();
  }, []);

  // 💰 CALCULATE
  const { A_owes_B, B_owes_A } = calculateDebt(expenses);
  const sharedBalance = calculateSharedBalance(contributions, expenses);

  // ➕ SUBMIT
  const handleSubmit = async () => {
    if (!amount) return;

    if (mode === "expense") {
      await addExpense({
        amount: Number(amount),
        paid_by: paidBy,
        source,
        month: dayjs().format("YYYY-MM"),
      });
    } else {
      await addContribution({
        amount: Number(amount),
        paid_by: paidBy,
        month: dayjs().format("YYYY-MM"),
      });
    }

    setOpen(false);
    setAmount("");
  };

  const history = [
    ...expenses.map((e) => ({
      id: e.id,
      type: "expense",
      amount: e.amount,
      paid_by: e.paid_by,
      source: e.source,
      created_at: e.created_at,
    })),

    ...contributions.map((c) => ({
      id: c.id,
      type: "contribution",
      amount: c.amount,
      paid_by: c.paid_by,
      source: undefined,
      created_at: c.created_at,
    })),
  ].sort(
    (a, b) =>
      new Date(b.created_at || "").getTime() -
      new Date(a.created_at || "").getTime(),
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-4 pb-20">
      {/* HEADER */}
      <h1 className="text-lg font-bold text-center mb-4">💰 CoupleFund</h1>

      {/* 💰 SHARED */}
      <div className="bg-black text-white rounded-2xl p-4 mb-3">
        <p className="text-sm opacity-70">Tiền chung</p>
        <p className="text-2xl font-bold mt-1">
          {sharedBalance.toLocaleString()}đ
        </p>
      </div>

      {/* 👤 A + B */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-2xl p-4 shadow">
          <p className="text-sm text-gray-500">A</p>
          <p className="text-xl font-bold text-blue-600 mt-1">
            -{A_owes_B.toLocaleString()}đ
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow">
          <p className="text-sm text-gray-500">B</p>
          <p className="text-xl font-bold text-pink-600 mt-1">
            -{B_owes_A.toLocaleString()}đ
          </p>
        </div>
      </div>

      {/* 📜 HISTORY */}
      <div className="space-y-2">
        {history.map((item) => (
          <div
            key={item.id}
            className="bg-white p-3 rounded-xl shadow flex justify-between"
          >
            <div>
              {/* Title */}
              <p className="text-sm font-medium">
                {item.type === "expense" ? (
                  <>
                    {item.paid_by} •{" "}
                    {item.source === "personal" ? "Tiền riêng" : "Tiền chung"}
                  </>
                ) : (
                  <>💰 {item.paid_by} nạp quỹ</>
                )}
              </p>

              {/* Time */}
              <p className="text-xs text-gray-400">
                {dayjs(item.created_at).format("HH:mm DD/MM")}
              </p>
            </div>

            {/* Amount */}
            <p
              className={`font-semibold ${
                item.type === "contribution" ? "text-green-600" : ""
              }`}
            >
              {item.type === "contribution" ? "+" : ""}
              {Number(item.amount).toLocaleString()}đ
            </p>
          </div>
        ))}
      </div>

      {/* ➕ FLOAT BUTTON */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-4 w-14 h-14 rounded-full bg-black text-white text-2xl shadow-lg"
      >
        +
      </button>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-end">
          <div className="bg-white w-full p-4 rounded-t-3xl space-y-3">
            <h2 className="font-bold text-lg">Thêm dữ liệu</h2>

            {/* MODE */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode("expense");
                }}
                className={`flex-1 p-3 rounded-xl border ${
                  mode === "expense" ? "bg-black text-white" : "bg-white"
                }`}
              >
                Chi tiêu
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("contribution");
                }}
                className={`flex-1 p-3 rounded-xl border ${
                  mode === "contribution" ? "bg-black text-white" : "bg-white"
                }`}
              >
                Nạp quỹ
              </button>
            </div>

            {/* AMOUNT */}
            <input
              type="number"
              placeholder="Số tiền"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border p-3 rounded-xl"
            />

            {/* USER */}
            <div className="flex gap-2">
              {["A", "B"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPaidBy(p as any)}
                  className={`flex-1 p-2 rounded-xl ${
                    paidBy === p ? "bg-black text-white" : "bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* SOURCE (chỉ cho expense) */}
            {mode === "expense" && (
              <div className="flex gap-2">
                <button
                  onClick={() => setSource("personal")}
                  className={`flex-1 p-2 rounded-xl ${
                    source === "personal"
                      ? "bg-black text-white"
                      : "bg-gray-100"
                  }`}
                >
                  Tiền riêng
                </button>

                <button
                  onClick={() => setSource("shared_fund")}
                  className={`flex-1 p-2 rounded-xl ${
                    source === "shared_fund"
                      ? "bg-black text-white"
                      : "bg-gray-100"
                  }`}
                >
                  Tiền chung
                </button>
              </div>
            )}

            {/* ACTION */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 p-3 bg-gray-200 rounded-xl"
              >
                Huỷ
              </button>

              <button
                onClick={handleSubmit}
                className="flex-1 p-3 bg-black text-white rounded-xl"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
