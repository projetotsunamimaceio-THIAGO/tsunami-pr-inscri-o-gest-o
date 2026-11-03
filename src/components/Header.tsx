import React from 'react';

interface HeaderProps {
  logoUrl: string | null;
}

export const TsunamiCrest: React.FC<{ logoUrl?: string | null; size?: 'sm' | 'md' | 'lg' }> = ({
  logoUrl,
  size = 'md',
}) => {
  const dims = size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-16 h-16' : 'w-12 h-12 sm:w-14 sm:h-14';

  if (logoUrl) {
    return (
      <div
        className={`${dims} rounded-full overflow-hidden border-2 border-cyan-400/80 shadow-[0_0_16px_rgba(0,216,255,0.35)] shrink-0 bg-[#041233] flex items-center justify-center`}
      >
        <img
          src={logoUrl}
          alt="Logo Projeto Tsunami"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${dims} rounded-full border-2 border-cyan-400/85 shadow-[0_0_16px_rgba(0,216,255,0.38)] shrink-0 bg-gradient-to-b from-[#07265c] via-[#041537] to-[#020a1d] flex items-center justify-center relative overflow-hidden`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" className="w-full h-full p-1">
        <defs>
          <linearGradient id="tsunamiWave" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#00d8ff" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(56,189,248,0.45)" strokeWidth="2.5" />
        {/* Volleyball silhouette top-right */}
        <circle cx="64" cy="31" r="11" fill="#f8fafc" opacity="0.95" />
        <path d="M55 27 Q64 33 73 26 M56 35 Q65 30 72 36 M63 20 Q60 31 66 41" fill="none" stroke="#041537" strokeWidth="1.8" />
        {/* Dynamic Tsunami Wave */}
        <path
          d="M12 64 C22 42, 42 32, 60 40 C50 41, 44 48, 47 55 C57 52, 72 56, 86 66 C72 78, 34 84, 12 64 Z"
          fill="url(#tsunamiWave)"
        />
        <text
          x="50"
          y="56"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="13.5"
          fontWeight="800"
          fontFamily="Oswald, sans-serif"
          letterSpacing="0.6"
        >
          TSUNAMI
        </text>
        <text
          x="50"
          y="78"
          textAnchor="middle"
          fill="#7dd3fc"
          fontSize="8.5"
          fontWeight="700"
          fontFamily="Plus Jakarta Sans, sans-serif"
          letterSpacing="1.2"
        >
          ESPORTE
        </text>
      </svg>
    </div>
  );
};

export const Header: React.FC<HeaderProps> = ({ logoUrl }) => {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-[#143772] bg-gradient-to-b from-[#081d4a] via-[#041130] to-[#030a1c] shadow-[inset_0_2px_0_rgba(125,211,252,0.22),inset_0_-3px_0_rgba(0,0,0,0.65),0_12px_30px_rgba(0,0,0,0.65)] px-4 py-4 sm:px-6 sm:py-5">
      {/* Subtle 3D top specular sheen */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-cyan-400/[0.08] to-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-32 rounded-full bg-cyan-500/15 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative flex flex-col items-center text-center">
        {/* Small Kicker */}
        <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold tracking-[0.22em] text-cyan-300/90 uppercase mb-1.5">
          <span className="text-cyan-400/60" aria-hidden="true">:::</span>
          <span>Bem vindo ao</span>
          <span className="text-cyan-400/60" aria-hidden="true">:::</span>
        </div>

        {/* Main 3D Crest + Brand Lockup */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 my-0.5">
          <TsunamiCrest logoUrl={logoUrl} size="md" />
          <h1 className="font-display text-3xl sm:text-5xl font-bold uppercase tracking-wide leading-none flex items-center gap-2 sm:gap-2.5 drop-shadow-[0_3px_0_rgba(0,0,0,0.85)]">
            <span className="text-white">PROJETO</span>
            <span className="text-[#00D8FF] drop-shadow-[0_0_14px_rgba(0,216,255,0.5)]">TSUNAMI</span>
          </h1>
        </div>

        {/* Project Description */}
        <p className="mt-2 text-[11px] sm:text-xs text-slate-300/85 leading-snug max-w-md font-medium">
          Esporte, disciplina e evangelismo —{' '}
          <span className="block sm:inline text-slate-400">
            Projeto ligado ao Arena Sede Maceió - Igreja Sara Nossa Terra
          </span>
        </p>
      </div>
    </div>
  );
};
