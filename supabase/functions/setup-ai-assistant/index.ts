import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const adminRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "assistant@chatwave.app",
        password: "ChatWaveAI2026!Secure",
        email_confirm: true,
        user_metadata: { is_ai: true },
      }),
    });

    if (!adminRes.ok) {
      const errBody = await adminRes.text();
      // If user already exists, that's fine
      if (!errBody.includes("already") && !errBody.includes("been registered")) {
        return new Response(JSON.stringify({ error: errBody }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const userData = adminRes.ok ? await adminRes.json() : null;
    const aiUserId = userData?.id;

    if (aiUserId) {
      const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${aiUserId}`, {
        method: "PATCH",
        headers: {
          "apikey": serviceKey,
          "Authorization": `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          username: "chatwave_ai",
          full_name: "ChatWave Assistant",
          bio: "Your official ChatWave AI assistant. Here to help you discover features, tips, and updates.",
          is_verified: true,
          is_official: true,
        }),
      });
      if (!profileRes.ok) {
        console.error("Profile update failed", await profileRes.text());
      }
    }

    return new Response(JSON.stringify({ success: true, ai_user_id: aiUserId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
