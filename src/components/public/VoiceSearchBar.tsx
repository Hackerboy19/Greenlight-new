/**
 * Voice-to-Text Search Bar with Web Speech API Integration
 * Features live audio wave animations, speech recognition status, auto-submit, keyboard navigation,
 * and persistent local search history with quick re-access and topic suggestions.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Mic, MicOff, X, Loader2, Sparkles, History, Clock, Trash2, ArrowUpRight, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface VoiceSearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
  className?: string;
}

// Browser SpeechRecognition interface augmentation
interface IWindow extends Window {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
}

const HISTORY_STORAGE_KEY = 'greenlight_voice_search_history';
const MAX_HISTORY_ITEMS = 8;

const POPULAR_DISCOVERY_TOPICS = [
  'FSIA Awards',
  'Luxury Hotels',
  'Women Entrepreneurs',
  'Green Tech',
  'National Spotlights'
];

export const VoiceSearchBar: React.FC<VoiceSearchBarProps> = ({
  onSearch,
  placeholder = "Search stories, key figures, topics, or ask aloud...",
  initialValue = "",
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechFeedback, setSpeechFeedback] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Local search history state
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((q) => typeof q === 'string' && q.trim().length > 0).slice(0, MAX_HISTORY_ITEMS);
        }
      }
    } catch (e) {
      console.warn('Could not load search history from localStorage:', e);
    }
    return [];
  });

  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(initialValue);
  }, [initialValue]);

  // Click-outside listener to close the history dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsHistoryOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Save a search query into local history
  const saveToHistory = useCallback((query: string) => {
    const clean = query.trim();
    if (!clean) return;

    setSearchHistory((prev) => {
      // Case-insensitive deduplication, keeping new query at front
      const filtered = prev.filter((item) => item.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('Could not save search query to localStorage:', err);
      }
      return updated;
    });
  }, []);

  // Remove a single query from local history
  const removeFromHistory = useCallback((queryToRemove: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSearchHistory((prev) => {
      const updated = prev.filter((item) => item.toLowerCase() !== queryToRemove.toLowerCase());
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('Could not update search history in localStorage:', err);
      }
      return updated;
    });
  }, []);

  // Clear entire search history
  const clearHistory = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSearchHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (err) {
      console.warn('Could not clear search history from localStorage:', err);
    }
  }, []);

  // Selection handler from history or suggestions
  const handleSelectQuery = (query: string) => {
    const clean = query.trim();
    setSearchTerm(clean);
    saveToHistory(clean);
    onSearch(clean);
    setIsHistoryOpen(false);
    setSpeechFeedback(null);
  };

  // Initialize Web Speech Recognition
  useEffect(() => {
    const win = window as unknown as IWindow;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechFeedback("Listening... Speak now");
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        setSearchTerm(currentTranscript);
        setSpeechFeedback(currentTranscript ? `"${currentTranscript}"` : "Listening...");

        if (finalTranscript) {
          setIsListening(false);
          const clean = finalTranscript.trim();
          saveToHistory(clean);
          onSearch(clean);
          setSpeechFeedback(null);
          setIsHistoryOpen(false);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechFeedback('Microphone permission blocked');
        } else {
          setSpeechFeedback('Voice input error');
        }
        setTimeout(() => setSpeechFeedback(null), 3000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Speech recognition not supported in environment', e);
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [onSearch, saveToHistory]);

  const toggleVoice = () => {
    if (!speechSupported) {
      alert("Voice search is not supported by your current browser. Please try typing your search.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setSpeechFeedback(null);
    } else {
      try {
        setIsHistoryOpen(false);
        setSpeechFeedback("Listening... Speak now");
        recognitionRef.current?.start();
      } catch (err) {
        console.warn('Could not start recognition:', err);
      }
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setSpeechFeedback(null);
    onSearch('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const clean = searchTerm.trim();
      if (clean) {
        saveToHistory(clean);
        onSearch(clean);
        setIsHistoryOpen(false);
      } else {
        onSearch('');
        setIsHistoryOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsHistoryOpen(false);
    }
  };

  return (
    <div id="voice-search-bar-root" ref={containerRef} className={`relative w-full ${className}`}>
      <div 
        className={`relative flex items-center w-full rounded-2xl bg-white dark:bg-slate-900 border transition-all shadow-xs ${
          isListening 
            ? 'border-emerald-500 ring-4 ring-emerald-500/20 bg-emerald-50/10' 
            : isHistoryOpen
              ? 'border-emerald-500/70 ring-2 ring-emerald-500/10 dark:border-emerald-500/50'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        {/* Search Icon */}
        <div className="pl-4 text-slate-400">
          <Search className="w-4 h-4" />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsHistoryOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening to your voice..." : placeholder}
          className="w-full py-3 px-3.5 text-xs sm:text-sm bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none"
        />

        {/* Actions (Clear & Mic) */}
        <div className="flex items-center gap-1.5 pr-3">
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Voice Search Mic Button */}
          <button
            type="button"
            onClick={toggleVoice}
            className={`p-2 rounded-xl transition-all relative ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                : 'text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={speechSupported ? "Search by voice" : "Voice search unsupported"}
          >
            {isListening ? (
              <Mic className="w-4 h-4 text-white" />
            ) : (
              <Mic className="w-4 h-4" />
            )}

            {/* Ripple wave when listening */}
            {isListening && (
              <span className="absolute -inset-1 rounded-xl bg-rose-500/30 animate-ping pointer-events-none" />
            )}
          </button>
        </div>
      </div>

      {/* Local Search History Dropdown */}
      <AnimatePresence>
        {isHistoryOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.99 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/60 overflow-hidden z-50 text-left"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <History className="w-3.5 h-3.5 text-emerald-600" />
                <span>Recent Searches</span>
              </div>
              {searchHistory.length > 0 && (
                <button
                  type="button"
                  onClick={clearHistory}
                  className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {/* Query List */}
            {searchHistory.length > 0 ? (
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {searchHistory.map((query) => (
                  <div
                    key={query}
                    onClick={() => handleSelectQuery(query)}
                    className="group flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 shrink-0 transition-colors" />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 truncate transition-colors">
                        {query}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 pl-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => removeFromHistory(query, e)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                        title="Remove from history"
                        aria-label={`Remove ${query} from history`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-5 text-center space-y-1">
                <Clock className="w-5 h-5 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">No search history yet</p>
                <p className="text-[11px] text-slate-400">Type a keyword or tap the microphone to search stories</p>
              </div>
            )}

            {/* Discovery Suggestions Footer */}
            <div className="p-3 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                <TrendingUp className="w-3 h-3 text-emerald-600" />
                <span>Popular Topics</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_DISCOVERY_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => handleSelectQuery(topic)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 border border-slate-200/80 dark:border-slate-700/80 transition-colors"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speech feedback bubble */}
      <AnimatePresence>
        {speechFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute left-0 right-0 -bottom-8 flex items-center justify-between px-4 py-1 rounded-xl bg-slate-900 text-white text-[11px] font-medium shadow-lg z-20"
          >
            <span className="flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {speechFeedback}
            </span>
            <span className="text-[10px] text-slate-400">Web Speech API</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceSearchBar;
