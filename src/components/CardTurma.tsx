import React, { useState } from 'react';
import { Check, Copy, LogIn, LogOut, Lock, Shuffle, Star, Trophy, X } from 'lucide-react';
import { Aluno, TimeEquilibrado, Turma } from '../types';
import { ListaInscritos } from './ListaInscritos';
import { BotaoTresD } from './BotaoTresD';

interface CardTurmaProps {
  turma: Turma;
  todosAlunos: Aluno[];
  alunoAtual: Aluno | null;
  isProfessor: boolean;
  inscricoesTrancadas: boolean;
  onToggleInscricao: (turmaId: string) => void;
  onNotificar: (msg: string) => void;
}

function sortearTimesEquilibrados(inscritos: Aluno[], numTimes: number, semente: number): TimeEquilibrado[] {
  const copia = [...inscritos].sort((a, b) => {
    if (b.nivel !== a.nivel) return b.nivel - a.nivel;
    // Desempate determinístico baseado na semente para permitir re-sorteio justo entre mesmo nível
    const hashA = (a.id.charCodeAt(1) * 31 + semente * 17) % 97;
    const hashB = (b.id.charCodeAt(1) * 31 + semente * 17) % 97;
    return hashA - hashB;
  });

  const times: TimeEquilibrado[] = Array.from({ length: numTimes }, (_, i) => ({
    nome: `LINHA ${i + 1}`,
    atletas: [],
    somaEstrelas: 0,
    mediaEstrelas: 0,
  }));

  // Algoritmo guloso + snake balanceado pela soma atual de estrelas e tamanho da linha
  for (const atleta of copia) {
    times.sort((tA, tB) => {
      if (tA.atletas.length !== tB.atletas.length) {
        return tA.atletas.length - tB.atletas.length;
      }
      return tA.somaEstrelas - tB.somaEstrelas;
    });
    times[0].atletas.push(atleta);
    times[0].somaEstrelas += atleta.nivel;
  }

  return times
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .map((t) => ({
      ...t,
      mediaEstrelas: t.atletas.length > 0 ? Number((t.somaEstrelas / t.atletas.length).toFixed(1)) : 0,
    }));
}

export const CardTurma: React.FC<CardTurmaProps> = ({
  turma,
  todosAlunos,
  alunoAtual,
  isProfessor,
  inscricoesTrancadas,
  onToggleInscricao,
  onNotificar,
}) => {
  const [mostrarSorteio, setMostrarSorteio] = useState(false);
  const [numLinhas, setNumLinhas] = useState<number>(2);
  const [semente, setSemente] = useState<number>(1);
  const [copiado, setCopiado] = useState(false);

  const inscritos: Aluno[] = turma.inscritosIds
    .map((id) => todosAlunos.find((a) => a.id === id))
    .filter((a): a is Aluno => Boolean(a));

  const ocupadas = inscritos.length;
  const restantes = Math.max(0, turma.vagasTotais - ocupadas);
  const percentual = turma.vagasTotais > 0 ? Math.min(100, Math.round((ocupadas / turma.vagasTotais) * 100)) : 0;
  const lotado = restantes === 0;
  const jaInscrito = alunoAtual ? turma.inscritosIds.includes(alunoAtual.id) : false;

  const timesSorteados = mostrarSorteio
    ? sortearTimesEquilibrados(inscritos, Math.max(2, Math.min(4, numLinhas)), semente)
    : [];

  const copiarSorteioWhatsApp = async () => {
    const linhasTexto = timesSorteados
      .map(
        (t) =>
          `*${t.nome}* (Média ${t.mediaEstrelas}★)\n` +
          t.atletas.map((a, idx) => `${idx + 1}. ${a.nome} (${a.nivel}★)`).join('\n')
      )
      .join('\n\n');

    const texto = `🏐 *PROJETO TSUNAMI — ${turma.nome} (${turma.horario})*\n⚖️ *LINHAS EQUILIBRADAS*\n\n${linhasTexto}`;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      onNotificar('Linhas equilibradas copiadas para enviar no WhatsApp!');
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      onNotificar('Não foi possível copiar automaticamente.');
    }
  };

  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-[#071426] to-[#050d1a] p-4 sm:p-5 shadow-[0_0_28px_rgba(16,185,129,0.08)] flex flex-col justify-between">
      <div>
        {/* Cabeçalho do Card da Turma */}
        <div className="flex flex-wrap items-start justify-between gap-2.5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-wide text-white">
                {turma.nome}
              </h3>
              <span className="rounded-md border border-emerald-400/30 bg-emerald-950/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 font-mono-num">
                {turma.vagasTotais} VAGAS
              </span>
            </div>
            <p className="mt-0.5 text-xs font-semibold text-slate-400 font-mono-num">
              {turma.horario} <span aria-hidden="true">·</span> {turma.dia} <span aria-hidden="true">·</span>{' '}
              {turma.modalidade}
            </p>
          </div>

          {isProfessor && (
            <button
              type="button"
              onClick={() => {
                setSemente((s) => s + 1);
                setMostrarSorteio((prev) => !prev);
              }}
              disabled={inscritos.length < 2}
              className="min-h-[40px] rounded-xl border border-emerald-500/35 bg-[#0b1c31] hover:bg-[#112844] px-3 py-1.5 text-[11px] font-display font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
              title="Divide os atletas inscritos em times equilibrados pelas estrelas"
            >
              <Shuffle className="w-3.5 h-3.5 text-emerald-400" />
              <span>SORTEAR LINHAS</span>
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
            </button>
          )}
        </div>

        {/* Contador de Vagas & Barra de Progresso */}
        <div className="mt-4 mb-3.5">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-1.5 font-mono-num">
            <span className={lotado ? 'text-rose-400' : 'text-emerald-300'}>
              {lotado ? '0 VAGAS RESTANTES (LOTADO)' : `${restantes} VAGAS RESTANTES`}
            </span>
            <span className="text-slate-300">
              {ocupadas} / {turma.vagasTotais} ({percentual}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#0d1a2f] overflow-hidden border border-slate-800/80">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                lotado
                  ? 'bg-gradient-to-r from-rose-600 to-red-400'
                  : percentual >= 80
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    : 'bg-gradient-to-r from-emerald-500 to-cyan-400'
              }`}
              style={{ width: `${percentual}%` }}
            />
          </div>
        </div>

        {/* Painel de Sorteio de Linhas Equilibradas (Visível ao clicar como Professor) */}
        {isProfessor && mostrarSorteio && inscritos.length >= 2 && (
          <div className="mb-4 rounded-xl border border-cyan-500/35 bg-[#061328] p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="font-display text-sm font-bold uppercase tracking-wider text-cyan-300">
                  Linhas Equilibradas por Estrelas
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {[2, 3].map((qtd) => (
                  <button
                    key={qtd}
                    type="button"
                    onClick={() => setNumLinhas(qtd)}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase cursor-pointer transition-colors ${
                      numLinhas === qtd
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {qtd} Times
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSemente((s) => s + 1)}
                  className="px-2.5 py-1 rounded bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 text-[11px] font-bold uppercase hover:bg-emerald-600/50 cursor-pointer"
                >
                  Re-sortear
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarSorteio(false)}
                  aria-label="Fechar sorteio"
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {timesSorteados.map((time) => (
                <div key={time.nome} className="rounded-lg border border-slate-800 bg-[#09172e] p-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-display text-sm font-bold text-white uppercase">{time.nome}</span>
                    <span className="text-[11px] font-mono-num text-amber-300 flex items-center gap-1">
                      Soma {time.somaEstrelas}★ · Média {time.mediaEstrelas}
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {time.atletas.map((atl, i) => (
                      <li key={atl.id} className="flex items-center justify-between text-xs text-slate-200">
                        <span className="truncate font-semibold uppercase">
                          {i + 1}. {atl.nome}
                        </span>
                        <span className="font-mono-num text-cyan-300 shrink-0 ml-2">{atl.nivel}★</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={copiarSorteioWhatsApp}
              className="mt-3 w-full min-h-[40px] rounded-lg border border-emerald-500/40 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-200 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {copiado ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiado ? 'Linhas Copiadas!' : 'Copiar Linhas para WhatsApp'}</span>
            </button>
          </div>
        )}

        {/* Lista Numerada dos Inscritos */}
        <ListaInscritos
          atletas={inscritos}
          modo="turma"
          alunoLogadoId={alunoAtual?.id}
          mensagemVazia="Nenhum atleta inscrito nesta turma até o momento."
        />
      </div>
    </div>
  );
};
