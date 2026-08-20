import React from 'react';

interface GreenLightLogoProps {
  variant?: 'full' | 'icon' | 'horizontal' | 'badge';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtitle?: boolean;
}

export const GreenLightLogo: React.FC<GreenLightLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  className = '',
  showSubtitle = true
}) => {
  // Size mapping
  const sizeMap = {
    sm: { height: 32, icon: 28, text: 'text-sm', sub: 'text-[9px]' },
    md: { height: 44, icon: 38, text: 'text-lg', sub: 'text-[10px]' },
    lg: { height: 60, icon: 52, text: 'text-2xl', sub: 'text-xs' },
    xl: { height: 96, icon: 84, text: 'text-4xl', sub: 'text-sm' }
  }[size];

  // Pure SVG reproduction of the Green Light International Monogram & Badge
  const IconGl = ({ width = 48, height = 48 }: { width?: number; height?: number }) => (
    <svg
      viewBox="0 0 400 400"
      width={width}
      height={height}
      className="inline-block flex-shrink-0"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Green Light International Logo"
    >
      <defs>
        <linearGradient id="glGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e8a38" />
          <stop offset="50%" stopColor="#15803d" />
          <stop offset="100%" stopColor="#0f6027" />
        </linearGradient>
      </defs>

      {/* Main G glyph with serifs */}
      <path
        d="M 210 135 C 190 90, 120 90, 100 145 C 75 210, 80 290, 140 315 C 195 330, 220 280, 220 240 L 165 240 L 165 205 L 250 205 L 250 245 C 248 310, 195 350, 130 340 C 60 325, 30 240, 50 160 C 70 80, 150 50, 225 90 C 235 96, 242 105, 248 115 L 210 135 Z"
        fill="url(#glGreenGrad)"
      />

      {/* Main L glyph overlapping & interlocking */}
      <path
        d="M 235 75 L 285 75 L 285 285 L 375 285 L 375 335 L 235 335 Z"
        fill="url(#glGreenGrad)"
      />

      {/* Center Ribbon / Banner with "INTERNATIONAL" cutout style */}
      <rect x="25" y="195" width="350" height="28" fill="#14532d" rx="2" />
      <text
        x="200"
        y="215"
        textAnchor="middle"
        fill="#ffffff"
        fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="16"
        fontWeight="900"
        letterSpacing="7"
      >
        INTERNATIONAL
      </text>
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <IconGl width={sizeMap.icon} height={sizeMap.icon} />
      </div>
    );
  }

  if (variant === 'full' || variant === 'badge') {
    return (
      <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
        <div className="relative p-2 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 shadow-sm">
          <IconGl width={sizeMap.icon * 2.2} height={sizeMap.icon * 2.2} />
          <div className="mt-2 text-center">
            <h1 className="text-emerald-700 dark:text-emerald-400 font-black tracking-wider text-xl font-sans leading-tight">
              GREEN LIGHT
            </h1>
            {showSubtitle && (
              <p className="text-emerald-800 dark:text-emerald-300/80 text-[11px] font-semibold tracking-widest uppercase mt-0.5 font-sans">
                BLOG / MAGAZINE
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default 'horizontal' variant for navbar and headers
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* GL Emblem */}
      <div className="flex-shrink-0 relative group">
        <div className="p-1 bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-emerald-900/50 shadow-sm group-hover:scale-105 transition-transform">
          <IconGl width={sizeMap.icon} height={sizeMap.icon} />
        </div>
      </div>

      {/* Typography */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 leading-none">
          <span className="font-black tracking-tight text-emerald-800 dark:text-emerald-400 font-sans" style={{ fontSize: size === 'sm' ? '14px' : size === 'lg' ? '22px' : '17px' }}>
            GREEN LIGHT
          </span>
          <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded font-bold border border-emerald-200 dark:border-emerald-800">
            FSIA
          </span>
        </div>
        {showSubtitle && (
          <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/70 font-semibold tracking-wider uppercase mt-1 leading-none font-sans">
            INTERNATIONAL BLOG / MAGAZINE
          </p>
        )}
      </div>
    </div>
  );
};
