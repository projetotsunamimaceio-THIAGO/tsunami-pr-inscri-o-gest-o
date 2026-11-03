import React, { useEffect, useState } from 'react';
import { Check, Flame, Volleyball, X } from 'lucide-react';
import { Aluno, Turma } from '../types';
import { BotaoTresD } from './BotaoTresD';

interface ModalConfirmarInscricaoProps {
  aberto: boolean;
  alunos: Aluno[];
  turmas: Turma[];
  confirmadosCelulaIds: string[];
  onFechar: () => void;
  onSalvarInscricao: (alunoId: string, confirmarCelula: boolean, turmasSelecionadasIds: string[]) => void;
}

export const ModalConfirmarInscricao: React.FC<ModalConfirmarInscricaoProps> = ({
  aberto,
  alunos,
  turmas,
  confirmadosCelulaIds,
  onFechar,
  onSalvarInscricao,
}) => {
  const [alunoId, setAlunoId] = useState<string>(alunos[0]?.id || '');
  const [confirmarCelula, setConfirmarCelula] = useState<boolean>(true);
  const [turmasSelecionadas, setTurmasSelecionadas] = useState<string[]>([]);
  const [mensagemErro, setMensagemErro] = useState<string>('');

  // Ao mudar de aluno ou abrir modal, pré-carrega o estado atual daquele atleta
  useEffect(() => {
    if (!alunoId && alunos.length > 0) {
      setAlunoId(alunos[0].id);
    }
  }, [alunos, alunoId]);

  useEffect(() => {
    if (alunoId) {
      setConfirmarCelula(confirmadosCelulaIds.includes(alunoId));
      const turmasDoAluno = turmas
        .filter((t) => t.inscritosIds.includes(alunoId))
        .map((t) => t.id);
      setTurmasSelecionadas(turmasDoAluno);
      setMensagemErro('');
    }
  }, [alunoId, confirmadosCelulaIds, turmas, aberto]);

  if (!aberto) return null;

  const alunoSelecionado = alunos.find((a) => a.id === alunoId);

  const toggleTurma = (id: string, lotada: boolean) => {
    const jaInscrito = turmasSelecionadas.includes(id);
    if (!jaInscrito && lotada) {
      setMensagemErro('Esta turma já atingiu a capacidade máxima de vagas.');
      return;
    }
    setMensagemErro('');
    setTurmasSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alunoId) {
      setMensagemErro('Por favor, selecione seu nome na lista de atletas cadastrados.');
      return;
    }
    if (alunoSelecionado && !alunoSelecionado.liberadoInscricao) {
      setMensagemErro('Seu perfil está temporariamente bloqueado para inscrição. Fale com o professor.');
      return;
    }
    onSalvarInscricao(alunoId, confirmarCelula, turmasSelecionadas);
    onFechar();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-inscricao-titulo"
    >
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl border border-cyan-500/40 bg-[#041029] p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 id="modal-inscricao-titulo" className="font-display text-2xl font-bold uppercase tracking-wide text-white">
              Confirmar Pré-Inscrição
            </h2>
            <p className="text-xs text-cyan-300 font-medium">
              Apenas alunos cadastrados pelo professor
            </p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar janela"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {mensagemErro && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 px-3.5 py-2.5 text-xs text-rose-200">
            {mensagemErro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seleção do Nome do Aluno */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              1. Selecione o seu Nome:
            </label>
            <select
              value={alunoId}
              onChange={(e) => setAlunoId(e.target.value)}
              className="w-full min-h-[48px] rounded-xl border border-slate-700 bg-[#081736] px-3.5 py-2.5 text-sm font-semibold text-white focus:border-cyan-400 focus:outline-none"
            >
              {alunos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome} ({a.nivel}★) — {a.turmaCadastro}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-400">
              Não encontrou seu nome? O cadastro de novos alunos é feito exclusivamente pelo professor.
            </p>
          </div>

          {/* Confirmação Célula Obrigatória */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-1.5 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>2. Célula Semanal (Obrigatória):</span>
            </label>
            <label
              className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                confirmarCelula
                  ? 'border-amber-500/50 bg-amber-950/30 text-white'
                  : 'border-slate-800 bg-[#071328] text-slate-400'
              }`}
            >
              <input
                type="checkbox"
                checked={confirmarCelula}
                onChange={(e) => setConfirmarCelula(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
              <span className="text-xs sm:text-sm font-semibold">
                Sim, confirmo minha presença na Célula (Terça às 20:00)
              </span>
            </label>
          </div>

          {/* Seleção das Turmas Abertas de Voleibol */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-cyan-300 mb-1.5 flex items-center gap-1.5">
              <Volleyball className="w-4 h-4 text-cyan-400" />
              <span>3. Escolha a(s) Turma(s) do Dia:</span>
            </label>

            <div className="space-y-2">
              {turmas
                .filter((t) => t.aberta)
                .map((t) => {
                  const jaEstaInscrito = turmasSelecionadas.includes(t.id);
                  const vagasRestantes = Math.max(0, t.vagasTotais - t.inscritosIds.length);
                  const lotada = vagasRestantes === 0 && !jaEstaInscrito;

                  return (
                    <label
                      key={t.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                        jaEstaInscrito
                          ? 'border-cyan-500/60 bg-cyan-950/30 text-white'
                          : lotada
                            ? 'border-slate-800/60 bg-[#050b18]/70 text-slate-500 cursor-not-allowed'
                            : 'border-slate-800 bg-[#071328] text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          disabled={lotada}
                          checked={jaEstaInscrito}
                          onChange={() => toggleTurma(t.id, lotada)}
                          className="w-4 h-4 accent-cyan-500 rounded cursor-pointer disabled:cursor-not-allowed"
                        />
                        <div className="min-w-0">
                          <p className="font-display text-sm font-bold uppercase text-white truncate">
                            {t.nome}
                          </p>
                          <p className="text-[11px] font-mono-num text-slate-400">
                            {t.horario} · {t.dia} · {t.modalidade}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono-num font-bold uppercase px-2 py-1 rounded shrink-0 ${
                          jaEstaInscrito
                            ? 'bg-cyan-500 text-slate-950'
                            : lotada
                              ? 'bg-rose-950 text-rose-400 border border-rose-500/30'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {lotada ? 'LOTADA' : `${vagasRestantes} VAGAS`}
                      </span>
                    </label>
                  );
                })}
            </div>
          </div>

          <div className="pt-2">
            <BotaoTresD
              type="submit"
              cor="azul"
              tamanho="md"
              icone={<Check className="w-5 h-5" />}
              className="w-full"
            >
              CONFIRMAR MINHA INSCRIÇÃO
            </BotaoTresD>
          </div>
        </form>
      </div>
    </div>
  );
};
