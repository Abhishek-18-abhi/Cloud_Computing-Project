import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://ukkatirylydafqjngywt.supabase.co";
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_2pTJwplui8u3KvijBNifNQ_vHh6XoVi";

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
