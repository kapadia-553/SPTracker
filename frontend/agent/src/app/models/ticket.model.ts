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
  source: TicketSource;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  comments: Comment[];
  attachments: Attachment[];
  worklogs?: Worklog[];
  slaTarget?: SlaTarget; // Add this
}

export interface SlaTarget {
  id: string;
  policyName: string;
  firstResponseDueAt?: Date;
  resolveDueAt?: Date;
  firstResponseMet: boolean;
  resolveMet: boolean;
  isPaused: boolean;
  isFirstResponseBreached: boolean;
  isResolveBreached: boolean;
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
  avStatus: string;
  uploadedByName: string;
  createdAt: Date;
  downloadUrl?: string;
}

export interface Worklog {
  id: string;
  minutes: number;
  activityType: string;
  billable: boolean;
  notes: string;
  userName: string;
  createdAt: Date;
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