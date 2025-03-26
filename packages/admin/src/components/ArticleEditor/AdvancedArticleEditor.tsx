import TextEditor from "../TextEditor/TextEditor";
import { useRichTextEditor } from "../TextEditor/hooks";

export default function AdvancedArticleEditor() {
  const { editor } = useRichTextEditor();
  return <div> {editor && <TextEditor editor={editor!} />}</div>;
}
