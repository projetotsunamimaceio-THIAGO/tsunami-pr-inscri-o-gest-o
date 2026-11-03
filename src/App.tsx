import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarCheck2,
  Check,
  Clock,
  FileBarChart,
  Flame,
  MessageCircle,
  Sparkles,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  ALUNOS_INICIAIS,
  CONFIRMADOS_CELULA_INICIAIS,
  FREQUENCIAS_INICIAIS,
  JUSTIFICATIVAS_INICIAIS,
  PROGRAMACAO_INICIAL,
  TURMAS_INICIAIS,
} from './data/initialData';
import { Aluno, EventoProgramacao, JustificativaSabado, RegistroFrequencia, Turma } from './types';
import { Header } from './components/Header';
import { BotaoTresD } from './components/BotaoTresD';
import { ListaInscritos } from './components/ListaInscritos';
import { CardTurma } from './components/CardTurma';
import { Login } from './components/Login';
import { ModalConfirmarInscricao } from './components/ModalConfirmarInscricao';
import { PainelAdmin } from './components/PainelAdmin';

const STORAGE_KEY = 'projeto_tsunami_dados_v4';

function carregarEstadoSalvo() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function App() {
  const salvo = useMemo(() => carregarEstadoSalvo(), []);

  const [abaAtiva, setAbaAtiva] = useState<'inicial' | 'admin'>('inicial');
  const [alunos, setAlunos] = useState<Aluno[]>(() => {
    const base = salvo?.alunos;
    if (base && Array.isArray(base) && base.some((a: Aluno) => a.id === 'a15')) {
      return base;
    }
    return ALUNOS_INICIAIS;
  });
  const [turmas, setTurmas] = useState<Turma[]>(() => {
    const base = salvo?.turmas ?? TURMAS_INICIAIS;
    // Garante que todas as turmas comecem com a lista de inscritos zerada
    return base.map((t: Turma) => ({ ...t, inscritosIds: [] }));
  });
  const [confirmadosCelulaIds, setConfirmadosCelulaIds] = useState<string[]>([]);
  const [programacao, setProgramacao] = useState<EventoProgramacao[]>(
    salvo?.programacao ?? PROGRAMACAO_INICIAL
  );
  const [frequencias, setFrequencias] = useState<RegistroFrequencia[]>(() => {
    const base = salvo?.frequencias;
    if (base && Array.isArray(base) && base.some((f: RegistroFrequencia) => f.id.includes('2026-10-31_a15'))) {
      return base;
    }
    return FREQUENCIAS_INICIAIS;
  });
  const [justificativas, setJustificativas] = useState<JustificativaSabado[]>(
    salvo?.justificativas ?? JUSTIFICATIVAS_INICIAIS
  );
  const [logoUrl, setLogoUrl] = useState<string | null>(salvo?.logoUrl ?? null);
  const [inscricoesTrancadas, setInscricoesTrancadas] = useState<boolean>(
    salvo?.inscricoesTrancadas ?? false
  );
  const [esporteSabadoAtivo, setEsporteSabadoAtivo] = useState<boolean>(
    salvo?.esporteSabadoAtivo ?? true
  );

  // Controle de Acesso Exclusivo do Professor
  const [isProfessor, setIsProfessor] = useState<boolean>(false);
  const [modalLoginProfessorAberto, setModalLoginProfessorAberto] = useState(false);

  // Modais de Ações do Aluno (Sem login, apenas confirmação)
  const [modalInscricaoAberto, setModalInscricaoAberto] = useState(false);
  const [modalFrequenciaAluno, setModalFrequenciaAluno] = useState(false);
  const [alunoFreqConsultaId, setAlunoFreqConsultaId] = useState<string>(ALUNOS_INICIAIS[0]?.id || '');

  const [modalJustificativa, setModalJustificativa] = useState(false);
  const [alunoJustId, setAlunoJustId] = useState<string>(ALUNOS_INICIAIS[0]?.id || '');
  const [dataSabadoJust, setDataSabadoJust] = useState('2026-11-07');
  const [textoJustificativa, setTextoJustificativa] = useState('');

  // Notificações e link WhatsApp
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [linkWhatsAppCelula, setLinkWhatsAppCelula] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          alunos,
          turmas,
          confirmadosCelulaIds,
          programacao,
          frequencias,
          justificativas,
          logoUrl,
          inscricoesTrancadas,
          esporteSabadoAtivo,
        })
      );
    } catch {
      // Ignora erro de quota do browser
    }
  }, [
    alunos,
    turmas,
    confirmadosCelulaIds,
    programacao,
    frequencias,
    justificativas,
    logoUrl,
    inscricoesTrancadas,
    esporteSabadoAtivo,
  ]);

  const notificar = (mensagem: string) => {
    setToastMsg(mensagem);
    setTimeout(() => {
      setToastMsg((atual) => (atual === mensagem ? null : atual));
    }, 3200);
  };

  const eventoCelula = useMemo(
    () =>
      programacao.find((ev) => ev.tipo === 'Célula') || {
        id: 'cel_padrao',
        titulo: 'Célula Projeto Tsunami',
        dia: 'TERÇA',
        horario: '20:00',
        tipo: 'Célula' as const,
        obrigatorio: true,
        descricao:
          'Reunião evangelística semanal no TERÇA às 20:00. A presença é obrigatória para todos os atletas antes das atividades esportivas.',
      },
    [programacao]
  );

  const atletasConfirmadosCelula = useMemo(
    () =>
      confirmadosCelulaIds
        .map((id) => alunos.find((a) => a.id === id))
        .filter((a): a is Aluno => Boolean(a)),
    [confirmadosCelulaIds, alunos]
  );

  const turmasAbertas = useMemo(() => turmas.filter((t) => t.aberta), [turmas]);

  // Salvar Inscrição do Aluno (Sem login, ele apenas confirma na lista)
  const handleSalvarInscricao = (
    alunoId: string,
    confirmarCelula: boolean,
    turmasSelecionadasIds: string[]
  ) => {
    if (inscricoesTrancadas) {
      notificar('As inscrições estão trancadas pelo professor no momento.');
      return;
    }

    const atleta = alunos.find((a) => a.id === alunoId);
    if (!atleta) return;

    // Atualiza lista da Célula
    setConfirmadosCelulaIds((prev) => {
      if (confirmarCelula) {
        return prev.includes(alunoId) ? prev : [...prev, alunoId];
      } else {
        return prev.filter((id) => id !== alunoId);
      }
    });

    // Atualiza turmas esportivas
    setTurmas((prev) =>
      prev.map((t) => {
        const deveEstar = turmasSelecionadasIds.includes(t.id);
        const estaInscrito = t.inscritosIds.includes(alunoId);
        if (deveEstar && !estaInscrito) {
          return { ...t, inscritosIds: [...t.inscritosIds, alunoId] };
        } else if (!deveEstar && estaInscrito) {
          return { ...t, inscritosIds: t.inscritosIds.filter((id) => id !== alunoId) };
        }
        return t;
      })
    );

    notificar(`Inscrição de ${atleta.nome} confirmada com sucesso!`);
  };

  const handleCompartilharCelulaWhatsApp = async () => {
    const listaFormatada =
      atletasConfirmadosCelula.length > 0
        ? atletasConfirmadosCelula.map((a, idx) => `${idx + 1}. ${a.nome} ✅`).join('\n')
        : 'Nenhum atleta confirmado ainda.';

    const mensagem =
      `🔥 *PROJETO TSUNAMI — INSCRITOS NA CÉLULA*\n` +
      `📅 Horário: ${eventoCelula.horario} (${eventoCelula.dia})\n` +
      `👥 Total: ${atletasConfirmadosCelula.length} confirmados\n\n` +
      `${listaFormatada}`;

    const waUrl = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    setLinkWhatsAppCelula(waUrl);

    try {
      await navigator.clipboard.writeText(mensagem);
      notificar('Lista da Célula copiada para a área de transferência!');
    } catch {
      notificar('Lista gerada para envio no WhatsApp.');
    }
  };

  const handleEnviarJustificativa = (e: React.FormEvent) => {
    e.preventDefault();
    const atleta = alunos.find((a) => a.id === alunoJustId);
    if (!atleta) return;

    if (!atleta.autorizadoJustificar) {
      notificar('Este atleta não possui autorização ativa para justificar ausência. Fale com o professor.');
      return;
    }
    if (textoJustificativa.trim().length < 5) {
      notificar('Descreva o motivo da ausência no sábado.');
      return;
    }

    const nova: JustificativaSabado = {
      id: `just_${Date.now()}`,
      alunoId: atleta.id,
      alunoNome: atleta.nome,
      dataSabado: dataSabadoJust,
      motivo: textoJustificativa.trim(),
      criadoEm: new Date().toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'pendente',
    };
    setJustificativas((prev) => [nova, ...prev]);
    setTextoJustificativa('');
    setModalJustificativa(false);
    notificar(`Justificativa de ${atleta.nome} enviada para o professor!`);
  };

  // Consulta de Frequência do Aluno Selecionado no Modal
  const alunoFreqConsulta = useMemo(
    () => alunos.find((a) => a.id === alunoFreqConsultaId) || alunos[0] || null,
    [alunos, alunoFreqConsultaId]
  );

  const registrosAlunoConsulta = useMemo(
    () => (alunoFreqConsulta ? frequencias.filter((f) => f.alunoId === alunoFreqConsulta.id) : []),
    [frequencias, alunoFreqConsulta]
  );

  const resumoFreqConsulta = useMemo(() => {
    const presencas = registrosAlunoConsulta.filter((r) => r.status === 'presente').length;
    const justificados = registrosAlunoConsulta.filter((r) => r.status === 'justificado').length;
    const faltas = registrosAlunoConsulta.filter((r) => r.status === 'falta').length;
    const total = registrosAlunoConsulta.length;
    const percentual = total > 0 ? Math.round(((presencas + justificados) / total) * 100) : 100;
    return { presencas, justificados, faltas, total, percentual };
  }, [registrosAlunoConsulta]);

  return (
    <div className="min-h-screen flex flex-col bg-[#020B24] text-slate-100">
      {/* Botão Superior Direito Discreto: ÁREA DO PROFESSOR - LOGIN */}
      <div className="w-full max-w-xl mx-auto px-4 pt-3 pb-1 flex justify-end">
        {abaAtiva === 'admin' ? (
          <button
            type="button"
            onClick={() => setAbaAtiva('inicial')}
            className="rounded-md border border-cyan-400/50 bg-[#041233]/90 hover:bg-[#071d4d] px-3.5 py-1.5 text-[11px] font-display font-bold uppercase tracking-wider text-cyan-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(0,216,255,0.2)]"
          >
            <span>← VOLTAR À ABA PRINCIPAL</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (isProfessor) {
                setAbaAtiva('admin');
              } else {
                setModalLoginProfessorAberto(true);
              }
            }}
            className="rounded-md border border-cyan-400/50 bg-[#041233]/90 hover:bg-[#071d4d] px-3.5 py-1.5 text-[11px] font-display font-bold uppercase tracking-wider text-cyan-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(0,216,255,0.2)]"
          >
            <span className="text-[10px]">⬡</span>
            <span>{isProfessor ? 'PAINEL DO PROFESSOR' : 'ÁREA DO PROFESSOR - LOGIN'}</span>
          </button>
        )}
      </div>

      {/* Notificação Flutuante (Toast) */}
      {toastMsg && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 max-w-md w-[calc(100%-2rem)] rounded-xl border border-cyan-400/50 bg-[#061a3d]/95 backdrop-blur-md px-4 py-3 shadow-2xl flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold text-white"
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
            aria-label="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =========================================================
          CONTEÚDO PRINCIPAL (1 COLUNA CENTRALIZADA MOBILE-FIRST)
         ========================================================= */}
      <main className="flex-1 w-full max-w-xl mx-auto px-3.5 sm:px-4 pt-1 pb-12 space-y-5">
        {/* Banner 3D de Boas-vindas */}
        <Header logoUrl={logoUrl} />

        {abaAtiva === 'inicial' ? (
          <div className="space-y-4">
            {/* Título Grande em Botão 3D Azul Centralizado: PRÉ-INSCRIÇÃO */}
            <section className="flex flex-col items-center text-center space-y-2 pt-1">
              <div className="w-full max-w-sm flex items-center justify-center">
                <BotaoTresD
                  cor="azul"
                  tamanho="lg"
                  icone={<UserPlus className="w-5 h-5" />}
                  onClick={() => setModalInscricaoAberto(true)}
                  className="w-full shadow-[0_0_25px_rgba(37,99,235,0.45)]"
                >
                  PRÉ-INSCRIÇÃO
                </BotaoTresD>
              </div>

              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#22b8cf]">
                * VAGAS LIBERADAS APENAS PARA ATLETAS COM FREQUÊNCIA FACIAL CONFIRMADA NA SEMANA
              </p>
            </section>

            {/* Layout em Coluna Única Fiel à Imagem de Referência */}
            <div className="space-y-4">
              {/* =====================================================
                  SEÇÃO A — INSCRITOS NA CÉLULA (OBRIGATÓRIA) - DOURADO/ÂMBAR
                 ===================================================== */}
              <section className="rounded-2xl border border-amber-500/35 bg-gradient-to-b from-[#0a1324] via-[#070f1d] to-[#050b16] p-4 sm:p-5 shadow-[0_0_30px_rgba(245,158,11,0.09)] space-y-4">
                {/* Topo do Card da Célula */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full border border-amber-500/40 bg-amber-950/40 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                      <Flame className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-wide text-white leading-tight">
                          INSCRITOS NA CÉLULA
                        </h2>
                        <span className="rounded-md border border-amber-400/40 bg-amber-950/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                          OBRIGATÓRIA
                        </span>
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                        <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>
                          Horário:{' '}
                          <strong className="text-white font-mono-num">{eventoCelula.horario}</strong> (
                          {eventoCelula.dia})
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Contador X CONFIRMADOS + Botão WHATSAPP */}
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="rounded-xl border border-amber-500/30 bg-[#0d182c] px-3 py-1.5 text-xs font-display font-bold uppercase tracking-wider text-amber-200 flex items-center gap-1.5 font-mono-num">
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      <span>{atletasConfirmadosCelula.length} CONFIRMADOS</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCompartilharCelulaWhatsApp}
                      className="min-h-[38px] rounded-xl border border-emerald-500/40 bg-[#0b2228] hover:bg-[#10333b] px-3 py-1.5 text-xs font-display font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>WHATSAPP</span>
                    </button>
                  </div>
                </div>

                {/* Barra opcional de envio direto caso clicou em WhatsApp */}
                {linkWhatsAppCelula && (
                  <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/30 px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
                    <span className="text-emerald-200">Lista copiada! Deseja abrir no WhatsApp?</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={linkWhatsAppCelula}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase"
                      >
                        Abrir WhatsApp
                      </a>
                      <button
                        type="button"
                        onClick={() => setLinkWhatsAppCelula(null)}
                        className="text-slate-400 hover:text-white cursor-pointer"
                        aria-label="Fechar barra WhatsApp"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Aviso Obrigatório */}
                <div className="rounded-xl border border-amber-500/20 bg-[#0c1629] p-3.5 flex items-start gap-3">
                  <CalendarCheck2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-200 leading-relaxed">
                    Reunião evangelística semanal no{' '}
                    <strong className="text-amber-300">{eventoCelula.dia}</strong> às{' '}
                    <strong className="text-white font-mono-num">{eventoCelula.horario}</strong>. A presença é
                    obrigatória para todos os atletas antes das atividades esportivas.
                  </p>
                </div>

                {/* Lista Numerada dos Confirmados */}
                <ListaInscritos
                  atletas={atletasConfirmadosCelula}
                  modo="celula"
                  mensagemVazia="Nenhum atleta confirmou presença na célula ainda."
                />
              </section>

              {/* =====================================================
                  SEÇÃO B — VAGAS EM TEMPO REAL (VERDE-ESMERALDA)
                 ===================================================== */}
              <section id="secao-vagas-tempo-real" className="space-y-4">
                <div className="rounded-2xl border border-emerald-500/25 bg-[#061022] px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </span>
                    <h2 className="font-display text-lg sm:text-xl font-bold uppercase tracking-wider text-white">
                      VAGAS EM TEMPO REAL
                    </h2>
                  </div>

                  <span className="text-xs font-display font-bold uppercase tracking-wider text-emerald-300 font-mono-num">
                    {esporteSabadoAtivo
                      ? `${turmasAbertas.length} ${turmasAbertas.length === 1 ? 'TURMA ABERTA' : 'TURMAS ABERTAS'}`
                      : 'ATIVIDADES DE SÁBADO PAUSADAS'}
                  </span>
                </div>

                {!esporteSabadoAtivo ? (
                  <div className="rounded-2xl border border-slate-800 bg-[#061124] p-8 text-center">
                    <p className="font-display text-xl font-bold uppercase text-amber-300">
                      Pré-inscrição de Sábado Pausada
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      O professor pausou temporariamente as turmas de sábado. Acompanhe os avisos na Célula!
                    </p>
                  </div>
                ) : turmasAbertas.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-[#061124] p-8 text-center">
                    <p className="font-display text-xl font-bold uppercase text-slate-300">
                      Nenhuma turma aberta no momento
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Aguarde o professor liberar as vagas das modalidades da semana.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {turmasAbertas.map((turma) => (
                      <CardTurma
                        key={turma.id}
                        turma={turma}
                        todosAlunos={alunos}
                        alunoAtual={null}
                        isProfessor={isProfessor}
                        inscricoesTrancadas={inscricoesTrancadas}
                        onToggleInscricao={() => setModalInscricaoAberto(true)}
                        onNotificar={notificar}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* =====================================================
                RODAPÉ DA ABA INICIAL: 2 BOTÕES 3D CHANFRADOS
               ===================================================== */}
            <section className="pt-4 max-w-md mx-auto w-full space-y-3.5">
              <BotaoTresD
                cor="azul"
                formato="chamfer"
                icone={<FileBarChart className="w-5 h-5" />}
                onClick={() => setModalFrequenciaAluno(true)}
              >
                RELATÓRIO FREQUÊNCIA
              </BotaoTresD>

              <BotaoTresD
                cor="vermelho"
                formato="chamfer"
                icone={<AlertCircle className="w-5 h-5" />}
                onClick={() => setModalJustificativa(true)}
              >
                JUSTIFICATIVA SÁBADO
              </BotaoTresD>
            </section>
          </div>
        ) : (
          /* =========================================================
             ABA 2: PAINEL ADMINISTRATIVO (ACESSO EXCLUSIVO DO PROFESSOR)
             ========================================================= */
          <PainelAdmin
            turmas={turmas}
            alunos={alunos}
            programacao={programacao}
            frequencias={frequencias}
            justificativas={justificativas}
            logoUrl={logoUrl}
            inscricoesTrancadas={inscricoesTrancadas}
            esporteSabadoAtivo={esporteSabadoAtivo}
            onSetTurmas={setTurmas}
            onSetAlunos={setAlunos}
            onSetProgramacao={setProgramacao}
            onSetFrequencias={setFrequencias}
            onSetJustificativas={setJustificativas}
            onSetLogoUrl={setLogoUrl}
            onToggleTrancarInscricoes={() => {
              setInscricoesTrancadas((prev) => {
                const novo = !prev;
                notificar(
                  novo ? 'Inscrições trancadas para os alunos!' : 'Inscrições destrancadas e abertas!'
                );
                return novo;
              });
            }}
            onToggleEsporteSabado={() => {
              setEsporteSabadoAtivo((prev) => {
                const novo = !prev;
                notificar(novo ? 'Esporte no sábado ativado!' : 'Esporte no sábado pausado.');
                return novo;
              });
            }}
            onResetarInscricoesSemana={() => {
              setConfirmadosCelulaIds([]);
              setTurmas((prev) => prev.map((t) => ({ ...t, inscritosIds: [] })));
              notificar('Listas da Célula e das Turmas zeradas para a nova semana!');
            }}
            onLogoff={() => {
              setIsProfessor(false);
              setAbaAtiva('inicial');
              notificar('Sessão do professor encerrada.');
            }}
            onNotificar={notificar}
          />
        )}
      </main>

      {/* Rodapé Institucional */}
      <footer className="border-t border-[#0f2247] bg-[#010717] py-5 px-4 text-center">
        <p className="font-display text-sm sm:text-base font-bold uppercase tracking-[0.18em] text-slate-500">
          PROJETO TSUNAMI - 2027 - ARENA SEDE - MACEIÓ AL
        </p>
      </footer>

      {/* =========================================================
          1º AJUSTE: ÁREA DO PROFESSOR (APENAS PROFESSOR ACESSA COM SENHA)
         ========================================================= */}
      <Login
        aberto={modalLoginProfessorAberto}
        onFechar={() => setModalLoginProfessorAberto(false)}
        onLoginProfessor={() => {
          setIsProfessor(true);
          setAbaAtiva('admin');
          notificar('Bem-vindo à Área Técnica do Professor!');
        }}
      />

      {/* =========================================================
          2º & 3º AJUSTE: ALUNO NÃO TEM LOGIN / CONFIRMAÇÃO DIRETA
         ========================================================= */}
      <ModalConfirmarInscricao
        aberto={modalInscricaoAberto}
        alunos={alunos}
        turmas={turmas}
        confirmadosCelulaIds={confirmadosCelulaIds}
        onFechar={() => setModalInscricaoAberto(false)}
        onSalvarInscricao={handleSalvarInscricao}
      />

      {/* =========================================================
          MODAL: RELATÓRIO DE FREQUÊNCIA (CONSULTA POR NOME)
         ========================================================= */}
      {modalFrequenciaAluno && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl border border-[#183b78] bg-[#041029] p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="font-display text-2xl font-bold uppercase text-white">
                  Relatório de Frequência
                </h2>
                <p className="text-xs text-cyan-300 font-semibold uppercase">
                  Consulte a assiduidade individual do atleta
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalFrequenciaAluno(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Selecione o Atleta:
              </label>
              <select
                value={alunoFreqConsultaId}
                onChange={(e) => setAlunoFreqConsultaId(e.target.value)}
                className="w-full min-h-[46px] rounded-xl border border-slate-700 bg-[#081736] px-3.5 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
              >
                {alunos.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome} ({a.turmaCadastro})
                  </option>
                ))}
              </select>
            </div>

            {alunoFreqConsulta && (
              <>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-xl border border-slate-800 bg-[#081736] p-3">
                    <p className="font-mono-num text-xl font-bold text-cyan-300">{resumoFreqConsulta.percentual}%</p>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Assiduidade</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-[#081736] p-3">
                    <p className="font-mono-num text-xl font-bold text-emerald-400">{resumoFreqConsulta.presencas}</p>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Presenças</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-[#081736] p-3">
                    <p className="font-mono-num text-xl font-bold text-amber-300">{resumoFreqConsulta.justificados}</p>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Justif.</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-[#081736] p-3">
                    <p className="font-mono-num text-xl font-bold text-rose-400">{resumoFreqConsulta.faltas}</p>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Faltas</p>
                  </div>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {registrosAlunoConsulta.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-6">
                      Ainda não há chamadas registradas para este atleta.
                    </p>
                  ) : (
                    registrosAlunoConsulta.map((reg) => (
                      <div
                        key={reg.id}
                        className="rounded-xl border border-slate-800 bg-[#07142c] px-3.5 py-2.5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-white uppercase">{reg.turmaNome}</p>
                          <p className="text-[11px] font-mono-num text-slate-400">{reg.data}</p>
                        </div>
                        <span
                          className={`font-bold uppercase ${
                            reg.status === 'presente'
                              ? 'text-emerald-400'
                              : reg.status === 'justificado'
                                ? 'text-amber-300'
                                : 'text-rose-400'
                          }`}
                        >
                          {reg.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            <BotaoTresD cor="azul" tamanho="md" onClick={() => setModalFrequenciaAluno(false)} className="w-full">
              FECHAR
            </BotaoTresD>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: JUSTIFICATIVA SÁBADO (SELEÇÃO POR NOME)
         ========================================================= */}
      {modalJustificativa && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl border border-rose-500/40 bg-[#041029] p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="font-display text-2xl font-bold uppercase text-white">
                  Justificativa de Ausência — Sábado
                </h2>
                <p className="text-xs text-rose-300 font-semibold uppercase">
                  Envie sua justificativa diretamente ao professor
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalJustificativa(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEnviarJustificativa} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Selecione seu Nome (Atleta):
                </label>
                <select
                  value={alunoJustId}
                  onChange={(e) => setAlunoJustId(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-[#081736] px-3.5 py-2 text-sm text-white focus:border-rose-400 focus:outline-none"
                >
                  {alunos.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Data do Sábado
                </label>
                <input
                  type="date"
                  required
                  value={dataSabadoJust}
                  onChange={(e) => setDataSabadoJust(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-[#081736] px-3.5 py-2 text-sm text-white font-mono-num focus:border-rose-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Motivo da Ausência
                </label>
                <textarea
                  rows={3}
                  required
                  value={textoJustificativa}
                  onChange={(e) => setTextoJustificativa(e.target.value)}
                  placeholder="Explique o motivo da ausência no sábado..."
                  className="w-full rounded-xl border border-slate-700 bg-[#081736] p-3.5 text-sm text-white focus:border-rose-400 focus:outline-none"
                />
              </div>

              <BotaoTresD type="submit" cor="vermelho" tamanho="md" className="w-full">
                ENVIAR JUSTIFICATIVA AO PROFESSOR
              </BotaoTresD>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
