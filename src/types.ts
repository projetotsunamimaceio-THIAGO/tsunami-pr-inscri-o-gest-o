export type ModalidadeEsporte = 'Voleibol' | 'Futvôlei' | 'Vôlei de Praia' | 'Funcional' | 'Futsal' | 'Basquete';

export interface Aluno {
  id: string;
  nome: string;
  idade?: number;
  telefone: string;
  nivel: 1 | 2 | 3 | 4 | 5;
  senha: string;
  turmaCadastro: string; // Turma base de matrícula no projeto
  inicioMatricula: string; // YYYY-MM-DD
  fimMatricula: string; // YYYY-MM-DD
  liberadoInscricao: boolean;
  autorizadoJustificar: boolean;
}

export interface Turma {
  id: string;
  nome: string;
  modalidade: ModalidadeEsporte;
  dia: string;
  diasTreino?: string[];
  horario: string;
  horarioInicio?: string;
  horarioTermino?: string;
  vagasTotais: number;
  aberta: boolean;
  inscritosIds: string[];
  periodoMatricula?: string;
}

export interface EventoProgramacao {
  id: string;
  titulo: string;
  dia: string;
  horario: string;
  tipo: 'Célula' | 'Treino' | 'Amistoso' | 'Evento';
  obrigatorio: boolean;
  descricao: string;
}

export type StatusFrequencia = 'presente' | 'falta' | 'justificado' | 'advertencia';

export interface RegistroFrequencia {
  id: string;
  data: string; // YYYY-MM-DD
  turmaId: string; // 'celula' ou id da turma
  turmaNome: string;
  alunoId: string;
  status: StatusFrequencia;
}

export interface JustificativaSabado {
  id: string;
  alunoId: string;
  alunoNome: string;
  dataSabado: string;
  motivo: string;
  criadoEm: string;
  status: 'pendente' | 'aceita';
}

export interface TimeEquilibrado {
  nome: string;
  atletas: Aluno[];
  somaEstrelas: number;
  mediaEstrelas: number;
}
