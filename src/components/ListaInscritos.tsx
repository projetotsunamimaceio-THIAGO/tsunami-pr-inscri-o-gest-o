import React from 'react';
import { Flame, Star } from 'lucide-react';
import { Aluno } from '../types';

interface ListaInscritosProps {
  atletas: Aluno[];
  modo: 'celula' | 'turma';
  alunoLogadoId?: string | null;
  mensagemVazia?: string;
}

export const ListaInscritos: React.FC<ListaInscritosProps> = ({
  atletas,
  modo,
  alunoLogadoId,
  mensagemVazia = 'Nenhum atleta confirmado ainda.',
}) => {
  if (atletas.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800/80 bg-[#070f20]/70 px-4 py-6 text-center text-xs text-slate-400">
        {mensagemVazia}
      </div>
    );
  }

  return (
    <ol className="space-y-2">
      {atletas.map((atleta, index) => {
        const isCurrentUser = atleta.id === alunoLogadoId;
        return (
          <li
            key={atleta.id}
            className={`flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 border transition-colors ${
              isCurrentUser
                ? modo === 'celula'
                  ? 'bg-amber-950/30 border-amber-500/45'
                  : 'bg-cyan-950/35 border-cyan-500/45'
                : 'bg-[#091224] border-[#152542]'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono-num font-bold shrink-0 border ${
                  modo === 'celula'
                    ? 'bg-[#0e192d] border-amber-500/30 text-amber-300'
                    : 'bg-[#0e192d] border-slate-700 text-slate-300'
                }`}
              >
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="font-display text-sm sm:text-base font-bold uppercase tracking-wide text-white truncate">
                  {atleta.nome}
                </p>
              </div>
            </div>

            {modo === 'celula' ? (
              <div className="flex items-center gap-1.5 shrink-0 rounded-lg border border-amber-400/25 bg-[#0c1a30] px-2.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-300">
                <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>CONFIRMADO</span>
              </div>
            ) : (
              <div
                className="flex items-center gap-0.5 shrink-0 rounded-lg border border-slate-800 bg-[#060d1b] px-2 py-1"
                aria-label={`Nível ${atleta.nivel} de 5 estrelas`}
                title={`Nível técnico: ${atleta.nivel}/5`}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                      star <= atleta.nivel
                        ? 'fill-cyan-300 text-cyan-300'
                        : 'fill-slate-800 text-slate-800'
                    }`}
                  />
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
};
