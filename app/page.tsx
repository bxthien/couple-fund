"use client";

import { useEffect, useState } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import dayjs from "dayjs";
import { calculateDebt, calculateSharedBalance } from "@/utils/calc";
import { useFinance, USERS, UserType } from "@/store/useFinance";

export default function Page() {
  const { expenses, contributions, fetch, addExpense, addContribution } =
    useFinance();

  const [open, setOpen] = useState(false);
  const [showSettleConfirm, setShowSettleConfirm] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState<UserType>(USERS[0]);
  const [source, setSource] = useState<"personal" | "shared_fund">("personal");
  const [mode, setMode] = useState<"expense" | "contribution">("expense");
  const [note, setNote] = useState("");

  const [mounted, setMounted] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() =>
    dayjs().format("YYYY-MM"),
  );

  useRealtime();

  const handleSync = async () => {
    setIsSyncing(true);
    await fetch();
    setTimeout(() => setIsSyncing(false), 800); // Tạo hiệu ứng mượt
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    fetch();
  }, []);

  if (!mounted) {
    return null; // Tránh lỗi Hydration Mismatch giữa Server và Client
  }

  // 💰 DATA SLICING
  const getMonthStr = (dateStr?: string, monthField?: string) => {
    if (monthField) return monthField;
    if (dateStr) return dayjs(dateStr).format("YYYY-MM");
    return dayjs().format("YYYY-MM");
  };

  const currentMonthExpenses = expenses.filter(
    (e) => getMonthStr(e.created_at, e.month) === selectedMonth,
  );
  const currentMonthContributions = contributions.filter(
    (c) => getMonthStr(c.created_at, c.month) === selectedMonth,
  );

  const previousMonthsExpenses = expenses.filter(
    (e) => getMonthStr(e.created_at, e.month) < selectedMonth,
  );
  const previousMonthsContributions = contributions.filter(
    (c) => getMonthStr(c.created_at, c.month) < selectedMonth,
  );

  // 💰 CALCULATE
  const { netBalance } = calculateDebt(expenses); // Tổng nợ (Toàn thời gian)
  const { totalMiaPaid, totalEthanPaid } = calculateDebt(currentMonthExpenses); // Spending cho tháng hiện tại

  const carryOverBalance = calculateSharedBalance(
    previousMonthsContributions,
    previousMonthsExpenses,
  );
  const currentMonthSharedBalance = calculateSharedBalance(
    currentMonthContributions,
    currentMonthExpenses,
  );
  const finalSharedBalance = carryOverBalance + currentMonthSharedBalance;

  // ➕ SUBMIT
  const handleSubmit = async () => {
    const rawValue = Number(amount.replace(/,/g, ""));
    if (!amount || rawValue <= 0) return;

    if (mode === "expense") {
      await addExpense({
        amount: rawValue,
        paid_by: paidBy,
        source,
        month: selectedMonth,
        note,
      });
    } else {
      await addContribution({
        amount: rawValue,
        paid_by: paidBy,
        month: selectedMonth,
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setOpen(false);
    setAmount("");
    setNote("");
    setPaidBy(USERS[0]);
    setSource("personal");
    setMode("expense");
  };

  const handleConfirmSettle = async () => {
    if (netBalance === 0) return;

    // Nếu netBalance > 0, USERS[0] (Mia) nợ USERS[1] (Ethan) -> Mia paid_by.
    // Nếu netBalance < 0, USERS[1] (Ethan) nợ USERS[0] (Mia) -> Ethan paid_by.
    const debtor = netBalance > 0 ? USERS[0] : USERS[1];
    const amountToPay = Math.abs(netBalance);

    await addExpense({
      amount: amountToPay,
      paid_by: debtor,
      source: "settlement",
      month: dayjs().format("YYYY-MM"), // Mặc định ghi nhận thanh toán nợ vào tháng hiện tại thực tế
      note: "Thanh toán công nợ",
    });
  };

  // Xử lý múi giờ bị thiếu từ db cũ (chỉ có timestamp without timezone)
  const fixTimezone = (timeStr?: string) => {
    if (!timeStr) return timeStr;
    if (
      !timeStr.endsWith("Z") &&
      !timeStr.includes("+") &&
      !timeStr.match(/-\d{2}:\d{2}$/)
    ) {
      return timeStr + "Z";
    }
    return timeStr;
  };

  const history = [
    ...currentMonthExpenses.map((e) => ({
      id: e.id,
      type: "expense",
      amount: e.amount,
      paid_by: e.paid_by,
      source: e.source,
      created_at: fixTimezone(e.created_at),
      note: e.note,
    })),

    ...currentMonthContributions.map((c) => ({
      id: c.id,
      type: "contribution",
      amount: c.amount,
      paid_by: c.paid_by,
      source: undefined,
      created_at: fixTimezone(c.created_at),
      note: undefined,
    })),
  ].sort((a, b) => {
    const timeA = a.created_at ? dayjs(a.created_at).valueOf() : 0;
    const timeB = b.created_at ? dayjs(b.created_at).valueOf() : 0;
    return timeB - timeA;
  });

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-4 pb-10">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-3 bg-white p-3 rounded-2xl shadow-sm border border-pink-50">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold bg-linear-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent drop-shadow-sm">
              CoupleFund
            </h1>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className={`p-1.5 rounded-full bg-gray-50 text-gray-900 active:scale-95 transition-all ${isSyncing ? "animate-spin text-pink-500" : "hover:text-pink-500"}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path
                  fillRule="evenodd"
                  d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"
                />
                <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-500 font-medium tracking-wide mt-1 flex items-center gap-1">
            <span>{USERS[0]}</span>
            <span className="text-pink-400 animate-pulse text-sm">❤</span>
            <span>{USERS[1]}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
            Ví chung
          </p>
          <p className="text-xl font-extrabold text-gray-800 bg-linear-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent drop-shadow-sm">
            {finalSharedBalance.toLocaleString()}đ
          </p>
          {carryOverBalance > 0 && (
            <p className="text-[10px] text-green-500 font-semibold mt-0.5 whitespace-nowrap">
              (+{carryOverBalance.toLocaleString()}đ từ tháng trước)
            </p>
          )}
          {carryOverBalance < 0 && (
            <p className="text-[10px] text-red-400 font-semibold mt-0.5 whitespace-nowrap">
              ({carryOverBalance.toLocaleString()}đ từ tháng trước)
            </p>
          )}
        </div>
      </div>

      {/* MONTH SELECTOR */}
      <div className="flex items-center justify-between mb-3 bg-white/60 p-2 rounded-2xl shadow-sm border border-gray-100">
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

      {/* 👤 USERS */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-white rounded-2xl p-4 shadow flex flex-col justify-center">
          <p className="text-sm text-pink-400 font-medium mb-1">{USERS[0]}</p>
          <div className="flex items-baseline gap-1 flex-wrap">
            <p className="text-xl font-bold text-pink-500">
              {totalMiaPaid.toLocaleString()}đ
            </p>
            {netBalance > 0 && (
              <span className="text-[11px] font-semibold text-red-400 opacity-90 truncate">
                (Nợ {netBalance.toLocaleString()}đ)
              </span>
            )}
            {netBalance <= 0 && (
              <span className="text-[11px] font-semibold text-red-400 opacity-90 truncate">
                (Hông có nợ)
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow flex flex-col justify-center">
          <p className="text-sm text-blue-400 font-medium mb-1">{USERS[1]}</p>
          <div className="flex items-baseline gap-1 flex-wrap">
            <p className="text-xl font-bold text-blue-500">
              {totalEthanPaid.toLocaleString()}đ
            </p>
            {netBalance < 0 && (
              <span className="text-[11px] font-semibold text-red-400 opacity-90 truncate">
                (Nợ {Math.abs(netBalance).toLocaleString()}đ)
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-row justify-between items-center p-3 mb-3 bg-white rounded-2xl shadow-sm border border-pink-50">
        <div className="flex-1">
          {netBalance === 0 ? (
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                ✨
              </span>
              <p className="text-sm font-bold text-gray-500">Không có nợ nần</p>
            </div>
          ) : (
            <>
              {netBalance > 0 && (
                <p className="text-sm font-medium text-gray-600">
                  <span className="text-pink-500 font-bold">{USERS[0]}</span> nợ{" "}
                  <span className="text-blue-500 font-bold">{USERS[1]}</span>
                  <br />
                  <span className="text-rose-500 font-extrabold text-lg tracking-tight">
                    {netBalance.toLocaleString()}đ
                  </span>
                </p>
              )}
              {netBalance < 0 && (
                <p className="text-sm font-medium text-gray-600">
                  <span className="text-blue-500 font-bold">{USERS[1]}</span> nợ{" "}
                  <span className="text-pink-500 font-bold">{USERS[0]}</span>
                  <br />
                  <span className="text-rose-500 font-extrabold text-lg tracking-tight">
                    {Math.abs(netBalance).toLocaleString()}đ
                  </span>
                </p>
              )}
            </>
          )}
        </div>
        {netBalance !== 0 && (
          <button
            onClick={() => setShowSettleConfirm(true)}
            className="ml-3 px-6 py-2.5 bg-linear-to-r from-pink-500 to-rose-400 text-white rounded-full text-sm font-bold shadow-md shadow-pink-200 active:scale-95 transition-all whitespace-nowrap"
          >
            Thanh toán
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 mt-4 mb-3 opacity-80">
        <div className="h-px flex-1 bg-gray-200"></div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Lịch sử hoạt động
        </p>
        <div className="h-px flex-1 bg-gray-200"></div>
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
                  item.source === "settlement" ? (
                    <span className="text-gray-600">
                      💸{" "}
                      <span
                        className={
                          item.paid_by === USERS[0]
                            ? "text-pink-600"
                            : "text-blue-600"
                        }
                      >
                        {item.paid_by}
                      </span>{" "}
                      thanh toán nợ
                    </span>
                  ) : (
                    <>
                      <span
                        className={
                          item.paid_by === USERS[0]
                            ? "text-pink-600"
                            : "text-blue-600"
                        }
                      >
                        {item.paid_by}
                      </span>{" "}
                      •{" "}
                      {item.source === "personal" ? "Tiền riêng" : "Tiền chung"}
                    </>
                  )
                ) : (
                  <>
                    💰{" "}
                    <span
                      className={
                        item.paid_by === USERS[0]
                          ? "text-pink-600"
                          : "text-blue-600"
                      }
                    >
                      {item.paid_by}
                    </span>{" "}
                    nạp quỹ
                  </>
                )}
              </p>

              {item.note && (
                <p className="text-sm text-gray-600 mt-0.5">{item.note}</p>
              )}

              {/* Time */}
              <p className="text-xs text-gray-400 mt-1">
                {dayjs(item.created_at).format("HH:mm DD/MM")}
              </p>
            </div>

            {/* Amount */}
            <p
              className={`font-semibold ${
                item.type === "contribution"
                  ? "text-green-600"
                  : item.paid_by === USERS[0]
                    ? "text-pink-600"
                    : "text-blue-600"
              }`}
            >
              {item.type === "contribution" ? "+" : "-"}
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
            <div className="mb-3">
              <input
                type="tel"
                inputMode="numeric"
                placeholder="Số tiền"
                value={amount}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  const formatted = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                  setAmount(formatted);
                }}
                className="w-full border p-3 rounded-xl mb-2 font-bold text-lg"
              />
              <div className="flex flex-wrap gap-2">
                {[
                  50000, 75000, 100000, 125000, 150000, 200000, 300000, 500000,
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      const formatted = String(preset).replace(
                        /\B(?=(\d{3})+(?!\d))/g,
                        ",",
                      );
                      setAmount(formatted);
                    }}
                    className="px-3 py-1 bg-gray-100 text-sm rounded-full text-gray-700 active:bg-gray-200"
                  >
                    +{preset.toLocaleString()}đ
                  </button>
                ))}
              </div>
            </div>

            {/* NOTE */}
            {mode === "expense" && (
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Ghi chú (tùy chọn)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full border p-3 rounded-xl mb-2"
                />
                <div className="flex flex-wrap gap-2">
                  {[
                    "Nhu yếu phẩm",
                    "Ăn chơi",
                    "Đồ gia dụng",
                    "Mua vàng",
                    "Quà tặng",
                    "Đi chợ",
                    "Tiền nhà",
                  ].map((tag) => {
                    const currentNotes = note
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean);
                    const isSelected = currentNotes.includes(tag);

                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setNote(
                              currentNotes.filter((t) => t !== tag).join(", "),
                            );
                          } else {
                            setNote([...currentNotes, tag].join(", "));
                          }
                        }}
                        className={`px-3 py-1 text-sm rounded-full ${
                          isSelected
                            ? "bg-black text-white"
                            : "bg-gray-100 text-gray-700 active:bg-gray-200"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* USER */}
            <div className="flex gap-2">
              {USERS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPaidBy(p)}
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
                onClick={resetForm}
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

      {/* XÁC NHẬN THANH TOÁN MODAL */}
      {showSettleConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-sm p-6 rounded-3xl space-y-4 shadow-xl transform scale-100 transition-transform">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                🤝
              </div>
              <h2 className="font-bold text-xl mb-2 text-gray-800">
                Xác nhận thanh toán
              </h2>
              <p className="text-gray-500 text-sm">
                Bạn có chắc chắn đã hoàn tất thanh toán khoản nợ này? Dữ liệu
                công nợ này sẽ lập tức được hệ thống xóa bỏ và đưa số dư về 0.
              </p>
            </div>
            <div className="flex gap-3 pt-3">
              <button
                onClick={() => setShowSettleConfirm(false)}
                className="flex-1 p-3 bg-gray-100 text-gray-700 font-semibold rounded-xl active:bg-gray-200"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  setShowSettleConfirm(false);
                  handleConfirmSettle();
                }}
                className="flex-1 p-3 bg-black text-white font-semibold rounded-xl shadow-lg active:scale-95 transition-transform"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
