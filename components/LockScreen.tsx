"use client";
import { useState } from "react";
import { verifyPinServer } from "@/app/actions/auth";

export default function LockScreen({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInput = async (num: string) => {
    if (pin.length >= 6) return;
    const newPin = pin + num;
    setPin(newPin);
    setError(false);

    if (newPin.length === 6) {
      setLoading(true);
      
      try {
        // Gửi lệnh kiểm tra ngầm xuống Server Action để tránh dò thông tin API ở Network Tab
        const res = await verifyPinServer(newPin);

        if (!res.success) {
          setError(true);
          setTimeout(() => setPin(""), 500);
          setLoading(false);
          return;
        }

        // Xác thực thành công (tồn tại user khớp PIN)
        onSuccess();
      } catch (err) {
        console.error(err);
        setError(true);
        setTimeout(() => setPin(""), 500);
      }
      
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col justify-center items-center p-6 z-50">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold bg-linear-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent mb-3 drop-shadow-sm">
          CoupleFund
        </h1>
        <p className="text-gray-500 font-medium">Nhập mã PIN để truy cập</p>
      </div>

      <div className="flex gap-4 mb-14">
        {/* Render 6 dots */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-300 ${
              i < pin.length ? "bg-pink-500 scale-125 shadow-sm" : "bg-gray-300"
            } ${error ? "bg-red-500 animate-bounce" : ""}`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6 max-w-[280px] w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            disabled={loading}
            onClick={() => handleInput(String(num))}
            className="w-full aspect-square bg-white rounded-full text-2xl font-bold shadow-sm active:bg-pink-50 active:scale-95 transition-all text-gray-800"
          >
            {num}
          </button>
        ))}
        <div /> {/* Không gian trống */}
        <button
          disabled={loading}
          onClick={() => handleInput("0")}
          className="w-full aspect-square bg-white rounded-full text-2xl font-bold shadow-sm active:bg-pink-50 active:scale-95 transition-all text-gray-800"
        >
          0
        </button>
        <button
          disabled={loading}
          onClick={handleDelete}
          className="w-full aspect-square rounded-full text-lg font-bold text-gray-500 active:bg-gray-200 active:scale-95 transition-all flex items-center justify-center"
        >
          ✖
        </button>
      </div>
      
      {error && (
        <p className="fixed bottom-10 text-red-500 font-medium animate-pulse">
          Mã PIN không đúng!
        </p>
      )}
    </div>
  );
}
