/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HĀSEBO (حاسبو) Official Brand Identity Logo Component
 * Reference: Official HĀSEBO Brand Guide & Vector Specifications
 * Tagline: أدر تجارتك بذكاء | MANAGE YOUR BUSINESS SMARTER
 */

import React from 'react';

export type HaseboLogoVariant =
  | 'primary'
  | 'horizontal'
  | 'icon'
  | 'arabic'
  | 'english'
  | 'splash'
  | 'monochrome-white'
  | 'monochrome-dark';

export type HaseboLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';

export interface HaseboLogoProps {
  variant?: HaseboLogoVariant;
  size?: HaseboLogoSize;
  theme?: 'dark' | 'light' | 'auto';
  showTagline?: boolean;
  showEnglishTagline?: boolean;
  withContainer?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Pure SVG Symbol of HĀSEBO
 * Recreates the exact gold Arabic "ح", white receipt with fold & serrated tear,
 * dark navy checkmark, and 3-step ascending gold growth bars.
 */
export const HaseboSymbol: React.FC<{
  className?: string;
  isMonochromeWhite?: boolean;
  isMonochromeDark?: boolean;
  isLightMode?: boolean;
}> = ({ className = 'w-10 h-10', isMonochromeWhite, isMonochromeDark, isLightMode }) => {
  const uniqueId = React.useId().replace(/:/g, '');
  const goldGradId = `gold-${uniqueId}`;
  const goldLightGradId = `gold-light-${uniqueId}`;
  const paperGradId = `paper-${uniqueId}`;
  const darkNavyColor = isLightMode ? '#07111F' : '#07111F';

  const goldFill = isMonochromeWhite
    ? '#FFFFFF'
    : isMonochromeDark
    ? '#07111F'
    : `url(#${goldGradId})`;

  const goldLightFill = isMonochromeWhite
    ? '#FFFFFF'
    : isMonochromeDark
    ? '#1E293B'
    : `url(#${goldLightGradId})`;

  const paperFill = isMonochromeWhite
    ? '#FFFFFF'
    : isMonochromeDark
    ? '#F8FAFC'
    : `url(#${paperGradId})`;

  const checkColor = isMonochromeWhite
    ? '#07111F'
    : isMonochromeDark
    ? '#07111F'
    : '#07111F';

  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="شعار حاسبو - HĀSEBO"
    >
      <defs>
        {/* Rich Metallic 3D Gold Gradient */}
        <linearGradient id={goldGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE894" />
          <stop offset="20%" stopColor="#F5C84C" />
          <stop offset="55%" stopColor="#D4A72C" />
          <stop offset="85%" stopColor="#B38018" />
          <stop offset="100%" stopColor="#E5B83E" />
        </linearGradient>

        {/* Highlight Gold Gradient */}
        <linearGradient id={goldLightGradId} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#D4A72C" />
          <stop offset="100%" stopColor="#FFF2B2" />
        </linearGradient>

        {/* Realistic Receipt Paper Shading */}
        <linearGradient id={paperGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="85%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#EDF2F7" />
        </linearGradient>

        {/* Soft Drop Shadow for Depth */}
        <filter id={`shadow-${uniqueId}`} x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.35" />
        </filter>
      </defs>

      <g transform="translate(10, 10) scale(0.9)" filter={`url(#shadow-${uniqueId})`}>
        {/* 1. White Invoice / Receipt Paper with Top Rolled Curve & Serrated Bottom */}
        <g id="receipt-paper">
          {/* Main Receipt Body with Perforated Tear Bottom */}
          <path
            d="M 68 28 
               C 68 20, 88 18, 108 18 
               C 128 18, 148 20, 148 28 
               L 148 132 
               L 143 126 L 138 132 L 133 126 L 128 132 L 123 126 L 118 132 L 113 126 L 108 132 
               L 103 126 L 98 132 L 93 126 L 88 132 L 83 126 L 78 132 L 73 126 L 68 132 
               Z"
            fill={paperFill}
            stroke={isLightMode ? '#CBD5E1' : 'rgba(255,255,255,0.1)'}
            strokeWidth="1"
          />

          {/* Top Receipt Rolled Header Lip / Cylinder Curve */}
          <path
            d="M 68 28 C 68 20, 88 18, 108 18 C 128 18, 148 20, 148 28 C 148 35, 128 33, 108 33 C 88 33, 68 35, 68 28 Z"
            fill="#E2E8F0"
          />

          {/* Horizontal Invoice Header Lines */}
          <rect x="80" y="44" width="52" height="5" rx="2.5" fill={darkNavyColor} />
          <rect x="80" y="54" width="36" height="4.5" rx="2.25" fill={darkNavyColor} />

          {/* Navy Verified Checkmark */}
          <path
            d="M 110 92 L 121 103 L 142 74"
            fill="none"
            stroke={checkColor}
            strokeWidth="6.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* 2. Golden Arabic Stylized "ح" Enclosure & Growth Bars */}
        <g id="golden-ha-symbol">
          {/* Main Golden "ح" Character Wrapping the Document */}
          <path
            d="M 50 36
               C 50 28, 56 24, 66 24
               C 76 24, 84 28, 84 36
               L 84 48
               C 84 53, 80 57, 75 59
               L 56 68
               C 44 73, 38 84, 38 97
               L 38 120
               C 38 150, 62 170, 98 170
               C 136 170, 164 154, 170 141
               C 173 135, 167 129, 161 130
               C 154 131, 130 148, 98 148
               C 70 148, 56 135, 56 115
               L 56 98
               C 56 91, 62 87, 68 89
               L 132 89
               C 143 89, 150 96, 148 106
               C 145 114, 136 118, 126 115
               L 88 115
               C 81 115, 76 110, 76 104
               C 76 98, 81 94, 88 94
               L 126 94
               C 131 94, 134 97, 133 101
               C 132 104, 128 106, 123 106
               L 70 106
               C 58 106, 50 97, 50 86
               Z"
            fill={goldFill}
          />

          {/* 3 Ascending Financial Growth Bars (Inside Left Curve of the "ح") */}
          <rect x="56" y="130" width="7.5" height="17" rx="3.75" fill={goldLightFill} />
          <rect x="67" y="118" width="8" height="29" rx="4" fill={goldLightFill} />
          <rect x="79" y="104" width="8.5" height="43" rx="4.25" fill={goldLightFill} />
        </g>
      </g>
    </svg>
  );
};

export const HaseboLogo: React.FC<HaseboLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  theme = 'auto',
  showTagline = true,
  showEnglishTagline = false,
  withContainer = false,
  className = '',
  onClick,
}) => {
  const isMonochromeWhite = variant === 'monochrome-white';
  const isMonochromeDark = variant === 'monochrome-dark';
  const isLight = theme === 'light';

  // Size mapping
  const sizeConfig = {
    xs: {
      symbolSize: 'w-6 h-6',
      containerSize: 'w-7 h-7 rounded-lg p-0.5',
      arabicText: 'text-sm font-extrabold',
      englishText: 'text-[9px] tracking-[0.25em] font-black',
      taglineText: 'text-[8px]',
      gap: 'gap-1.5',
    },
    sm: {
      symbolSize: 'w-8 h-8',
      containerSize: 'w-9 h-9 rounded-xl p-1',
      arabicText: 'text-base font-extrabold',
      englishText: 'text-[10px] tracking-[0.3em] font-black',
      taglineText: 'text-[9px]',
      gap: 'gap-2',
    },
    md: {
      symbolSize: 'w-10 h-10',
      containerSize: 'w-11 h-11 rounded-2xl p-1.5',
      arabicText: 'text-xl font-black',
      englishText: 'text-xs tracking-[0.35em] font-black',
      taglineText: 'text-[10px]',
      gap: 'gap-2.5',
    },
    lg: {
      symbolSize: 'w-14 h-14',
      containerSize: 'w-16 h-16 rounded-2xl p-2',
      arabicText: 'text-2xl font-black',
      englishText: 'text-sm tracking-[0.4em] font-black',
      taglineText: 'text-xs',
      gap: 'gap-3',
    },
    xl: {
      symbolSize: 'w-20 h-20',
      containerSize: 'w-24 h-24 rounded-3xl p-3',
      arabicText: 'text-4xl font-black',
      englishText: 'text-lg tracking-[0.45em] font-black',
      taglineText: 'text-sm',
      gap: 'gap-4',
    },
    hero: {
      symbolSize: 'w-28 h-28 sm:w-36 sm:h-36',
      containerSize: 'w-32 h-32 sm:w-40 sm:h-40 rounded-[2.5rem] p-4',
      arabicText: 'text-4xl sm:text-6xl font-black',
      englishText: 'text-base sm:text-2xl tracking-[0.45em] font-black',
      taglineText: 'text-sm sm:text-base',
      gap: 'gap-4 sm:gap-6',
    },
  }[size];

  // Symbol element with optional squircle container
  const symbolElement = (
    <div
      className={`${
        withContainer
          ? `${sizeConfig.containerSize} bg-gradient-to-b from-[#0F1B2E] via-[#07111F] to-[#040A14] border border-[#D4A72C]/30 shadow-lg shadow-black/40 flex items-center justify-center shrink-0`
          : 'shrink-0 flex items-center justify-center'
      }`}
    >
      <HaseboSymbol
        className={sizeConfig.symbolSize}
        isMonochromeWhite={isMonochromeWhite}
        isMonochromeDark={isMonochromeDark}
        isLightMode={isLight}
      />
    </div>
  );

  // Icon-only variant
  if (variant === 'icon') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center justify-center ${onClick ? 'cursor-pointer' : ''} ${className}`}
      >
        {symbolElement}
      </div>
    );
  }

  // Primary Vertical Centered Variant
  if (variant === 'primary' || variant === 'splash') {
    return (
      <div
        onClick={onClick}
        className={`flex flex-col items-center text-center ${sizeConfig.gap} ${
          onClick ? 'cursor-pointer' : ''
        } ${className}`}
        dir="rtl"
      >
        {symbolElement}

        <div className="flex flex-col items-center">
          {/* Arabic Brand Name */}
          <span
            className={`${sizeConfig.arabicText} tracking-tight leading-tight ${
              isMonochromeWhite
                ? 'text-white'
                : isMonochromeDark
                ? 'text-slate-900'
                : isLight
                ? 'text-slate-900'
                : 'text-white'
            }`}
          >
            حاسبو
          </span>

          {/* English Brand Name */}
          <span
            className={`${sizeConfig.englishText} mt-0.5 ${
              isMonochromeWhite
                ? 'text-white/80'
                : isMonochromeDark
                ? 'text-slate-700'
                : 'text-[#D4A72C]'
            }`}
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            HĀSEBO
          </span>

          {/* Official Tagline */}
          {showTagline && (
            <div className="mt-2.5 flex items-center gap-2.5">
              <span className="h-[1.5px] w-6 sm:w-12 bg-gradient-to-r from-transparent via-[#D4A72C] to-[#D4A72C]" />
              <span
                className={`${sizeConfig.taglineText} font-extrabold tracking-wide ${
                  isLight ? 'text-slate-800' : 'text-slate-100'
                }`}
              >
                أدر تجارتك بذكاء
              </span>
              <span className="h-[1.5px] w-6 sm:w-12 bg-gradient-to-l from-transparent via-[#D4A72C] to-[#D4A72C]" />
            </div>
          )}

          {/* English Tagline */}
          {showEnglishTagline && (
            <span 
              className="text-[9px] sm:text-[11px] font-bold tracking-[0.22em] text-slate-400 mt-1 uppercase"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              MANAGE YOUR BUSINESS SMARTER
            </span>
          )}
        </div>
      </div>
    );
  }

  // Arabic only variant
  if (variant === 'arabic') {
    return (
      <div
        onClick={onClick}
        className={`flex items-center ${sizeConfig.gap} ${onClick ? 'cursor-pointer' : ''} ${className}`}
        dir="rtl"
      >
        {symbolElement}
        <span
          className={`${sizeConfig.arabicText} tracking-tight leading-tight ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}
        >
          حاسبو
        </span>
      </div>
    );
  }

  // English only variant
  if (variant === 'english') {
    return (
      <div
        onClick={onClick}
        className={`flex items-center ${sizeConfig.gap} ${onClick ? 'cursor-pointer' : ''} ${className}`}
        dir="ltr"
      >
        {symbolElement}
        <span
          className={`${sizeConfig.englishText} text-[#D4A72C]`}
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          HĀSEBO
        </span>
      </div>
    );
  }

  // Standard Horizontal Variant (Default for Header, Sidebar, Navbars)
  return (
    <div
      onClick={onClick}
      className={`flex items-center ${sizeConfig.gap} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      dir="rtl"
    >
      {symbolElement}

      <div className="flex flex-col items-start leading-none text-right">
        <div className="flex items-center gap-1.5">
          <span
            className={`${sizeConfig.arabicText} tracking-tight leading-none ${
              isMonochromeWhite
                ? 'text-white'
                : isMonochromeDark
                ? 'text-slate-900'
                : isLight
                ? 'text-slate-900'
                : 'text-white'
            }`}
          >
            حاسبو
          </span>
          <span
            className={`${sizeConfig.englishText} leading-none ${
              isMonochromeWhite
                ? 'text-white/80'
                : isMonochromeDark
                ? 'text-slate-600'
                : 'text-[#D4A72C]'
            }`}
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            HĀSEBO
          </span>
        </div>

        {showTagline && (
          <span
            className={`${sizeConfig.taglineText} font-bold mt-1 tracking-wide ${
              isLight ? 'text-slate-700' : 'text-[#E0B43C]'
            }`}
          >
            أدر تجارتك بذكاء
          </span>
        )}
      </div>
    </div>
  );
};

export default HaseboLogo;
