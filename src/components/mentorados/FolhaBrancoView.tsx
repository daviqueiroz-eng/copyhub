import { RichTextEditor } from "./docs-editor/RichTextEditor";
import { Loader2, Check } from "lucide-react";

interface FolhaBrancoViewProps {
  content: string;
  onChange: (html: string) => void;
  isSaving?: boolean;
  isSaved?: boolean;
}

export const FolhaBrancoView = ({ content, onChange, isSaving, isSaved }: FolhaBrancoViewProps) => {
  return (
    <div className="px-4 sm:px-8 lg:px-16 py-6 lg:py-12 relative">
      <div className="absolute top-3 right-4 flex items-center gap-2 text-xs text-muted-foreground">
        {isSaving && (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Salvando...</span>
          </>
        )}
        {!isSaving && isSaved && (
          <>
            <Check className="h-3 w-3 text-emerald-500" />
            <span>Salvo</span>
          </>
        )}
      </div>
      <RichTextEditor
        value={content}
        onChange={(html) => onChange(html)}
        placeholder="Comece a escrever..."
        minHeight={800}
      />
    </div>
  );
};