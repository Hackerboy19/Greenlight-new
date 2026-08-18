/**
 * Voice-to-Text Search Bar with Web Speech API Integration
 * Features live audio wave animations, speech recognition status, auto-submit, and keyboard navigation
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, Mic, MicOff, X, Loader2, Sparkles } from 'lucide-react';
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
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchTerm(initialValue);
  }, [initialValue]);

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
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');

        setSearchTerm(transcript);
        setSpeechFeedback(`Heard: "${transcript}"`);

        // If final result, trigger search
        if (event.results[0].isFinal) {
          onSearch(transcript);
          setTimeout(() => {
            setIsListening(false);
            setSpeechFeedback(null);
          }, 600);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[VoiceSearch] Speech recognition event error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechFeedback('Microphone permission blocked. Please allow mic access.');
        } else {
          setSpeechFeedback('Could not capture voice. Try typing or speaking again.');
        }
        setTimeout(() => setSpeechFeedback(null), 3000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('[VoiceSearch] Speech recognition initialization failed:', e);
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, [onSearch]);

  const toggleListening = () => {
    if (!speechSupported) {
      setSpeechFeedback('Voice search is not supported in this browser engine.');
      setTimeout(() => setSpeechFeedback(null), 2500);
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setSpeechFeedback(null);
    } else {
      try {
        setSpeechFeedback("Initializing microphone...");
        recognitionRef.current?.start();
      } catch (err) {
        console.error('[VoiceSearch] Start error:', err);
        recognitionRef.current?.stop();
        setTimeout(() => recognitionRef.current?.start(), 100);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch(searchTerm);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
    inputRef.current?.focus();
  };

  return (
    <div id="voice-search-bar-container" className={`relative w-full max-w-3xl mx-auto ${className}`}>
      <div 
        className={`relative flex items-center w-full transition-all duration-300 rounded-full border bg-white dark:bg-slate-900 shadow-sm ${
          isListening 
            ? 'ring-2 ring-emerald-500 border-emerald-500 shadow-emerald-100 dark:shadow-emerald-950/40' 
            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20'
        }`}
      >
        <div className="pl-4.5 pr-2 text-slate-400 dark:text-slate-500 flex items-center">
          <Search className="w-5 h-5" />
        </div>

        <input
          id="voice-search-input"
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening... Speak now" : placeholder}
          className="w-full py-3.5 px-2 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent outline-none"
        />

        <div className="flex items-center pr-2 gap-1.5">
          {searchTerm && (
            <button
              id="voice-search-clear-btn"
              type="button"
              onClick={handleClear}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            id="voice-search-mic-btn"
            type="button"
            onClick={toggleListening}
            aria-label={isListening ? "Stop listening" : "Voice search"}
            className={`relative p-2.5 rounded-full transition-all duration-200 ${
              isListening
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
            title={speechSupported ? "Voice search" : "Speech search unavailable"}
          >
            {isListening ? (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="flex items-center justify-center"
              >
                <Mic className="w-4 h-4" />
              </motion.div>
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          <button
            id="voice-search-submit-btn"
            type="button"
            onClick={() => onSearch(searchTerm)}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-full transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>Search</span>
          </button>
        </div>
      </div>

      {/* Speech feedback / audio wave pill */}
      <AnimatePresence>
        {speechFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute top-full left-0 right-0 mt-2 z-20 flex justify-center"
          >
            <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-900/90 dark:bg-slate-800/95 backdrop-blur text-white text-xs font-medium rounded-full shadow-lg border border-slate-700">
              {isListening && (
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-3 bg-rose-400 rounded-full animate-pulse" />
                  <span className="w-1.5 h-4 bg-rose-500 rounded-full animate-pulse delay-75" />
                  <span className="w-1.5 h-2.5 bg-rose-400 rounded-full animate-pulse delay-150" />
                </div>
              )}
              <span>{speechFeedback}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceSearchBar;
