/**
 * InfoboxBuilder Component
 * Dynamic Wikipedia Infobox Key-Value Editor for Editorial Articles
 * Features Section Grouping, Key Presets, Row Add/Delete, and Live Interactive Preview
 */

import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, Sparkles, Layers, Info, Check, Eye } from 'lucide-react';
import { WikiInfobox, InfoboxField } from '../public/WikiInfobox';

export interface InfoboxBuilderProps {
  initialFields?: InfoboxField[];
  articleTitle?: string;
  onChange: (fields: InfoboxField[]) => void;
  className?: string;
}

const COMMON_PRESET_FIELDS = [
  { section: 'Overview', key: 'Industry', sample: 'Aerospace & Quantum Systems' },
  { section: 'Overview', key: 'Headquarters', sample: 'Bengaluru, India' },
  { section: 'Overview', key: 'Founded', sample: '2021' },
  { section: 'Leadership', key: 'Chief Executive', sample: 'Dr. Ramesh Sundaram' },
  { section: 'Financials', key: 'Valuation', sample: '$14.8 Billion USD' },
  { section: 'Financials', key: 'Annual Revenue', sample: '$2.1 Billion' },
  { section: 'Specifications', key: 'Technology Node', sample: '1.4nm RibbonFET GAA' },
  { section: 'Operations', key: 'Active Satellites', sample: '48 Operational Orbiters' }
];

export const InfoboxBuilder: React.FC<InfoboxBuilderProps> = ({
  initialFields = [],
  articleTitle = "Article Title Factsheet",
  onChange,
  className = ""
}) => {
  const [fields, setFields] = useState<InfoboxField[]>(
    initialFields.length > 0
      ? initialFields
      : [
          { section: 'Overview', field_key: 'Industry', field_value: 'Aerospace & DeepTech' },
          { section: 'Overview', field_key: 'Valuation', field_value: '$44.2B' },
          { section: 'Operations', field_key: 'Key Regulator', field_value: 'IN-SPACe' }
        ]
  );

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  const handleFieldChange = (index: number, key: 'section' | 'field_key' | 'field_value', value: string) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: value };
    setFields(updated);
    onChange(updated);
  };

  const handleAddField = (section = 'Overview', field_key = '', field_value = '') => {
    const updated = [...fields, { section, field_key, field_value }];
    setFields(updated);
    onChange(updated);
  };

  const handleRemoveField = (index: number) => {
    const updated = fields.filter((_, i) => i !== index);
    setFields(updated);
    onChange(updated);
  };

  const handleAddPreset = (preset: typeof COMMON_PRESET_FIELDS[0]) => {
    handleAddField(preset.section, preset.key, preset.sample);
  };

  return (
    <div id="infobox-builder-container" className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm ${className}`}>
      {/* Header with Editor / Preview Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Wikipedia Infobox Key-Value Builder</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Attach high-density factsheets to articles for enhanced reader engagement & SEO schema
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                activeTab === 'editor'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Row Editor ({fields.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Preview</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'editor' ? (
        <div className="mt-5 space-y-6">
          {/* Quick Presets Pill Bar */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Quick Preset Insert:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_PRESET_FIELDS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddPreset(preset)}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-600 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 text-emerald-500" />
                  <span>{preset.key}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Rows */}
          <div className="space-y-3">
            <div className="hidden sm:grid grid-cols-12 gap-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2">
              <div className="col-span-3">Section Header</div>
              <div className="col-span-4">Field Key (Label)</div>
              <div className="col-span-4">Field Value (Content)</div>
              <div className="col-span-1 text-center">Action</div>
            </div>

            {fields.map((field, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 items-center hover:border-slate-300 transition-colors"
              >
                {/* Section */}
                <div className="sm:col-span-3">
                  <label className="text-[10px] text-slate-400 sm:hidden block mb-1">Section</label>
                  <input
                    type="text"
                    value={field.section || ''}
                    onChange={(e) => handleFieldChange(idx, 'section', e.target.value)}
                    placeholder="e.g. Overview, Financials"
                    className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Field Key */}
                <div className="sm:col-span-4">
                  <label className="text-[10px] text-slate-400 sm:hidden block mb-1">Field Key</label>
                  <input
                    type="text"
                    value={field.field_key}
                    onChange={(e) => handleFieldChange(idx, 'field_key', e.target.value)}
                    placeholder="e.g. Valuation, CEO, Node"
                    className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Field Value */}
                <div className="sm:col-span-4">
                  <label className="text-[10px] text-slate-400 sm:hidden block mb-1">Field Value</label>
                  <input
                    type="text"
                    value={field.field_value}
                    onChange={(e) => handleFieldChange(idx, 'field_value', e.target.value)}
                    placeholder="e.g. $44.2 Billion, 1.4nm"
                    className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Delete Button */}
                <div className="sm:col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveField(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete row"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Row Button */}
          <button
            type="button"
            onClick={() => handleAddField()}
            className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2 transition-colors bg-slate-50/40 dark:bg-slate-800/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Fact Row</span>
          </button>
        </div>
      ) : (
        /* Live Preview Tab */
        <div className="mt-6 max-w-sm mx-auto">
          <WikiInfobox
            title={articleTitle}
            subtitle="Verified Wikipedia-Style Factsheet Preview"
            fields={fields}
          />
        </div>
      )}
    </div>
  );
};

export default InfoboxBuilder;
