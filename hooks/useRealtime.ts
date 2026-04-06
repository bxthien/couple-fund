import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useFinance } from "@/store/useFinance";

export const useRealtime = () => {
  const fetch = useFinance((s) => s.fetch);

  useEffect(() => {
    const channel = supabase
      .channel("expenses")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses" },
        fetch,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
};
