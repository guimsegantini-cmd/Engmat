
export enum TaskStatus {
  OPEN = 'Aberta',
  COMPLETED = 'Concluída',
  DELAYED = 'Atrasada'
}

export enum TaskType {
  CALL = 'Ligação',
  VISIT = 'Visita',
  FOLLOW_UP = 'Follow-up',
  PROPOSAL = 'Envio de Proposta',
  BILLING = 'Cobrança'
}

export enum Priority {
  HIGH = 'Alta',
  MEDIUM = 'Média',
  LOW = 'Baixa'
}

export interface Contact {
  name: string;
  phone: string;
  email: string;
}

export interface HistoryEntry {
  status: string;
  date: string;
  user: string;
}

export interface Task {
  id: string;
  title: string;
  date: string;
  time: string;
  type: TaskType;
  status: TaskStatus;
  priority: Priority;
  cardId: string;
  cardName: string;
  construtoraName: string;
  representada: string;
  googleEventId?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  clientName: string;
  obraName: string;
  billingCnpj?: string;
  value: number;
  status: string;
  date: string;
  expectedBillingDate?: string;
  representada: string;
  suggestedRepresentadas: string[];
  history: HistoryEntry[];
  contacts: Contact[];
  cep?: string;
  address?: string;
  streetNumber?: string;
  complement?: string;
}

export interface Prospect {
  id: string;
  construtora: string;
  obra: string;
  tier: 'Gold' | 'Silver' | 'Bronze';
  stage: string;
  contacts: Contact[];
  probability?: number;
  competitor?: string;
  cep?: string;
  address?: string;
  streetNumber?: string;
  complement?: string;
  notes?: string;
  attachments?: string[];
  createdAt: string;
  history: HistoryEntry[];
}

export interface AppConfig {
  prospectStages: string[];
  orderStages: string[];
  representadas: string[];
  representadaAttachments: { [key: string]: string };
  automationMessages: {
    [key: string]: string;
  };
  trackingMessage: string;
  googleCalendarConnected?: boolean;
}

export type PeriodFilter = 'Hoje' | 'Esta Semana' | 'Este Mês' | 'Este Ano' | 'Personalizado' | 'Todas';

export interface DateRange {
  start: string;
  end: string;
}
