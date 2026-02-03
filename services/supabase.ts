
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jcruhxclidltylxdvmlp.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || "sb_publishable_ELx3V_aGkiOpCF0isqBK1w_JZoUZvuY";

/**
 * تهيئة عميل Supabase للتعامل مع قاعدة البيانات وتخزين الملفات.
 */
export const createClient = () =>
  createBrowserClient(
    supabaseUrl!,
    supabaseKey!,
  );

// نسخة وحيدة للاستخدام العام
export const supabase = createClient();
