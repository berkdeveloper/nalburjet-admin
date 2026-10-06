"use client";

import {
    Bold,
    Italic,
    Link as LinkIcon,
    List,
    ListOrdered,
    Quote,
    Redo2,
    RemoveFormatting,
    Underline as UnderlineIcon,
    Undo2,
} from "lucide-react";
import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";

function ToolbarButton({
    onClick,
    active = false,
    disabled = false,
    title,
    children,
}) {
    return (
        <button
            type="button"
            onMouseDown={(event) => {
                event.preventDefault();
            }}
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${active
                    ? "bg-primary text-white"
                    : "text-text-secondary hover:bg-background-soft hover:text-text-primary"
                } disabled:cursor-not-allowed disabled:opacity-40`}
        >
            {children}
        </button>
    );
}

export default function RichTextEditor({
    value,
    onChange,
    disabled = false,
}) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                bulletList: {
                    keepMarks: true,
                    keepAttributes: true,
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: true,
                },
            }),
            Underline,
            Link.configure({
                openOnClick: false,
                autolink: true,
                defaultProtocol: "https",
            }),
        ],
        content: value ?? "",
        immediatelyRender: false,
        editable: !disabled,
        onUpdate: ({ editor: currentEditor }) => {
            onChange?.(currentEditor.getHTML());
        },
    });

    useEffect(() => {
        if (!editor) {
            return;
        }

        editor.setEditable(!disabled);
    }, [disabled, editor]);

    useEffect(() => {
        if (!editor) {
            return;
        }

        const currentHtml = editor.getHTML();

        if (value !== currentHtml) {
            editor.commands.setContent(value ?? "", {
                emitUpdate: false,
            });
        }
    }, [editor, value]);

    if (!editor) {
        return (
            <div className="min-h-48 rounded-lg border border-border bg-white" />
        );
    }

    function handleAddLink() {
        const previousUrl = editor.getAttributes("link").href;
        const url = window.prompt("Bağlantı adresi:", previousUrl ?? "");

        if (url === null) {
            return;
        }

        if (!url.trim()) {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }

        editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: url.trim() })
            .run();
    }

    return (
        <div className="overflow-hidden rounded-lg border border-border bg-white">
            <div className="flex flex-wrap items-center gap-1 border-b border-border bg-background-soft p-2">
                <ToolbarButton
                    title="Kalın"
                    active={editor.isActive("bold")}
                    disabled={!editor.can().chain().focus().toggleBold().run()}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    <Bold className="h-4 w-4" />
                </ToolbarButton>

                <ToolbarButton
                    title="İtalik"
                    active={editor.isActive("italic")}
                    disabled={!editor.can().chain().focus().toggleItalic().run()}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    <Italic className="h-4 w-4" />
                </ToolbarButton>

                <ToolbarButton
                    title="Altı çizili"
                    active={editor.isActive("underline")}
                    disabled={!editor.can().chain().focus().toggleUnderline().run()}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                >
                    <UnderlineIcon className="h-4 w-4" />
                </ToolbarButton>

                <div className="mx-1 h-5 w-px bg-border" />

                <select
                    value={
                        editor.isActive("heading", { level: 1 })
                            ? "1"
                            : editor.isActive("heading", { level: 2 })
                                ? "2"
                                : editor.isActive("heading", { level: 3 })
                                    ? "3"
                                    : "paragraph"
                    }
                    onChange={(event) => {
                        const value = event.target.value;

                        if (value === "paragraph") {
                            editor.chain().focus().setParagraph().run();
                            return;
                        }

                        editor
                            .chain()
                            .focus()
                            .toggleHeading({ level: Number(value) })
                            .run();
                    }}
                    className="h-8 rounded-md border border-border bg-white px-2 text-xs font-medium text-text-primary outline-none focus:border-primary"
                    title="Metin biçimi"
                >
                    <option value="paragraph">Normal</option>
                    <option value="1">Başlık 1</option>
                    <option value="2">Başlık 2</option>
                    <option value="3">Başlık 3</option>
                </select>

                <div className="mx-1 h-5 w-px bg-border" />

                <ToolbarButton
                    title="Madde işaretli liste"
                    active={editor.isActive("bulletList")}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                >
                    <List className="h-4 w-4" />
                </ToolbarButton>

                <ToolbarButton
                    title="Numaralı liste"
                    active={editor.isActive("orderedList")}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                >
                    <ListOrdered className="h-4 w-4" />
                </ToolbarButton>

                <ToolbarButton
                    title="Alıntı"
                    active={editor.isActive("blockquote")}
                    disabled={
                        !editor.can().chain().focus().toggleBlockquote().run()
                    }
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                >
                    <Quote className="h-4 w-4" />
                </ToolbarButton>

                <ToolbarButton
                    title="Bağlantı ekle"
                    active={editor.isActive("link")}
                    onClick={handleAddLink}
                >
                    <LinkIcon className="h-4 w-4" />
                </ToolbarButton>

                <div className="mx-1 h-5 w-px bg-border" />

                <ToolbarButton
                    title="Biçimlendirmeyi temizle"
                    onClick={() =>
                        editor.chain().focus().clearNodes().unsetAllMarks().run()
                    }
                >
                    <RemoveFormatting className="h-4 w-4" />
                </ToolbarButton>

                <ToolbarButton
                    title="Geri al"
                    disabled={!editor.can().chain().focus().undo().run()}
                    onClick={() => editor.chain().focus().undo().run()}
                >
                    <Undo2 className="h-4 w-4" />
                </ToolbarButton>

                <ToolbarButton
                    title="İleri al"
                    disabled={!editor.can().chain().focus().redo().run()}
                    onClick={() => editor.chain().focus().redo().run()}
                >
                    <Redo2 className="h-4 w-4" />
                </ToolbarButton>
            </div>

            <EditorContent
                editor={editor}
                className="rich-text-editor min-h-48"
            />
        </div>
    );
}