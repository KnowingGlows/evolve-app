"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { Bold, Italic, Strikethrough, List, ListOrdered, Heading1, Heading2, Code, Quote, Link as LinkIcon, Undo2, Redo2 } from "lucide-react";
import { useEffect } from "react";

interface RichTextProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  variant?: "compact" | "document";
}

export function RichText({ value, onChange, placeholder, minHeight = 200, variant = "document" }: RichTextProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
      }),
      Placeholder.configure({ placeholder: placeholder || "Start writing…" }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-violet-400 underline underline-offset-2 decoration-violet-400/40 hover:decoration-violet-400" },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: `prose-invert max-w-none outline-none text-white/80 leading-relaxed ${variant === "document" ? "text-[15px]" : "text-sm"}`,
        style: `min-height: ${minHeight}px;`,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return null;

  const Btn = ({ active, onClick, children, title }: { active?: boolean; onClick: () => void; children: React.ReactNode; title: string }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-md transition-colors ${active ? "bg-violet-500/20 text-violet-300" : "text-white/40 hover:text-white hover:bg-white/5"}`}
    >
      {children}
    </button>
  );

  const addLink = () => {
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("URL", prev || "https://");
    if (url === null) return;
    if (url === "") return editor.chain().focus().extendMarkRange("link").unsetLink().run();
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="rich-text">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 mb-3 flex-wrap sticky top-0 z-10 bg-[#0a0a12]/80 backdrop-blur-sm py-2 -my-2">
        <Btn title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 size={15} /></Btn>
        <Btn title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={15} /></Btn>
        <div className="w-px h-5 bg-white/10 mx-1" />
        <Btn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={14} /></Btn>
        <Btn title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={14} /></Btn>
        <Btn title="Strike" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={14} /></Btn>
        <Btn title="Code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}><Code size={14} /></Btn>
        <div className="w-px h-5 bg-white/10 mx-1" />
        <Btn title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={15} /></Btn>
        <Btn title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={15} /></Btn>
        <Btn title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={14} /></Btn>
        <Btn title="Link" active={editor.isActive("link")} onClick={addLink}><LinkIcon size={14} /></Btn>
        <div className="w-px h-5 bg-white/10 mx-1" />
        <Btn title="Undo" onClick={() => editor.chain().focus().undo().run()}><Undo2 size={14} /></Btn>
        <Btn title="Redo" onClick={() => editor.chain().focus().redo().run()}><Redo2 size={14} /></Btn>
      </div>

      <EditorContent editor={editor} />

      <style jsx global>{`
        .rich-text .ProseMirror {
          outline: none;
        }
        .rich-text .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: rgba(255, 255, 255, 0.2);
          float: left;
          pointer-events: none;
          height: 0;
        }
        .rich-text .ProseMirror h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: white;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          line-height: 1.2;
        }
        .rich-text .ProseMirror h2 {
          font-size: 1.3rem;
          font-weight: 600;
          color: white;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          line-height: 1.3;
        }
        .rich-text .ProseMirror h3 {
          font-size: 1.05rem;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
          margin-top: 1rem;
          margin-bottom: 0.4rem;
        }
        .rich-text .ProseMirror p {
          margin: 0.5rem 0;
        }
        .rich-text .ProseMirror ul, .rich-text .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .rich-text .ProseMirror ul {
          list-style: disc;
        }
        .rich-text .ProseMirror ol {
          list-style: decimal;
        }
        .rich-text .ProseMirror li {
          margin: 0.2rem 0;
        }
        .rich-text .ProseMirror li p {
          margin: 0;
        }
        .rich-text .ProseMirror blockquote {
          border-left: 3px solid rgba(139, 92, 246, 0.4);
          padding-left: 1rem;
          margin: 0.75rem 0;
          color: rgba(255,255,255,0.6);
          font-style: italic;
        }
        .rich-text .ProseMirror code {
          background: rgba(255,255,255,0.06);
          border-radius: 4px;
          padding: 2px 5px;
          font-size: 0.85em;
          font-family: ui-monospace, SFMono-Regular, monospace;
          color: rgba(167, 139, 250, 1);
        }
        .rich-text .ProseMirror strong {
          color: white;
          font-weight: 600;
        }
        .rich-text .ProseMirror em {
          color: rgba(255,255,255,0.9);
        }
        .rich-text .ProseMirror hr {
          border: none;
          border-top: 1px solid rgba(255,255,255,0.06);
          margin: 1.5rem 0;
        }
      `}</style>
    </div>
  );
}
