import { useEffect, forwardRef, useImperativeHandle, useRef } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle, FontSize } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import FontFamily from "@tiptap/extension-font-family";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { cn } from "@/lib/utils";
import { toEditorHtml, htmlToPlain } from "@/lib/htmlPlain";
import { useActiveEditor } from "./ActiveEditorContext";

export interface RichTextEditorHandle {
  focus: () => void;
  getEditor: () => Editor | null;
  getPlainText: () => string;
}

interface RichTextEditorProps {
  value: string;
  onChange: (html: string, plain: string) => void;
  onBlur?: () => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  ({ value, onChange, onBlur, onKeyDown, placeholder, className, minHeight = 60 }, ref) => {
    const { setActiveEditor } = useActiveEditor();
    const lastEmittedRef = useRef<string>("");

    const editor = useEditor({
      extensions: [
        StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
        Underline,
        TextStyle,
        FontSize,
        Color,
        Highlight.configure({ multicolor: true }),
        FontFamily,
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        Link.configure({ openOnClick: false, autolink: true }),
        Placeholder.configure({ placeholder: placeholder || "" }),
        TaskList,
        TaskItem.configure({ nested: true }),
      ],
      content: toEditorHtml(value),
      editorProps: {
        attributes: {
          class: cn(
            "tiptap font-poppins focus:outline-none w-full",
            "prose prose-sm max-w-none dark:prose-invert",
            className,
          ),
          style: `min-height:${minHeight}px;line-height:1.6;`,
          spellcheck: "true",
          "data-gramm": "true",
        },
        handleKeyDown: (_view, event) => {
          if (onKeyDown) onKeyDown(event);
          return false;
        },
      },
      onUpdate: ({ editor: ed }) => {
        const html = ed.getHTML();
        if (html === lastEmittedRef.current) return;
        lastEmittedRef.current = html;
        onChange(html, htmlToPlain(html));
      },
      onFocus: ({ editor: ed }) => setActiveEditor(ed),
      onBlur: () => onBlur?.(),
    });

    // Sync external value changes (realtime, find/replace, IA, etc.)
    useEffect(() => {
      if (!editor) return;
      const incoming = toEditorHtml(value);
      if (incoming === editor.getHTML()) return;
      // Don't fight the user while focused
      if (editor.isFocused) return;
      editor.commands.setContent(incoming, { emitUpdate: false });
      lastEmittedRef.current = incoming;
    }, [value, editor]);

    useImperativeHandle(ref, () => ({
      focus: () => editor?.commands.focus(),
      getEditor: () => editor,
      getPlainText: () => (editor ? htmlToPlain(editor.getHTML()) : ""),
    }));

    return <EditorContent editor={editor} />;
  },
);

RichTextEditor.displayName = "RichTextEditor";