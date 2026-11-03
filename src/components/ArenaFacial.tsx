import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  RefreshCw,
  Scan,
  ShieldAlert,
  Sparkles,
  UserCheck,
  UserX,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Aluno, RegistroFrequencia, StatusFrequencia } from '../types';

interface ArenaFacialProps {
  alunos: Aluno[];
  frequencias: RegistroFrequencia[];
  onSetFrequencias: React.Dispatch<React.SetStateAction<RegistroFrequencia[]>>;
  onVoltar: () => void;
  onIrParaFrequenciaArena: () => void;
  onNotificar: (msg: string) => void;
}

interface LeituraLog {
  id: string;
  alunoId: string;
  alunoNome: string;
  turma: string;
  data: string;
  hora: string;
  sucesso: boolean;
  motivo?: string;
}

export const ArenaFacial: React.FC<ArenaFacialProps> = ({
  alunos,
  frequencias,
  onSetFrequencias,
  onVoltar,
  onIrParaFrequenciaArena,
  onNotificar,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [cameraErro, setCameraErro] = useState<string | null>(null);
  const [somHabilitado, setSomHabilitado] = useState(true);

  // Data do sábado para marcar a frequência (padrão: 31 de Outubro de 2026 para sincronizar com o mês ativo)
  const [dataSabado, setDataSabado] = useState<string>('2026-10-31');

  // Estado do escaneamento
  const [escanenando, setEscaneando] = useState(false);
  const [ultimoReconhecido, setUltimoReconhecido] = useState<{
    aluno: Aluno;
    confianca: number;
    sucesso: boolean;
    mensagem: string;
  } | null>(null);

  // Histórico de leituras faciais da sessão
  const [historicoLeituras, setHistoricoLeituras] = useState<LeituraLog[]>([]);

  // Filtro de busca de atletas na lista de simulação
  const [buscaSimulacao, setBuscaSimulacao] = useState('');

  // Sábados disponíveis para seleção
  const sabadosOpcoes = [
    { data: '2026-10-03', label: '03/10/2026 (SÁBADO)' },
    { data: '2026-10-10', label: '10/10/2026 (SÁBADO)' },
    { data: '2026-10-17', label: '17/10/2026 (SÁBADO)' },
    { data: '2026-10-24', label: '24/10/2026 (SÁBADO)' },
    { data: '2026-10-31', label: '31/10/2026 (SÁBADO)' },
    { data: '2026-11-07', label: '07/11/2026 (SÁBADO)' },
  ];

  // Iniciar câmera real
  const iniciarCamera = async () => {
    setCameraErro(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraErro('Navegador não possui suporte para acesso direto à webcam.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraAtiva(true);
      onNotificar('Câmera biométrica ativada. Posicione o rosto do atleta!');
    } catch {
      setCameraErro('Permissão de câmera não concedida. Use a simulação com os atletas cadastrados abaixo.');
      setCameraAtiva(false);
    }
  };

  // Parar câmera
  const pararCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraAtiva(false);
  };

  useEffect(() => {
    return () => {
      pararCamera();
    };
  }, []);

  // Tocar som de confirmação com Web Audio API
  const tocarSomSucesso = () => {
    if (!somHabilitado) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Ignora erro de áudio
    }
  };

  // Tocar som de bloqueio (erro)
  const tocarSomErro = () => {
    if (!somHabilitado) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Ignora
    }
  };

  // Regra de matrícula: "Se o aluno estiver cadastrado em uma data no meio do mês, e não antes, a frequência bloqueia, deixando (N/M)"
  const isMatriculado = (aluno: Aluno, data: string): boolean => {
    if (aluno.inicioMatricula && data < aluno.inicioMatricula) return false;
    if (aluno.fimMatricula && data > aluno.fimMatricula) return false;
    return true;
  };

  // Processar identificação biométrica do atleta e registrar na FREQUÊNCIA ARENA
  const processarReconhecimento = (aluno: Aluno) => {
    setEscaneando(true);

    setTimeout(() => {
      setEscaneando(false);
      const matriculado = isMatriculado(aluno, dataSabado);
      const confianca = Math.floor(96 + Math.random() * 4); // 96% a 99.9%
      const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      if (!matriculado) {
        // Bloqueado por não matrícula
        tocarSomErro();
        const msg = `BLOQUEADO: Matrícula iniciada em ${aluno.inicioMatricula || 'N/A'}. Não matriculado em ${dataSabado} (N/M).`;
        setUltimoReconhecido({
          aluno,
          confianca,
          sucesso: false,
          mensagem: msg,
        });

        setHistoricoLeituras((prev) => [
          {
            id: `log_${Date.now()}`,
            alunoId: aluno.id,
            alunoNome: aluno.nome,
            turma: aluno.turmaCadastro || 'Geral',
            data: dataSabado,
            hora: agora,
            sucesso: false,
            motivo: 'Não matriculado na data (N/M)',
          },
          ...prev,
        ]);

        onNotificar(`[Arena Facial] ❌ ${aluno.nome} bloqueado: Não matriculado nesta data!`);
        return;
      }

      // Atleta matriculado -> MARCA PRESENÇA (P) NA FREQUÊNCIA ARENA
      onSetFrequencias((prev) => {
        const semEsse = prev.filter((f) => !(f.alunoId === aluno.id && f.data === dataSabado));
        const novoRegistro: RegistroFrequencia = {
          id: `freq_${dataSabado}_${aluno.id}`,
          data: dataSabado,
          alunoId: aluno.id,
          turmaId: 'arena-sabado',
          turmaNome: aluno.turmaCadastro || 'Arena Sábado',
          status: 'presente',
        };
        return [...semEsse, novoRegistro];
      });

      tocarSomSucesso();
      const msg = `PRESENÇA CONFIRMADA! Marcado como PRESENTE (P) na Frequência Arena de ${dataSabado}.`;
      setUltimoReconhecido({
        aluno,
        confianca,
        sucesso: true,
        mensagem: msg,
      });

      setHistoricoLeituras((prev) => [
        {
          id: `log_${Date.now()}`,
          alunoId: aluno.id,
          alunoNome: aluno.nome,
          turma: aluno.turmaCadastro || 'Geral',
          data: dataSabado,
          hora: agora,
          sucesso: true,
        },
        ...prev,
      ]);

      onNotificar(`[Arena Facial] ✅ ${aluno.nome} identificado (${confianca}%) — PRESENÇA confirmada!`);
    }, 450);
  };

  // Alunos ordenados alfabeticamente para a simulação/leitura
  const alunosOrdenados = useMemo(() => {
    return [...alunos].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [alunos]);

  const alunosFiltradosSimulacao = useMemo(() => {
    if (!buscaSimulacao.trim()) return alunosOrdenados;
    const termo = buscaSimulacao.toLowerCase();
    return alunosOrdenados.filter((a) => a.nome.toLowerCase().includes(termo));
  }, [alunosOrdenados, buscaSimulacao]);

  // Total de presenças marcadas na data selecionada
  const totalPresentesHoje = useMemo(() => {
    return frequencias.filter((f) => f.data === dataSabado && (f.status === 'presente' || f.status === 'advertencia')).length;
  }, [frequencias, dataSabado]);

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
          <Scan className="w-6 h-6 text-cyan-400 stroke-[2.5]" />
          <h2 className="font-display font-black text-xl sm:text-2xl uppercase tracking-wider text-cyan-300">
            ARENA FACIAL — FREQUÊNCIA BIOMÉTRICA
          </h2>
        </div>

        <button
          type="button"
          onClick={onIrParaFrequenciaArena}
          className="min-h-[36px] px-3.5 rounded-lg border border-emerald-500/50 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">VER</span>
          <span>FREQUÊNCIA ARENA</span>
        </button>
      </div>

      {/* Controles de Configuração: Sábado Selecionado e Áudio */}
      <div className="rounded-2xl border border-cyan-500/30 bg-[#020d1f] p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase text-slate-300">Data do Sábado:</span>
          <select
            value={dataSabado}
            onChange={(e) => setDataSabado(e.target.value)}
            className="min-h-[36px] px-3 rounded-lg border border-cyan-500/50 bg-[#001424] text-cyan-200 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            {sabadosOpcoes.map((s) => (
              <option key={s.data} value={s.data}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-[#001726] border border-cyan-500/30 text-xs text-cyan-300 font-mono-num font-bold">
            {totalPresentesHoje} ATLETAS COM PRESENÇA
          </div>

          <button
            type="button"
            onClick={() => setSomHabilitado(!somHabilitado)}
            className={`p-2 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
              somHabilitado
                ? 'border-cyan-500/40 bg-cyan-950/40 text-cyan-300'
                : 'border-slate-700 bg-slate-900 text-slate-400'
            }`}
            title={somHabilitado ? 'Som ativado' : 'Som desativado'}
          >
            {somHabilitado ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Grid Principal: Câmera HUD + Resultado Imediato */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Lado Esquerdo: Visor da Câmera Facial com Overlay HUD */}
        <div className="lg:col-span-7 rounded-2xl border-2 border-cyan-500/50 bg-[#010814] p-4 relative overflow-hidden shadow-[0_0_30px_rgba(0,229,255,0.15)] flex flex-col items-center justify-center min-h-[340px]">
          {/* Vídeo da Câmera ou Visor de Simulação */}
          <div className="relative w-full aspect-video max-w-lg bg-[#030d1d] rounded-xl overflow-hidden border border-cyan-500/40 flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraAtiva ? 'block' : 'hidden'}`}
            />

            {!cameraAtiva && (
              <div className="text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-cyan-400/50 bg-cyan-950/30 flex items-center justify-center mx-auto animate-pulse">
                  <Camera className="w-8 h-8 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase text-white tracking-wider">
                    Scanner Facial em Standby
                  </p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                    Ative sua webcam para leitura biométrica ou clique em qualquer aluno na lista abaixo para escanear.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={iniciarCamera}
                  className="min-h-[38px] px-4 rounded-xl border border-cyan-400 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 mx-auto cursor-pointer shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all"
                >
                  <Camera className="w-4 h-4" />
                  <span>ATIVAR CÂMERA AO VIVO</span>
                </button>
              </div>
            )}

            {/* Overlay HUD Holográfico */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3">
              {/* Topo do HUD */}
              <div className="flex items-center justify-between text-[10px] font-mono font-bold tracking-wider text-cyan-400 uppercase">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>TSUNAMI FACIAL AI • V2.4</span>
                </span>
                <span>DATA: {dataSabado}</span>
              </div>

              {/* Mira Central */}
              <div className="relative flex-1 flex items-center justify-center">
                <div
                  className={`w-44 h-52 sm:w-52 sm:h-60 rounded-3xl border-2 transition-all duration-300 relative ${
                    escanenando
                      ? 'border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.6)] scale-105'
                      : ultimoReconhecido?.sucesso
                      ? 'border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.6)]'
                      : ultimoReconhecido && !ultimoReconhecido.sucesso
                      ? 'border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.6)]'
                      : 'border-cyan-400/80 shadow-[0_0_20px_rgba(0,229,255,0.3)]'
                  }`}
                >
                  {/* Cantos do Retículo */}
                  <span className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-cyan-300" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-cyan-300" />
                  <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-cyan-300" />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-cyan-300" />

                  {/* Linha de Scanner Animada */}
                  <div
                    className={`w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent absolute top-0 animate-[bounce_2s_infinite] ${
                      escanenando ? 'opacity-100' : 'opacity-40'
                    }`}
                  />

                  {/* Texto de Status no Centro da Mira */}
                  <div className="absolute inset-x-0 bottom-2 text-center">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded backdrop-blur-sm ${
                        escanenando
                          ? 'bg-amber-950/80 text-amber-300'
                          : ultimoReconhecido?.sucesso
                          ? 'bg-emerald-950/80 text-emerald-300'
                          : 'bg-black/60 text-cyan-300'
                      }`}
                    >
                      {escanenando ? 'ESCANEANDO FACE...' : 'POSICIONE O ROSTO'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rodapé do HUD */}
              <div className="flex items-center justify-between text-[9px] font-mono text-cyan-400/80 uppercase">
                <span>SEDE MACEIÓ — SEDE ARENA</span>
                <span>SÁBADOS: 4/5 CICLO</span>
              </div>
            </div>
          </div>

          {/* Botões de Ação do Visor */}
          {cameraAtiva && (
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={pararCamera}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-white text-xs font-bold uppercase cursor-pointer"
              >
                Desativar Câmera
              </button>
            </div>
          )}

          {cameraErro && <p className="mt-2 text-xs text-amber-300 text-center">{cameraErro}</p>}
        </div>

        {/* Lado Direito: Card de Última Leitura + Log da Sessão */}
        <div className="lg:col-span-5 space-y-3 flex flex-col">
          {/* Card de Destaque do Atleta Reconhecido */}
          <div
            className={`rounded-2xl border p-4 transition-all ${
              ultimoReconhecido?.sucesso
                ? 'border-emerald-500/80 bg-emerald-950/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                : ultimoReconhecido && !ultimoReconhecido.sucesso
                ? 'border-rose-500/80 bg-rose-950/20 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                : 'border-cyan-500/40 bg-[#020f26]'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                ÚLTIMA LEITURA FACIAL
              </span>
              {ultimoReconhecido?.sucesso ? (
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/50 text-[10px] font-bold text-emerald-300 uppercase flex items-center gap-1">
                  <Check className="w-3 h-3" /> IDENTIFICADO
                </span>
              ) : ultimoReconhecido ? (
                <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/50 text-[10px] font-bold text-rose-300 uppercase flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> BLOQUEADO
                </span>
              ) : (
                <span className="text-[10px] text-slate-400">Aguardando atleta...</span>
              )}
            </div>

            {ultimoReconhecido ? (
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl border border-cyan-400/50 bg-[#001726] flex items-center justify-center text-lg font-black text-white shrink-0">
                    {ultimoReconhecido.aluno.nome.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-sans font-bold uppercase text-white text-sm truncate">
                      {ultimoReconhecido.aluno.nome}
                    </p>
                    <p className="text-xs text-teal-400 font-sans">
                      {ultimoReconhecido.aluno.turmaCadastro || '04. QUEIMADA/VOLEIBOL'}
                    </p>
                    <p className="text-[10px] font-mono text-cyan-300">
                      Confiança: {ultimoReconhecido.confianca}% • {ultimoReconhecido.aluno.nivel}★
                    </p>
                  </div>
                </div>

                <div
                  className={`p-2.5 rounded-lg text-xs leading-relaxed ${
                    ultimoReconhecido.sucesso
                      ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-950/60 border border-rose-500/40 text-rose-200'
                  }`}
                >
                  {ultimoReconhecido.mensagem}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Nenhuma leitura facial realizada nesta sessão ainda.
              </div>
            )}
          </div>

          {/* Histórico das Leituras Recentes da Sessão */}
          <div className="rounded-2xl border border-slate-800 bg-[#010814] p-3.5 flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                HISTÓRICO DA SESSÃO ({historicoLeituras.length})
              </span>
              {historicoLeituras.length > 0 && (
                <button
                  type="button"
                  onClick={() => setHistoricoLeituras([])}
                  className="text-[10px] text-slate-500 hover:text-slate-300 uppercase cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>

            <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1 flex-1">
              {historicoLeituras.length === 0 ? (
                <p className="text-center py-6 text-[11px] text-slate-500">
                  Os atletas reconhecidos aparecerão aqui com hora e status.
                </p>
              ) : (
                historicoLeituras.map((log) => (
                  <div
                    key={log.id}
                    className="p-2 rounded-lg bg-[#040e21] border border-slate-800/80 flex items-center justify-between text-xs gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {log.sucesso ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <UserX className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      )}
                      <span className="font-bold uppercase text-white truncate text-[11px]">
                        {log.alunoNome}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-mono text-slate-400">
                      <span>{log.hora}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                          log.sucesso ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                        }`}
                      >
                        {log.sucesso ? 'P' : 'N/M'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Seção Inferior: Seleção Rápida de Atleta Cadastrado para Reconhecimento */}
      <div className="rounded-2xl border border-cyan-500/30 bg-[#020b18] p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h3 className="font-display font-bold text-sm sm:text-base uppercase tracking-wider text-cyan-300">
              ALUNOS CADASTRADOS PARA LEITURA FACIAL ({alunosFiltradosSimulacao.length})
            </h3>
            <p className="text-xs text-slate-400">
              Clique em <strong className="text-cyan-300">"ESCANEAR ROSTO"</strong> em qualquer atleta cadastrado para testar ou registrar a presença facial instantaneamente.
            </p>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              value={buscaSimulacao}
              onChange={(e) => setBuscaSimulacao(e.target.value)}
              placeholder="Buscar aluno cadastrado..."
              className="w-full h-[36px] rounded-xl border border-slate-700 bg-[#001726] px-3 text-xs text-white uppercase focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Grade dos Atletas em Ordem Alfabética */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
          {alunosFiltradosSimulacao.map((aluno) => {
            const matriculado = isMatriculado(aluno, dataSabado);
            const freqAtual = frequencias.find((f) => f.alunoId === aluno.id && f.data === dataSabado);
            const jaPresente = freqAtual?.status === 'presente' || freqAtual?.status === 'advertencia';

            return (
              <div
                key={aluno.id}
                className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                  jaPresente
                    ? 'border-emerald-500/50 bg-emerald-950/20'
                    : !matriculado
                    ? 'border-slate-800 bg-[#040c1c]/60 opacity-70'
                    : 'border-slate-800 bg-[#040e22] hover:border-cyan-500/40'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1.5">
                    <p className="font-sans font-bold uppercase text-white text-xs truncate">
                      {aluno.nome}
                    </p>
                    {jaPresente ? (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/30 border border-emerald-500/60 text-[9px] font-black text-emerald-300">
                        PRESENTE
                      </span>
                    ) : !matriculado ? (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[9px] font-bold text-slate-400">
                        N/M
                      </span>
                    ) : null}
                  </div>

                  <p className="text-[10px] text-teal-400/80 font-sans truncate mt-0.5">
                    {aluno.turmaCadastro || '04. QUEIMADA/VOLEIBOL'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => processarReconhecimento(aluno)}
                  className={`w-full min-h-[32px] px-2.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    jaPresente
                      ? 'border-emerald-500/60 bg-emerald-900/40 text-emerald-300 hover:bg-emerald-800/50'
                      : !matriculado
                      ? 'border-slate-700 bg-slate-800 text-slate-400 hover:border-rose-500/50 hover:text-rose-300'
                      : 'border-cyan-500/60 bg-[#001f33] hover:bg-cyan-900/50 text-cyan-300 hover:text-white shadow-sm'
                  }`}
                >
                  <Scan className="w-3 h-3" />
                  <span>{jaPresente ? 'REVALIDAR ROSTO' : 'ESCANEAR ROSTO'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
