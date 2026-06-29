import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { Editor } from "@tiptap/react";

interface ActiveEditorContextValue {
  editor: Editor | null;
  setActiveEditor: (editor: Editor | null) => void;
}

const ActiveEditorContext = createContext<ActiveEditorContextValue>({
  editor: null,
  setActiveEditor: () => {},
});

export function ActiveEditorProvider({ children }: { children: ReactNode }) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const setActiveEditor = useCallback((e: Editor | null) => setEditor(e), []);
  return (
    <ActiveEditorContext.Provider value={{ editor, setActiveEditor }}>
      {children}
    </ActiveEditorContext.Provider>
  );
}

export function useActiveEditor() {
  return useContext(ActiveEditorContext);
}