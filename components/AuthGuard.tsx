"use client";

import { useEffect, useState } from "react";
import LockScreen from "./LockScreen";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
      
      // Kiểm tra xem khóa mở ứng dụng còn hiệu lực 1 ngày không
      const unlockTime = localStorage.getItem("app_unlocked_time");
      
      if (unlockTime) {
        const ONE_DAY = 24 * 60 * 60 * 1000;
        const isExpired = Date.now() - parseInt(unlockTime, 10) > ONE_DAY;
        
        if (!isExpired) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("app_unlocked_time");
        }
      }
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  if (!isMounted) return null; // Chống flash giao diện và lỗi hydration

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <LockScreen
      onSuccess={() => {
        localStorage.setItem("app_unlocked_time", Date.now().toString());
        setIsAuthenticated(true);
      }}
    />
  );
}
