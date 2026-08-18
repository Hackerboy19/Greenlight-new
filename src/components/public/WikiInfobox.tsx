/**
 * WikiInfobox Component
 * Wikipedia-style structured key-value sidebar card for rich contextual journalism
 */

import React, { useState } from 'react';
import { Info, Copy, Check, ExternalLink, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface InfoboxField {
  section?: string;
  field_key: string;
  field_value: string;
}

export interface WikiInfoboxProps {
  title: string;
  subtitle?: string;
  image?: string;
  imageCaption?: string;
  fields: InfoboxField[];
  className?: string;
}

export const WikiInfobox: React.FC<WikiInfoboxProps> = ({
  title,
  subtitle,
  image,
  imageCaption,
  fields,
  className = ""
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  if (!fields || fields.length === 0) {
    return null;
  }

  // Group fields by section
  const groupedSections: Record<string, InfoboxField[]> = {};
  fields.forEach((field) => {
    const sectionName = field.section || 'General Overview';
    if (!groupedSections[sectionName]) {
      groupedSections[sectionName] = [];
    }
    groupedSections[sectionName].push(field);
  });

  const toggleSection = (sectionName: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  const handleCopy = (text: string, keyId: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <aside 
      id="wiki-infobox-container"
      aria-label="Wikipedia-style Quick Factsheet"
      className={`w-full lg:w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80 overflow-hidden shadow-sm text-xs ${className}`}
    >
      {/* Header bar */}
      <div className="bg-emerald-900 dark:bg-emerald-950 text-white p-4 border-b border-emerald-800 text-center relative">
        <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-emerald-300 mb-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verified Editorial Factsheet</span>
        </div>
        <h3 className="text-base font-bold text-white leading-snug">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-emerald-200/80 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* Featured Media Thumbnail (if provided) */}
      {image && (
        <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="rounded-xl overflow-hidden aspect-video relative bg-slate-100 dark:bg-slate-800">
            <img 
              src={image} 
              alt={title}
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
            />
          </div>
          {imageCaption && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-2 italic px-2">
              {imageCaption}
            </p>
          )}
        </div>
      )}

      {/* Structured Sections */}
      <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
        {Object.entries(groupedSections).map(([sectionName, sectionFields]) => {
          const isCollapsed = collapsedSections[sectionName] || false;

          return (
            <div key={sectionName} className="bg-white dark:bg-slate-900">
              {/* Section Header */}
              <button
                type="button"
                onClick={() => toggleSection(sectionName)}
                className="w-full px-4 py-2.5 bg-slate-100/70 dark:bg-slate-800/60 flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors text-left"
              >
                <span className="text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300 font-semibold">
                  {sectionName}
                </span>
                {isCollapsed ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {/* Section Rows */}
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <table className="w-full text-left border-collapse">
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        {sectionFields.map((f, idx) => {
                          const keyId = `${sectionName}-${f.field_key}-${idx}`;
                          const isCopied = copiedKey === keyId;

                          return (
                            <tr 
                              key={keyId}
                              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                            >
                              <th className="py-2.5 px-4 w-2/5 font-semibold text-slate-500 dark:text-slate-400 align-top text-[11px] bg-slate-50/30 dark:bg-slate-900/30">
                                {f.field_key}
                              </th>
                              <td className="py-2.5 px-4 text-slate-900 dark:text-slate-100 font-medium align-top leading-relaxed relative text-[11px]">
                                <div className="flex items-start justify-between gap-1">
                                  <span>{f.field_value}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(f.field_value, keyId)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-opacity rounded"
                                    title="Copy value"
                                  >
                                    {isCopied ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Footer reference attribution */}
      <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
        <span className="font-mono">Greenlight Wiki Standard</span>
        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Synced Data Node</span>
      </div>
    </aside>
  );
};

export default WikiInfobox;
