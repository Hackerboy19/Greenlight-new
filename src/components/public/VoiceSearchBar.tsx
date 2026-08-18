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
          onSearch(finalTranscript.trim());
          setSpeechFeedback(null);
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
  }, [onSearch]);

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
      onSearch(searchTerm.trim());
    }
  };

  return (
    <div id="voice-search-bar-root" className={`relative w-full ${className}`}>
      <div 
        className={`relative flex items-center w-full rounded-2xl bg-white dark:bg-slate-900 border transition-all shadow-sm ${
          isListening 
            ? 'border-emerald-500 ring-4 ring-emerald-500/20 bg-emerald-50/10' 
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
