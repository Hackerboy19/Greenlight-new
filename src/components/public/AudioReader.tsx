/**
 * AudioReader Component
 * Interactive Text-to-Speech audio reader for Greenlight Magazine articles.
 * Uses Web Speech Synthesis with speed control, voice selection, audio waveforms, and reading progress.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  FastForward, 
  Headphones, 
  Sparkles,
  Sliders,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface AudioReaderProps {
  title: string;
  contentHtml: string;
  excerpt?: string;
  authorName?: string;
  languageCode?: string;
  className?: string;
}

export const AudioReader: React.FC<AudioReaderProps> = ({
  title,
  contentHtml,
  excerpt = '',
  authorName = 'FSIA Editorial Board',
  languageCode = 'en',
  className = ''
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(true);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sentencesRef = useRef<string[]>([]);
  const animIntervalRef = useRef<any>(null);

  // Extract clean text and split into readable sentences
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setHasSpeechSupport(false);
      return;
    }

    // Convert HTML to clean plain text
    const tempEl = document.createElement('div');
    tempEl.innerHTML = contentHtml;
    // Remove scripts and style tags if any
    const scripts = tempEl.querySelectorAll('script, style');
    scripts.forEach(s => s.remove());
    const rawText = tempEl.textContent || tempEl.innerText || '';

    // Prepare speaking text: Introduction + Excerpt + Body
    const introText = `${title}. Published by Greenlight Magazine. By ${authorName}. ${excerpt}`;
    const cleanBody = rawText.replace(/\s+/g, ' ').trim();
    const fullText = `${introText}. ${cleanBody}`;

    // Split into sentences for progress tracking
    const sentences = fullText
      .split(/(?<=[.?!।])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    sentencesRef.current = sentences;

    // Load voices
    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        // Try to find a voice matching current languageCode
        const matchIdx = voices.findIndex(v => v.lang.toLowerCase().startsWith(languageCode.toLowerCase()));
        if (matchIdx !== -1) {
          setSelectedVoiceIndex(matchIdx);
        } else {
          // Default to first English or first available voice
          const enIdx = voices.findIndex(v => v.lang.toLowerCase().startsWith('en'));
          setSelectedVoiceIndex(enIdx !== -1 ? enIdx : 0);
        }
      }
    };

    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    // Cleanup on unmount or article change
    return () => {
      window.speechSynthesis.cancel();
      if (animIntervalRef.current) clearInterval(animIntervalRef.current);
    };
  }, [title, contentHtml, excerpt, authorName, languageCode]);

  // Handle Play/Resume
  const handlePlay = () => {
    if (!hasSpeechSupport) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    // Cancel any previous speech
    window.speechSynthesis.cancel();

    const textToSpeak = sentencesRef.current.slice(currentSentenceIndex).join(' ');
    if (!textToSpeak) {
      setCurrentSentenceIndex(0);
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak || title);
    utterance.rate = playbackRate;
    utterance.volume = isMuted ? 0 : 1;

    if (availableVoices[selectedVoiceIndex]) {
      utterance.voice = availableVoices[selectedVoiceIndex];
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onpause = () => {
      setIsPaused(true);
      setIsPlaying(false);
    };

    utterance.onresume = () => {
      setIsPaused(false);
      setIsPlaying(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgressPercent(100);
      setCurrentSentenceIndex(0);
    };

    utterance.onerror = (e) => {
      console.warn('[AudioReader Error]:', e);
      setIsPlaying(false);
      setIsPaused(false);
    };

    // Track boundary/words to update progress bar
    utterance.onboundary = (event) => {
      if (event.name === 'sentence' || event.name === 'word') {
        const totalLen = textToSpeak.length;
        if (totalLen > 0) {
          const currentProgress = Math.min(100, Math.round((event.charIndex / totalLen) * 100));
          setProgressPercent(currentProgress);
        }
      }
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  // Handle Pause
  const handlePause = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  // Handle Stop
  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setProgressPercent(0);
    setCurrentSentenceIndex(0);
  };

  // Change Playback Speed
  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (isPlaying) {
      // Restart with new rate from current position
      handleStop();
      setTimeout(() => {
        setPlaybackRate(speed);
        handlePlay();
      }, 50);
    }
  };

  // Toggle Mute
  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    if (isPlaying) {
      handleStop();
      setTimeout(handlePlay, 50);
    }
  };

  const rates = [0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <div className={`w-full rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border border-emerald-500/30 p-4 sm:p-5 text-white shadow-xl ${className}`}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
            <Headphones className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span>Audio Article Reader</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-[11px] text-slate-400">
              {isPlaying ? 'Reading aloud • Listen on the go' : 'Natural voice text-to-speech engine'}
            </div>
          </div>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-2">
          {/* Animated Waveform Indicator */}
          {isPlaying && (
            <div className="flex items-center gap-0.5 h-4 px-2">
              <span className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s] h-3" />
              <span className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s] h-4" />
              <span className="w-1 bg-emerald-400 rounded-full animate-bounce h-2" />
              <span className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.2s] h-3.5" />
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors border border-slate-700"
            title="Audio settings & voice controls"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[10px] font-mono">{playbackRate}x</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Main Player Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Play/Pause/Stop cluster */}
        <div className="flex items-center gap-2">
          {!isPlaying ? (
            <button
              type="button"
              onClick={handlePlay}
              className="flex-1 sm:flex-initial min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 transition-transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-current shrink-0" />
              <span>{isPaused ? 'Resume Audio' : 'Listen to Story'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePause}
              className="flex-1 sm:flex-initial min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
            >
              <Pause className="w-4 h-4 fill-current shrink-0" />
              <span>Pause Audio</span>
            </button>
          )}

          {(isPlaying || isPaused) && (
            <button
              type="button"
              onClick={handleStop}
              className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center justify-center active:scale-95"
              title="Stop playback"
              aria-label="Stop audio"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleMute}
            className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center justify-center active:scale-95"
            title={isMuted ? 'Unmute' : 'Mute'}
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Speed Selector Pills */}
        <div className="flex items-center justify-between sm:justify-start gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 px-1 font-semibold sm:hidden">Speed:</span>
          <div className="flex items-center gap-1">
            {rates.map(rate => (
              <button
                key={rate}
                type="button"
                onClick={() => handleSpeedChange(rate)}
                className={`min-h-[36px] min-w-[36px] px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-colors active:scale-95 ${
                  playbackRate === rate
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3.5 space-y-1">
        <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-emerald-500 to-teal-300 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>{isPlaying ? 'Playing story' : isPaused ? 'Audio paused' : 'Ready to listen'}</span>
          <span>{progressPercent}%</span>
        </div>
      </div>

      {/* Expanded Voice & Language Customizer */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-4 mt-3 border-t border-slate-800 text-xs space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-slate-300 text-[11px] font-medium flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Select Narrator Voice:</span>
              </label>

              {availableVoices.length > 0 ? (
                <select
                  value={selectedVoiceIndex}
                  onChange={(e) => {
                    setSelectedVoiceIndex(Number(e.target.value));
                    if (isPlaying) {
                      handleStop();
                      setTimeout(handlePlay, 50);
                    }
                  }}
                  className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none max-w-xs"
                >
                  {availableVoices.map((voice, idx) => (
                    <option key={voice.name + idx} value={idx}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-[11px] text-slate-500">Default device voice active</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
