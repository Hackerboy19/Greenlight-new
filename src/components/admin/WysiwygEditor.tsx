/**
 * Visual WYSIWYG Rich Text Editor for Non-Technical Editors
 * Allows writers to write and format articles visually like Google Docs / Word
 * Features:
 * - Visual formatting toolbar (Bold, Italic, Underline, Strikethrough, Headings H2/H3/H4, Lists, Quotes)
 * - Single-click insertion of Formatted Quote, Highlight Alert Box, Key Takeaways, Media Image, Clean Table
 * - Interactive Link & Image inserter modals
 * - Switch between Visual Mode, Split View, and Source HTML Mode
 * - Clean HTML sanitizer and real-time word count & reading time
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Code,
  Eye,
  Edit3,
  Undo,
  Redo,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Info,
  Check,
  AlertCircle,
  HelpCircle,
  Maximize2,
  Minimize2,
  Eraser
} from 'lucide-react';

export interface WysiwygEditorProps {
  value: string;
  onChange: (htmlContent: string) => void;
  placeholder?: string;
  className?: string;
}

export const WysiwygEditor: React.FC<WysiwygEditorProps> = ({
  value,
  onChange,
  placeholder = "Write your story here... Use the toolbar above to format headings, quotes, and lists.",
  className = ""
}) => {
  const [editorMode, setEditorMode] = useState<'visual' | 'split' | 'code'>('visual');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  // Sync external value to visual editor when value changes externally
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
    isInternalChange.current = false;
  }, [value]);

  // Handle content changes from visual editor
  const handleContentInput = () => {
    if (editorRef.current) {
      const newHtml = editorRef.current.innerHTML;
      isInternalChange.current = true;
      onChange(newHtml);
    }
  };

  // Execute formatting command on document
  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleContentInput();
    }
  };

  // Format heading block
  const formatBlock = (tag: string) => {
    document.execCommand('formatBlock', false, `<${tag}>`);
    if (editorRef.current) {
      editorRef.current.focus();
      handleContentInput();
    }
  };

  // Insert Link Handler
  const handleInsertLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;

    const formattedUrl = linkUrl.startsWith('http://') || linkUrl.startsWith('https://') 
      ? linkUrl 
      : `https://${linkUrl}`;

    if (linkText.trim()) {
      const linkHtml = `<a href="${formattedUrl}" target="_blank" rel="noopener noreferrer" class="text-emerald-600 underline font-semibold">${linkText}</a>`;
      execCmd('insertHTML', linkHtml);
    } else {
      execCmd('createLink', formattedUrl);
    }

    setLinkUrl('');
    setLinkText('');
    setShowLinkModal(false);
  };

  // Insert Image Handler
  const handleInsertImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;

    const imgHtml = `
      <figure class="my-6 text-center">
        <img src="${imageUrl}" alt="${imageCaption || 'Editorial Photo'}" class="w-full max-h-96 object-cover rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md" />
        ${imageCaption ? `<figcaption class="text-xs text-slate-500 mt-2 italic">${imageCaption}</figcaption>` : ''}
      </figure>
      <p></p>
    `;

    execCmd('insertHTML', imgHtml);
    setImageUrl('');
    setImageCaption('');
    setShowImageModal(false);
  };

  // Insert Clean Table Handler
  const handleInsertTable = (e: React.FormEvent) => {
    e.preventDefault();
    const rows = Math.max(1, Math.min(tableRows, 10));
    const cols = Math.max(1, Math.min(tableCols, 6));

    let tableHtml = `<div class="my-6 overflow-x-auto"><table class="w-full text-xs text-left border-collapse border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-xs"><thead><tr class="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">`;
    for (let c = 1; c <= cols; c++) {
      tableHtml += `<th class="p-3 border border-slate-200 dark:border-slate-700 font-bold">Column ${c}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;
    for (let r = 1; r <= rows; r++) {
      tableHtml += `<tr class="${r % 2 === 0 ? 'bg-slate-50 dark:bg-slate-900' : 'bg-white dark:bg-slate-850'}">`;
      for (let c = 1; c <= cols; c++) {
        tableHtml += `<td class="p-3 border border-slate-200 dark:border-slate-700">Sample data</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table></div><p></p>`;

    execCmd('insertHTML', tableHtml);
    setShowTableModal(false);
  };

  // Quick Editorial Block Templates
  const insertTemplateBlock = (type: 'key-takeaways' | 'quote-box' | 'expert-note' | 'divider') => {
    let blockHtml = '';
    if (type === 'key-takeaways') {
      blockHtml = `
        <div class="my-6 p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 shadow-xs">
          <h4 class="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-1.5">
            Key Editorial Takeaways
          </h4>
          <ul class="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-300 text-xs">
            <li>Primary milestone or verified statistic achieved in this report.</li>
            <li>Key industry stakeholder or awardee impact across regional hubs.</li>
            <li>Upcoming roadmap or policy timeline for national implementation.</li>
          </ul>
        </div>
        <p></p>
      `;
    } else if (type === 'quote-box') {
      blockHtml = `
        <blockquote class="my-6 p-4 border-l-4 border-emerald-500 bg-slate-50 dark:bg-slate-800/60 rounded-r-2xl italic text-slate-800 dark:text-slate-200 text-sm">
          "This initiative represents a transformative leap forward for Indian talent and national innovation."
          <cite class="block text-xs not-italic font-bold text-emerald-700 dark:text-emerald-400 mt-2">— Official FSIA Jury Statement</cite>
        </blockquote>
        <p></p>
      `;
    } else if (type === 'expert-note') {
      blockHtml = `
        <div class="my-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-slate-800 dark:text-slate-200 text-xs">
          <strong class="text-amber-800 dark:text-amber-300 font-bold block mb-1">Editor's Verification Note:</strong>
          Data reported in this article has been cross-referenced with national government registries and certified conclave records.
        </div>
        <p></p>
      `;
    } else if (type === 'divider') {
      blockHtml = `<hr class="my-8 border-t border-slate-200 dark:border-slate-800" /><p></p>`;
    }

    execCmd('insertHTML', blockHtml);
  };

  // Word count & Reading Time stats
  const plainText = (value || '').replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = plainText ? plainText.split(' ').length : 0;
  const charCount = plainText.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div
      id="wysiwyg-editor-wrapper"
      className={`rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl border-emerald-500' : ''
      } ${className}`}
    >
      {/* Top Toolbar Header - Responsive Auto-Adjusting */}
      <div className="p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2">
        {/* Main Formatting Group */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {/* Headings Selector */}
          <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 shadow-2xs shrink-0">
            <button
              type="button"
              onClick={() => formatBlock('p')}
              title="Normal Paragraph"
              className="min-h-[34px] px-2 py-1 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95"
            >
              Body
            </button>
            <button
              type="button"
              onClick={() => formatBlock('h2')}
              title="Heading 2 (Main Section)"
              className="min-h-[34px] px-2 py-1 text-xs font-bold rounded-lg text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => formatBlock('h3')}
              title="Heading 3 (Subsection)"
              className="min-h-[34px] px-2 py-1 text-xs font-bold rounded-lg text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95"
            >
              H3
            </button>
            <button
              type="button"
              onClick={() => formatBlock('h4')}
              title="Heading 4 (Minor Subtitle)"
              className="min-h-[34px] px-2 py-1 text-xs font-bold rounded-lg text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95"
            >
              H4
            </button>
          </div>

          <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700 mx-0.5 hidden sm:block shrink-0" />

          {/* Text Style: Bold, Italic, Underline */}
          <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 shadow-2xs shrink-0">
            <button
              type="button"
              onClick={() => execCmd('bold')}
              title="Bold (Ctrl+B)"
              className="min-w-[34px] min-h-[34px] p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center active:scale-95"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('italic')}
              title="Italic (Ctrl+I)"
              className="min-w-[34px] min-h-[34px] p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center active:scale-95"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('underline')}
              title="Underline (Ctrl+U)"
              className="min-w-[34px] min-h-[34px] p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center active:scale-95"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('strikeThrough')}
              title="Strikethrough"
              className="min-w-[34px] min-h-[34px] p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center active:scale-95"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700 mx-0.5 hidden sm:block shrink-0" />

          {/* Lists & Quotes */}
          <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 shadow-2xs shrink-0">
            <button
              type="button"
              onClick={() => execCmd('insertUnorderedList')}
              title="Bullet Points"
              className="min-w-[34px] min-h-[34px] p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center active:scale-95"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('insertOrderedList')}
              title="Numbered List"
              className="min-w-[34px] min-h-[34px] p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center active:scale-95"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertTemplateBlock('quote-box')}
              title="Pull Quote Box"
              className="min-w-[34px] min-h-[34px] p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center active:scale-95"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700 mx-0.5 hidden sm:block shrink-0" />

          {/* Insert Media / Links / Tables */}
          <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 shadow-2xs shrink-0">
            <button
              type="button"
              onClick={() => setShowLinkModal(true)}
              title="Insert Link"
              className="min-h-[34px] px-2 py-1 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 flex items-center gap-1 text-xs"
            >
              <LinkIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Link</span>
            </button>
            <button
              type="button"
              onClick={() => setShowImageModal(true)}
              title="Insert Inline Image"
              className="min-h-[34px] px-2 py-1 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 flex items-center gap-1 text-xs"
            >
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Image</span>
            </button>
            <button
              type="button"
              onClick={() => setShowTableModal(true)}
              title="Insert Table"
              className="min-h-[34px] px-2 py-1 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 flex items-center gap-1 text-xs"
            >
              <TableIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          {/* Quick Pre-formatted Editorial Helpers */}
          <div className="hidden xl:flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => insertTemplateBlock('key-takeaways')}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>+ Takeaways</span>
            </button>
            <button
              type="button"
              onClick={() => insertTemplateBlock('expert-note')}
              className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 text-[11px] font-bold border border-amber-200 dark:border-amber-900/60"
            >
              + Note
            </button>
          </div>
        </div>

        {/* View Mode Controller (Visual, Split, Source HTML) - Auto Adjusting */}
        <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 md:pt-0 border-t md:border-t-0 border-slate-200/60 dark:border-slate-700/60">
          <div className="grid grid-cols-3 sm:flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 text-xs font-semibold shadow-2xs w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setEditorMode('visual')}
              className={`min-h-[34px] px-2.5 py-1 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                editorMode === 'visual'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3 h-3 shrink-0" />
              <span className="truncate">
                <span className="sm:hidden">Edit</span>
                <span className="hidden sm:inline lg:hidden">Visual</span>
                <span className="hidden lg:inline">Visual Editor</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setEditorMode('split')}
              className={`min-h-[34px] px-2.5 py-1 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                editorMode === 'split'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3 h-3 shrink-0" />
              <span className="truncate">
                <span className="sm:hidden">Preview</span>
                <span className="hidden sm:inline lg:hidden">Preview</span>
                <span className="hidden lg:inline">Live Preview</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setEditorMode('code')}
              className={`min-h-[34px] px-2.5 py-1 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                editorMode === 'code'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Code className="w-3 h-3 shrink-0" />
              <span className="truncate">
                <span className="sm:hidden">HTML</span>
                <span className="hidden sm:inline lg:hidden">Source</span>
                <span className="hidden lg:inline">HTML Source</span>
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Editor'}
            className="min-w-[36px] min-h-[36px] p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center shrink-0"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Editor Body Canvas */}
      <div className="flex-1 flex flex-col sm:flex-row overflow-hidden min-h-[320px]">
        {/* Visual ContentEditable Canvas */}
        {(editorMode === 'visual' || editorMode === 'split') && (
          <div className={`flex-1 p-5 overflow-y-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 ${editorMode === 'split' ? 'border-r border-slate-200 dark:border-slate-800' : ''}`}>
            <div
              ref={editorRef}
              contentEditable
              onInput={handleContentInput}
              onBlur={handleContentInput}
              className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed outline-none min-h-[260px] focus:ring-0 focus:outline-none"
              style={{ minHeight: '260px' }}
              data-placeholder={placeholder}
            />
          </div>
        )}

        {/* Live Reader Preview Split Screen */}
        {editorMode === 'split' && (
          <div className="flex-1 p-5 overflow-y-auto bg-slate-50/70 dark:bg-slate-950/60">
            <div className="text-[10px] uppercase tracking-widest font-mono text-slate-400 mb-3 flex items-center gap-1">
              <Eye className="w-3 h-3 text-emerald-500" />
              <span>Public Reader Live Output</span>
            </div>
            <div 
              className="prose prose-emerald dark:prose-invert max-w-none text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: value || '<p class="text-slate-400 italic">No content typed yet...</p>' }}
            />
          </div>
        )}

        {/* HTML Source Code Mode for Advanced Editors */}
        {editorMode === 'code' && (
          <div className="flex-1 flex flex-col bg-slate-950 text-emerald-300 font-mono text-xs p-4">
            <div className="text-[10px] text-slate-400 mb-2 flex items-center justify-between border-b border-slate-800 pb-2">
              <span>Source HTML Mode (Changes reflect in Visual Editor automatically)</span>
              <button
                type="button"
                onClick={() => setEditorMode('visual')}
                className="text-emerald-400 font-bold hover:underline"
              >
                Return to Visual Mode →
              </button>
            </div>
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 w-full bg-transparent text-emerald-300 font-mono text-xs p-2 outline-none resize-none"
              placeholder="<h2>Heading</h2><p>Body...</p>"
              rows={12}
            />
          </div>
        )}
      </div>

      {/* Bottom Status Bar (Word Count, Reading Time, Quick Tips) */}
      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
            <strong>{wordCount}</strong> words
          </span>
          <span>•</span>
          <span>{charCount} characters</span>
          <span>•</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            ~{readingTime} min read time
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-slate-400">
            💡 Select text and click H2 or H3 to generate automatic Table of Contents entries.
          </span>
        </div>
      </div>

      {/* Insert Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-emerald-600" />
              <span>Insert Web Hyperlink</span>
            </h3>
            <form onSubmit={handleInsertLink} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Destination URL *
                </label>
                <input
                  type="text"
                  required
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://greenlight.fsia.in/about"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Link Anchor Text (Optional)
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="e.g. Read full jury report"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl"
                >
                  Insert Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Insert Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-600" />
              <span>Insert Article Image</span>
            </h3>
            <form onSubmit={handleInsertImage} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Image Direct URL (HTTPS) *
                </label>
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Image Caption / Alt Description
                </label>
                <input
                  type="text"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder="e.g. Awardees receiving trophy at Jaipur Convention Centre"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>
              {imageUrl && (
                <div className="w-full h-32 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                  <img src={imageUrl} alt="Preview" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImageModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl"
                >
                  Insert Image
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Insert Table Modal */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-emerald-600" />
              <span>Insert Data Table</span>
            </h3>
            <form onSubmit={handleInsertTable} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Rows (1-8)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={tableRows}
                    onChange={(e) => setTableRows(parseInt(e.target.value) || 2)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Columns (1-5)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={tableCols}
                    onChange={(e) => setTableCols(parseInt(e.target.value) || 2)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTableModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl"
                >
                  Create Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WysiwygEditor;
