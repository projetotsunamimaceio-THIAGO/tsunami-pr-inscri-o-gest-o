import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Award,
  BarChart3,
  Calendar,
  CheckCircle2,
  Copy,
  Download,
  Flame,
  MessageCircle,
  PieChart,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Aluno, RegistroFrequencia, Turma } from '../types';

interface RelatoriosGraficosProps {
  alunos: Aluno[];
  turmas: Turma[];
  frequencias: RegistroFrequencia[];
  onVoltar: () => void;
  onNotificar: (msg: string) => void;
}

export const RelatoriosGraficos: React.FC<RelatoriosGraficosProps> = ({
  alunos,
  turmas,
  frequencias,
  onVoltar,
  onNotificar,
}) => {
  const [dataInicio, setDataInicio] = useState('2026-10-01');
  const [dataFim, setDataFim] = useState('2026-10-31');
  const [turmaFiltro, setTurmaFiltro] = useState<string>('todas');
  const [buscaAtleta, setBuscaAtleta] = useState<string>('');

  // Sábados de referência em Outubro 2026 para os gráficos de barras
  const sabadosGrafico = ['2026-10-03', '2026-10-10', '2026-10-17', '2026-10-24', '2026-10-31'];

  // Registros filtrados pelo período selecionado
  const frequenciasFiltradas = useMemo(() => {
    return frequencias.filter((f) => f.data >= dataInicio && f.data <= dataFim);
  }, [frequencias, dataInicio, dataFim]);

  // Alunos filtrados por turma
  const alunosFiltrados = useMemo(() => {
    if (turmaFiltro === 'todas') return alunos;
    return alunos.filter((a) => a.turmaCadastro === turmaFiltro);
  }, [alunos, turmaFiltro]);

  // Estatísticas por Sábado para o Gráfico de Barras
  const dadosPorSabado = useMemo(() => {
    return sabadosGrafico.map((dataStr) => {
      const diaNum = dataStr.split('-')[2];
      const matriculadosNesseDia = alunosFiltrados.filter((a) => {
        if (a.inicioMatricula && dataStr < a.inicioMatricula) return false;
        if (a.fimMatricula && dataStr > a.fimMatricula) return false;
        return true;
      });

      const presentes = matriculadosNesseDia.filter((a) => {
        const reg = frequencias.find((f) => f.alunoId === a.id && f.data === dataStr);
        // Presença e Atraso contam como Presença
        return reg?.status === 'presente' || reg?.status === 'advertencia';
      }).length;

      const faltas = matriculadosNesseDia.filter((a) => {
        const reg = frequencias.find((f) => f.alunoId === a.id && f.data === dataStr);
        // Falta e Justificativa contam como Falta
        return reg?.status === 'falta' || reg?.status === 'justificado';
      }).length;

      const totalMatriculados = matriculadosNesseDia.length;
      const taxa = totalMatriculados > 0 ? Math.round((presentes / totalMatriculados) * 100) : 0;

      return {
        dataStr,
        label: `SÁB ${diaNum}`,
        presentes,
        faltas,
        totalMatriculados,
        taxa,
      };
    });
  }, [sabadosGrafico, alunosFiltrados, frequencias]);

  // Estatísticas por Atleta
  const relatorioPorAtleta = useMemo(() => {
    return alunosFiltrados.map((a) => {
      let presencas = 0;
      let faltas = 0;
      let diasMatriculados = 0;

      sabadosGrafico.forEach((dataStr) => {
        const matriculado =
          (!a.inicioMatricula || dataStr >= a.inicioMatricula) &&
          (!a.fimMatricula || dataStr <= a.fimMatricula);

        if (matriculado) {
          diasMatriculados++;
          const reg = frequencias.find((f) => f.alunoId === a.id && f.data === dataStr);
          if (reg?.status === 'presente' || reg?.status === 'advertencia') {
            presencas++;
          } else if (reg?.status === 'falta' || reg?.status === 'justificado') {
            faltas++;
          }
        }
      });

      const taxa = diasMatriculados > 0 ? Math.round((presencas / diasMatriculados) * 100) : 100;

      return {
        aluno: a,
        presencas,
        faltas,
        diasMatriculados,
        taxa,
      };
    });
  }, [alunosFiltrados, sabadosGrafico, frequencias]);

  // Ranking ordenado pela maior taxa de presença
  const rankingAtletas = useMemo(() => {
    return [...relatorioPorAtleta].sort((a, b) => b.taxa - a.taxa || b.presencas - a.presencas);
  }, [relatorioPorAtleta]);

  // Estatísticas Gerais
  const totalPresencasGeral = dadosPorSabado.reduce((acc, d) => acc + d.presentes, 0);
  const totalFaltasGeral = dadosPorSabado.reduce((acc, d) => acc + d.faltas, 0);
  const totalGeral = totalPresencasGeral + totalFaltasGeral;
  const taxaGeral = totalGeral > 0 ? Math.round((totalPresencasGeral / totalGeral) * 100) : 0;

  // Copiar relatório formatado para o WhatsApp
  const copiarRelatorioWhatsApp = async () => {
    let msg = `📊 *PROJETO TSUNAMI — RELATÓRIO DE PRESENÇAS ARENA*\n`;
    msg += `📅 Período: Outubro 2026\n`;
    msg += `👥 Atletas Avaliados: ${alunosFiltrados.length}\n`;
    msg += `🔥 Taxa Geral de Presença: ${taxaGeral}%\n\n`;

    msg += `*DESEMPENHO POR SÁBADO:*\n`;
    dadosPorSabado.forEach((d) => {
      msg += `• ${d.label} (${d.dataStr.split('-')[2]}/10): ${d.presentes} presentes (${d.taxa}% assiduidade)\n`;
    });

    msg += `\n*TOP ATLETAS MAIS ASSÍDUOS:*\n`;
    rankingAtletas.slice(0, 5).forEach((r, idx) => {
      const medalha = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '⭐';
      msg += `${medalha} ${r.aluno.nome}: ${r.presencas}/${r.diasMatriculados} presenças (${r.taxa}%)\n`;
    });

    try {
      await navigator.clipboard.writeText(msg);
      onNotificar('Relatório copiado para o WhatsApp com sucesso!');
    } catch {
      onNotificar('Não foi possível copiar o relatório.');
    }
  };

  // Exportar CSV
  const exportarCSV = () => {
    const header = 'Atleta,Turma,Presenças,Faltas,Dias Matriculados,Taxa de Presença (%)\n';
    const body = rankingAtletas
      .map(
        (r) =>
          `"${r.aluno.nome}","${r.aluno.turmaCadastro || 'Geral'}",${r.presencas},${r.faltas},${r.diasMatriculados},${r.taxa}%`
      )
      .join('\n');

    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-presencas-tsunami-${dataInicio}-a-${dataFim}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onNotificar('Arquivo CSV gerado e baixado!');
  };

  return (
    <div className="space-y-4">
      {/* Barra de Topo */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onVoltar}
          className="min-h-[36px] px-3.5 rounded-lg border border-teal-500/50 bg-[#001726] hover:bg-[#002b47] text-teal-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-teal-400" />
          <span>VOLTAR AO PAINEL</span>
        </button>

        <div className="flex items-center gap-2 text-cyan-300">
          <BarChart3 className="w-6 h-6 text-cyan-400 stroke-[2.5]" />
          <h2 className="font-display font-black text-xl sm:text-2xl uppercase tracking-wider text-cyan-300">
            RELATÓRIOS & GRÁFICOS DE FREQUÊNCIA
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copiarRelatorioWhatsApp}
            className="min-h-[36px] px-3.5 rounded-lg border border-emerald-500/50 bg-[#0b2228] hover:bg-[#10333b] text-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">WHATSAPP</span>
          </button>

          <button
            type="button"
            onClick={exportarCSV}
            className="min-h-[36px] px-3.5 rounded-lg border border-cyan-500/50 bg-[#071d3d] hover:bg-[#0c2954] text-cyan-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas Principais (KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-cyan-500/30 bg-[#020d1f] p-3 text-center">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Atletas</span>
          <span className="font-display font-black text-xl sm:text-2xl text-cyan-300 font-mono-num">
            {alunosFiltrados.length}
          </span>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-[#021815] p-3 text-center">
          <span className="text-[10px] font-bold uppercase text-emerald-400/80 block">Presenças</span>
          <span className="font-display font-black text-xl sm:text-2xl text-emerald-400 font-mono-num">
            {totalPresencasGeral}
          </span>
        </div>

        <div className="rounded-xl border border-rose-500/30 bg-[#1c0812] p-3 text-center">
          <span className="text-[10px] font-bold uppercase text-rose-400/80 block">Faltas</span>
          <span className="font-display font-black text-xl sm:text-2xl text-rose-400 font-mono-num">
            {totalFaltasGeral}
          </span>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-[#1f1505] p-3 text-center">
          <span className="text-[10px] font-bold uppercase text-amber-400/80 block">Taxa Geral</span>
          <span className="font-display font-black text-xl sm:text-2xl text-amber-300 font-mono-num">
            {taxaGeral}%
          </span>
        </div>
      </div>

      {/* =========================================================
          GRÁFICO 1: BARRAS VISUAIS DE PRESENÇA POR SÁBADO DO MÊS
         ========================================================= */}
      <div className="rounded-2xl border border-teal-500/30 bg-[#020b18] p-4 sm:p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-950 pb-3">
          <div className="flex items-center gap-2 text-teal-300">
            <TrendingUp className="w-5 h-5 text-teal-400" />
            <h3 className="font-display font-bold text-sm sm:text-base uppercase tracking-wider">
              GRÁFICO DE PRESENÇAS POR SÁBADO (OUTUBRO 2026)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Atraso (A) e Presença (P) = Presença
          </span>
        </div>

        {/* Visualização de Gráfico de Barras com Tailwind */}
        <div className="grid grid-cols-5 gap-2 sm:gap-4 items-end pt-4 pb-2 px-2 min-h-[190px]">
          {dadosPorSabado.map((d) => {
            const alturaPct = Math.max(12, Math.min(100, (d.presentes / (alunosFiltrados.length || 1)) * 100));

            return (
              <div key={d.dataStr} className="flex flex-col items-center gap-2 group">
                <span className="text-xs sm:text-sm font-bold text-emerald-400 font-mono-num">
                  {d.presentes}
                </span>

                {/* Barra */}
                <div className="w-full max-w-[54px] bg-[#021226] rounded-t-lg h-32 flex items-end p-1 border border-teal-900/60">
                  <div
                    style={{ height: `${alturaPct}%` }}
                    className="w-full rounded-t bg-gradient-to-t from-teal-600 via-emerald-500 to-cyan-400 transition-all duration-500 shadow-[0_0_12px_rgba(16,185,129,0.3)] group-hover:scale-105"
                  />
                </div>

                {/* Rótulo do Sábado */}
                <div className="text-center">
                  <span className="block text-[10px] sm:text-xs font-bold uppercase text-teal-300">
                    {d.label}
                  </span>
                  <span className="block text-[9px] text-slate-500 font-mono-num">
                    {d.taxa}% assíduo
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================
          RANKING DE ASSIDUIDADE DOS ATLETAS
         ========================================================= */}
      <div className="rounded-2xl border border-cyan-500/30 bg-[#020b18] p-4 sm:p-5 space-y-3 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-950 pb-3">
          <div className="flex items-center gap-2 text-cyan-300">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="font-display font-bold text-sm sm:text-base uppercase tracking-wider">
              RANKING DE ASSIDUIDADE DOS ATLETAS
            </h3>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              value={buscaAtleta}
              onChange={(e) => setBuscaAtleta(e.target.value)}
              placeholder="Buscar atleta no ranking..."
              className="w-full h-[36px] rounded-xl border border-slate-700 bg-[#001726] px-3 text-xs text-white uppercase focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-[#04122b] text-slate-400 border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-2.5 px-3 text-left">POS</th>
                <th className="py-2.5 px-3 text-left">ATLETA</th>
                <th className="py-2.5 px-3 text-left">TURMA</th>
                <th className="py-2.5 px-3 text-center">PRESENÇAS</th>
                <th className="py-2.5 px-3 text-center">FALTAS</th>
                <th className="py-2.5 px-3 text-center">ASSIDUIDADE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {rankingAtletas
                .filter((r) => r.aluno.nome.toLowerCase().includes(buscaAtleta.toLowerCase()))
                .map((r, idx) => (
                  <tr key={r.aluno.id} className="hover:bg-[#041433] transition-colors">
                    <td className="py-2 px-3 font-mono font-bold text-slate-400">
                      {idx === 0 ? '🥇 1º' : idx === 1 ? '🥈 2º' : idx === 2 ? '🥉 3º' : `${idx + 1}º`}
                    </td>
                    <td className="py-2 px-3 font-bold uppercase text-white">
                      {r.aluno.nome}
                    </td>
                    <td className="py-2 px-3 text-teal-400/80 text-[11px]">
                      {r.aluno.turmaCadastro || '04. QUEIMADA/VOLEIBOL'}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-emerald-400 font-mono-num">
                      {r.presencas}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-rose-400 font-mono-num">
                      {r.faltas}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-cyan-300 font-mono-num">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          r.taxa >= 80
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : r.taxa >= 50
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {r.taxa}%
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
