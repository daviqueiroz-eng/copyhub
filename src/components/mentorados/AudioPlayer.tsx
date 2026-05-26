import { useEffect, useRef, useState } from "react";
import { Play, Pause, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  src: string;
  initialDuration?: number | null;
  className?: string;
};

const fmt = (s: number) => {
  if (!isFinite(s) || s < 0) return "00:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
};

/**
 * Player compacto que mostra duração antes do play.
 * MediaRecorder (webm/opus) costuma gravar sem `duration` no header;
 * usamos o seek-trick (currentTime = 1e9) para forçar o navegador a calcular.
 */
export const AudioPlayer = ({ src, initialDuration, className }: Props) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [duration, setDuration] = useState<number>(
    initialDuration && isFinite(initialDuration) && initialDuration > 0 ? initialDuration : 0
  );
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    let forced = false;
    const onLoaded = () => {
      if (isFinite(a.duration) && a.duration > 0 && a.duration < 1e6) {
        setDuration(a.duration);
        return;
      }
      if (!forced) {
        forced = true;
        try {
          a.currentTime = 1e9;
        } catch {
          /* noop */
        }
      }
    };
    const onTimeUpdate = () => {
      if (forced && isFinite(a.duration) && a.duration > 0 && a.duration < 1e6) {
        setDuration(a.duration);
        a.currentTime = 0;
        forced = false;
        return;
      }
      setCurrent(a.currentTime);
    };
    const onEnd = () => setPlaying(false);
    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("durationchange", onLoaded);
    a.addEventListener("timeupdate", onTimeUpdate);
    a.addEventListener("ended", onEnd);
    // força load
    try {
      a.load();
    } catch {
      /* noop */
    }
    return () => {
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("durationchange", onLoaded);
      a.removeEventListener("timeupdate", onTimeUpdate);
      a.removeEventListener("ended", onEnd);
    };
  }, [src]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  };

  const pct = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;

  return (
    <div
      className={`flex items-center gap-2 rounded-md border bg-background px-2 py-1 ${className ?? ""}`}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={toggle}
      >
        {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </Button>
      <div className="relative h-1.5 flex-1 min-w-[60px] rounded-full bg-muted overflow-hidden">
        <div
          className="absolute inset-y-0 left-0"
          style={{ width: `${pct}%`, background: "#B8860B" }}
        />
      </div>
      <span className="text-[10px] tabular-nums text-muted-foreground shrink-0">
        {fmt(current)} / {fmt(duration)}
      </span>
      <button
        type="button"
        className="shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
        title="Baixar áudio"
        onClick={async (e) => {
          e.stopPropagation();
          e.preventDefault();
          try {
            const res = await fetch(src);
            if (!res.ok) throw new Error("download failed");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const ext = (src.split("?")[0].split(".").pop() || "webm").toLowerCase();
            const filename = `audio-${Date.now()}.${ext}`;
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          } catch {
            window.open(src, "_blank");
          }
        }}
      >
        <Download className="h-3.5 w-3.5" />
      </button>
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
    </div>
  );
};

export default AudioPlayer;