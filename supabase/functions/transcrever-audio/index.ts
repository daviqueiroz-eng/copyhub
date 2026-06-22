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

    const audioRes = await fetch(audio_url);
    if (!audioRes.ok) throw new Error(`Falha ao baixar áudio: ${audioRes.status}`);
    const blob = await audioRes.blob();
    const contentType = audioRes.headers.get("content-type") || blob.type || "audio/webm";
    const ext = contentType.includes("mp4") || contentType.includes("m4a")
      ? "mp4"
      : contentType.includes("mp3") || contentType.includes("mpeg")
      ? "mp3"
      : contentType.includes("wav")
      ? "wav"
      : contentType.includes("ogg")
      ? "ogg"
      : "webm";

    const form = new FormData();
    form.append("model", "openai/gpt-4o-mini-transcribe");
    form.append("file", blob, `audio.${ext}`);

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: form,
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      throw new Error(`Gateway ${aiRes.status}: ${errText}`);
    }

    const data = await aiRes.json();
    const texto = (data?.text || "").trim();
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