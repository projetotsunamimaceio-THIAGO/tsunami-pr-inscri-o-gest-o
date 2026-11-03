import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Copy,
  Download,
  Edit3,
  FileBarChart2,
  Lock,
  LogOut,
  Package,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  Star,
  Trash2,
  Unlock,
  Upload,
  User,
  Users,
  XCircle,
  Eye,
  EyeOff,
  Key,
} from 'lucide-react';
import {
  Aluno,
  EventoProgramacao,
  JustificativaSabado,
  ModalidadeEsporte,
  RegistroFrequencia,
  StatusFrequencia,
  Turma,
} from '../types';
import { BotaoTresD } from './BotaoTresD';
import { TsunamiCrest } from './Header';
import { FrequenciaArena } from './FrequenciaArena';
import { ArenaFacial } from './ArenaFacial';
import { RelatoriosGraficos } from './RelatoriosGraficos';

type ModuloAdmin = 'home' | 'turmas' | 'alunos' | 'programacao' | 'facial' | 'frequencia' | 'relatorios';

interface PainelAdminProps {
  turmas: Turma[];
  alunos: Aluno[];
  programacao: EventoProgramacao[];
  frequencias: RegistroFrequencia[];
  justificativas: JustificativaSabado[];
  logoUrl: string | null;
  inscricoesTrancadas: boolean;
  esporteSabadoAtivo: boolean;
  onSetTurmas: React.Dispatch<React.SetStateAction<Turma[]>>;
  onSetAlunos: React.Dispatch<React.SetStateAction<Aluno[]>>;
  onSetProgramacao: React.Dispatch<React.SetStateAction<EventoProgramacao[]>>;
  onSetFrequencias: React.Dispatch<React.SetStateAction<RegistroFrequencia[]>>;
  onSetJustificativas: React.Dispatch<React.SetStateAction<JustificativaSabado[]>>;
  onSetLogoUrl: (url: string | null) => void;
  onToggleTrancarInscricoes: () => void;
  onToggleEsporteSabado: () => void;
  onResetarInscricoesSemana: () => void;
  onLogoff: () => void;
  onNotificar: (msg: string) => void;
}

const MODALIDADES: ModalidadeEsporte[] = ['Voleibol', 'Futvôlei', 'Vôlei de Praia', 'Funcional', 'Futsal', 'Basquete'];
const DIAS_SEMANA = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO', 'DOMINGO'];

export const PainelAdmin: React.FC<PainelAdminProps> = ({
  turmas,
  alunos,
  programacao,
  frequencias,
  justificativas,
  logoUrl,
  inscricoesTrancadas,
  esporteSabadoAtivo,
  onSetTurmas,
  onSetAlunos,
  onSetProgramacao,
  onSetFrequencias,
  onSetJustificativas,
  onSetLogoUrl,
  onToggleTrancarInscricoes,
  onToggleEsporteSabado,
  onResetarInscricoesSemana,
  onLogoff,
  onNotificar,
}) => {
  const [modulo, setModulo] = useState<ModuloAdmin>('home');
  const [confirmandoReset, setConfirmandoReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Estado para exclusão segura via Modal In-App (substitui window.confirm bloqueado em iframes)
  const [itemParaExcluir, setItemParaExcluir] = useState<{
    tipo: 'turma' | 'aluno';
    id: string;
    nome: string;
  } | null>(null);

  // Estados rápidos da home "Controle de Alunos & Acessos"
  const [buscaRapida, setBuscaRapida] = useState('');
  const [filtroAcesso, setFiltroAcesso] = useState<'todos' | 'liberados_justificar' | 'sem_autorizacao'>('todos');

  // === MÓDULO TURMAS ===
  const [editandoTurmaId, setEditandoTurmaId] = useState<string | null>(null);
  const [nomeTurma, setNomeTurma] = useState('');
  const [inicioTurma, setInicioTurma] = useState('18:45');
  const [terminoTurma, setTerminoTurma] = useState('20:15');
  const [vagasTurma, setVagasTurma] = useState(20);
  const [diasTreinoTurma, setDiasTreinoTurma] = useState<string[]>(['TER', 'SEX', 'SÁB']);
  const DIAS_SIGLAS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];

  // Modal Dedicado de Edição de Turma (Abre instantaneamente ao clicar em EDITAR)
  const [turmaModalEdicao, setTurmaModalEdicao] = useState<Turma | null>(null);
  const [editModalNome, setEditModalNome] = useState('');
  const [editModalInicio, setEditModalInicio] = useState('18:45');
  const [editModalTermino, setEditModalTermino] = useState('20:15');
  const [editModalVagas, setEditModalVagas] = useState(20);
  const [editModalDias, setEditModalDias] = useState<string[]>(['SÁB']);

  const extrairDiasTreino = (t: Turma): string[] => {
    if (t.diasTreino && Array.isArray(t.diasTreino) && t.diasTreino.length > 0) {
      return t.diasTreino;
    }
    if (!t.dia) return ['SÁB'];
    const texto = t.dia.toUpperCase();
    const siglas: string[] = [];
    const chaves = [
      { id: 'SEG', match: ['SEG', 'SEGUNDA'] },
      { id: 'TER', match: ['TER', 'TERÇA', 'TERCA'] },
      { id: 'QUA', match: ['QUA', 'QUARTA'] },
      { id: 'QUI', match: ['QUI', 'QUINTA'] },
      { id: 'SEX', match: ['SEX', 'SEXTA'] },
      { id: 'SÁB', match: ['SÁB', 'SAB', 'SÁBADO', 'SABADO'] },
      { id: 'DOM', match: ['DOM', 'DOMINGO'] },
    ];
    for (const c of chaves) {
      if (c.match.some((m) => texto.includes(m))) {
        siglas.push(c.id);
      }
    }
    return siglas.length > 0 ? siglas : ['SÁB'];
  };

  const extrairHorarioInicio = (t: Turma): string => {
    if (t.horarioInicio && t.horarioInicio.trim()) return t.horarioInicio.trim();
    if (t.horario) {
      const parts = t.horario.split(/às|-|a/);
      if (parts[0] && parts[0].trim().match(/^\d{1,2}:\d{2}$/)) {
        return parts[0].trim();
      }
    }
    return '18:45';
  };

  const extrairHorarioTermino = (t: Turma): string => {
    if (t.horarioTermino && t.horarioTermino.trim()) return t.horarioTermino.trim();
    if (t.horario) {
      const parts = t.horario.split(/às|-|a/);
      if (parts[1] && parts[1].trim().match(/^\d{1,2}:\d{2}$/)) {
        return parts[1].trim();
      }
    }
    return '20:15';
  };

  const abrirEdicaoTurma = (t: Turma) => {
    const dias = extrairDiasTreino(t);
    const hInicio = extrairHorarioInicio(t);
    const hTermino = extrairHorarioTermino(t);

    // Preenche o Modal Dedicado de Edição
    setTurmaModalEdicao(t);
    setEditModalNome(t.nome);
    setEditModalInicio(hInicio);
    setEditModalTermino(hTermino);
    setEditModalVagas(t.vagasTotais || 20);
    setEditModalDias(dias);

    // Também preenche o formulário superior
    setEditandoTurmaId(t.id);
    setNomeTurma(t.nome);
    setInicioTurma(hInicio);
    setTerminoTurma(hTermino);
    setVagasTurma(t.vagasTotais || 20);
    setDiasTreinoTurma(dias);
  };

  const salvarEdicaoTurmaModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!turmaModalEdicao) return;
    if (!editModalNome.trim()) {
      onNotificar('Informe o nome da turma.');
      return;
    }
    const diasFormatados = editModalDias.length > 0 ? editModalDias.join(', ') : 'A DEFINIR';
    const horarioFormatado =
      editModalInicio && editModalTermino
        ? `${editModalInicio} às ${editModalTermino}`
        : editModalInicio || '18:45';

    onSetTurmas((prev) =>
      prev.map((t) =>
        t.id === turmaModalEdicao.id
          ? {
              ...t,
              nome: editModalNome.trim().toUpperCase(),
              diasTreino: editModalDias,
              dia: diasFormatados,
              horarioInicio: editModalInicio,
              horarioTermino: editModalTermino,
              horario: horarioFormatado,
              vagasTotais: Math.max(1, editModalVagas),
            }
          : t
      )
    );
    onNotificar(`Turma ${editModalNome.trim().toUpperCase()} atualizada com sucesso!`);
    setTurmaModalEdicao(null);
    limparFormTurma();
  };

  const toggleDiaTreinoModal = (sigla: string) => {
    setEditModalDias((prev) =>
      prev.includes(sigla) ? prev.filter((d) => d !== sigla) : [...prev, sigla]
    );
  };

  const toggleDiaTreino = (sigla: string) => {
    setDiasTreinoTurma((prev) =>
      prev.includes(sigla) ? prev.filter((d) => d !== sigla) : [...prev, sigla]
    );
  };

  // === MÓDULO ALUNOS ===
  const [abaCadastroAluno, setAbaCadastroAluno] = useState<'individual' | 'lote'>('individual');
  const [textoLoteAlunos, setTextoLoteAlunos] = useState('');
  const [editandoAlunoId, setEditandoAlunoId] = useState<string | null>(null);
  const [nomeAluno, setNomeAluno] = useState('');
  const [senhaAluno, setSenhaAluno] = useState('1234');
  const [mostrarSenhaForm, setMostrarSenhaForm] = useState(false);
  const [senhasVisiveis, setSenhasVisiveis] = useState<Record<string, boolean>>({});
  const [turmaCadAluno, setTurmaCadAluno] = useState('');
  const [inicioMatAluno, setInicioMatAluno] = useState('2026-11-03');
  const [fimMatAluno, setFimMatAluno] = useState('2027-12-20');
  const [nivelAluno, setNivelAluno] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [filtroTurmaModulo, setFiltroTurmaModulo] = useState<string>('todas');
  const [buscaAlunoModulo, setBuscaAlunoModulo] = useState('');
  const [filtroNivelModulo, setFiltroNivelModulo] = useState<number>(0);

  // Turmas e Alunos estritamente em Ordem Alfabética
  const turmasOrdenadas = useMemo(() => {
    return [...turmas].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [turmas]);

  const alunosOrdenados = useMemo(() => {
    return [...alunos].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [alunos]);

  // Alternar Turma Aberta / Fechada na Aba Principal
  const toggleTurmaAberta = (turmaId: string) => {
    onSetTurmas((prev) =>
      prev.map((t) => (t.id === turmaId ? { ...t, aberta: !t.aberta } : t))
    );
    const alvo = turmas.find((t) => t.id === turmaId);
    if (alvo) {
      const proximo = !alvo.aberta ? 'ABERTA NA ABA PRINCIPAL' : 'FECHADA';
      onNotificar(`Turma "${alvo.nome}" agora está ${proximo}!`);
    }
  };

  // === MÓDULO PROGRAMAÇÃO ===
  const [editandoEventoId, setEditandoEventoId] = useState<string | null>(null);
  const [tituloEv, setTituloEv] = useState('');
  const [diaEv, setDiaEv] = useState('SÁBADO');
  const [horaEv, setHoraEv] = useState('18:00');
  const [tipoEv, setTipoEv] = useState<'Célula' | 'Treino' | 'Amistoso' | 'Evento'>('Treino');
  const [obrigEv, setObrigEv] = useState(false);
  const [descEv, setDescEv] = useState('');

  // Lançar Programação do Dia: Abre as turmas e pré-inscreve automaticamente quem esteve presente no sábado
  const lancarProgramacaoTurmas = () => {
    if (programacao.length === 0) {
      onNotificar('Nenhuma atividade na programação para lançar.');
      return;
    }

    // Busca o sábado com registros de frequência mais recentes
    const sabadosComFreq = Array.from(new Set(frequencias.map((f) => f.data))).sort().reverse();
    const sabadoAlvo = sabadosComFreq[0] || '2026-10-31';

    // Atletas que tiveram presença (P) ou advertência/atraso (A) no sábado
    const atletasPresentesSabadoIds = Array.from(
      new Set(
        frequencias
          .filter((f) => f.data === sabadoAlvo && (f.status === 'presente' || f.status === 'advertencia'))
          .map((f) => f.alunoId)
      )
    );

    // Abre turmas da programação e adiciona os atletas presentes
    onSetTurmas((prev) => {
      const novas = [...prev];
      programacao.forEach((ev) => {
        const nomeUpper = ev.titulo.toUpperCase().trim();
        const idx = novas.findIndex(
          (t) => t.nome.includes(nomeUpper) || nomeUpper.includes(t.nome)
        );

        if (idx >= 0) {
          const inscritosSet = new Set(novas[idx].inscritosIds);
          atletasPresentesSabadoIds.forEach((id) => inscritosSet.add(id));
          novas[idx] = {
            ...novas[idx],
            aberta: true,
            horario: ev.horario,
            inscritosIds: Array.from(inscritosSet),
          };
        } else {
          novas.push({
            id: `t_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            nome: nomeUpper,
            modalidade: 'Voleibol',
            dia: ev.dia,
            diasTreino: [ev.dia.slice(0, 3).toUpperCase()],
            horario: ev.horario,
            vagasTotais: 20,
            aberta: true,
            inscritosIds: atletasPresentesSabadoIds,
          });
        }
      });
      return novas;
    });

    const dtParts = sabadoAlvo.split('-');
    const dataFormatada = `${dtParts[2]}/${dtParts[1]}/${dtParts[0]}`;
    onNotificar(
      `⚡ Programação Lançada! Turmas abertas na aba principal e ${atletasPresentesSabadoIds.length} atletas presentes no sábado (${dataFormatada}) pré-inscritos!`
    );
  };

  // === MÓDULO FREQUÊNCIA MANUAL ===
  const [dataFreq, setDataFreq] = useState('2026-11-03');
  const [turmaFreqId, setTurmaFreqId] = useState<string>('celula');

  // === MÓDULO RELATÓRIOS ===
  const [abaRelatorio, setAbaRelatorio] = useState<'aluno' | 'turma' | 'periodo' | 'justificativas'>('aluno');
  const [dataInicioRel, setDataInicioRel] = useState('2026-10-01');
  const [dataFimRel, setDataFimRel] = useState('2026-12-31');

  const handleUploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onSetLogoUrl(reader.result);
        onNotificar('Logo do Projeto Tsunami atualizada com sucesso!');
      }
    };
    reader.readAsDataURL(file);
  };

  // --- Handlers Turmas ---
  const limparFormTurma = () => {
    setEditandoTurmaId(null);
    setNomeTurma('');
    setInicioTurma('18:45');
    setTerminoTurma('20:15');
    setVagasTurma(20);
    setDiasTreinoTurma(['TER', 'SEX', 'SÁB']);
    setTurmaModalEdicao(null);
  };

  const salvarTurma = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeTurma.trim()) {
      onNotificar('Por favor, informe o nome da turma (ex: SUB-15).');
      return;
    }
    const diasFormatados = diasTreinoTurma.length > 0 ? diasTreinoTurma.join(', ') : 'A DEFINIR';
    const horarioFormatado = inicioTurma && terminoTurma ? `${inicioTurma} às ${terminoTurma}` : inicioTurma || '18:45';

    if (editandoTurmaId) {
      onSetTurmas((prev) =>
        prev.map((t) =>
          t.id === editandoTurmaId
            ? {
                ...t,
                nome: nomeTurma.trim().toUpperCase(),
                diasTreino: diasTreinoTurma,
                dia: diasFormatados,
                horarioInicio: inicioTurma,
                horarioTermino: terminoTurma,
                horario: horarioFormatado,
                vagasTotais: Math.max(1, vagasTurma),
              }
            : t
        )
      );
      onNotificar(`Turma ${nomeTurma.trim().toUpperCase()} atualizada com sucesso!`);
    } else {
      const nova: Turma = {
        id: `t_${Date.now()}`,
        nome: nomeTurma.trim().toUpperCase(),
        modalidade: 'Voleibol',
        diasTreino: diasTreinoTurma,
        dia: diasFormatados,
        horarioInicio: inicioTurma,
        horarioTermino: terminoTurma,
        horario: horarioFormatado,
        vagasTotais: Math.max(1, vagasTurma),
        aberta: true,
        inscritosIds: [],
        periodoMatricula: '2026/2027',
      };
      onSetTurmas((prev) => [...prev, nova]);
      onNotificar(`Turma ${nova.nome} criada e aberta com sucesso!`);
    }
    limparFormTurma();
  };

  // --- Handlers Alunos ---
  const limparFormAluno = () => {
    setEditandoAlunoId(null);
    setNomeAluno('');
    setSenhaAluno('1234');
    setTurmaCadAluno(turmas[0]?.nome || '');
    setInicioMatAluno('2026-11-03');
    setFimMatAluno('2027-12-20');
    setNivelAluno(3);
    setTextoLoteAlunos('');
  };

  const executarExclusao = () => {
    if (!itemParaExcluir) return;
    if (itemParaExcluir.tipo === 'turma') {
      const turmaAlvo = turmas.find((t) => t.id === itemParaExcluir.id);
      const nomeExibicao = turmaAlvo ? turmaAlvo.nome : itemParaExcluir.nome;
      onSetTurmas((prev) => prev.filter((x) => x.id !== itemParaExcluir.id));
      onNotificar(`Turma "${nomeExibicao}" apagada com sucesso!`);
      if (editandoTurmaId === itemParaExcluir.id || turmaModalEdicao?.id === itemParaExcluir.id) {
        limparFormTurma();
        setTurmaModalEdicao(null);
      }
    } else if (itemParaExcluir.tipo === 'aluno') {
      const alunoAlvo = alunos.find((a) => a.id === itemParaExcluir.id);
      const nomeExibicao = alunoAlvo ? alunoAlvo.nome : itemParaExcluir.nome;
      onSetAlunos((prev) => prev.filter((item) => item.id !== itemParaExcluir.id));
      onNotificar(`Aluno "${nomeExibicao}" apagado com sucesso!`);
      if (editandoAlunoId === itemParaExcluir.id) {
        limparFormAluno();
      }
    }
    setItemParaExcluir(null);
  };

  const salvarAluno = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeAluno.trim()) {
      onNotificar('Por favor, informe o nome completo do aluno.');
      return;
    }
    const turmaEscolhida = turmaCadAluno.trim() || turmas[0]?.nome || 'TURMA GERAL';
    const senhaFinal = senhaAluno.trim() || '1234';

    if (editandoAlunoId) {
      onSetAlunos((prev) =>
        prev.map((a) =>
          a.id === editandoAlunoId
            ? {
                ...a,
                nome: nomeAluno.trim().toUpperCase(),
                senha: senhaFinal,
                turmaCadastro: turmaEscolhida,
                inicioMatricula: inicioMatAluno || '2026-11-03',
                fimMatricula: fimMatAluno || '2027-12-20',
                nivel: nivelAluno,
              }
            : a
        )
      );
      onNotificar(`Aluno ${nomeAluno.trim().toUpperCase()} atualizado na turma ${turmaEscolhida}!`);
    } else {
      const novo: Aluno = {
        id: `a_${Date.now()}`,
        nome: nomeAluno.trim().toUpperCase(),
        idade: 17,
        telefone: '(82) 99999-0000',
        nivel: nivelAluno,
        senha: senhaFinal,
        turmaCadastro: turmaEscolhida,
        inicioMatricula: inicioMatAluno || '2026-11-03',
        fimMatricula: fimMatAluno || '2027-12-20',
        liberadoInscricao: true,
        autorizadoJustificar: true,
      };
      onSetAlunos((prev) => [novo, ...prev]);
      onNotificar(`Aluno ${novo.nome} cadastrado com senha na turma ${turmaEscolhida}!`);
    }
    limparFormAluno();
  };

  const salvarLoteAlunos = (e: React.FormEvent) => {
    e.preventDefault();
    const linhas = textoLoteAlunos
      .split('\n')
      .map((l) => l.trim().toUpperCase())
      .filter((l) => l.length > 1);

    if (linhas.length === 0) {
      onNotificar('Por favor, informe ao menos um nome de aluno (um por linha).');
      return;
    }

    const turmaEscolhida = turmaCadAluno.trim() || turmas[0]?.nome || 'TURMA GERAL';

    const novos: Aluno[] = linhas.map((nome, idx) => ({
      id: `a_${Date.now()}_${idx}`,
      nome,
      idade: 17,
      telefone: '(82) 99999-0000',
      nivel: nivelAluno,
      senha: '1234',
      turmaCadastro: turmaEscolhida,
      inicioMatricula: inicioMatAluno || '2026-11-03',
      fimMatricula: fimMatAluno || '2027-12-20',
      liberadoInscricao: true,
      autorizadoJustificar: true,
    }));

    onSetAlunos((prev) => [...novos, ...prev]);
    onNotificar(`${novos.length} alunos cadastrados em lote na turma ${turmaEscolhida} (senha padrão: 1234)!`);
    setTextoLoteAlunos('');
    limparFormAluno();
  };

  // --- Handlers Programação ---
  const limparFormEvento = () => {
    setEditandoEventoId(null);
    setTituloEv('');
    setDiaEv('SÁBADO');
    setHoraEv('18:45');
    setTipoEv('Treino');
    setObrigEv(false);
    setDescEv('');
  };

  const salvarEvento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tituloEv.trim()) return;
    if (editandoEventoId) {
      onSetProgramacao((prev) =>
        prev.map((ev) =>
          ev.id === editandoEventoId
            ? {
                ...ev,
                titulo: tituloEv.trim(),
                dia: diaEv,
                horario: horaEv,
                tipo: tipoEv,
                obrigatorio: obrigEv,
                descricao: descEv.trim(),
              }
            : ev
        )
      );
      onNotificar('Atividade atualizada na programação!');
    } else {
      const novoEv: EventoProgramacao = {
        id: `ev_${Date.now()}`,
        titulo: tituloEv.trim(),
        dia: diaEv,
        horario: horaEv,
        tipo: tipoEv,
        obrigatorio: obrigEv,
        descricao: descEv.trim() || 'Atividade oficial do Projeto Tsunami.',
      };
      onSetProgramacao((prev) => [...prev, novoEv]);
      onNotificar('Evento adicionado à programação!');
    }
    limparFormEvento();
  };

  // --- Handlers Frequência Manual ---
  const marcarFrequencia = (alunoId: string, status: StatusFrequencia) => {
    const turmaNome =
      turmaFreqId === 'celula'
        ? 'Célula Obrigatória'
        : turmas.find((t) => t.id === turmaFreqId)?.nome || 'Turma Esportiva';

    onSetFrequencias((prev) => {
      const idx = prev.findIndex(
        (f) => f.data === dataFreq && f.turmaId === turmaFreqId && f.alunoId === alunoId
      );
      if (idx >= 0) {
        const copia = [...prev];
        copia[idx] = { ...copia[idx], status };
        return copia;
      }
      return [
        ...prev,
        {
          id: `f_${Date.now()}_${alunoId}`,
          data: dataFreq,
          turmaId: turmaFreqId,
          turmaNome,
          alunoId,
          status,
        },
      ];
    });
  };

  const marcarTodosFrequencia = (status: StatusFrequencia) => {
    alunos.forEach((a) => marcarFrequencia(a.id, status));
    onNotificar(`Todos os atletas marcados como "${status.toUpperCase()}" em ${dataFreq}.`);
  };

  // --- Filtros da Home "Controle de Alunos & Acessos" ---
  const alunosFiltradosHome = useMemo(() => {
    return alunos.filter((a) => {
      const matchNome = a.nome.toLowerCase().includes(buscaRapida.toLowerCase());
      if (!matchNome) return false;
      if (filtroAcesso === 'liberados_justificar') return a.autorizadoJustificar;
      if (filtroAcesso === 'sem_autorizacao') return !a.autorizadoJustificar;
      return true;
    });
  }, [alunos, buscaRapida, filtroAcesso]);

  // --- Cálculos de Relatórios ---
  const frequenciasPeriodo = useMemo(() => {
    return frequencias.filter((f) => f.data >= dataInicioRel && f.data <= dataFimRel);
  }, [frequencias, dataInicioRel, dataFimRel]);

  const relatorioPorAluno = useMemo(() => {
    return alunos.map((a) => {
      const regs = frequenciasPeriodo.filter((f) => f.alunoId === a.id);
      const presencas = regs.filter((r) => r.status === 'presente').length;
      const faltas = regs.filter((r) => r.status === 'falta').length;
      const justificados = regs.filter((r) => r.status === 'justificado').length;
      const total = regs.length;
      const taxa = total > 0 ? Math.round(((presencas + justificados) / total) * 100) : 100;
      return { aluno: a, presencas, faltas, justificados, total, taxa };
    });
  }, [alunos, frequenciasPeriodo]);

  const copiarRelatorioTexto = async () => {
    const linhas = relatorioPorAluno
      .map(
        (r, i) =>
          `${i + 1}. ${r.aluno.nome}: ${r.presencas}P | ${r.justificados}J | ${r.faltas}F (${r.taxa}%)`
      )
      .join('\n');
    const texto = `📊 *RELATÓRIO DE FREQUÊNCIA — PROJETO TSUNAMI*\nPeríodo: ${dataInicioRel} até ${dataFimRel}\n\n${linhas}`;
    try {
      await navigator.clipboard.writeText(texto);
      onNotificar('Relatório copiado para a área de transferência!');
    } catch {
      onNotificar('Não foi possível copiar o relatório.');
    }
  };

  const exportarRelatorioCSV = () => {
    const header = 'Atleta,Turma Matricula,Nivel,Presencas,Justificados,Faltas,Frequencia (%)\n';
    const body = relatorioPorAluno
      .map(
        (r) =>
          `"${r.aluno.nome}","${r.aluno.turmaCadastro}",${r.aluno.nivel},${r.presencas},${r.justificados},${r.faltas},${r.taxa}%`
      )
      .join('\n');
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-tsunami-${dataInicioRel}-a-${dataFimRel}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onNotificar('Arquivo CSV de frequência baixado!');
  };

  return (
    <div className="space-y-5">
      {/* Barra de Cabeçalho */}
      {modulo === 'turmas' ? (
        <div className="flex items-center justify-between gap-4 py-2">
          <button
            type="button"
            onClick={() => {
              limparFormTurma();
              setModulo('home');
            }}
            className="min-h-[42px] px-5 py-2 rounded-xl border-2 border-[#00e5ff] bg-[#001726]/80 hover:bg-[#00283d] text-[#00e5ff] hover:text-white font-display font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(0,229,255,0.25)] transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#00e5ff]" />
            <span>VOLTAR</span>
          </button>

          <div className="flex items-center gap-3">
            <TsunamiCrest logoUrl={logoUrl} size="md" />
            <div className="flex items-center text-[#00e5ff]">
              <Users className="w-7 h-7" />
              <Settings className="w-5 h-5 -ml-1 mt-1 opacity-90" />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-wider text-[#00e5ff] drop-shadow-[0_0_15px_rgba(0,229,255,0.7)]">
              GERENCIAR TURMAS
            </h2>
          </div>

          <div className="w-[100px] flex justify-end">
            <button
              type="button"
              onClick={onLogoff}
              className="min-h-[38px] px-3 rounded-lg border border-slate-800 bg-[#061126] hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
            >
              LOGOFF
            </button>
          </div>
        </div>
      ) : modulo === 'alunos' ? (
        <div className="flex items-center justify-between gap-4 py-2">
          <button
            type="button"
            onClick={() => {
              limparFormAluno();
              setModulo('home');
            }}
            className="min-h-[42px] px-5 py-2 rounded-xl border-2 border-[#d946ef] bg-[#160826]/80 hover:bg-[#2d0f42] text-[#e879f9] hover:text-white font-display font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(217,70,239,0.25)] transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#e879f9]" />
            <span>VOLTAR</span>
          </button>

          <div className="flex items-center gap-3">
            <TsunamiCrest logoUrl={logoUrl} size="md" />
            <div className="flex items-center text-[#e879f9]">
              <Users className="w-7 h-7" />
              <User className="w-5 h-5 -ml-1 mt-1 opacity-90" />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-wider text-[#e879f9] drop-shadow-[0_0_15px_rgba(232,121,249,0.7)]">
              CADASTRO DE ALUNOS
            </h2>
          </div>

          <div className="w-[100px] flex justify-end">
            <button
              type="button"
              onClick={onLogoff}
              className="min-h-[38px] px-3 rounded-lg border border-slate-800 bg-[#061126] hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
            >
              LOGOFF
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#16366d] bg-gradient-to-r from-[#071638] via-[#051029] to-[#071638] px-4 py-3.5 sm:px-5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wide text-white">
                <span className="text-[#e879f9] drop-shadow-[0_0_10px_rgba(232,121,249,0.5)]">ÁREA</span> TÉCNICA DO PROFESSOR
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Área Técnica do Professor · Gerenciamento Geral · Acesso Exclusivo da Coordenação
            </p>
          </div>

          <div className="flex items-center gap-2">
            {modulo !== 'home' && (
              <button
                type="button"
                onClick={() => setModulo('home')}
                className="min-h-[42px] px-3.5 py-2 rounded-xl border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-200 text-xs font-display font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>
            )}
            <button
              type="button"
              onClick={onLogoff}
              className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-700 bg-[#0b1730] hover:bg-rose-950/50 hover:border-rose-500/40 text-slate-200 text-xs font-display font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>LOGOFF</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          TELA INICIAL DO PAINEL ADMINISTRATIVO (GRADE 3x2 + CONTROLES)
         ========================================================= */}
      {modulo === 'home' && (
        <div className="space-y-6">
          {/* Grade de Botões 3D das 7 Funcionalidades do Professor */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5">
            <BotaoTresD
              cor="roxo"
              formato="tile"
              onClick={() => setModulo('turmas')}
              subtitulo={`${turmas.length} turmas • Horários & Vagas`}
            >
              CRIAR TURMA / ABRIR
            </BotaoTresD>

            <BotaoTresD
              cor="azul"
              formato="tile"
              onClick={() => setModulo('alunos')}
              subtitulo={`${alunos.length} atletas • Senhas & Lote`}
            >
              CADASTRAR ALUNO / SENHA
            </BotaoTresD>

            <BotaoTresD
              cor="verde"
              formato="tile"
              onClick={() => setModulo('programacao')}
              subtitulo={`${programacao.length} eventos • Lançar do Dia`}
            >
              PAINEL DA PROGRAMAÇÃO
            </BotaoTresD>

            <BotaoTresD
              cor="amarelo"
              formato="tile"
              onClick={() => setModulo('facial')}
              subtitulo="Biometria c/ Câmera ao Vivo"
            >
              FAZER ARENA FACIAL
            </BotaoTresD>

            <BotaoTresD
              cor="vermelho"
              formato="tile"
              onClick={() => setModulo('frequencia')}
              subtitulo="Manual ou Leitura Facial"
            >
              FREQUÊNCIA ARENA
            </BotaoTresD>

            <BotaoTresD
              cor="escuro"
              formato="tile"
              onClick={() => setModulo('frequencia')}
              subtitulo="4 a 5 Sábados do Mês & N/M"
            >
              FREQUÊNCIA MENSAL
            </BotaoTresD>

            <div className="col-span-2 sm:col-span-1 lg:col-span-2">
              <BotaoTresD
                cor="ciano"
                formato="tile"
                onClick={() => setModulo('relatorios')}
                subtitulo="Gráficos de Barras, Assiduidade & WhatsApp"
              >
                RELATÓRIO DE PRESENÇAS; COM GRÁFICOS
              </BotaoTresD>
            </div>
          </div>

          {/* Seção: Alterar Logo + Controles Rápidos da Semana */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Card Logo do Projeto */}
            <div className="rounded-2xl border border-[#142d5e] bg-[#061126] p-4 flex items-center gap-4">
              <TsunamiCrest logoUrl={logoUrl} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm font-bold uppercase tracking-wider text-cyan-300">
                  Logo do Projeto
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleUploadLogo}
                  className="hidden"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[40px] flex-1 rounded-xl border border-cyan-500/35 bg-[#091c3e] hover:bg-[#0e2958] px-3 py-2 text-xs font-display font-bold uppercase tracking-wider text-white flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Alterar Imagem da Logo</span>
                  </button>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        onSetLogoUrl(null);
                        onNotificar('Logo padrão restaurada.');
                      }}
                      className="min-h-[40px] rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
                    >
                      Padrão
                    </button>
                  )}
                </div>
                <p className="mt-1.5 text-[10px] uppercase tracking-wider text-slate-400">
                  Formatos aceitos: JPG, PNG, WEBP (Exibição Circular)
                </p>
              </div>
            </div>

            {/* Card Trancar / Esporte no Sábado / Resetar Inscrições */}
            <div className="rounded-2xl border border-[#142d5e] bg-[#061126] p-4 flex flex-col justify-center gap-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={onToggleTrancarInscricoes}
                  className={`min-h-[44px] rounded-xl border px-3.5 py-2 text-xs font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                    inscricoesTrancadas
                      ? 'border-amber-500/50 bg-amber-950/40 text-amber-200'
                      : 'border-slate-700 bg-[#0a1833] hover:bg-[#10244a] text-slate-200'
                  }`}
                >
                  {inscricoesTrancadas ? (
                    <>
                      <Unlock className="w-4 h-4 text-amber-400" />
                      <span>DESTRANCAR INSCRIÇÕES</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-slate-400" />
                      <span>TRANCAR INSCRIÇÕES</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onToggleEsporteSabado}
                  className={`min-h-[44px] rounded-xl border px-3.5 py-2 text-xs font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                    esporteSabadoAtivo
                      ? 'border-cyan-400/50 bg-gradient-to-b from-slate-200 to-slate-300 text-slate-950 shadow'
                      : 'border-slate-700 bg-[#0a1833] text-slate-300'
                  }`}
                >
                  <span>🏐 ESPORTE NO SÁBADO: {esporteSabadoAtivo ? 'ATIVO' : 'PAUSADO'}</span>
                </button>
              </div>

              {!confirmandoReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmandoReset(true)}
                  className="min-h-[42px] rounded-xl border border-rose-500/30 bg-[#0a1428] hover:bg-rose-950/35 px-3.5 py-2 text-xs font-display font-bold uppercase tracking-wider text-rose-300 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>RESETAR INSCRIÇÕES DA SEMANA</span>
                </button>
              ) : (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-rose-500/50 bg-rose-950/40 px-3 py-2">
                  <span className="text-xs font-semibold text-rose-200">Zerar lista da célula e turmas?</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onResetarInscricoesSemana();
                        setConfirmandoReset(false);
                      }}
                      className="px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold uppercase cursor-pointer"
                    >
                      Confirmar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmandoReset(false)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold uppercase cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controle Rápido de Alunos & Acessos (Conforme imagem de referência) */}
          <div className="rounded-2xl border border-[#152c55] bg-[#050e21] p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-xl font-bold uppercase tracking-wide text-white">
                  Controle de Alunos & Acessos
                </h3>
                <p className="text-xs text-slate-400">
                  Gerencie inscrições, níveis técnicos (estrelas) e quem pode justificar ausência no sábado.
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onSetAlunos((prev) => prev.map((a) => ({ ...a, liberadoInscricao: true })));
                    onNotificar('Todos os atletas foram liberados para pré-inscrição!');
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#0b1830] hover:bg-emerald-950/40 text-[11px] font-bold uppercase text-slate-200 cursor-pointer"
                >
                  Liberar Todos
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSetAlunos((prev) => prev.map((a) => ({ ...a, liberadoInscricao: false })));
                    onNotificar('Todos os atletas foram bloqueados temporariamente.');
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#0b1830] hover:bg-rose-950/40 text-[11px] font-bold uppercase text-slate-200 cursor-pointer"
                >
                  Bloquear Todos
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSetAlunos((prev) => prev.map((a) => ({ ...a, autorizadoJustificar: true })));
                    onNotificar('Justificativa liberada para todos os atletas!');
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-emerald-500/35 bg-emerald-950/30 hover:bg-emerald-900/40 text-[11px] font-bold uppercase text-emerald-300 cursor-pointer"
                >
                  ✓ Autorizar Justificar (Todos)
                </button>
              </div>
            </div>

            {/* Busca + Filtros */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={buscaRapida}
                  onChange={(e) => setBuscaRapida(e.target.value)}
                  placeholder="Pesquisar atleta..."
                  className="w-full min-h-[42px] rounded-xl border border-slate-800 bg-[#09152b] pl-10 pr-3.5 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1 p-1 rounded-xl bg-[#09152b] border border-slate-800 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setFiltroAcesso('todos')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase whitespace-nowrap cursor-pointer ${
                    filtroAcesso === 'todos' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Todos ({alunos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroAcesso('liberados_justificar')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase whitespace-nowrap cursor-pointer ${
                    filtroAcesso === 'liberados_justificar'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Liberados Justificar ({alunos.filter((a) => a.autorizadoJustificar).length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroAcesso('sem_autorizacao')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase whitespace-nowrap cursor-pointer ${
                    filtroAcesso === 'sem_autorizacao'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Sem Autorização ({alunos.filter((a) => !a.autorizadoJustificar).length})
                </button>
              </div>
            </div>

            {/* Lista de Controle Rápido */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {alunosFiltradosHome.map((aluno) => (
                <div
                  key={aluno.id}
                  className="rounded-xl border border-slate-800/90 bg-[#081326] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-display text-base font-bold uppercase text-white">{aluno.nome}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1 rounded-lg bg-[#050c1a] border border-slate-800 px-2 py-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">Nível:</span>
                        {[1, 2, 3, 4, 5].map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() =>
                              onSetAlunos((prev) =>
                                prev.map((item) =>
                                  item.id === aluno.id ? { ...item, nivel: st as 1 | 2 | 3 | 4 | 5 } : item
                                )
                              )
                            }
                            aria-label={`Definir ${st} estrelas para ${aluno.nome}`}
                            className="p-0.5 cursor-pointer"
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                st <= aluno.nivel ? 'fill-cyan-300 text-cyan-300' : 'fill-slate-800 text-slate-700'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="ml-1 text-[10px] font-mono-num text-cyan-300 font-bold">{aluno.nivel}★</span>
                      </div>

                      <span className="text-[11px] font-mono-num text-slate-400">
                        SENHA: <strong className="text-slate-200">{aluno.senha}</strong> · {aluno.turmaCadastro}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex rounded-lg border border-slate-700 bg-[#050c1a] p-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          onSetAlunos((prev) =>
                            prev.map((item) => (item.id === aluno.id ? { ...item, liberadoInscricao: true } : item))
                          )
                        }
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase cursor-pointer ${
                          aluno.liberadoInscricao ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Liberar
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onSetAlunos((prev) =>
                            prev.map((item) => (item.id === aluno.id ? { ...item, liberadoInscricao: false } : item))
                          )
                        }
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase cursor-pointer ${
                          !aluno.liberadoInscricao ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Bloquear
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onSetAlunos((prev) =>
                          prev.map((item) =>
                            item.id === aluno.id
                              ? { ...item, autorizadoJustificar: !item.autorizadoJustificar }
                              : item
                          )
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase cursor-pointer transition-colors ${
                        aluno.autorizadoJustificar
                          ? 'border-emerald-500/40 bg-emerald-950/35 text-emerald-300'
                          : 'border-slate-700 bg-[#050c1a] text-slate-400'
                      }`}
                    >
                      Justificar: {aluno.autorizadoJustificar ? 'Liberado' : 'Bloqueado'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          1. MÓDULO INTERNO: GERENCIAR TURMAS (EXATO AO SCREENSHOT DO USUÁRIO)
         ========================================================= */}
      {modulo === 'turmas' && (
        <div className="space-y-6">
          {/* Card NOVA TURMA / EDITAR TURMA */}
          <div className="rounded-3xl border border-[#0d3455] bg-[#030c1d] p-5 sm:p-6 shadow-[0_0_25px_rgba(0,30,60,0.6)]">
            <div className="flex items-center justify-between pb-3 border-b border-[#0d3455]">
              <h3 className="font-display text-sm sm:text-base font-bold uppercase tracking-widest text-[#00e5ff] drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]">
                {editandoTurmaId ? 'EDITAR TURMA' : 'NOVA TURMA'}
              </h3>
              {editandoTurmaId && (
                <button
                  type="button"
                  onClick={limparFormTurma}
                  className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕ Cancelar Edição
                </button>
              )}
            </div>

            <form onSubmit={salvarTurma} className="mt-5 space-y-5">
              {/* Linha 1: Nome da Turma, Início, Término, Vagas e Botão + CRIAR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7ea5cb] mb-1.5">
                    NOME DA TURMA
                  </label>
                  <input
                    type="text"
                    required
                    value={nomeTurma}
                    onChange={(e) => setNomeTurma(e.target.value)}
                    placeholder="EX: SUB-15"
                    className="w-full h-[46px] rounded-xl border border-[#0f446d] bg-[#051329] px-4 text-sm font-bold uppercase text-white placeholder:text-slate-500 focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] focus:outline-none transition-all"
                  />
                </div>

                <div className="col-span-1 lg:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7ea5cb] mb-1.5">
                    INÍCIO
                  </label>
                  <input
                    type="time"
                    required
                    value={inicioTurma}
                    onChange={(e) => setInicioTurma(e.target.value)}
                    className="w-full h-[46px] rounded-xl border border-[#0f446d] bg-[#051329] px-3 text-center text-sm font-bold text-white focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] focus:outline-none transition-all cursor-pointer"
                  />
                </div>

                <div className="col-span-1 lg:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7ea5cb] mb-1.5">
                    TÉRMINO
                  </label>
                  <input
                    type="time"
                    required
                    value={terminoTurma}
                    onChange={(e) => setTerminoTurma(e.target.value)}
                    className="w-full h-[46px] rounded-xl border border-[#0f446d] bg-[#051329] px-3 text-center text-sm font-bold text-white focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] focus:outline-none transition-all cursor-pointer"
                  />
                </div>

                <div className="col-span-1 lg:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7ea5cb] mb-1.5">
                    VAGAS
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={vagasTurma}
                    onChange={(e) => setVagasTurma(Number(e.target.value))}
                    className="w-full h-[46px] rounded-xl border border-[#0f446d] bg-[#051329] px-3 text-center text-sm font-bold font-mono-num text-white focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] focus:outline-none transition-all"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2 lg:col-span-2">
                  <button
                    type="submit"
                    className="w-full h-[46px] rounded-xl border-2 border-[#00e5ff] bg-[#001f33] hover:bg-[#002f4d] active:scale-[0.98] text-[#00e5ff] hover:text-white font-display font-bold text-sm uppercase tracking-wider shadow-[0_0_18px_rgba(0,229,255,0.35)] hover:shadow-[0_0_24px_rgba(0,229,255,0.6)] flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    {editandoTurmaId ? (
                      <>
                        <Check className="w-4 h-4 text-cyan-300" />
                        <span>SALVAR</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 text-[#00e5ff]" />
                        <span>CRIAR</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Linha 2: Dias de Treino */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7ea5cb] mb-2.5">
                  DIAS DE TREINO
                </label>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {DIAS_SIGLAS.map((sigla) => {
                    const ativo = diasTreinoTurma.includes(sigla);
                    return (
                      <button
                        key={sigla}
                        type="button"
                        onClick={() => toggleDiaTreino(sigla)}
                        className={`min-w-[64px] h-[40px] px-3 rounded-xl font-display font-bold text-xs uppercase tracking-wider cursor-pointer transition-all ${
                          ativo
                            ? 'bg-[#00e5ff] text-[#001524] shadow-[0_0_16px_rgba(0,229,255,0.8)] border border-transparent scale-105'
                            : 'bg-[#051329] text-[#7ea5cb] border border-[#0f446d] hover:border-cyan-500/50 hover:text-white'
                        }`}
                      >
                        {sigla}
                      </button>
                    );
                  })}
                </div>
              </div>
            </form>
          </div>

          {/* Listagem de Turmas com opções de Editar e Apagar */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between px-1">
              <h4 className="font-display text-sm font-bold uppercase tracking-wider text-slate-300">
                TURMAS CADASTRADAS ({turmas.length})
              </h4>
              <p className="text-xs text-slate-500">
                Clique em Editar para alterar ou Apagar para remover
              </p>
            </div>

            {turmas.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-[#040d1e] p-8 text-center text-slate-400">
                Nenhuma turma cadastrada no momento. Crie sua primeira turma acima!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {turmasOrdenadas.map((t) => (
                  <div
                    key={t.id}
                    className={`rounded-2xl border p-4.5 transition-all ${
                      editandoTurmaId === t.id
                        ? 'border-[#00e5ff] bg-[#04162e] shadow-[0_0_20px_rgba(0,229,255,0.25)]'
                        : 'border-[#0d3455] bg-[#040d1e] hover:border-[#144975]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h5 className="font-display text-lg font-bold uppercase text-white tracking-wide">
                            {t.nome}
                          </h5>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              t.aberta
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50'
                                : 'bg-slate-900 text-slate-400 border border-slate-800'
                            }`}
                          >
                            {t.aberta ? 'ABERTA NA ABA PRINCIPAL' : 'FECHADA'}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-mono-num text-slate-300">
                          <span className="inline-flex items-center gap-1 text-cyan-300 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/40">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            {t.horarioInicio && t.horarioTermino
                              ? `${t.horarioInicio} às ${t.horarioTermino}`
                              : t.horario}
                          </span>
                          <span className="inline-flex items-center gap-1 text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {t.inscritosIds.length} / {t.vagasTotais} VAGAS
                          </span>
                        </div>

                        {/* Badges dos dias de treino */}
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          {extrairDiasTreino(t).map((dia) => (
                            <span
                              key={dia}
                              className="px-2 py-0.5 rounded bg-[#071f3a] border border-[#0d4470] text-[10px] font-bold uppercase text-cyan-300 font-display"
                            >
                              {dia}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Botões de Ação: Abrir/Fechar, Editar e Apagar */}
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => toggleTurmaAberta(t.id)}
                          className={`min-h-[34px] px-3 rounded-xl border text-xs font-display font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                            t.aberta
                              ? 'border-emerald-500/70 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50'
                              : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-white'
                          }`}
                          title={t.aberta ? 'Clique para fechar na Aba Principal' : 'Clique para abrir na Aba Principal'}
                        >
                          <span className={`w-2 h-2 rounded-full ${t.aberta ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                          <span>{t.aberta ? 'ABERTA' : 'ABRIR'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => abrirEdicaoTurma(t)}
                          className="min-h-[34px] px-3 rounded-xl border border-cyan-400/80 bg-[#001726] hover:bg-[#002b47] text-cyan-200 text-xs font-display font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(0,229,255,0.2)] cursor-pointer transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                          <span>EDITAR</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setItemParaExcluir({ tipo: 'turma', id: t.id, nome: t.nome });
                          }}
                          className="min-h-[34px] px-3 rounded-xl border border-rose-500/50 bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 text-xs font-display font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>APAGAR</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Dedicado de Edição de Turma (Abre sobre a tela com os dados preenchidos) */}
          {turmaModalEdicao && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="relative w-full max-w-xl rounded-3xl border border-[#00e5ff] bg-[#030c1d] p-5 sm:p-6 shadow-[0_0_40px_rgba(0,229,255,0.35)]">
                <div className="flex items-center justify-between pb-3 border-b border-[#0d3455]">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-[#00e5ff]" />
                    <h3 className="font-display text-lg font-bold uppercase tracking-wider text-[#00e5ff] drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]">
                      EDITAR TURMA
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTurmaModalEdicao(null)}
                    className="w-8 h-8 rounded-full border border-slate-700 bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={salvarEdicaoTurmaModal} className="mt-5 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7ea5cb] mb-1.5">
                        NOME DA TURMA
                      </label>
                      <input
                        type="text"
                        required
                        value={editModalNome}
                        onChange={(e) => setEditModalNome(e.target.value)}
                        placeholder="EX: SUB-15"
                        className="w-full h-[46px] rounded-xl border border-[#0f446d] bg-[#051329] px-4 text-sm font-bold uppercase text-white focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7ea5cb] mb-1.5">
                        INÍCIO
                      </label>
                      <input
                        type="time"
                        required
                        value={editModalInicio}
                        onChange={(e) => setEditModalInicio(e.target.value)}
                        className="w-full h-[46px] rounded-xl border border-[#0f446d] bg-[#051329] px-3 text-center text-sm font-bold text-white focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] focus:outline-none transition-all cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7ea5cb] mb-1.5">
                        TÉRMINO
                      </label>
                      <input
                        type="time"
                        required
                        value={editModalTermino}
                        onChange={(e) => setEditModalTermino(e.target.value)}
                        className="w-full h-[46px] rounded-xl border border-[#0f446d] bg-[#051329] px-3 text-center text-sm font-bold text-white focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] focus:outline-none transition-all cursor-pointer"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7ea5cb] mb-1.5">
                        VAGAS
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        required
                        value={editModalVagas}
                        onChange={(e) => setEditModalVagas(Number(e.target.value))}
                        className="w-full h-[46px] rounded-xl border border-[#0f446d] bg-[#051329] px-3 text-center text-sm font-bold font-mono-num text-white focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7ea5cb] mb-2.5">
                      DIAS DE TREINO
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {DIAS_SIGLAS.map((sigla) => {
                        const ativo = editModalDias.includes(sigla);
                        return (
                          <button
                            key={sigla}
                            type="button"
                            onClick={() => toggleDiaTreinoModal(sigla)}
                            className={`min-w-[60px] h-[38px] px-3 rounded-xl font-display font-bold text-xs uppercase tracking-wider cursor-pointer transition-all ${
                              ativo
                                ? 'bg-[#00e5ff] text-[#001524] shadow-[0_0_16px_rgba(0,229,255,0.8)] border border-transparent scale-105'
                                : 'bg-[#051329] text-[#7ea5cb] border border-[#0f446d] hover:border-cyan-500/50 hover:text-white'
                            }`}
                          >
                            {sigla}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setTurmaModalEdicao(null)}
                      className="min-h-[44px] px-4 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 font-display font-bold text-xs uppercase tracking-wider hover:bg-slate-800 cursor-pointer"
                    >
                      CANCELAR
                    </button>
                    <button
                      type="submit"
                      className="min-h-[44px] px-6 rounded-xl border-2 border-[#00e5ff] bg-[#001f33] hover:bg-[#002f4d] active:scale-[0.98] text-[#00e5ff] hover:text-white font-display font-bold text-xs uppercase tracking-wider shadow-[0_0_18px_rgba(0,229,255,0.4)] flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <Check className="w-4 h-4 text-cyan-300" />
                      <span>SALVAR ALTERAÇÕES</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          2. MÓDULO INTERNO: CADASTRO DE ALUNOS (EXATO AO SCREENSHOT DO USUÁRIO)
         ========================================================= */}
      {modulo === 'alunos' && (
        <div className="space-y-6">
          {/* Abas Superiores: INDIVIDUAL / CADASTRO EM LOTE */}
          <div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAbaCadastroAluno('individual')}
                className={`min-h-[44px] px-5 py-2 rounded-t-2xl font-display font-bold text-xs uppercase tracking-wider flex items-center gap-2 border-t-2 border-x-2 transition-all cursor-pointer ${
                  abaCadastroAluno === 'individual'
                    ? 'border-[#d946ef] bg-[#0c0517] text-[#f5d0fe] shadow-[0_-5px_15px_rgba(217,70,239,0.25)] relative z-10'
                    : 'border-slate-800 bg-[#061022]/70 text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-4 h-4 text-[#d946ef]" />
                <span>INDIVIDUAL</span>
              </button>

              <button
                type="button"
                onClick={() => setAbaCadastroAluno('lote')}
                className={`min-h-[44px] px-5 py-2 rounded-t-2xl font-display font-bold text-xs uppercase tracking-wider flex items-center gap-2 border-t-2 border-x-2 transition-all cursor-pointer ${
                  abaCadastroAluno === 'lote'
                    ? 'border-[#d946ef] bg-[#0c0517] text-[#f5d0fe] shadow-[0_-5px_15px_rgba(217,70,239,0.25)] relative z-10'
                    : 'border-slate-800 bg-[#061022]/70 text-slate-400 hover:text-white'
                }`}
              >
                <Package className="w-4 h-4 text-[#d946ef]" />
                <span>CADASTRO EM LOTE</span>
              </button>
            </div>

            {/* Card Principal de Cadastro (Borda Magenta com Glow) */}
            <div className="rounded-3xl rounded-tl-none border-2 border-[#d946ef]/80 bg-[#06030d] p-5 sm:p-6 shadow-[0_0_30px_rgba(217,70,239,0.2)]">
              {abaCadastroAluno === 'individual' ? (
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#2d0f40]">
                    <h3 className="font-display text-sm sm:text-base font-bold uppercase tracking-widest text-[#e879f9] drop-shadow-[0_0_8px_rgba(232,121,249,0.4)]">
                      {editandoAlunoId ? 'EDITAR ALUNO' : 'NOVO ALUNO'}
                    </h3>
                    {editandoAlunoId && (
                      <button
                        type="button"
                        onClick={limparFormAluno}
                        className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white cursor-pointer"
                      >
                        ✕ Cancelar Edição
                      </button>
                    )}
                  </div>

                  <form onSubmit={salvarAluno} className="mt-5 space-y-4">
                    {/* Linha dos Campos: NOME COMPLETO, TURMA, MATRÍCULA, VENCIMENTO, SENHA DO APP, NÍVEL */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
                      {/* NOME COMPLETO */}
                      <div className="sm:col-span-2 lg:col-span-3">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#d8b4fe] mb-1.5">
                          NOME COMPLETO
                        </label>
                        <input
                          type="text"
                          required
                          value={nomeAluno}
                          onChange={(e) => setNomeAluno(e.target.value)}
                          placeholder="EX: JOÃO SILVA"
                          className="w-full h-[46px] rounded-xl border border-[#3d1457] bg-[#0c0517] px-4 text-sm font-bold uppercase text-white placeholder:text-slate-600 focus:border-[#d946ef] focus:ring-1 focus:ring-[#d946ef] focus:outline-none transition-all"
                        />
                      </div>

                      {/* TURMA */}
                      <div className="col-span-1 lg:col-span-2">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#d8b4fe] mb-1.5">
                          TURMA
                        </label>
                        <select
                          required
                          value={turmaCadAluno}
                          onChange={(e) => setTurmaCadAluno(e.target.value)}
                          className="w-full h-[46px] rounded-xl border border-[#3d1457] bg-[#0c0517] px-3 text-sm font-bold text-white focus:border-[#d946ef] focus:ring-1 focus:ring-[#d946ef] focus:outline-none transition-all cursor-pointer"
                        >
                          <option value="">Selecione...</option>
                          {turmasOrdenadas.map((t) => (
                            <option key={t.id} value={t.nome}>
                              {t.nome}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* MATRÍCULA */}
                      <div className="col-span-1 lg:col-span-2">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#d8b4fe] mb-1.5">
                          MATRÍCULA
                        </label>
                        <input
                          type="date"
                          required
                          value={inicioMatAluno}
                          onChange={(e) => setInicioMatAluno(e.target.value)}
                          className="w-full h-[46px] rounded-xl border border-[#3d1457] bg-[#0c0517] px-3 text-center text-sm font-bold text-white focus:border-[#d946ef] focus:ring-1 focus:ring-[#d946ef] focus:outline-none transition-all cursor-pointer"
                        />
                      </div>

                      {/* VENCIMENTO */}
                      <div className="col-span-1 lg:col-span-2">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#d8b4fe] mb-1.5">
                          VENCIMENTO
                        </label>
                        <input
                          type="date"
                          required
                          value={fimMatAluno}
                          onChange={(e) => setFimMatAluno(e.target.value)}
                          className="w-full h-[46px] rounded-xl border border-[#3d1457] bg-[#0c0517] px-3 text-center text-sm font-bold text-white focus:border-[#d946ef] focus:ring-1 focus:ring-[#d946ef] focus:outline-none transition-all cursor-pointer"
                        />
                      </div>

                      {/* SENHA DO APP */}
                      <div className="col-span-1 lg:col-span-2">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#d8b4fe]">
                            SENHA DO APP
                          </label>
                          <button
                            type="button"
                            onClick={() => setSenhaAluno(Math.floor(1000 + Math.random() * 9000).toString())}
                            className="text-[10px] text-[#e879f9] hover:underline uppercase cursor-pointer"
                            title="Gerar código PIN aleatório"
                          >
                            Gerar
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={mostrarSenhaForm ? 'text' : 'password'}
                            required
                            value={senhaAluno}
                            onChange={(e) => setSenhaAluno(e.target.value)}
                            placeholder="1234"
                            className="w-full h-[46px] rounded-xl border border-[#3d1457] bg-[#0c0517] pl-3 pr-8 text-sm font-bold font-mono text-white focus:border-[#d946ef] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setMostrarSenhaForm(!mostrarSenhaForm)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                          >
                            {mostrarSenhaForm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* NÍVEL */}
                      <div className="col-span-1 lg:col-span-1">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#d8b4fe] mb-1.5">
                          NÍVEL
                        </label>
                        <select
                          value={nivelAluno}
                          onChange={(e) => setNivelAluno(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                          className="w-full h-[46px] rounded-xl border border-[#3d1457] bg-[#0c0517] px-2 text-sm font-bold text-white focus:border-[#d946ef] focus:ring-1 focus:ring-[#d946ef] focus:outline-none transition-all cursor-pointer"
                        >
                          <option value={1}>1★</option>
                          <option value={2}>2★</option>
                          <option value={3}>3★</option>
                          <option value={4}>4★</option>
                          <option value={5}>5★</option>
                        </select>
                      </div>
                    </div>

                    {/* Botão [+] abaixo do campo (exato ao screenshot) */}
                    <div className="pt-1 flex items-center gap-3">
                      <button
                        type="submit"
                        aria-label={editandoAlunoId ? 'Salvar Aluno' : 'Adicionar Aluno'}
                        className="w-[52px] h-[46px] rounded-xl border-2 border-[#d946ef] bg-[#1a0628] hover:bg-[#2e0b46] active:scale-[0.98] text-[#e879f9] hover:text-white flex items-center justify-center font-bold text-xl shadow-[0_0_16px_rgba(217,70,239,0.35)] hover:shadow-[0_0_22px_rgba(217,70,239,0.6)] cursor-pointer transition-all"
                      >
                        {editandoAlunoId ? <Check className="w-5 h-5 text-emerald-300" /> : <Plus className="w-5 h-5 text-[#e879f9]" />}
                      </button>

                      {editandoAlunoId ? (
                        <span className="text-xs font-bold uppercase tracking-wider text-[#e879f9]">
                          Clique no botão para salvar as alterações do aluno
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Clique em <strong className="text-[#e879f9]">+</strong> para cadastrar o aluno na turma
                        </span>
                      )}
                    </div>
                  </form>
                </div>
              ) : (
                /* CADASTRO EM LOTE */
                <div>
                  <div className="pb-3 border-b border-[#2d0f40]">
                    <h3 className="font-display text-sm sm:text-base font-bold uppercase tracking-widest text-[#e879f9]">
                      CADASTRO EM LOTE DE ALUNOS
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Selecione a turma cadastrada e cole a lista de nomes dos atletas (um por linha) para matriculá-los de uma só vez com senha gerada.
                    </p>
                  </div>

                  <form onSubmit={salvarLoteAlunos} className="mt-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#d8b4fe] mb-1.5">
                          TURMA DE DESTINO
                        </label>
                        <select
                          required
                          value={turmaCadAluno}
                          onChange={(e) => setTurmaCadAluno(e.target.value)}
                          className="w-full h-[46px] rounded-xl border border-[#3d1457] bg-[#0c0517] px-3 text-sm font-bold text-white focus:border-[#d946ef] focus:outline-none cursor-pointer"
                        >
                          <option value="">Selecione a turma...</option>
                          {turmasOrdenadas.map((t) => (
                            <option key={t.id} value={t.nome}>
                              {t.nome}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#d8b4fe] mb-1.5">
                          MATRÍCULA
                        </label>
                        <input
                          type="date"
                          required
                          value={inicioMatAluno}
                          onChange={(e) => setInicioMatAluno(e.target.value)}
                          className="w-full h-[46px] rounded-xl border border-[#3d1457] bg-[#0c0517] px-3 text-center text-sm font-bold text-white focus:border-[#d946ef] focus:outline-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#d8b4fe] mb-1.5">
                          VENCIMENTO
                        </label>
                        <input
                          type="date"
                          required
                          value={fimMatAluno}
                          onChange={(e) => setFimMatAluno(e.target.value)}
                          className="w-full h-[46px] rounded-xl border border-[#3d1457] bg-[#0c0517] px-3 text-center text-sm font-bold text-white focus:border-[#d946ef] focus:outline-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#d8b4fe] mb-1.5">
                          NÍVEL PADRÃO
                        </label>
                        <select
                          value={nivelAluno}
                          onChange={(e) => setNivelAluno(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                          className="w-full h-[46px] rounded-xl border border-[#3d1457] bg-[#0c0517] px-3 text-sm font-bold text-white focus:border-[#d946ef] focus:outline-none cursor-pointer"
                        >
                          <option value={1}>1 Estrela ★</option>
                          <option value={2}>2 Estrelas ★★</option>
                          <option value={3}>3 Estrelas ★★★</option>
                          <option value={4}>4 Estrelas ★★★★</option>
                          <option value={5}>5 Estrelas ★★★★★</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#d8b4fe] mb-1.5">
                        LISTA DE ATLETAS (UM NOME POR LINHA)
                      </label>
                      <textarea
                        rows={6}
                        required
                        value={textoLoteAlunos}
                        onChange={(e) => setTextoLoteAlunos(e.target.value)}
                        placeholder={`JOÃO SILVA\nMARIA SANTOS\nPEDRO ALVES\nLUCAS OLIVEIRA`}
                        className="w-full rounded-2xl border border-[#3d1457] bg-[#0c0517] p-4 text-sm font-bold uppercase text-white placeholder:text-slate-600 focus:border-[#d946ef] focus:outline-none leading-relaxed font-mono"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="submit"
                        className="h-[46px] px-6 rounded-xl border-2 border-[#d946ef] bg-[#1a0628] hover:bg-[#2e0b46] active:scale-[0.98] text-[#e879f9] hover:text-white font-display font-bold text-xs uppercase tracking-wider shadow-[0_0_18px_rgba(217,70,239,0.35)] flex items-center gap-2 cursor-pointer transition-all"
                      >
                        <Plus className="w-4 h-4 text-[#e879f9]" />
                        <span>CADASTRAR EM LOTE</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Listagem de Alunos Cadastrados com Filtro por Turma e Busca */}
          <div className="space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
              <div>
                <h4 className="font-display text-sm font-bold uppercase tracking-wider text-slate-200">
                  ALUNOS CADASTRADOS ({alunos.length})
                </h4>
                <p className="text-xs text-slate-500">
                  Estes alunos estão vinculados às suas turmas (cadastro geral do projeto)
                </p>
              </div>

              {/* Filtro por Turma */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-slate-400">Turma:</span>
                <select
                  value={filtroTurmaModulo}
                  onChange={(e) => setFiltroTurmaModulo(e.target.value)}
                  className="min-h-[38px] rounded-xl border border-slate-700 bg-[#061126] px-3 text-xs font-bold uppercase text-white focus:border-[#d946ef] focus:outline-none cursor-pointer"
                >
                  <option value="todas">Todas as Turmas ({alunos.length})</option>
                  {turmas.map((t) => (
                    <option key={t.id} value={t.nome}>
                      {t.nome} ({alunos.filter((a) => a.turmaCadastro === t.nome).length})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Barra de Busca e Filtro de Nível */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={buscaAlunoModulo}
                  onChange={(e) => setBuscaAlunoModulo(e.target.value)}
                  placeholder="Buscar aluno por nome..."
                  className="w-full h-[42px] rounded-xl border border-slate-800 bg-[#061126] pl-10 pr-4 text-xs font-bold uppercase text-white placeholder:text-slate-500 focus:border-[#d946ef] focus:outline-none"
                />
              </div>

              <select
                value={filtroNivelModulo}
                onChange={(e) => setFiltroNivelModulo(Number(e.target.value))}
                className="h-[42px] rounded-xl border border-slate-800 bg-[#061126] px-3.5 text-xs font-bold text-white focus:border-[#d946ef] focus:outline-none cursor-pointer"
              >
                <option value={0}>Todos os níveis (1★ a 5★)</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    Somente {n}★
                  </option>
                ))}
              </select>
            </div>

            {/* Cards dos Alunos Cadastrados */}
            {alunos.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-[#06030d] p-8 text-center text-slate-400">
                Nenhum aluno cadastrado no momento. Cadastre seu primeiro aluno acima!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {alunosOrdenados
                  .filter((a) => {
                    const termo = buscaAlunoModulo.toLowerCase();
                    const matchNome = a.nome.toLowerCase().includes(termo);
                    const matchTurma =
                      filtroTurmaModulo === 'todas' || a.turmaCadastro === filtroTurmaModulo;
                    const matchNivel = filtroNivelModulo === 0 || a.nivel === filtroNivelModulo;
                    return matchNome && matchTurma && matchNivel;
                  })
                  .map((a) => (
                    <div
                      key={a.id}
                      className={`rounded-2xl border p-4 transition-all ${
                        editandoAlunoId === a.id
                          ? 'border-[#d946ef] bg-[#140620] shadow-[0_0_20px_rgba(217,70,239,0.25)]'
                          : 'border-slate-800 bg-[#061126] hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-display text-base font-bold uppercase text-white truncate">
                            {a.nome}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-[#1c082b] border border-[#3b1257] text-[10px] font-bold uppercase text-[#e879f9] font-display">
                              {a.turmaCadastro || 'Turma Tsunami'}
                            </span>
                            <span className="text-xs font-mono-num text-amber-300 flex items-center gap-0.5">
                              {'★'.repeat(a.nivel)}
                              <span className="text-slate-600">{'★'.repeat(5 - a.nivel)}</span>
                            </span>
                          </div>
                          <p className="text-[11px] font-mono-num text-slate-400 mt-1">
                            Matrícula: {a.inicioMatricula || '01/02/2026'} até {a.fimMatricula || '20/12/2027'}
                          </p>

                          {/* Senha do App com Opção de Ver e Copiar */}
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                            <Key className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>Senha:</span>
                            <span className="font-mono font-bold text-cyan-300">
                              {senhasVisiveis[a.id] ? (a.senha || '1234') : '••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSenhasVisiveis((prev) => ({ ...prev, [a.id]: !prev[a.id] }))}
                              className="text-slate-500 hover:text-cyan-300 cursor-pointer ml-0.5"
                              title={senhasVisiveis[a.id] ? 'Ocultar senha' : 'Ver senha'}
                            >
                              {senhasVisiveis[a.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(a.senha || '1234');
                                onNotificar(`Senha de ${a.nome} copiada!`);
                              }}
                              className="text-slate-500 hover:text-cyan-300 cursor-pointer ml-0.5"
                              title="Copiar senha do app"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setAbaCadastroAluno('individual');
                              setEditandoAlunoId(a.id);
                              setNomeAluno(a.nome);
                              setSenhaAluno(a.senha || '1234');
                              setTurmaCadAluno(a.turmaCadastro);
                              setInicioMatAluno(a.inicioMatricula);
                              setFimMatAluno(a.fimMatricula);
                              setNivelAluno(a.nivel);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="min-h-[34px] px-3 rounded-lg border border-purple-500/40 bg-purple-950/30 hover:bg-purple-900/50 text-purple-200 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-purple-300" />
                            <span>EDITAR</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setItemParaExcluir({ tipo: 'aluno', id: a.id, nome: a.nome });
                            }}
                            className="min-h-[34px] px-3 rounded-lg border border-rose-500/40 bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>APAGAR</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          3. MÓDULO INTERNO: PROGRAMAÇÃO (VERDE)
         ========================================================= */}
      {modulo === 'programacao' && (
        <div className="space-y-5">
          {/* Banner de Destaque: Lançamento de Programação & Sincronização Automática com Pré-Inscrição */}
          <div className="rounded-2xl border-2 border-emerald-500/80 bg-gradient-to-r from-[#031d17] via-[#042921] to-[#021813] p-4 sm:p-5 shadow-[0_0_25px_rgba(16,185,129,0.25)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <h4 className="font-display font-black text-lg uppercase tracking-wide">
                  LANÇAMENTO DA PROGRAMAÇÃO & PRÉ-INSCRIÇÃO
                </h4>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed max-w-xl">
                Quando o professor lança a programação, ele <strong>abre a turma do dia na aba principal</strong> (ex: Voleibol 18h, Futsal 19h, Basquete 20h) e <strong>automaticamente a pessoa que estava na frequência de sábado aparece na lista da pré-inscrição</strong>!
              </p>
            </div>

            <button
              type="button"
              onClick={lancarProgramacaoTurmas}
              className="min-h-[46px] px-6 rounded-xl border-2 border-emerald-300 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.5)] cursor-pointer hover:scale-105 active:scale-95 transition-all shrink-0"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>LANÇAR PROGRAMAÇÃO DO DIA</span>
            </button>
          </div>

          {/* Atalhos Rápidos com os Exemplos do Professor */}
          <div className="rounded-xl border border-emerald-500/30 bg-[#020e1e] p-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase text-slate-300 mr-1">Atalhos do Treino:</span>
            <button
              type="button"
              onClick={() => {
                setTituloEv('VOLEIBOL');
                setHoraEv('18:00');
                setDiaEv('SÁBADO');
                setTipoEv('Treino');
              }}
              className="px-2.5 py-1 rounded-lg border border-teal-500/40 bg-teal-950/40 hover:bg-teal-900/50 text-[11px] font-bold text-teal-300 uppercase cursor-pointer"
            >
              + VOLEIBOL - 18:00
            </button>
            <button
              type="button"
              onClick={() => {
                setTituloEv('FUTSAL');
                setHoraEv('19:00');
                setDiaEv('SÁBADO');
                setTipoEv('Treino');
              }}
              className="px-2.5 py-1 rounded-lg border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/50 text-[11px] font-bold text-cyan-300 uppercase cursor-pointer"
            >
              + FUTSAL - 19:00
            </button>
            <button
              type="button"
              onClick={() => {
                setTituloEv('BASQUETE');
                setHoraEv('20:00');
                setDiaEv('SÁBADO');
                setTipoEv('Treino');
              }}
              className="px-2.5 py-1 rounded-lg border border-amber-500/40 bg-amber-950/40 hover:bg-amber-900/50 text-[11px] font-bold text-amber-300 uppercase cursor-pointer"
            >
              + BASQUETE - 20:00
            </button>
          </div>

          {/* Formulário de Adicionar / Editar Atividade */}
          <div className="rounded-2xl border border-emerald-500/35 bg-[#061126] p-4 sm:p-5">
            <h3 className="font-display text-xl font-bold uppercase text-emerald-300 mb-3">
              {editandoEventoId ? 'Editar Evento da Programação' : 'Adicionar Atividade da Programação'}
            </h3>
            <form onSubmit={salvarEvento} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Título da Atividade</label>
                <input
                  type="text"
                  required
                  value={tituloEv}
                  onChange={(e) => setTituloEv(e.target.value)}
                  placeholder="Ex.: VOLEIBOL / FUTSAL / BASQUETE"
                  className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-[#091836] px-3.5 py-2 text-sm text-white font-bold uppercase focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Dia</label>
                <select
                  value={diaEv}
                  onChange={(e) => setDiaEv(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-[#091836] px-3.5 py-2 text-sm text-white font-bold uppercase focus:border-emerald-400 focus:outline-none cursor-pointer"
                >
                  {DIAS_SEMANA.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Horário</label>
                <input
                  type="time"
                  value={horaEv}
                  onChange={(e) => setHoraEv(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-[#091836] px-3.5 py-2 text-sm text-white font-bold focus:border-emerald-400 focus:outline-none cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Tipo</label>
                <select
                  value={tipoEv}
                  onChange={(e) => setTipoEv(e.target.value as 'Célula' | 'Treino' | 'Amistoso' | 'Evento')}
                  className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-[#091836] px-3.5 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none cursor-pointer"
                >
                  <option value="Treino">Treino</option>
                  <option value="Célula">Célula</option>
                  <option value="Amistoso">Amistoso</option>
                  <option value="Evento">Evento</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Obrigatoriedade</label>
                <select
                  value={obrigEv ? 'sim' : 'nao'}
                  onChange={(e) => setObrigEv(e.target.value === 'sim')}
                  className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-[#091836] px-3.5 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none cursor-pointer"
                >
                  <option value="nao">Opcional / Por inscrição</option>
                  <option value="sim">Obrigatória para atletas</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Descrição / Aviso</label>
                <input
                  type="text"
                  value={descEv}
                  onChange={(e) => setDescEv(e.target.value)}
                  placeholder="Instruções exibidas aos atletas na aba principal..."
                  className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-[#091836] px-3.5 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-4 flex gap-2.5">
                <BotaoTresD type="submit" cor="verde" tamanho="sm" icone={<Calendar className="w-4 h-4" />}>
                  {editandoEventoId ? 'ATUALIZAR PROGRAMAÇÃO' : 'SALVAR NA AGENDA'}
                </BotaoTresD>
                {editandoEventoId && (
                  <BotaoTresD type="button" cor="escuro" tamanho="sm" onClick={limparFormEvento}>
                    CANCELAR
                  </BotaoTresD>
                )}
              </div>
            </form>
          </div>

          {/* Lista das Atividades da Programação */}
          <div className="space-y-3">
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-slate-300 px-1">
              ATIVIDADES DA PROGRAMAÇÃO ATIVA ({programacao.length})
            </h4>

            {programacao.map((ev) => {
              const turmaCorrespondente = turmas.find(
                (t) =>
                  t.nome.toUpperCase().includes(ev.titulo.toUpperCase()) ||
                  ev.titulo.toUpperCase().includes(t.nome.toUpperCase())
              );
              const estaAberta = turmaCorrespondente?.aberta;

              return (
                <div
                  key={ev.id}
                  className="rounded-2xl border border-slate-800 bg-[#061126] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-emerald-500/40 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-display text-lg font-bold uppercase text-white">{ev.titulo}</h4>
                      <span className="text-xs font-mono-num font-bold text-emerald-300 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
                        {ev.dia} · {ev.horario}
                      </span>
                      <span className="text-xs font-bold uppercase text-slate-400">
                        {ev.tipo}
                      </span>
                      {ev.obrigatorio && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300">
                          OBRIGATÓRIA
                        </span>
                      )}
                      {estaAberta && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/50 text-emerald-300">
                          ✓ ABERTA NA ABA PRINCIPAL
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{ev.descricao || 'Turma aberta para os atletas do projeto.'}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Botão de Abrir e Sincronizar com Frequência do Sábado */}
                    <button
                      type="button"
                      onClick={() => {
                        // Encontra o último sábado com frequência
                        const sabadosComFreq = Array.from(new Set(frequencias.map((f) => f.data))).sort().reverse();
                        const sabadoAlvo = sabadosComFreq[0] || '2026-10-31';
                        const presentesIds = frequencias
                          .filter((f) => f.data === sabadoAlvo && (f.status === 'presente' || f.status === 'advertencia'))
                          .map((f) => f.alunoId);

                        onSetTurmas((prev) => {
                          const nomeUpper = ev.titulo.toUpperCase().trim();
                          const idx = prev.findIndex((t) => t.nome.includes(nomeUpper) || nomeUpper.includes(t.nome));
                          if (idx >= 0) {
                            const setIds = new Set(prev[idx].inscritosIds);
                            presentesIds.forEach((id) => setIds.add(id));
                            return prev.map((t, i) =>
                              i === idx
                                ? { ...t, aberta: true, horario: ev.horario, inscritosIds: Array.from(setIds) }
                                : t
                            );
                          } else {
                            return [
                              ...prev,
                              {
                                id: `t_${Date.now()}`,
                                nome: nomeUpper,
                                modalidade: 'Voleibol',
                                dia: ev.dia,
                                diasTreino: [ev.dia.slice(0, 3).toUpperCase()],
                                horario: ev.horario,
                                vagasTotais: 20,
                                aberta: true,
                                inscritosIds: presentesIds,
                              },
                            ];
                          }
                        });

                        onNotificar(
                          `Turma "${ev.titulo}" aberta na Aba Principal com ${presentesIds.length} atletas da frequência de sábado pré-inscritos!`
                        );
                      }}
                      className="min-h-[38px] px-3.5 rounded-xl border border-emerald-500/60 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>ABRIR & SINCRONIZAR SÁBADO</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditandoEventoId(ev.id);
                        setTituloEv(ev.titulo);
                        setDiaEv(ev.dia);
                        setHoraEv(ev.horario);
                        setTipoEv(ev.tipo);
                        setObrigEv(ev.obrigatorio);
                        setDescEv(ev.descricao);
                      }}
                      className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-200 hover:text-white cursor-pointer"
                      title="Editar evento"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSetProgramacao((prev) => prev.filter((x) => x.id !== ev.id))}
                      className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl border border-rose-500/30 bg-rose-950/30 text-rose-300 hover:bg-rose-900/40 cursor-pointer"
                      title="Apagar evento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================
          4. MÓDULO INTERNO: ARENA FACIAL (AMARELO) - EM BREVE
         ========================================================= */}
      {/* =========================================================
          4. MÓDULO INTERNO: ARENA FACIAL (AMARELO / CÂMERA BIOMÉTRICA)
         ========================================================= */}
      {modulo === 'facial' && (
        <ArenaFacial
          alunos={alunos}
          frequencias={frequencias}
          onSetFrequencias={onSetFrequencias}
          onVoltar={() => setModulo('home')}
          onIrParaFrequenciaArena={() => setModulo('frequencia')}
          onNotificar={onNotificar}
        />
      )}

      {/* =========================================================
          5. MÓDULO INTERNO: FREQUÊNCIA ARENA & FREQUÊNCIA MENSAL (4 A 5 SÁBADOS)
         ========================================================= */}
      {modulo === 'frequencia' && (
        <FrequenciaArena
          alunos={alunos}
          turmas={turmas}
          frequencias={frequencias}
          onSetFrequencias={onSetFrequencias}
          onVoltar={() => setModulo('home')}
          onNotificar={onNotificar}
        />
      )}

      {/* =========================================================
          6. MÓDULO INTERNO: RELATÓRIOS DE PRESENÇA COM GRÁFICOS
         ========================================================= */}
      {modulo === 'relatorios' && (
        <RelatoriosGraficos
          alunos={alunos}
          turmas={turmas}
          frequencias={frequencias}
          onVoltar={() => setModulo('home')}
          onNotificar={onNotificar}
        />
      )}

      {/* Modal In-App de Confirmação de Exclusão (sem window.confirm bloqueado no iframe) */}
      {itemParaExcluir && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#030d22] border-2 border-rose-500/80 rounded-2xl shadow-[0_0_35px_rgba(244,63,94,0.35)] max-w-md w-full p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 border-2 border-rose-500/60 flex items-center justify-center mx-auto mb-4 text-rose-400">
              <Trash2 className="w-7 h-7" />
            </div>

            <h3 className="font-display font-black text-xl uppercase tracking-wider text-rose-300 mb-2">
              Confirmar Exclusão
            </h3>

            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Deseja realmente apagar {itemParaExcluir.tipo === 'turma' ? 'a turma' : 'o aluno'}{' '}
              <span className="font-bold text-white underline decoration-rose-500/60 underline-offset-2">
                "{itemParaExcluir.nome}"
              </span>
              ?
              <br />
              <span className="text-xs text-rose-400/90 mt-1 block">
                Esta ação é imediata e não poderá ser desfeita.
              </span>
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setItemParaExcluir(null)}
                className="min-h-[44px] px-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executarExclusao}
                className="min-h-[44px] px-4 rounded-xl border border-rose-400/80 bg-rose-600 hover:bg-rose-500 text-white font-display font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Apagar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

