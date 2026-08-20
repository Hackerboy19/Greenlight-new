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

const TOPIC_PRESETS = [
  {
    name: '🏆 Awards & Conclave',
    fields: [
      { section: 'Event Details', field_key: 'Award Name', field_value: 'Forever Star India Awards' },
      { section: 'Event Details', field_key: 'Venue', field_value: 'Jaipur Convention Centre, Rajasthan' },
      { section: 'Event Details', field_key: 'Frequency', field_value: 'Annual Season' },
      { section: 'Impact', field_key: 'Awardees Recognized', field_value: '400+ National Achievers' },
      { section: 'Impact', field_key: 'Coverage', field_value: 'Pan-India (28 States & UTs)' }
    ]
  },
  {
    name: '🏢 Organization & Startup',
    fields: [
      { section: 'Overview', field_key: 'Entity Name', field_value: 'FSIA Media Network' },
      { section: 'Overview', field_key: 'Headquarters', field_value: 'Jaipur, India' },
      { section: 'Overview', field_key: 'Primary Sector', field_value: 'Media & Talent Platform' },
      { section: 'Operations', field_key: 'Official Portal', field_value: 'greenlight.fsia.in' }
    ]
  },
  {
    name: '👤 Personality & Leader',
    fields: [
      { section: 'Profile', field_key: 'Full Name', field_value: 'Rajesh Sharma' },
      { section: 'Profile', field_key: 'Designation', field_value: 'Founding Director & Convenor' },
      { section: 'Recognition', field_key: 'Key Milestone', field_value: 'Pioneered Forever Star India Conclaves' },
      { section: 'Recognition', field_key: 'Affiliation', field_value: 'FSIA Awards Council' }
    ]
  },
  {
    name: '🏨 Luxury & Hospitality',
    fields: [
      { section: 'Property', field_key: 'Category', field_value: '5-Star Luxury Resort' },
      { section: 'Property', field_key: 'Location', field_value: 'Jaipur, Rajasthan' },
      { section: 'Features', field_key: 'Architecture', field_value: 'Rajasthani Royal Heritage' },
      { section: 'Features', field_key: 'Capacity', field_value: 'Grand Ballroom & Convention Lawn' }
    ]
  }
];

const COMMON_PRESET_FIELDS = [
  { section: 'Overview', key: 'Industry', sample: 'Aerospace & Quantum Systems' },
  { section: 'Overview', key: 'Headquarters', sample: 'Jaipur, Rajasthan, India' },
  { section: 'Overview', key: 'Founded', sample: '2020' },
  { section: 'Leadership', key: 'Chief Executive', sample: 'Rajesh Sharma' },
  { section: 'Recognition', key: 'Flagship Event', sample: 'FSIA National Gala' },
  { section: 'Recognition', key: 'Women Initiative', sample: 'The Real Super Woman' },
  { section: 'Reach', key: 'States Covered', sample: '28 States & UTs' },
  { section: 'Media', key: 'Press Syndication', sample: 'National Press & TV' }
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
          { section: 'Overview', field_key: 'Organization', field_value: 'Forever Star India Awards' },
          { section: 'Overview', field_key: 'Scope', field_value: 'National & Global Achievers' },
          { section: 'Operations', field_key: 'Hub', field_value: 'greenlight.fsia.in' }
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

  const handleAddPreset = (preset: { section: string; key: string; sample: string }) => {
    handleAddField(preset.section, preset.key, preset.sample);
  };

  return (
    <div id="infobox-builder-root" className={`p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm ${className}`}>
      {/* Header with Editor / Live Preview toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Wikipedia Infobox Key-Value Builder</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-mono">
                {fields.length} Fields
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Structured contextual factsheet indexed for Google Knowledge Panels and Wikipedia-style citations
            </p>
          </div>
        </div>

        {/* Tab Controls - Auto Adjusting */}
        <div className="grid grid-cols-2 sm:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'editor'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>Form Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'preview'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5 shrink-0" />
            <span>Live Output</span>
          </button>
        </div>
      </div>

      {/* Preset Quick Chips - Responsive Auto Adjusting */}
      {activeTab === 'editor' && (
        <div className="py-3 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>1-Click Factsheet Presets:</span>
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {TOPIC_PRESETS.map((tPreset) => (
                <button
                  key={tPreset.name}
                  type="button"
                  onClick={() => {
                    setFields(tPreset.fields);
                    onChange(tPreset.fields);
                  }}
                  className="min-h-[32px] px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 text-[11px] font-bold transition-all whitespace-nowrap shadow-2xs shrink-0 active:scale-95"
                >
                  {tPreset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs pt-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
              Add Individual Key:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {COMMON_PRESET_FIELDS.slice(0, 6).map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => handleAddPreset(preset)}
                  className="px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300 text-[10px] font-medium transition-colors"
                >
                  + {preset.key}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Editor Body */}
      {activeTab === 'editor' ? (
        <div className="pt-4 space-y-3">
          {fields.length === 0 ? (
            <div className="py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">No Infobox fields defined yet.</p>
              <button
                type="button"
                onClick={() => handleAddField()}
                className="mt-3 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
              >
                Add First Fact Row
              </button>
            </div>
          ) : (
            fields.map((field, idx) => (
              <div 
                key={idx}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 group transition-colors hover:border-slate-300 dark:hover:border-slate-700"
              >
                <div className="flex items-center gap-1 text-slate-300 dark:text-slate-600 hidden sm:flex">
                  <GripVertical className="w-4 h-4" />
                </div>

                {/* Section Input */}
                <div className="w-full sm:w-1/4">
                  <input
                    type="text"
                    value={field.section || ''}
                    onChange={(e) => handleFieldChange(idx, 'section', e.target.value)}
                    placeholder="Section (e.g. Overview)"
                    className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Key Input */}
                <div className="w-full sm:w-1/3">
                  <input
                    type="text"
                    value={field.field_key}
                    onChange={(e) => handleFieldChange(idx, 'field_key', e.target.value)}
                    placeholder="Field Key (e.g. Headquarters)"
                    className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Value Input */}
                <div className="flex-1">
                  <input
                    type="text"
                    value={field.field_value}
                    onChange={(e) => handleFieldChange(idx, 'field_value', e.target.value)}
                    placeholder="Field Value (e.g. Bengaluru, India)"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleRemoveField(idx)}
                  className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 self-end sm:self-center"
                  title="Remove row"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}

          {/* Add Row Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleAddField()}
              className="w-full py-2.5 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Infobox Key-Value Row</span>
            </button>
          </div>
        </div>
      ) : (
        /* Live Infobox Preview in Modal */
        <div className="pt-6 flex justify-center bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl">
          <WikiInfobox
            title={articleTitle}
            subtitle="Verified Editorial Factsheet"
            fields={fields}
          />
        </div>
      )}
    </div>
  );
};

export default InfoboxBuilder;
