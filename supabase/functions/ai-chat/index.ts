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
    const { conversationId, userId } = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Fetch recent messages
    const messagesRes = await fetch(
      `${supabaseUrl}/rest/v1/messages?conversation_id=eq.${conversationId}&order=created_at.asc&limit=20&select=sender_id,text,media_type,deleted_for_everyone`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
    );
    const history = await messagesRes.json() as {
      sender_id: string;
      text: string | null;
      media_type: string | null;
      deleted_for_everyone: boolean;
    }[];

    const aiMessages: { role: string; content: string }[] = [
      { role: "system", content: "You are ChatWave Assistant, a friendly AI assistant for the Pulse messaging app. Keep responses concise and helpful. Use emojis naturally." },
    ];

    for (const msg of history) {
      if (msg.deleted_for_everyone || !msg.text) continue;
      if (msg.sender_id === "12f8a30b-8b9a-41c2-b6db-ad57f37eab9a") {
        aiMessages.push({ role: "assistant", content: msg.text });
      } else {
        aiMessages.push({ role: "user", content: msg.text });
      }
    }

    // Try POST with timeout
    let aiText = "";
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);
      const aiRes = await fetch("https://text.pollinations.ai/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai",
          messages: aiMessages,
          temperature: 0.7,
          max_tokens: 500,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        aiText = aiData?.choices?.[0]?.message?.content ?? "";
      } else {
        const errText = await aiRes.text();
        console.error("POST AI error:", aiRes.status, errText.slice(0, 200));
      }
    } catch (e) {
      console.error("POST AI exception:", e.message?.slice(0, 200));
    }

    // Fallback: GET
    if (!aiText || !aiText.trim()) {
      try {
        const prompt = encodeURIComponent(
          aiMessages.map((m) => `${m.role}: ${m.content}`).join("\n") + "\nassistant: "
        );
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000);
        const getRes = await fetch(`https://text.pollinations.ai/${prompt}?model=openai`);
        clearTimeout(timeout);
        if (getRes.ok) {
          aiText = await getRes.text();
        }
      } catch (e) {
        console.error("GET AI exception:", e.message?.slice(0, 200));
      }
    }

    if (!aiText || !aiText.trim()) {
      return new Response(JSON.stringify({ error: "AI service unavailable", debug: { msgCount: aiMessages.length } }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save the AI response
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/messages`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        sender_id: "12f8a30b-8b9a-41c2-b6db-ad57f37eab9a",
        text: aiText.trim(),
      }),
    });

    if (!insertRes.ok) {
      return new Response(JSON.stringify({ error: "Failed to save AI response", debug: await insertRes.text() }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const inserted = await insertRes.json() as Record<string, unknown>[];
    return new Response(JSON.stringify({ success: true, message: inserted?.[0] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal error", debug: String(err).slice(0, 300) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
