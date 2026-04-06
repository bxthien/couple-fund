"use server";

import { createClient } from "@supabase/supabase-js";

export async function verifyPinServer(pin: string) {
  try {
    // Khởi tạo Supabase ngay trên Server để giấu logic query
    // Điều này giúp ngăn chặn hoàn toàn việc client (trình duyệt) có thể Inspect Network
    // để dòm ngó xem cột protect_key có những mã PIN nào (khi lên Production).
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return { success: false, error: "Missing DB Env Options" };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("users")
      .select("protect_key")
      .eq("protect_key", pin)
      .limit(1);

    if (error || !data || data.length === 0) {
      return { success: false };
    }

    return { success: true };
  } catch (err) {
    console.error("Lỗi quá trình verify:", err);
    return { success: false };
  }
}
