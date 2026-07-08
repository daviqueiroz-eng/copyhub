import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface SpellError {
  id: string;
  type:
    | "spacing"
    | "punctuation"
    | "spelling"
    | "duplicate"
    | "trim"
    | "grammar"
    | "nome_cliente"
    | "mentorado";
  original: string;
  suggestion: string;
  startIndex: number;
  endIndex: number;
  message: string;
}

interface InlineSpellCheckEditorProps {
  value: string;
  onChange: (value: string, cursorPosition?: number) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSelect?: (e: React.SyntheticEvent<HTMLTextAreaElement>) => void;
  onBlur?: () => void;
  onMouseUp?: (e: React.MouseEvent<HTMLTextAreaElement>) => void;
  onPaste?: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  errors?: SpellError[];
  onFixError?: (error: SpellError) => void;
  onIgnoreError?: (errorId: string) => void;
  showErrors?: boolean;
  activeErrorId?: string | null;
  onErrorClick?: (errorId: string) => void;
}

export interface InlineSpellCheckEditorHandle {
  focus: () => void;
  getTextarea: () => HTMLTextAreaElement | null;
}

export const InlineSpellCheckEditor = forwardRef<InlineSpellCheckEditorHandle, InlineSpellCheckEditorProps>(({
  value,
  onChange,
  onKeyDown,
  onSelect,
  onBlur,
  onMouseUp,
  onPaste,
  placeholder,
  className,
  errors = [],
  onFixError,
  onIgnoreError,
  showErrors = false,
  activeErrorId: activeErrorIdProp,
  onErrorClick,
}, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeErrorId, setActiveErrorId] = useState<string | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number } | null>(null);

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
    getTextarea: () => textareaRef.current,
  }));

  // Sync scroll between textarea and overlay
  const syncScroll = useCallback(() => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  // Auto-resize textarea
  const resizeRafRef = useRef<number | null>(null);
  const autoResize = useCallback(() => {
    if (resizeRafRef.current != null) {
      cancelAnimationFrame(resizeRafRef.current);
    }
    resizeRafRef.current = requestAnimationFrame(() => {
      resizeRafRef.current = null;
      const ta = textareaRef.current;
      if (ta) {
        ta.style.height = 'auto';
        const h = ta.scrollHeight + 'px';
        ta.style.height = h;
        if (overlayRef.current) overlayRef.current.style.height = h;
      }
    });
  }, []);

  useEffect(() => {
    autoResize();
  }, [value, autoResize]);

  useEffect(() => {
    return () => {
      if (resizeRafRef.current != null) cancelAnimationFrame(resizeRafRef.current);
    };
  }, []);

  // Sort errors by position (for rendering)
  const sortedErrors = [...errors].sort((a, b) => a.startIndex - b.startIndex);

  // Build highlighted text with error spans
  const renderHighlightedText = () => {
    if (!showErrors || sortedErrors.length === 0) {
      return <span className="invisible whitespace-pre-wrap">{value || placeholder || " "}</span>;
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedErrors.forEach((error, idx) => {
      // Text before error
      if (error.startIndex > lastIndex) {
        parts.push(
          <span key={`text-${idx}`} className="invisible">
            {value.substring(lastIndex, error.startIndex)}
          </span>
        );
      }

      // Error span with wavy underline
      const errorText = value.substring(error.startIndex, error.endIndex);
      parts.push(
        <span
          key={`error-${error.id}`}
          className={cn(
            "relative cursor-pointer",
            "underline decoration-wavy decoration-2",
            error.type === "spelling" || error.type === "grammar" 
              ? "decoration-red-500" 
              : error.type === "punctuation" 
                ? "decoration-orange-500" 
                : "decoration-yellow-500"
          )}
          style={{ textDecorationSkipInk: "none" }}
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            const containerRect = containerRef.current?.getBoundingClientRect();
            if (containerRect) {
              setPopoverPosition({
                top: rect.bottom - containerRect.top + 4,
                left: rect.left - containerRect.left,
              });
            }
            setActiveErrorId(error.id);
          }}
        >
          {errorText}
        </span>
      );

      lastIndex = error.endIndex;
    });

    // Remaining text
    if (lastIndex < value.length) {
      parts.push(
        <span key="text-end" className="invisible">
          {value.substring(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  const activeError = sortedErrors.find(e => e.id === activeErrorId);

  const handleFix = () => {
    if (activeError && onFixError) {
      onFixError(activeError);
      setActiveErrorId(null);
      setPopoverPosition(null);
    }
  };

  const handleIgnore = () => {
    if (activeError && onIgnoreError) {
      onIgnoreError(activeError.id);
      setActiveErrorId(null);
      setPopoverPosition(null);
    }
  };

  // Fast path: no errors and overlay not needed — skip the heavy overlay rendering entirely
  const overlayNeeded = showErrors && sortedErrors.length > 0;

  return (
    <div ref={containerRef} className="relative">
      {/* Overlay with highlighted errors (only mounted when there are visible errors) */}
      {overlayNeeded && (
      <div
        ref={overlayRef}
        className={cn(
          "absolute inset-0 pointer-events-none whitespace-pre-wrap break-words overflow-hidden",
          "font-poppins",
          className
        )}
        style={{ 
          wordBreak: "break-word",
          lineHeight: "1.6",
        }}
        aria-hidden="true"
      >
        {sortedErrors.map((error, idx) => {
            const prevEnd = idx === 0 ? 0 : sortedErrors[idx - 1].endIndex;
            const beforeText = value.substring(prevEnd, error.startIndex);
            const errorText = value.substring(error.startIndex, error.endIndex);
            const isActiveExternal = activeErrorIdProp === error.id;
            const decorationClass =
              error.type === "spelling"
                ? "decoration-red-500"
                : error.type === "grammar"
                  ? "decoration-blue-500"
                  : error.type === "nome_cliente"
                    ? "decoration-orange-500"
                    : error.type === "mentorado"
                      ? "decoration-emerald-500"
                      : error.type === "punctuation"
                        ? "decoration-orange-500"
                        : "decoration-yellow-500";

            return (
              <span key={`wrapper-${error.id}`}>
                <span className="invisible">{beforeText}</span>
                <span
                  data-error-id={error.id}
                  className={cn(
                    "relative underline decoration-wavy decoration-2",
                    decorationClass,
                    isActiveExternal && "bg-yellow-200/50 dark:bg-yellow-500/25 rounded-sm"
                  )}
                  style={{ 
                    textDecorationSkipInk: "none",
                    pointerEvents: "none",
                  }}
                >
                  {errorText}
                </span>
                {idx === sortedErrors.length - 1 && error.endIndex < value.length && (
                  <span className="invisible">{value.substring(error.endIndex)}</span>
                )}
              </span>
            );
        })}
      </div>
      )}

      {/* Actual textarea - borderless for document style */}
      <textarea
        ref={textareaRef}
        value={value}
        spellCheck={true}
        autoCorrect="on"
        autoCapitalize="off"
        aria-multiline="true"
        data-gramm="true"
        data-gramm_editor="true"
        data-enable-grammarly="true"
        data-lt-active="true"
        data-lt-force-appearance="true"
        onChange={(e) => {
          const cursorPos = e.target.selectionStart;
          onChange(e.target.value, cursorPos);
          autoResize();
        }}
        onKeyDown={onKeyDown}
        onSelect={onSelect}
        onBlur={onBlur}
        onMouseUp={onMouseUp}
        onPaste={onPaste}
        onScroll={syncScroll}
        placeholder={placeholder}
        className={cn(
          "w-full resize-none overflow-hidden bg-transparent relative z-10",
          "font-poppins focus:outline-none",
          className
        )}
        style={{ 
          caretColor: "currentColor",
          lineHeight: "1.6",
        }}
      />

      {/* Error popover */}
      {activeError && popoverPosition && (
        <div
          className="absolute z-50 bg-popover border rounded-lg shadow-lg p-3 min-w-[200px]"
          style={{
            top: popoverPosition.top,
            left: popoverPosition.left,
          }}
        >
          <div className="space-y-2">
            <p className="text-sm font-medium">{activeError.message}</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-red-500 line-through">{activeError.original}</span>
              <span className="text-muted-foreground">→</span>
              <span className="text-green-500 font-medium">{activeError.suggestion}</span>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs gap-1"
                onClick={handleFix}
              >
                <Check className="h-3 w-3" />
                Aceitar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                onClick={handleIgnore}
              >
                <X className="h-3 w-3" />
                Ignorar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close popover */}
      {activeErrorId && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setActiveErrorId(null);
            setPopoverPosition(null);
          }}
        />
      )}
    </div>
  );
});

InlineSpellCheckEditor.displayName = "InlineSpellCheckEditor";
