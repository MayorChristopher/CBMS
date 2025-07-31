import { serve } from "std/server";
import { createClient } from "@supabase/supabase-js";

serve(async (req) => {
  // Parse the request body
  const { user_id } = await req.json();

  // Create a Supabase client with the service role key
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Delete the user
  const { error } = await supabase.auth.admin.deleteUser(user_id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});