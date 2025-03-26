import { useEditor } from "@tiptap/react";
import { Link } from "@mantine/tiptap";
import Highlight from "@tiptap/extension-highlight";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Superscript from "@tiptap/extension-superscript";
import SubScript from "@tiptap/extension-subscript";

export const useRichTextEditor = (content: string = "") => {
  const editor = useEditor({
    extensions: [
      //@ts-expect-error types miss-alignment
      StarterKit,
      Underline,
      Link,
      Superscript,
      SubScript,
      Highlight,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content,
  });

  const resetEditor = () => editor?.commands.clearContent();

  const setEditorContent = (html: string) => {
    resetEditor();
    editor?.commands.insertContent(html);
  };

  const getEditorHTML = () => editor?.getHTML();

  return { editor, setEditorContent, getEditorHTML, resetEditor };
};
