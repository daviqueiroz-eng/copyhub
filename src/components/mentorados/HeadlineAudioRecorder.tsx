import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Props = {
  mentoradoId: string;
  guiaNumero: number;
  ordem: number;
  audioUrl: string | null;
  onChange: (url: string | null) => void;
};

export const HeadlineAudioRecorder = ({ mentoradoId, guiaNumero, ordem, audioUrl, onChange }: Props) => {
  const { toast } = useToast();
  const [gravando, setGravando] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [segundos, setSegundos] = useState(0);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeRef = useRef<string>("audio/webm");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => {
    stopAll();
  }, []);

  const stopAll = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    analyserRef.current?.disconnect();
    analyserRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
  };

  const drawWave = () => {
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    if (!analyser) return;
    // If canvas not yet mounted, try again next frame
    if (!canvas) {
      rafRef.current = requestAnimationFrame(drawWave);
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(data);
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#B8860B";
    ctx.beginPath();
    const slice = w / data.length;
    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128.0;
      const y = (v * h) / 2;
      const x = i * slice;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    rafRef.current = requestAnimationFrame(drawWave);
  };

  const iniciar = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const candidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4;codecs=mp4a.40.2",
        "audio/mp4",
        "audio/aac",
      ];
      const mime = candidates.find((c) =>
        typeof MediaRecorder !== "undefined" &&
        (MediaRecorder as unknown as { isTypeSupported?: (t: string) => boolean })
          .isTypeSupported?.(c)
      ) || "";
      mimeRef.current = mime || "audio/webm";
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      mediaRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeRef.current });
        stream.getTracks().forEach((t) => t.stop());
        stopAll();
        setSegundos(0);
        await uploadBlob(blob);
      };
      mr.start(250);

      // waveform
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      analyserRef.current = analyser;

      setGravando(true);
      setSegundos(0);
      timerRef.current = window.setInterval(() => setSegundos((s) => s + 1), 1000);
      requestAnimationFrame(drawWave);
    } catch (e) {
      toast({ title: "Não foi possível acessar o microfone", variant: "destructive" });
    }
  };

  const parar = () => {
    mediaRef.current?.stop();
    setGravando(false);
  };

  const uploadBlob = async (blob: Blob) => {
    try {
      setUploading(true);
      const ext = mimeRef.current.includes("mp4") ? "mp4" : mimeRef.current.includes("aac") ? "aac" : "webm";
      const path = `headline-audio/${mentoradoId}/${guiaNumero}/${ordem}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("roteiro-comentarios-audio")
        .upload(path, blob, { contentType: mimeRef.current, upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("roteiro-comentarios-audio").getPublicUrl(path);
      onChange(data.publicUrl);
      toast({ title: "Áudio salvo" });
    } catch (e: any) {
      toast({ title: "Erro ao salvar áudio", description: e?.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const remover = () => {
    onChange(null);
  };

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  if (gravando) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="destructive" size="sm" className="h-6 px-2 gap-1" onClick={parar}>
          <Square className="h-3 w-3" /> Parar
        </Button>
        <canvas ref={canvasRef} width={140} height={22} className="rounded bg-muted" />
        <span className="text-xs tabular-nums text-muted-foreground">{fmt(segundos)}</span>
      </div>
    );
  }

  if (uploading) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> enviando…
      </div>
    );
  }

  if (audioUrl) {
    return (
      <div className="flex items-center gap-1">
        <span
          className="text-[11px] font-medium px-1.5 py-0.5 rounded"
          style={{ color: "#16a34a", fontFamily: '"Caveat", "Comic Sans MS", cursive' }}
        >
          🎙 Áudio complementar
        </span>
        <audio controls src={audioUrl} className="h-7" style={{ maxWidth: 200 }} />
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          title="Remover áudio"
          onClick={remover}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6"
      title="Gravar áudio complementar"
      onClick={iniciar}
    >
      <Mic className="h-3.5 w-3.5" style={{ color: "#16a34a" }} />
    </Button>
  );
};

export default HeadlineAudioRecorder;