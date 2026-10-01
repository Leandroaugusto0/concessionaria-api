import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error(
    "SUPABASE_URL e SUPABASE_SECRET_KEY precisam estar definidas no arquivo .env"
  );
}

const supabase = createClient(
  supabaseUrl,
  supabaseSecretKey,
);

export default supabase;