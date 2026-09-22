/**
 * Share Article Modal / Drawer
 * Enables public readers to share the current article across social channels
 * (WhatsApp, LinkedIn, X/Twitter, Facebook, Telegram, or Copy Link) with UTM tags.
 * Connects directly to the SocialShareAnalytics dashboard tracking system.
 */

import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  X,
  MessageSquare,
  Twitter,
  Linkedin,
  Facebook,
  Send,
  Link2,
  Sparkles
} from 'lucide-react';
import { Article } from '../../types';
import {
  SocialPlatform,
  SOCIAL_PLATFORMS,
  buildUtmLink,
  recordSocialShareEvent
} from '../../data/socialShareData';

interface ShareArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: Article;
  articlesList: Article[];
  onShareRecorded?: (platform: SocialPlatform) => void;
}

export const ShareArticleModal: React.FC<ShareArticleModalProps> = ({
  isOpen,
  onClose,
  article,
  articlesList,
  onShareRecorded
}) => {
  const [copied, setCopied] = useState(false);
  const [justSharedPlatform, setJustSharedPlatform] = useState<SocialPlatform | null>(null);

  if (!isOpen) return null;

  const handleShareClick = (platform: SocialPlatform) => {
    // 1. Record event in persistent tracker
    recordSocialShareEvent(article.id, platform, articlesList);
    onShareRecorded?.(platform);
    setJustSharedPlatform(platform);

    const shareUrl = buildUtmLink(window.location.origin, article.slug, platform, 'reader_share');

    if (platform === 'direct') {
      navigator.clipboard?.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      return;
    }

    const conf = SOCIAL_PLATFORMS[platform];
    const destinationUrl = conf.shareUrlTemplate(shareUrl, article.title);
    window.open(destinationUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/40">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-serif">
                Share this Story
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Help distribute Greenlight editorial coverage
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Article Preview Card */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-3">
          <img
            src={article.featured_image}
            alt={article.title}
            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
          />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              {article.category_name}
            </span>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
              {article.title}
            </h4>
            <p className="text-[11px] text-slate-400 font-mono truncate">
              {article.author_name}
            </p>
          </div>
        </div>

        {/* Social Platforms Grid */}
        <div>
          <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            Select Platform
          </span>
          <div className="grid grid-cols-3 gap-2.5">
            {/* WhatsApp */}
            <button
              type="button"
              onClick={() => handleShareClick('whatsapp')}
              className="p-3 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#128C7E] dark:text-[#25D366] flex flex-col items-center gap-1.5 transition-all active:scale-95 group"
            >
              <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold">WhatsApp</span>
            </button>

            {/* LinkedIn */}
            <button
              type="button"
              onClick={() => handleShareClick('linkedin')}
              className="p-3 rounded-2xl bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 border border-[#0A66C2]/30 text-[#0A66C2] dark:text-[#70B5F9] flex flex-col items-center gap-1.5 transition-all active:scale-95 group"
            >
              <div className="w-8 h-8 rounded-full bg-[#0A66C2] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Linkedin className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold">LinkedIn</span>
            </button>

            {/* X / Twitter */}
            <button
              type="button"
              onClick={() => handleShareClick('twitter')}
              className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 flex flex-col items-center gap-1.5 transition-all active:scale-95 group"
            >
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Twitter className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold">X (Twitter)</span>
            </button>

            {/* Facebook */}
            <button
              type="button"
              onClick={() => handleShareClick('facebook')}
              className="p-3 rounded-2xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/30 text-[#1877F2] dark:text-[#82B1FF] flex flex-col items-center gap-1.5 transition-all active:scale-95 group"
            >
              <div className="w-8 h-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Facebook className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold">Facebook</span>
            </button>

            {/* Telegram */}
            <button
              type="button"
              onClick={() => handleShareClick('telegram')}
              className="p-3 rounded-2xl bg-[#229ED9]/10 hover:bg-[#229ED9]/20 border border-[#229ED9]/30 text-[#229ED9] dark:text-[#80D8FF] flex flex-col items-center gap-1.5 transition-all active:scale-95 group"
            >
              <div className="w-8 h-8 rounded-full bg-[#229ED9] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Send className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold">Telegram</span>
            </button>

            {/* Copy Link */}
            <button
              type="button"
              onClick={() => handleShareClick('direct')}
              className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 flex flex-col items-center gap-1.5 transition-all active:scale-95 group"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
              </div>
              <span className="text-xs font-bold">{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Tracked Link Feedback */}
        {justSharedPlatform && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Shared via <strong>{SOCIAL_PLATFORMS[justSharedPlatform].name}</strong>! Your share has been counted in Greenlight Editorial Analytics.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
