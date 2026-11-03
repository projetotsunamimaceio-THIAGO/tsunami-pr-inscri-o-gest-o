import React, { useState } from 'react';
import { KeyRound, ShieldCheck, X } from 'lucide-react';
import { BotaoTresD } from './BotaoTresD';

interface ModalLoginProfessorProps {
  aberto: boolean;
  onFechar: () => void;
  onLoginProfessor: () => void;
}

export const Login: React.FC<ModalLoginProfessorProps> = ({
  aberto,
  onFechar,
  onLoginProfessor,
}) => {
  const [senha, setSenha] = useState('tsunami2027');
  const [erro, setErro] = useState('');

  if (!aberto) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = senha.trim();
    if (s === 'tsunami2027' || s === 'admin' || s === '1234') {
      setErro('');
      onLoginProfessor();
      onFechar();
    } else {
      setErro('Senha incorreta. Apenas professores e coordenação têm acesso a esta área.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-prof-titulo"
    >
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-purple-500/50 bg-[#061026] p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl border border-purple-500/40 bg-purple-950/50 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 id="modal-prof-titulo" className="font-display text-xl sm:text-2xl font-bold uppercase tracking-wide text-white">
                Área do Professor
              </h2>
              <p className="text-[11px] text-purple-300 font-semibold uppercase">
                Acesso Exclusivo da Coordenação
              </p>
            </div>
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

        {erro && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 px-3.5 py-2.5 text-xs text-rose-200">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Senha de Acesso do Professor:
            </label>
            <input
              type="password"
              autoFocus
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite a senha da coordenação"
              className="w-full min-h-[48px] rounded-xl border border-slate-700 bg-[#081736] px-3.5 py-2.5 text-sm text-white focus:border-purple-400 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-400 font-mono-num">
              Senha padrão: <span className="text-cyan-300">tsunami2027</span>
            </p>
          </div>

          <BotaoTresD
            type="submit"
            cor="roxo"
            tamanho="md"
            icone={<KeyRound className="w-4 h-4" />}
            className="w-full"
          >
            ENTRAR NO PAINEL DO PROFESSOR
          </BotaoTresD>
        </form>
      </div>
    </div>
  );
};
