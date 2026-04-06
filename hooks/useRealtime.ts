import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useFinance } from "@/store/useFinance";

export const useRealtime = () => {
  const fetch = useFinance((s) => s.fetch);

  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;
    const fetchDebounced = () => {
      clearTimeout(debounceTimer);
      // Đợi 500ms gom các thay đổi gộp thành 1 lần fetch
      debounceTimer = setTimeout(() => fetch(), 500);
    };

    const expensesChannel = supabase
      .channel("expenses")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses" },
        fetchDebounced
      )
      .subscribe();

    const contributionsChannel = supabase
      .channel("contributions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contributions" },
        fetchDebounced
      )
      .subscribe();

    // Auto sync every 5 mins
    const intervalTimer = setInterval(() => {
      fetch();
    }, 5 * 60 * 1000);

    return () => {
      supabase.removeChannel(expensesChannel);
      supabase.removeChannel(contributionsChannel);
      clearTimeout(debounceTimer);
      clearInterval(intervalTimer);
    };
  }, []);
};
