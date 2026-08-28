import React, { useState } from 'react';

interface LogoProps {
  variant?: 'full' | 'icon' | 'badge';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  showText = true,
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeMap = {
    sm: { img: 'w-8 h-8', title: 'text-sm', sub: 'text-[9px]' },
    md: { img: 'w-11 h-11', title: 'text-lg', sub: 'text-[10px]' },
    lg: { img: 'w-16 h-16', title: 'text-xl', sub: 'text-xs' },
    xl: { img: 'w-24 h-24', title: 'text-2xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Logo Mark / Image */}
      <div
        className={`${currentSize.img} rounded-xl bg-white p-0.5 shadow-md flex items-center justify-center overflow-hidden border border-amber-400/40 relative shrink-0 transition-transform duration-200 hover:scale-105`}
      >
        {!imageError ? (
          <img
            src="/Logoimport.jpg"
            alt="HW ANDEVIA SAC TRADING Logo"
            className="w-full h-full object-contain rounded-lg"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
          />
        ) : (
          /* High-Fidelity SVG Fallback matching the HWA Logo design */
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="50" cy="50" r="48" fill="#0f172a" />
            <circle cx="50" cy="50" r="46" stroke="#d97706" strokeWidth="2" />
            {/* Globe arc */}
            <path
              d="M 20 40 A 35 35 0 0 1 80 40"
              stroke="#2563eb"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M 22 65 A 35 35 0 0 0 85 55"
              stroke="#d97706"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Arrow */}
            <polygon points="82,45 92,53 84,60" fill="#d97706" />
            {/* HWA Text */}
            <text
              x="50"
              y="55"
              textAnchor="middle"
              fill="#ffffff"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="24"
              letterSpacing="1"
            >
              HWA
            </text>
            <text
              x="50"
              y="74"
              textAnchor="middle"
              fill="#fbbf24"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="bold"
              fontSize="7"
              letterSpacing="1"
            >
              ANDEVIA SAC
            </text>
          </svg>
        )}
      </div>

      {/* Typography Section */}
      {showText && variant !== 'icon' && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`${currentSize.title} font-black tracking-tight text-white uppercase`}>
              HW <span className="text-amber-400">ANDEVIA</span> <span className="text-slate-300 text-xs font-bold">SAC</span>
            </span>
            <span className="hidden sm:inline-block bg-amber-500/20 text-amber-300 text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-amber-500/40 tracking-wider">
              TRADING
            </span>
          </div>
          <p className={`${currentSize.sub} text-slate-400 font-medium tracking-wide flex items-center gap-1.5`}>
            <span>Repuestos TVS King & Torito Bajaj</span>
          </p>
        </div>
      )}
    </div>
  );
};
