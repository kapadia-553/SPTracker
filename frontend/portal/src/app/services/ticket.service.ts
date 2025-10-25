import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Ticket, CreateTicketRequest, TicketFilters, TicketListResponse } from '../models/ticket.model';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private apiUrl = `${environment.apiUrl}/tickets`;

  constructor(private http: HttpClient) {}

  async getTickets(filters: any): Promise<TicketListResponse> {
    let params = new HttpParams();

    if (filters.filterType) params = params.set('filterType', filters.filterType);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.priority) params = params.set('priority', filters.priority);
    if (filters.assigneeId) params = params.set('assigneeId', filters.assigneeId);
    if (filters.reporterId) params = params.set('reporterId', filters.reporterId);
    if (filters.projectId) params = params.set('projectId', filters.projectId);
    if (filters.categoryId) params = params.set('categoryId', filters.categoryId);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom.toISOString());
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo.toISOString());
    if (filters.q) params = params.set('q', filters.q);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.pageSize) params = params.set('pageSize', filters.pageSize.toString());

    const response = await this.http.get<TicketListResponse>(this.apiUrl, { params }).toPromise();
    return response!;
  }

  async getTicket(key: string): Promise<Ticket> {
    console.log('TicketService.getTicket called with key:', key);
    try {
      const response = await this.http.get<Ticket>(`${this.apiUrl}/${key}`).toPromise();
      console.log('TicketService.getTicket response:', response);
      return response!;
    } catch (error) {
      console.error('TicketService.getTicket error:', error);
      throw error;
    }
  }

  async createTicket(ticket: CreateTicketRequest): Promise<Ticket> {
    const response = await this.http.post<Ticket>(this.apiUrl, ticket).toPromise();
    return response!;
  }

  async addComment(ticketKey: string, body: string, isInternal: boolean = false): Promise<void> {
    await this.http.post(`${this.apiUrl}/${ticketKey}/comments`, {
      body,
      isInternal
    }).toPromise();
  }

  async updateTicket(ticketKey: string, updateData: any): Promise<Ticket> {
    const response = await this.http.put<Ticket>(`${this.apiUrl}/${ticketKey}`, updateData).toPromise();
    return response!;
  }

  // Add the missing uploadAttachment method
  async uploadAttachment(ticketKey: string, formData: FormData): Promise<void> {
    await this.http.post(`${this.apiUrl}/${ticketKey}/attachments`, formData).toPromise();
  }
}