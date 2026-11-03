import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  HelpCircle,
  Info,
  MessageSquare,
  Share2,
  Users,
} from 'lucide-react';
import { Aluno, RegistroFrequencia, StatusFrequencia, Turma } from '../types';

interface SabadoInfo {
  dataStr: string; // YYYY-MM-DD
  diaNumero: string; // '03', '10', etc.
  diaSemanaLabel: string; // 'SÁB'
}

interface FrequenciaArenaProps {
  alunos: Aluno[];
  turmas: Turma[];
  frequencias: RegistroFrequencia[];
  onSetFrequencias: React.Dispatch<React.SetStateAction<RegistroFrequencia[]>>;
  onVoltar: () => void;
  onNotificar: (msg: string) => void;
}

const MESES_NOMES = [
  'JANEIRO',
  'FEVEREIRO',
  'MARÇO',
  'ABRIL',
  'MAIO',
  'JUNHO',
  'JULHO',
  'AGOSTO',
  'SETEMBRO',
  'OUTUBRO',
  'NOVEMBRO',
  'DEZEMBRO',
];

const CICLO_STATUS: StatusFrequencia[] = ['presente', 'falta', 'advertencia', 'justificado'];

export const FrequenciaArena: React.FC<FrequenciaArenaProps> = ({
  alunos,
  turmas,
  frequencias,
  onSetFrequencias,
  onVoltar,
  onNotificar,
}) => {
  // Inicializa em Outubro 2026 para corresponder exatamente à tela de referência
  const [ano, setAno] = useState<number>(2026);
  const [mesIndex, setMesIndex] = useState<number>(9); // 9 = Outubro (0-indexed)
  const [turmaFiltro, setTurmaFiltro] = useState<string>('todas');
  const [modalSabadoDetalhes, setModalSabadoDetalhes] = useState<SabadoInfo | null>(null);

  // Calcula dinamicamente todos os sábados (4 ou 5) do mês e ano selecionados
  const sabadosDoMes = useMemo<SabadoInfo[]>(() => {
    const sabados: SabadoInfo[] = [];
    const diasNoMes = new Date(ano, mesIndex + 1, 0).getDate();
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const data = new Date(ano, mesIndex, dia);
      if (data.getDay() === 6) {
        // 6 = Sábado
        const mesStr = String(mesIndex + 1).padStart(2, '0');
        const diaStr = String(dia).padStart(2, '0');
        sabados.push({
          dataStr: `${ano}-${mesStr}-${diaStr}`,
          diaNumero: diaStr,
          diaSemanaLabel: 'SÁB',
        });
      }
    }
    return sabados;
  }, [ano, mesIndex]);

  // Lista de turmas disponíveis para o filtro
  const opcoesTurmas = useMemo(() => {
    const nomes = new Set<string>();
    turmas.forEach((t) => nomes.add(t.nome));
    alunos.forEach((a) => {
      if (a.turmaCadastro && a.turmaCadastro.trim()) {
        nomes.add(a.turmaCadastro.trim());
      }
    });
    return Array.from(nomes).sort();
  }, [turmas, alunos]);

  // Alunos filtrados por turma
  const alunosFiltrados = useMemo(() => {
    if (turmaFiltro === 'todas') return alunos;
    return alunos.filter((a) => a.turmaCadastro === turmaFiltro);
  }, [alunos, turmaFiltro]);

  // Navegação entre meses
  const mesAnterior = () => {
    if (mesIndex === 0) {
      setMesIndex(11);
      setAno((prev) => prev - 1);
    } else {
      setMesIndex((prev) => prev - 1);
    }
  };

  const proximoMes = () => {
    if (mesIndex === 11) {
      setMesIndex(0);
      setAno((prev) => prev + 1);
    } else {
      setMesIndex((prev) => prev + 1);
    }
  };

  // Regra fundamental: verifica se o aluno estava matriculado na data do sábado
  // "Se o aluno estiver cadastrado em uma data no meio do mês, e não antes, a frequência bloqueia, deixando (N/M) ou NÃO MATRICULADO"
  const isMatriculado = (aluno: Aluno, dataSabado: string): boolean => {
    if (aluno.inicioMatricula && dataSabado < aluno.inicioMatricula) {
      return false;
    }
    if (aluno.fimMatricula && dataSabado > aluno.fimMatricula) {
      return false;
    }
    return true;
  };

  // Obter status atual do aluno no sábado
  const getStatusAlunoSabado = (aluno: Aluno, dataSabado: string): StatusFrequencia => {
    const reg = frequencias.find((f) => f.alunoId === aluno.id && f.data === dataSabado);
    if (reg) return reg.status;
    return 'falta'; // Default para matriculados no sábado
  };

  // Alternar status do aluno com 1 clique (P -> F -> A -> J -> P)
  const alternarStatus = (aluno: Aluno, sabado: SabadoInfo) => {
    if (!isMatriculado(aluno, sabado.dataStr)) {
      const dtParts = (aluno.inicioMatricula || '').split('-');
      const dataInicioFormatada =
        dtParts.length === 3 ? `${dtParts[2]}/${dtParts[1]}/${dtParts[0]}` : aluno.inicioMatricula;
      onNotificar(
        `BLOQUEADO: "${aluno.nome}" não estava matriculado nesta data. Início da matrícula: ${dataInicioFormatada}.`
      );
      return;
    }

    const statusAtual = getStatusAlunoSabado(aluno, sabado.dataStr);
    const idx = CICLO_STATUS.indexOf(statusAtual);
    const novoStatus: StatusFrequencia =
      idx === -1 || idx === CICLO_STATUS.length - 1 ? CICLO_STATUS[0] : CICLO_STATUS[idx + 1];

    onSetFrequencias((prev) => {
      const semEsse = prev.filter((f) => !(f.alunoId === aluno.id && f.data === sabado.dataStr));
      const novoRegistro: RegistroFrequencia = {
        id: `freq_${sabado.dataStr}_${aluno.id}`,
        data: sabado.dataStr,
        alunoId: aluno.id,
        turmaId: 'arena-sabado',
        turmaNome: aluno.turmaCadastro || 'Arena Sábado',
        status: novoStatus,
      };
      return [...semEsse, novoRegistro];
    });

    const statusTexto =
      novoStatus === 'presente'
        ? 'PRESENÇA (P) [Conta como Presença]'
        : novoStatus === 'advertencia'
        ? 'ATRASO (A) [Conta como Presença]'
        : novoStatus === 'falta'
        ? 'FALTA (F) [Conta como Falta]'
        : 'JUSTIFICATIVA (J) [Conta como Falta]';

    onNotificar(`${aluno.nome} -> ${statusTexto} no dia ${sabado.diaNumero}`);
  };

  // Ação ALL: Marcar todos os matriculados como PRESENTE (P) naquele sábado
  const marcarTodosPresentesSabado = (sabado: SabadoInfo) => {
    const matriculados = alunosFiltrados.filter((a) => isMatriculado(a, sabado.dataStr));
    if (matriculados.length === 0) {
      onNotificar('Nenhum atleta matriculado neste sábado.');
      return;
    }

    onSetFrequencias((prev) => {
      const idsMatriculados = matriculados.map((m) => m.id);
      const outros = prev.filter((f) => !(f.data === sabado.dataStr && idsMatriculados.includes(f.alunoId)));
      const novos: RegistroFrequencia[] = matriculados.map((a) => ({
        id: `freq_${sabado.dataStr}_${a.id}`,
        data: sabado.dataStr,
        alunoId: a.id,
        turmaId: 'arena-sabado',
        turmaNome: a.turmaCadastro || 'Arena Sábado',
        status: 'presente',
      }));
      return [...outros, ...novos];
    });

    onNotificar(
      `Todos os ${matriculados.length} atletas matriculados no sábado ${sabado.diaNumero} foram marcados como PRESENTE (P)!`
    );
  };

  // Ação WhatsApp: Compartilhar relatório deste sábado
  const compartilharWhatsAppSabado = (sabado: SabadoInfo) => {
    const matriculados = alunosFiltrados.filter((a) => isMatriculado(a, sabado.dataStr));
    const naoMatriculados = alunosFiltrados.filter((a) => !isMatriculado(a, sabado.dataStr));

    const presentes = matriculados.filter((a) => getStatusAlunoSabado(a, sabado.dataStr) === 'presente');
    const faltas = matriculados.filter((a) => getStatusAlunoSabado(a, sabado.dataStr) === 'falta');
    const advertencias = matriculados.filter((a) => getStatusAlunoSabado(a, sabado.dataStr) === 'advertencia');
    const justificados = matriculados.filter((a) => getStatusAlunoSabado(a, sabado.dataStr) === 'justificado');

    const dtParts = sabado.dataStr.split('-');
    const dataFormatada = `${dtParts[2]}/${dtParts[1]}/${dtParts[0]}`;

    let texto = `*🌊 PROJETO TSUNAMI — FREQUÊNCIA ARENA*\n`;
    texto += `📅 *Sábado: ${dataFormatada}*\n`;
    texto += `🥋 Turma: ${turmaFiltro === 'todas' ? 'Todas as Turmas' : turmaFiltro}\n\n`;
    texto += `📊 *RESUMO:*\n`;
    texto += `✅ Presentes (P): ${presentes.length}\n`;
    texto += `❌ Faltas (F): ${faltas.length}\n`;
    if (advertencias.length > 0) texto += `⚠️ Advertências (A): ${advertencias.length}\n`;
    if (justificados.length > 0) texto += `📝 Justificados (J): ${justificados.length}\n`;
    if (naoMatriculados.length > 0) texto += `🚫 Não Matriculados (N/M): ${naoMatriculados.length}\n`;

    texto += `\n*CHAMADA DETALHADA:*\n`;
    matriculados.forEach((a, idx) => {
      const st = getStatusAlunoSabado(a, sabado.dataStr);
      const icon = st === 'presente' ? '🟢 P' : st === 'falta' ? '🔴 F' : st === 'advertencia' ? '🟡 A' : '🔵 J';
      texto += `${idx + 1}. [${icon}] ${a.nome}\n`;
    });

    if (naoMatriculados.length > 0) {
      texto += `\n*NÃO MATRICULADOS NESTA DATA:*\n`;
      naoMatriculados.forEach((a) => {
        texto += `• [N/M] ${a.nome}\n`;
      });
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(texto);
      onNotificar(`Chamada do sábado ${sabado.diaNumero}/${MESES_NOMES[mesIndex].slice(0, 3)} copiada!`);
    }

    try {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank');
    } catch {
      // Ignore if blocked in sandbox
    }
  };

  // Regra do Usuário:
  // - ATRASO (A) E PRESENÇA (P) É PRESENÇA
  // - FALTA (F) E JUSTIFICATIVA (J) É FALTA
  const calcularPresencasDia = (sabado: SabadoInfo): number => {
    return alunosFiltrados.reduce((total, aluno) => {
      if (!isMatriculado(aluno, sabado.dataStr)) {
        return total; // N/M não conta
      }
      const st = getStatusAlunoSabado(aluno, sabado.dataStr);
      // Presença e Atraso contam como Presença
      if (st === 'presente' || st === 'advertencia') {
        return total + 1;
      }
      return total;
    }, 0);
  };

  // Calcular total de faltas do atleta no mês (apenas sábados onde esteve matriculado)
  // - FALTA (F) E JUSTIFICATIVA (J) É FALTA
  const calcularFaltasMes = (aluno: Aluno): number => {
    return sabadosDoMes.reduce((acc, sabado) => {
      if (!isMatriculado(aluno, sabado.dataStr)) {
        return acc; // N/M nunca conta como falta!
      }
      const st = getStatusAlunoSabado(aluno, sabado.dataStr);
      // Falta e Justificativa contam como Falta
      return st === 'falta' || st === 'justificado' ? acc + 1 : acc;
    }, 0);
  };

  return (
    <div className="space-y-3">
      {/* Barra Superior: Voltar + Título Centralizado com Ícone Check */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onVoltar}
          className="min-h-[34px] px-3.5 rounded-lg border border-teal-500/50 bg-[#001726] hover:bg-[#002b47] text-teal-300 text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-teal-400" />
          <span>Voltar</span>
        </button>

        <div className="flex items-center gap-2 text-teal-400">
          <Check className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3] text-teal-400" />
          <h2 className="font-sans font-black text-lg sm:text-xl md:text-2xl uppercase tracking-wider text-teal-400">
            FREQUÊNCIA ARENA
          </h2>
        </div>

        <div className="w-[74px] hidden sm:block" />
      </div>

      {/* Card Principal: Moldura Exata com Borda Ciano/Teal e Fundo Dark */}
      <div className="rounded-xl border border-teal-500/30 bg-[#020b18] p-2.5 sm:p-4 shadow-2xl">
        {/* Controles de Navegação: Mês & Ano + Filtro de Turma */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 pb-3 border-b border-teal-950/80">
          {/* Seletor de Mês */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={mesAnterior}
              className="w-8 h-8 rounded-lg border border-teal-500/50 bg-[#001726] hover:bg-[#002b47] text-teal-300 flex items-center justify-center cursor-pointer transition-colors shadow-sm"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4 text-teal-300" />
            </button>

            <div className="min-w-[140px] text-center px-2.5 py-1 rounded-lg bg-[#001424] border border-teal-500/30">
              <span className="font-sans font-bold text-xs sm:text-sm tracking-wider text-teal-300 uppercase">
                {MESES_NOMES[mesIndex]} {ano}
              </span>
            </div>

            <button
              type="button"
              onClick={proximoMes}
              className="w-8 h-8 rounded-lg border border-teal-500/50 bg-[#001726] hover:bg-[#002b47] text-teal-300 flex items-center justify-center cursor-pointer transition-colors shadow-sm"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4 text-teal-300" />
            </button>
          </div>

          {/* Filtro de Turmas */}
          <div className="flex items-center gap-2">
            <select
              value={turmaFiltro}
              onChange={(e) => setTurmaFiltro(e.target.value)}
              className="min-h-[34px] px-3 rounded-lg border border-teal-500/50 bg-[#001726] text-teal-200 text-xs font-semibold uppercase tracking-wide focus:outline-none focus:border-teal-400 cursor-pointer shadow-sm"
            >
              <option value="todas">TODAS AS TURMAS</option>
              {opcoesTurmas.map((nome) => (
                <option key={nome} value={nome}>
                  {nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabela Matriz da Frequência Arena */}
        <div className="overflow-x-auto rounded-lg border border-teal-900/40 bg-[#010814]">
          <table className="w-full border-collapse">
            {/* Cabeçalho da Tabela */}
            <thead>
              <tr className="border-b border-teal-900/60 bg-[#021226]/80">
                <th className="text-left text-[11px] font-bold uppercase tracking-wider text-teal-400 py-2 px-3 min-w-[190px]">
                  ATLETA
                </th>

                {sabadosDoMes.map((sabado) => (
                  <th key={sabado.dataStr} className="text-center py-1.5 px-1 min-w-[56px] w-[62px]">
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-teal-400/80">
                      {sabado.diaSemanaLabel}
                    </span>
                    <span className="block text-sm sm:text-base font-sans font-bold text-teal-300 leading-tight">
                      {sabado.diaNumero}
                    </span>
                  </th>
                ))}

                <th className="text-center text-[11px] font-bold uppercase tracking-wider text-teal-400 py-2 px-2 min-w-[60px] w-[64px]">
                  FALTAS
                </th>
              </tr>

              {/* Linha Sub-Header: "RELATÓRIOS" + Botões de Ação por Sábado */}
              <tr className="border-b border-teal-950 bg-[#010a17]/90">
                <th className="text-left text-[9px] font-bold uppercase tracking-wider text-cyan-400/90 py-1 px-3">
                  RELATÓRIOS
                </th>

                {sabadosDoMes.map((sabado) => (
                  <th key={`acoes_${sabado.dataStr}`} className="py-1 px-1 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      {/* Botão Verde: Compartilhar WhatsApp */}
                      <button
                        type="button"
                        onClick={() => compartilharWhatsAppSabado(sabado)}
                        title="Compartilhar presença deste sábado no WhatsApp"
                        className="w-6 h-4 sm:w-6.5 sm:h-4.5 rounded bg-[#10b981] hover:bg-emerald-400 text-slate-950 flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105"
                      >
                        <Share2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </button>

                      {/* Botão Amarelo: Detalhes do Sábado */}
                      <button
                        type="button"
                        onClick={() => setModalSabadoDetalhes(sabado)}
                        title="Detalhes do Treino deste Sábado"
                        className="w-6 h-4 sm:w-6.5 sm:h-4.5 rounded bg-[#f59e0b] hover:bg-amber-400 text-slate-950 flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105"
                      >
                        <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </button>

                      {/* Botão Roxo: Mensagens / Justificativas */}
                      <button
                        type="button"
                        onClick={() => {
                          const matriculados = alunosFiltrados.filter((a) => isMatriculado(a, sabado.dataStr));
                          const justs = matriculados.filter(
                            (a) => getStatusAlunoSabado(a, sabado.dataStr) === 'justificado'
                          );
                          onNotificar(
                            `Sábado ${sabado.diaNumero}: ${justs.length} justificativas registradas.`
                          );
                        }}
                        title="Justificativas e Mensagens"
                        className="w-6 h-4 sm:w-6.5 sm:h-4.5 rounded bg-[#8b5cf6] hover:bg-purple-400 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105"
                      >
                        <MessageSquare className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </button>

                      {/* Botão Azul: ALL (Marcar todos presentes) */}
                      <button
                        type="button"
                        onClick={() => marcarTodosPresentesSabado(sabado)}
                        title="Marcar todos os matriculados como PRESENTE (P)"
                        className="w-6 h-4 sm:w-6.5 sm:h-4.5 rounded bg-[#3b82f6] hover:bg-blue-400 text-white text-[8px] font-black tracking-wider flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105"
                      >
                        ALL
                      </button>
                    </div>
                  </th>
                ))}

                <th className="text-center py-1 px-1 text-slate-500 font-normal text-[10px]">-</th>
              </tr>
            </thead>

            {/* Corpo da Tabela: Linhas dos Atletas */}
            <tbody className="divide-y divide-teal-950/60">
              {alunosFiltrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={sabadosDoMes.length + 2}
                    className="py-8 text-center text-xs text-slate-400 font-bold uppercase tracking-wider"
                  >
                    Nenhum aluno encontrado nesta turma.
                  </td>
                </tr>
              ) : (
                alunosFiltrados.map((aluno) => {
                  const faltasTotal = calcularFaltasMes(aluno);

                  return (
                    <tr
                      key={aluno.id}
                      className="hover:bg-teal-950/20 transition-colors group"
                    >
                      {/* Coluna Nome do Atleta + Turma Subtítulo */}
                      <td className="py-1.5 sm:py-2 px-3">
                        <p className="font-sans font-bold uppercase text-slate-100 tracking-tight text-[11px] sm:text-xs group-hover:text-teal-300 transition-colors leading-tight">
                          {aluno.nome}
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-teal-400/70 font-sans tracking-tight leading-tight mt-0.5">
                          {aluno.turmaCadastro || '04. QUEIMADA/VOLEIBOL'}
                        </p>
                      </td>

                      {/* Colunas dos Sábados do Mês */}
                      {sabadosDoMes.map((sabado) => {
                        const matriculado = isMatriculado(aluno, sabado.dataStr);

                        if (!matriculado) {
                          // ALUNO NÃO MATRICULADO NA DATA DO SÁBADO
                          // A frequência bloqueia e exibe (N/M)
                          return (
                            <td key={sabado.dataStr} className="py-1 sm:py-1.5 px-0.5 text-center">
                              <button
                                type="button"
                                onClick={() => alternarStatus(aluno, sabado)}
                                title={`Não Matriculado nesta data (Matrícula iniciou em: ${aluno.inicioMatricula || 'N/A'})`}
                                className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-[#09152a] border border-slate-800 text-slate-500 font-bold text-[8px] sm:text-[9px] flex items-center justify-center cursor-not-allowed opacity-50 mx-auto select-none transition-all hover:border-slate-700 hover:text-slate-400"
                              >
                                N/M
                              </button>
                            </td>
                          );
                        }

                        // ALUNO MATRICULADO NA DATA DO SÁBADO
                        const status = getStatusAlunoSabado(aluno, sabado.dataStr);

                        return (
                          <td key={sabado.dataStr} className="py-1 sm:py-1.5 px-0.5 text-center">
                            {status === 'presente' && (
                              <button
                                type="button"
                                onClick={() => alternarStatus(aluno, sabado)}
                                title="PRESENÇA (P) — Conta como presença (Clique para alternar)"
                                className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg border border-emerald-500/80 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 font-bold text-[11px] sm:text-xs flex items-center justify-center cursor-pointer mx-auto transition-transform active:scale-95 shadow-[0_0_6px_rgba(16,185,129,0.2)]"
                              >
                                P
                              </button>
                            )}

                            {status === 'falta' && (
                              <button
                                type="button"
                                onClick={() => alternarStatus(aluno, sabado)}
                                title="FALTA (F) — Conta como falta (Clique para alternar)"
                                className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg border border-rose-500/80 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 font-bold text-[11px] sm:text-xs flex items-center justify-center cursor-pointer mx-auto transition-transform active:scale-95 shadow-[0_0_6px_rgba(244,63,94,0.2)]"
                              >
                                F
                              </button>
                            )}

                            {status === 'advertencia' && (
                              <button
                                type="button"
                                onClick={() => alternarStatus(aluno, sabado)}
                                title="ATRASO (A) — Conta como presença (Clique para alternar)"
                                className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg border border-amber-500/80 bg-amber-950/40 hover:bg-amber-900/60 text-amber-400 font-bold text-[11px] sm:text-xs flex items-center justify-center cursor-pointer mx-auto transition-transform active:scale-95 shadow-[0_0_6px_rgba(245,158,11,0.2)]"
                              >
                                A
                              </button>
                            )}

                            {status === 'justificado' && (
                              <button
                                type="button"
                                onClick={() => alternarStatus(aluno, sabado)}
                                title="JUSTIFICATIVA (J) — Conta como falta (Clique para alternar)"
                                className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg border border-cyan-500/80 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 font-bold text-[11px] sm:text-xs flex items-center justify-center cursor-pointer mx-auto transition-transform active:scale-95 shadow-[0_0_6px_rgba(6,182,212,0.2)]"
                              >
                                J
                              </button>
                            )}
                          </td>
                        );
                      })}

                      {/* Coluna Faltas */}
                      <td className="py-1 sm:py-1.5 px-1 text-center">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-rose-950/50 border border-rose-500/30 text-rose-300 font-bold text-[11px] sm:text-xs flex items-center justify-center mx-auto shadow-inner font-sans">
                          {faltasTotal}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Linha Inferior: PRESENÇAS / DIA */}
            <tfoot>
              <tr className="border-t-2 border-teal-500/40 bg-[#021327]/95">
                <td className="py-2 px-3">
                  <span className="font-sans font-bold text-[10px] sm:text-[11px] uppercase tracking-wider text-emerald-400">
                    PRESENÇAS / DIA
                  </span>
                </td>

                {sabadosDoMes.map((sabado) => {
                  const totalPresencas = calcularPresencasDia(sabado);
                  return (
                    <td key={`total_${sabado.dataStr}`} className="py-2 px-1 text-center">
                      <span className="font-sans font-bold text-xs sm:text-sm text-emerald-400 leading-none">
                        {totalPresencas}
                      </span>
                    </td>
                  );
                })}

                <td className="py-2 px-1 text-center text-slate-500 font-sans text-[10px]">
                  -
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Legenda Explicativa Inferior */}
        <div className="mt-4 pt-4 border-t border-teal-950/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Legenda:</span>

            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-lg border border-emerald-500 bg-emerald-950/50 text-emerald-400 font-bold flex items-center justify-center text-xs">
                P
              </span>
              <span className="text-slate-300">Presença (P)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-lg border border-amber-500 bg-amber-950/50 text-amber-400 font-bold flex items-center justify-center text-xs">
                A
              </span>
              <span className="text-slate-300">Atraso (A = Presença)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-lg border border-rose-500 bg-rose-950/50 text-rose-400 font-bold flex items-center justify-center text-xs">
                F
              </span>
              <span className="text-slate-300">Falta (F)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-lg border border-cyan-500 bg-cyan-950/50 text-cyan-300 font-bold flex items-center justify-center text-xs">
                J
              </span>
              <span className="text-slate-300">Justificativa (J = Falta)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-8 h-6 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-500 font-bold flex items-center justify-center text-[10px]">
                N/M
              </span>
              <span className="text-slate-400">Não Matriculado (Bloqueado)</span>
            </div>
          </div>

          <p className="text-[11px] text-teal-400/90 font-medium">
            * <strong className="text-emerald-400">Atraso e Presença é Presença</strong> no dia. <strong className="text-rose-400">Falta e Justificativa é Falta</strong> no total de faltas.
          </p>
        </div>
      </div>

      {/* Modal Informativo do Sábado ao Clicar no Relógio Amarelo */}
      {modalSabadoDetalhes && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#030d22] border-2 border-amber-500/80 rounded-2xl shadow-[0_0_35px_rgba(245,158,11,0.3)] max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-amber-500/20">
              <div className="flex items-center gap-2 text-amber-400">
                <Clock className="w-5 h-5" />
                <h3 className="font-display font-black text-xl uppercase tracking-wider">
                  Treino de Sábado {modalSabadoDetalhes.diaNumero}/{MESES_NOMES[mesIndex].slice(0, 3)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalSabadoDetalhes(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              Atividades da Arena registradas para esta data:
            </p>

            <div className="space-y-2 mb-6">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                <p className="font-bold text-white uppercase">17:15 — VOLEIBOL BASE & MISTO</p>
                <p className="text-slate-400">Fundamentos técnicos e recepção</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                <p className="font-bold text-white uppercase">18:45 — VOLEIBOL (1ª PARTE)</p>
                <p className="text-slate-400">Sistemas táticos e jogos</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                <p className="font-bold text-white uppercase">20:20 — VOLEIBOL (2ª PARTE)</p>
                <p className="text-slate-400">Partidas equilibradas por estrelas</p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setModalSabadoDetalhes(null)}
                className="min-h-[40px] px-5 rounded-xl border border-amber-400/80 bg-amber-600 hover:bg-amber-500 text-slate-950 font-display font-black text-xs uppercase tracking-wider cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
