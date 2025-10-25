export interface Ticket {
  id: string;
  key: string;
  title: string;
  description: string;
  priority: Priority;
  status: TicketStatus;
  severity: Severity;
  categoryName?: string;
  productName?: string;
  reporterName: string;
  reporterEmail: string;
  assigneeName?: string;
  assigneeEmail?: string;
  assigneeId?: string;
  source: TicketSource;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  slaTarget?: SlaTarget;
  comments: Comment[];
  attachments: Attachment[];
}

export interface Comment {
  id: string;
  body: string;
  isInternal: boolean;
  authorName: string;
  authorEmail: string;
  createdAt: Date;
  attachments: Attachment[];
}

export interface Attachment {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  avStatus: AVStatus;
  uploadedByName: string;
  createdAt: Date;
  downloadUrl?: string;
}

export interface SlaTarget {
  id: string;
  policyName: string;
  firstResponseDueAt?: Date;
  resolveDueAt?: Date;
  firstResponseMet: boolean;
  resolveMet: boolean;
  isPaused: boolean;
  firstResponseTimeRemaining?: string;
  resolveTimeRemaining?: string;
  isFirstResponseBreached: boolean;
  isResolveBreached: boolean;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  priority: Priority;
  severity: Severity;
  projectId: string;
  categoryId?: string;
  productId?: string;
  assigneeId?: string;
  customFields?: { [key: string]: string };
}

export interface TicketFilters {
  status?: string;
  priority?: string;
  assigneeId?: string;
  reporterId?: string;
  projectId?: string;
  categoryId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface TicketListResponse {
  data: Ticket[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export enum Priority {
  P1 = 'P1',
  P2 = 'P2',
  P3 = 'P3',
  P4 = 'P4'
}

export enum TicketStatus {
  New = 'New',
  Triaged = 'Triaged',
  InProgress = 'InProgress',
  WaitingCustomer = 'WaitingCustomer',
  Resolved = 'Resolved',
  Closed = 'Closed',
  Cancelled = 'Cancelled'
}

export enum Severity {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical'
}

export enum TicketSource {
  Web = 'Web',
  Email = 'Email'
}

export enum AVStatus {
  Pending = 'Pending',
  Clean = 'Clean',
  Infected = 'Infected',
  Error = 'Error'
}