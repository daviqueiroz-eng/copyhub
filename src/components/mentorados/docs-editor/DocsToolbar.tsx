import { useActiveEditor } from "./ActiveEditorContext";
import { Button } from "@/components/ui/button";
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
import {
  Bold,
  Italic,
  Underline,
  Link2,
  List,
  ListOrdered,
  ListChecks,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Minus,
  Plus,
  Palette,
  Highlighter,
  Indent,
  Outdent,
  RemoveFormatting,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback } from "react";

const FONTS = ["Poppins", "Inter", "Arial", "Georgia", "Courier New", "Times New Roman"];
const COLORS = [
  "#000000", "#374151", "#6B7280", "#EF4444", "#F59E0B",
  "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#B8860B",
];
const HIGHLIGHTS = [
  "#FEF3C7", "#FCE7F3", "#DBEAFE", "#D1FAE5", "#FEE2E2",
  "#E9D5FF", "#FED7AA", "#F3E8FF", "transparent",
];

export function DocsToolbar() {
  const { editor } = useActiveEditor();
  const disabled = !editor;

  const getCurrentSize = useCallback(() => {
    if (!editor) return 14;
    const size = editor.getAttributes("textStyle").fontSize;
    if (typeof size === "string") {
      const n = parseInt(size, 10);
      if (!isNaN(n)) return n;
    }
    return 14;
  }, [editor]);

  const setSize = (n: number) => {
    if (!editor) return;
    const clamped = Math.max(8, Math.min(96, n));
    editor.chain().focus().setFontSize(`${clamped}px`).run();
  };

  const currentStyle = (() => {
    if (!editor) return "paragraph";
    if (editor.isActive("heading", { level: 1 })) return "h1";
    if (editor.isActive("heading", { level: 2 })) return "h2";
    if (editor.isActive("heading", { level: 3 })) return "h3";
    return "paragraph";
  })();

  const currentFont = editor?.getAttributes("textStyle").fontFamily || "Poppins";

  const setStyle = (v: string) => {
    if (!editor) return;
    const c = editor.chain().focus();
    if (v === "paragraph") c.setParagraph().run();
    else if (v === "h1") c.toggleHeading({ level: 1 }).run();
    else if (v === "h2") c.toggleHeading({ level: 2 }).run();
    else if (v === "h3") c.toggleHeading({ level: 3 }).run();
  };

  const setFont = (f: string) => editor?.chain().focus().setFontFamily(f).run();

  const insertLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("URL do link", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  };

  const btn = (active: boolean) =>
    cn(
      "h-8 w-8 p-0",
      active && "bg-accent text-accent-foreground",
    );

  return (
    <div
      className={cn(
        "flex items-center gap-1 px-3 py-1.5 bg-card rounded-full border shadow-sm",
        "overflow-x-auto whitespace-nowrap",
        disabled && "opacity-50 pointer-events-none",
      )}
    >
      {/* Estilo de parágrafo */}
      <Select value={currentStyle} onValueChange={setStyle}>
        <SelectTrigger className="h-8 w-[88px] rounded-md border-0 bg-transparent hover:bg-accent text-xs px-2">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="paragraph">Texto normal</SelectItem>
          <SelectItem value="h1">Título 1</SelectItem>
          <SelectItem value="h2">Título 2</SelectItem>
          <SelectItem value="h3">Título 3</SelectItem>
        </SelectContent>
      </Select>

      <div className="h-5 w-px bg-border mx-1" />

      {/* Fonte */}
      <Select value={currentFont} onValueChange={setFont}>
        <SelectTrigger className="h-8 w-[78px] rounded-md border-0 bg-transparent hover:bg-accent text-xs px-2">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FONTS.map((f) => (
            <SelectItem key={f} value={f} style={{ fontFamily: f }}>
              {f}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="h-5 w-px bg-border mx-1" />

      {/* Tamanho */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setSize(getCurrentSize() - 1)}
          title="Diminuir"
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <input
          type="number"
          value={getCurrentSize()}
          onChange={(e) => setSize(parseInt(e.target.value, 10) || 14)}
          className="h-7 w-10 text-center text-xs bg-transparent border rounded"
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setSize(getCurrentSize() + 1)}
          title="Aumentar"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="h-5 w-px bg-border mx-1" />

      {/* Bold/Italic/Underline */}
      <Button variant="ghost" size="icon" className={btn(!!editor?.isActive("bold"))} onClick={() => editor?.chain().focus().toggleBold().run()} title="Negrito (Ctrl+B)">
        <Bold className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className={btn(!!editor?.isActive("italic"))} onClick={() => editor?.chain().focus().toggleItalic().run()} title="Itálico (Ctrl+I)">
        <Italic className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className={btn(!!editor?.isActive("underline"))} onClick={() => editor?.chain().focus().toggleUnderline().run()} title="Sublinhado (Ctrl+U)">
        <Underline className="h-4 w-4" />
      </Button>

      {/* Cor do texto */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Cor do texto">
            <Palette className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="grid grid-cols-5 gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                className="h-6 w-6 rounded border hover:scale-110 transition-transform"
                style={{ background: c }}
                onClick={() => editor?.chain().focus().setColor(c).run()}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Marca-texto */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Marca-texto">
            <Highlighter className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="grid grid-cols-5 gap-1.5">
            {HIGHLIGHTS.map((c) => (
              <button
                key={c}
                className="h-6 w-6 rounded border hover:scale-110 transition-transform"
                style={{ background: c === "transparent" ? "white" : c, backgroundImage: c === "transparent" ? "linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%),linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%)" : undefined, backgroundSize: c === "transparent" ? "6px 6px" : undefined, backgroundPosition: c === "transparent" ? "0 0,3px 3px" : undefined }}
                onClick={() => {
                  if (c === "transparent") editor?.chain().focus().unsetHighlight().run();
                  else editor?.chain().focus().setHighlight({ color: c }).run();
                }}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <div className="h-5 w-px bg-border mx-1" />

      {/* Link */}
      <Button variant="ghost" size="icon" className={btn(!!editor?.isActive("link"))} onClick={insertLink} title="Link (Ctrl+K)">
        <Link2 className="h-4 w-4" />
      </Button>

      <div className="h-5 w-px bg-border mx-1" />

      {/* Alinhamento */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Alinhamento">
            <AlignLeft className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1 flex gap-1">
          <Button variant="ghost" size="icon" className={btn(!!editor?.isActive({ textAlign: "left" }))} onClick={() => editor?.chain().focus().setTextAlign("left").run()}>
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className={btn(!!editor?.isActive({ textAlign: "center" }))} onClick={() => editor?.chain().focus().setTextAlign("center").run()}>
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className={btn(!!editor?.isActive({ textAlign: "right" }))} onClick={() => editor?.chain().focus().setTextAlign("right").run()}>
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className={btn(!!editor?.isActive({ textAlign: "justify" }))} onClick={() => editor?.chain().focus().setTextAlign("justify").run()}>
            <AlignJustify className="h-4 w-4" />
          </Button>
        </PopoverContent>
      </Popover>

      {/* Listas */}
      <Button variant="ghost" size="icon" className={btn(!!editor?.isActive("bulletList"))} onClick={() => editor?.chain().focus().toggleBulletList().run()} title="Lista">
        <List className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className={btn(!!editor?.isActive("orderedList"))} onClick={() => editor?.chain().focus().toggleOrderedList().run()} title="Lista numerada">
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className={btn(!!editor?.isActive("taskList"))} onClick={() => editor?.chain().focus().toggleTaskList().run()} title="Checklist">
        <ListChecks className="h-4 w-4" />
      </Button>

      {/* Recuo */}
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor?.chain().focus().sinkListItem("listItem").run()} title="Aumentar recuo">
        <Indent className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor?.chain().focus().liftListItem("listItem").run()} title="Diminuir recuo">
        <Outdent className="h-4 w-4" />
      </Button>

      <div className="h-5 w-px bg-border mx-1" />

      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()} title="Limpar formatação">
        <RemoveFormatting className="h-4 w-4" />
      </Button>
    </div>
  );
}