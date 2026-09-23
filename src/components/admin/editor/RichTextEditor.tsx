/**
 * Rich-text editor for article bodies, built on TipTap.
 *
 * Produces clean HTML (headings, paragraphs, bold/italic/underline/strike,
 * lists, quotes, links, images, alignment, rules). Anything else pasted in,
 * such as inline font styles from Word or the old site, is dropped.
 */
import React, { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { CharacterCount, Placeholder } from '@tiptap/extensions';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Eraser,
  Heading2,
  Heading3,
  Heading4,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
  Unlink
} from 'lucide-react';

export const WORDS_PER_MINUTE = 200;

/** Estimated minutes to read some HTML, the same way the server counts it. */
export function estimateReadingTime(html: string) {
  const words = countWords(html);
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

export function countWords(html: string) {
  return String(html || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
}

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  /**
   * Opens an image picker (the media library, in phase 4). When absent, the
   * image button asks for an image address instead.
   */
  onRequestImage?: (insert: (image: { src: string; alt?: string }) => void) => void;
}

type Prompt = { kind: 'link' | 'image'; url: string; alt: string } | null;

const EMPTY_DOC = '<p></p>';

function ToolbarButton({
  label,
  icon: Icon,
  onClick,
  active,
  disabled
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors disabled:opacity-35 disabled:pointer-events-none ${
        active
          ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
      }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

const Divider = () => <span className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" aria-hidden="true" />;

function Toolbar({
  editor,
  sourceMode,
  onToggleSource,
  onPrompt
}: {
  editor: Editor;
  sourceMode: boolean;
  onToggleSource: () => void;
  onPrompt: (kind: 'link' | 'image') => void;
}) {
  // Re-render the toolbar when the selection's formatting changes.
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      paragraph: e.isActive('paragraph'),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      h4: e.isActive('heading', { level: 4 }),
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      link: e.isActive('link'),
      left: e.isActive({ textAlign: 'left' }),
      center: e.isActive({ textAlign: 'center' }),
      right: e.isActive({ textAlign: 'right' }),
      justify: e.isActive({ textAlign: 'justify' }),
      canUndo: e.can().undo(),
      canRedo: e.can().redo()
    })
  });
  const chain = () => editor.chain().focus();
  const off = sourceMode;

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 sticky top-0 z-10">
      <ToolbarButton label="Undo" icon={Undo2} onClick={() => chain().undo().run()} disabled={off || !state.canUndo} />
      <ToolbarButton label="Redo" icon={Redo2} onClick={() => chain().redo().run()} disabled={off || !state.canRedo} />
      <Divider />
      <ToolbarButton label="Paragraph" icon={Pilcrow} onClick={() => chain().setParagraph().run()} active={state.paragraph} disabled={off} />
      <ToolbarButton label="Heading 2" icon={Heading2} onClick={() => chain().toggleHeading({ level: 2 }).run()} active={state.h2} disabled={off} />
      <ToolbarButton label="Heading 3" icon={Heading3} onClick={() => chain().toggleHeading({ level: 3 }).run()} active={state.h3} disabled={off} />
      <ToolbarButton label="Heading 4" icon={Heading4} onClick={() => chain().toggleHeading({ level: 4 }).run()} active={state.h4} disabled={off} />
      <Divider />
      <ToolbarButton label="Bold" icon={Bold} onClick={() => chain().toggleBold().run()} active={state.bold} disabled={off} />
      <ToolbarButton label="Italic" icon={Italic} onClick={() => chain().toggleItalic().run()} active={state.italic} disabled={off} />
      <ToolbarButton label="Underline" icon={UnderlineIcon} onClick={() => chain().toggleUnderline().run()} active={state.underline} disabled={off} />
      <ToolbarButton label="Strikethrough" icon={Strikethrough} onClick={() => chain().toggleStrike().run()} active={state.strike} disabled={off} />
      <Divider />
      <ToolbarButton label="Bulleted list" icon={List} onClick={() => chain().toggleBulletList().run()} active={state.bullet} disabled={off} />
      <ToolbarButton label="Numbered list" icon={ListOrdered} onClick={() => chain().toggleOrderedList().run()} active={state.ordered} disabled={off} />
      <ToolbarButton label="Quote" icon={Quote} onClick={() => chain().toggleBlockquote().run()} active={state.quote} disabled={off} />
      <ToolbarButton label="Divider line" icon={Minus} onClick={() => chain().setHorizontalRule().run()} disabled={off} />
      <Divider />
      <ToolbarButton label="Align left" icon={AlignLeft} onClick={() => chain().setTextAlign('left').run()} active={state.left} disabled={off} />
      <ToolbarButton label="Align centre" icon={AlignCenter} onClick={() => chain().setTextAlign('center').run()} active={state.center} disabled={off} />
      <ToolbarButton label="Align right" icon={AlignRight} onClick={() => chain().setTextAlign('right').run()} active={state.right} disabled={off} />
      <ToolbarButton label="Justify" icon={AlignJustify} onClick={() => chain().setTextAlign('justify').run()} active={state.justify} disabled={off} />
      <Divider />
      <ToolbarButton label={state.link ? 'Edit link' : 'Add link'} icon={LinkIcon} onClick={() => onPrompt('link')} active={state.link} disabled={off} />
      {state.link && (
        <ToolbarButton label="Remove link" icon={Unlink} onClick={() => chain().extendMarkRange('link').unsetLink().run()} disabled={off} />
      )}
      <ToolbarButton label="Insert image" icon={ImageIcon} onClick={() => onPrompt('image')} disabled={off} />
      <ToolbarButton label="Clear formatting" icon={Eraser} onClick={() => chain().unsetAllMarks().clearNodes().run()} disabled={off} />
      <span className="flex-1" />
      <ToolbarButton label={sourceMode ? 'Back to visual editor' : 'Edit HTML'} icon={Code2} onClick={onToggleSource} active={sourceMode} />
    </div>
  );
}

function isSafeUrl(url: string) {
  return /^(https?:\/\/|mailto:|\/)/i.test(url.trim());
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write the story here. Use the toolbar for headings, lists, quotes, links and images.',
  className = '',
  onRequestImage
}) => {
  const [sourceMode, setSourceMode] = useState(false);
  const [source, setSource] = useState(value);
  const [prompt, setPrompt] = useState<Prompt>(null);
  const [promptError, setPromptError] = useState<string | null>(null);
  const lastEmitted = useRef(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: 'https',
          HTMLAttributes: { rel: 'noopener noreferrer', target: null }
        }
      }),
      Image.configure({ allowBase64: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
      CharacterCount
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'prose max-w-none min-h-[320px] px-5 py-4 outline-none text-slate-800 dark:text-slate-200',
        'aria-label': 'Article body',
        role: 'textbox',
        'aria-multiline': 'true'
      }
    },
    onUpdate: ({ editor: e }) => {
      const html = e.isEmpty ? '' : e.getHTML();
      lastEmitted.current = html;
      onChangeRef.current(html);
    }
  });

  // Load new content when the parent replaces it (another article opened).
  useEffect(() => {
    if (!editor || value === lastEmitted.current) return;
    lastEmitted.current = value;
    editor.commands.setContent(value || '', { emitUpdate: false });
    setSource(value);
  }, [editor, value]);

  if (!editor) return null;

  const words = editor.storage.characterCount?.words?.() ?? countWords(value);
  const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));

  const toggleSource = () => {
    if (sourceMode) {
      editor.commands.setContent(source || EMPTY_DOC, { emitUpdate: true });
    } else {
      setSource(editor.isEmpty ? '' : editor.getHTML());
    }
    setSourceMode((m) => !m);
  };

  const openPrompt = (kind: 'link' | 'image') => {
    setPromptError(null);
    if (kind === 'image' && onRequestImage) {
      onRequestImage(({ src, alt }) => editor.chain().focus().setImage({ src, alt: alt || '' }).run());
      return;
    }
    const url = kind === 'link' ? editor.getAttributes('link').href || '' : '';
    setPrompt({ kind, url, alt: '' });
  };

  const applyPrompt = () => {
    if (!prompt) return;
    const url = prompt.url.trim();
    if (prompt.kind === 'link') {
      if (!url) {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
      } else if (!isSafeUrl(url) && !/^[\w.-]+\.[a-z]{2,}/i.test(url)) {
        setPromptError('Enter a web address, like https://example.com');
        return;
      } else {
        const href = isSafeUrl(url) ? url : `https://${url}`;
        if (editor.state.selection.empty && !editor.isActive('link')) {
          editor.chain().focus().insertContent({ type: 'text', text: url, marks: [{ type: 'link', attrs: { href } }] }).run();
        } else {
          editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
        }
      }
    } else {
      if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) {
        setPromptError('Enter the image address, starting with https://');
        return;
      }
      editor.chain().focus().setImage({ src: url, alt: prompt.alt.trim() }).run();
    }
    setPrompt(null);
  };

  return (
    <div className={`rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden focus-within:border-emerald-500 ${className}`}>
      <Toolbar editor={editor} sourceMode={sourceMode} onToggleSource={toggleSource} onPrompt={openPrompt} />

      {prompt && (
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-emerald-50/60 dark:bg-emerald-950/30 text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-200">{prompt.kind === 'link' ? 'Link to' : 'Image address'}</span>
          <input
            autoFocus
            type="url"
            value={prompt.url}
            onChange={(e) => setPrompt({ ...prompt, url: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyPrompt();
              }
              if (e.key === 'Escape') setPrompt(null);
            }}
            placeholder={prompt.kind === 'link' ? 'https://example.com' : 'https://…/photo.jpg'}
            className="flex-1 min-w-[12rem] h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
          />
          {prompt.kind === 'image' && (
            <input
              type="text"
              value={prompt.alt}
              onChange={(e) => setPrompt({ ...prompt, alt: e.target.value })}
              placeholder="Describe the image (alt text)"
              className="flex-1 min-w-[10rem] h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
            />
          )}
          <button type="button" onClick={applyPrompt} className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
            {prompt.kind === 'link' ? (prompt.url ? 'Apply' : 'Remove link') : 'Insert'}
          </button>
          <button type="button" onClick={() => setPrompt(null)} className="h-8 px-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold">
            Cancel
          </button>
          {promptError && <span className="w-full text-red-600 dark:text-red-400">{promptError}</span>}
        </div>
      )}

      {sourceMode ? (
        <textarea
          value={source}
          onChange={(e) => {
            setSource(e.target.value);
          }}
          spellCheck={false}
          aria-label="Article HTML"
          className="block w-full min-h-[320px] px-5 py-4 font-mono text-xs leading-relaxed bg-slate-950 text-emerald-200 outline-none resize-y"
        />
      ) : (
        <EditorContent editor={editor} className="rich-text-editor" />
      )}

      <div className="flex items-center justify-between gap-3 px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
        <span>{sourceMode ? 'Editing HTML. Switch back to see the formatted story.' : 'Paste from Word or Google Docs keeps headings, lists and links.'}</span>
        <span className="tabular-nums whitespace-nowrap">
          {words.toLocaleString()} words · {minutes} min read
        </span>
      </div>
    </div>
  );
};

export default RichTextEditor;
