import React from 'react';

export type CorBotao3D = 'azul' | 'roxo' | 'verde' | 'amarelo' | 'vermelho' | 'ciano' | 'escuro';
export type FormatoBotao3D = 'bevel' | 'tile' | 'chamfer';

interface BotaoTresDProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  cor?: CorBotao3D;
  formato?: FormatoBotao3D;
  tamanho?: 'sm' | 'md' | 'lg';
  icone?: React.ReactNode;
  subtitulo?: string;
}

const PALETA_CORES: Record<CorBotao3D, { bg: string; border: string; text: string }> = {
  azul: {
    bg: 'bg-gradient-to-b from-[#2563EB] via-[#1D4ED8] to-[#133492]',
    border: 'border-[#60A5FA]/50',
    text: 'text-white',
  },
  roxo: {
    bg: 'bg-gradient-to-b from-[#9333EA] via-[#7E22CE] to-[#4C1D95]',
    border: 'border-[#C084FC]/50',
    text: 'text-white',
  },
  verde: {
    bg: 'bg-gradient-to-b from-[#10B981] via-[#059669] to-[#064E3B]',
    border: 'border-[#6EE7B7]/50',
    text: 'text-white',
  },
  amarelo: {
    bg: 'bg-gradient-to-b from-[#FBBF24] via-[#F59E0B] to-[#B45309]',
    border: 'border-[#FDE68A]/60',
    text: 'text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]',
  },
  vermelho: {
    bg: 'bg-gradient-to-b from-[#EF4444] via-[#DC2626] to-[#881313]',
    border: 'border-[#FCA5A5]/50',
    text: 'text-white',
  },
  ciano: {
    bg: 'bg-gradient-to-b from-[#0EA5E9] via-[#0284C7] to-[#075985]',
    border: 'border-[#7DD3FC]/55',
    text: 'text-white',
  },
  escuro: {
    bg: 'bg-gradient-to-b from-[#1E293B] via-[#0F172A] to-[#090F1E]',
    border: 'border-slate-600/40',
    text: 'text-slate-200',
  },
};

export const BotaoTresD: React.FC<BotaoTresDProps> = ({
  cor = 'azul',
  formato = 'bevel',
  tamanho = 'md',
  icone,
  subtitulo,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const paleta = PALETA_CORES[cor];

  if (formato === 'tile') {
    return (
      <button
        type="button"
        disabled={disabled}
        className={`tile-3d-plaque relative w-full min-h-[104px] sm:min-h-[124px] rounded-md border ${paleta.bg} ${paleta.border} ${paleta.text} flex flex-col items-center justify-center px-3 py-4 text-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-cyan-400 ${className}`}
        {...props}
      >
        {icone && <div className="mb-1 opacity-95">{icone}</div>}
        <span className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wide leading-tight drop-shadow-[0_2px_3px_rgba(0,0,0,0.75)]">
          {children}
        </span>
        {subtitulo && (
          <span className="mt-1 text-[11px] font-semibold tracking-wider text-white/80 uppercase">
            {subtitulo}
          </span>
        )}
      </button>
    );
  }

  if (formato === 'chamfer') {
    return (
      <div className="relative drop-shadow-[0_8px_16px_rgba(0,0,0,0.65)] w-full">
        <button
          type="button"
          disabled={disabled}
          className={`chamfer-3d relative w-full min-h-[58px] sm:min-h-[64px] px-6 py-3 ${paleta.bg} ${paleta.text} shadow-[inset_0_4px_0_rgba(255,255,255,0.35),inset_0_-6px_0_rgba(0,0,0,0.52)] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-cyan-400 ${className}`}
          {...props}
        >
          {icone && <span className="shrink-0">{icone}</span>}
          <span className="font-display text-xl sm:text-2xl font-bold uppercase tracking-wider whitespace-nowrap drop-shadow-[0_2px_2px_rgba(0,0,0,0.7)]">
            {children}
          </span>
        </button>
      </div>
    );
  }

  const sizeClasses =
    tamanho === 'sm'
      ? 'min-h-[44px] px-4 py-2 text-sm rounded-lg'
      : tamanho === 'lg'
        ? 'min-h-[52px] px-7 py-3 text-lg sm:text-xl rounded-xl'
        : 'min-h-[46px] px-5 py-2.5 text-base rounded-xl';

  return (
    <button
      type="button"
      disabled={disabled}
      className={`btn-3d-bevel border ${paleta.bg} ${paleta.border} ${paleta.text} ${sizeClasses} font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap focus-visible:outline-2 focus-visible:outline-cyan-400 ${className}`}
      {...props}
    >
      {icone && <span className="shrink-0">{icone}</span>}
      <span>{children}</span>
    </button>
  );
};
