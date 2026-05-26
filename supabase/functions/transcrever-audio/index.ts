import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio_url } = await req.json();
    if (!audio_url) {
      return new Response(JSON.stringify({ error: "audio_url obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    // Baixa o áudio
    const audioRes = await fetch(audio_url);
    if (!audioRes.ok) throw new Error(`Falha ao baixar áudio: ${audioRes.status}`);
    const buf = new Uint8Array(await audioRes.arrayBuffer());
    // base64
    let bin = "";
    for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
    const b64 = btoa(bin);

    const contentType = audioRes.headers.get("content-type") || "audio/webm";
    // OpenAI compat espera format curto (wav/mp3). Para webm/ogg usamos data URL via image_url-like? Usamos input_audio com format inferido.
    let format = "webm";
    if (contentType.includes("mp3") || contentType.includes("mpeg")) format = "mp3";
    else if (contentType.includes("wav")) format = "wav";
    else if (contentType.includes("ogg")) format = "ogg";
    else if (contentType.includes("mp4") || contentType.includes("m4a")) format = "mp4";

    const body = {
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Transcreva este áudio em português do Brasil. Retorne APENAS o texto transcrito, sem comentários, sem marcações, sem timestamps.",
            },
            {
              type: "input_audio",
              input_audio: { data: b64, format },
            },
          ],
        },
      ],
    };

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      throw new Error(`Gateway ${aiRes.status}: ${errText}`);
    }

    const data = await aiRes.json();
    const texto = data?.choices?.[0]?.message?.content?.trim() || "";
    if (!texto) throw new Error("Transcrição vazia");

    return new Response(JSON.stringify({ texto }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "erro";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});