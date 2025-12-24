import { useState } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TTSConfigPopoverProps {
  rate: number;
  pitch: number;
  onRateChange: (value: number) => void;
  onPitchChange: (value: number) => void;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  onVoiceChange: (voice: SpeechSynthesisVoice) => void;
}

export const TTSConfigPopover = ({
  rate,
  pitch,
  onRateChange,
  onPitchChange,
  voices,
  selectedVoice,
  onVoiceChange,
}: TTSConfigPopoverProps) => {
  const [open, setOpen] = useState(false);

  // Agrupar vozes por idioma para facilitar a seleção
  const portugueseVoices = voices.filter(v => 
    v.lang.includes("pt") || v.lang.includes("PT")
  );
  const otherVoices = voices.filter(v => 
    !v.lang.includes("pt") && !v.lang.includes("PT")
  );

  const getVoiceLabel = (voice: SpeechSynthesisVoice) => {
    const name = voice.name.replace(/Microsoft |Google |Apple /gi, "");
    return `${name} (${voice.lang})`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          title="Configurações de voz"
        >
          <Settings2 className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Configurações de Voz</h4>

          {/* Velocidade */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Velocidade</Label>
              <span className="text-xs text-muted-foreground">{rate.toFixed(1)}x</span>
            </div>
            <Slider
              value={[rate]}
              onValueChange={([value]) => onRateChange(value)}
              min={0.5}
              max={2}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0.5x</span>
              <span>1x</span>
              <span>2x</span>
            </div>
          </div>

          {/* Tom */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Tom</Label>
              <span className="text-xs text-muted-foreground">{pitch.toFixed(1)}</span>
            </div>
            <Slider
              value={[pitch]}
              onValueChange={([value]) => onPitchChange(value)}
              min={0.5}
              max={1.5}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Grave</span>
              <span>Normal</span>
              <span>Agudo</span>
            </div>
          </div>

          {/* Seleção de Voz */}
          <div className="space-y-2">
            <Label className="text-xs">Voz</Label>
            <Select
              value={selectedVoice?.name || ""}
              onValueChange={(name) => {
                const voice = voices.find(v => v.name === name);
                if (voice) onVoiceChange(voice);
              }}
            >
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue placeholder="Selecionar voz">
                  {selectedVoice ? getVoiceLabel(selectedVoice) : "Selecionar voz"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {portugueseVoices.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      Português
                    </div>
                    {portugueseVoices.map((voice) => (
                      <SelectItem key={voice.name} value={voice.name} className="text-xs">
                        {getVoiceLabel(voice)}
                      </SelectItem>
                    ))}
                  </>
                )}
                {otherVoices.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      Outros idiomas
                    </div>
                    {otherVoices.map((voice) => (
                      <SelectItem key={voice.name} value={voice.name} className="text-xs">
                        {getVoiceLabel(voice)}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Reset */}
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              onRateChange(1.0);
              onPitchChange(1.0);
            }}
          >
            Restaurar padrões
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
