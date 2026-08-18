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
      id="wiki-infobox-card"
      aria-label="Article Fact Box"
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden text-xs ${className}`}
    >
      {/* Infobox Header */}
      <div className="bg-slate-100 dark:bg-slate-800 p-2.5 text-center text-xs font-bold border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center justify-between px-3.5">
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-200">
          <Info className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          ARTICLE INFOBOX
        </span>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-bold">
          VERIFIED
        </span>
      </div>

      {/* Main Subject Title */}
      <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
          {title}
        </h3>
        {subtitle && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            {subtitle}
          </p>
        )}
      </div>

      {/* Featured Thumbnail */}
      {image && (
        <div className="p-2.5 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800">
          <div className="aspect-[16/10] rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <img
              src={image}
              alt={title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          {imageCaption && (
            <p className="mt-1.5 text-[10px] text-center text-slate-500 dark:text-slate-400 italic">
              {imageCaption}
            </p>
          )}
        </div>
      )}

      {/* Grouped Table Sections */}
      <div className="p-2.5 space-y-2.5 bg-slate-50/50 dark:bg-slate-900/50">
        {Object.entries(groupedSections).map(([sectionName, sectionFields]) => {
          const isCollapsed = !!collapsedSections[sectionName];

          return (
            <div key={sectionName} className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
              <button
                type="button"
                onClick={() => toggleSection(sectionName)}
                className="w-full px-3 py-1.5 bg-slate-100/90 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 flex items-center justify-between font-bold text-slate-700 dark:text-slate-300 text-[10px] uppercase tracking-wider transition-colors border-b border-slate-200 dark:border-slate-800"
              >
                <span>{sectionName}</span>
                {isCollapsed ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronUp className="w-3 h-3 text-slate-500" />}
              </button>

              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="infobox-grid dark:border-slate-800 dark:bg-slate-800">
                      {sectionFields.map((field, idx) => {
                        const rowId = `${sectionName}-${field.field_key}-${idx}`;
                        const isCopied = copiedKey === rowId;

                        return (
                          <React.Fragment key={idx}>
                            <div className="infobox-label dark:bg-slate-850 dark:text-slate-400 dark:border-slate-800 flex items-center justify-between">
                              <span>{field.field_key}</span>
                            </div>
                            <div className="infobox-value dark:bg-slate-900 dark:text-slate-100 flex items-center justify-between group">
                              <span className="font-medium text-[11px] leading-relaxed">{field.field_value}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(field.field_value, rowId)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded flex-shrink-0 ml-1"
                                title="Copy value"
                              >
                                {isCopied ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Footer verification badge */}
      <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
        <span className="flex items-center gap-1 font-medium">
          <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          Verified Editorial Factsheet
        </span>
        <span className="font-mono text-slate-400 text-[9px]">greenlight.fsia.in</span>
      </div>
    </aside>
  );
};

export default WikiInfobox;
