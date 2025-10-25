import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private apiUrl = `${environment.apiUrl}/tickets`;

  constructor(private http: HttpClient) {}

  async getTickets(filters?: any): Promise<any> {
    let params = new HttpParams();

    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.priority) params = params.set('priority', filters.priority);
      if (filters.severity) params = params.set('severity', filters.severity);
      if (filters.assigneeId) params = params.set('assigneeId', filters.assigneeId);
      if (filters.reporterId) params = params.set('reporterId', filters.reporterId);
      if (filters.projectId) params = params.set('projectId', filters.projectId);
      if (filters.categoryId) params = params.set('categoryId', filters.categoryId);
      if (filters.search && filters.search.trim()) params = params.set('q', filters.search.trim());
      if (filters.filterType) params = params.set('filterType', filters.filterType);
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.pageSize) params = params.set('pageSize', filters.pageSize.toString());
      if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
    }

    const response = await this.http.get<any>(this.apiUrl, { params }).toPromise();
    return response || { data: [], totalCount: 0 };
  }

  async getTicket(key: string): Promise<any> {
    const response = await this.http.get<any>(`${this.apiUrl}/${key}`).toPromise();
    return response;
  }

  async updateTicket(key: string, data: any): Promise<any> {
    const response = await this.http.put<any>(`${this.apiUrl}/${key}`, data).toPromise();
    return response;
  }

  async addComment(ticketKey: string, body: string, isInternal: boolean = false): Promise<void> {
    await this.http.post(`${this.apiUrl}/${ticketKey}/comments`, {
      body,
      isInternal
    }).toPromise();
  }

  async addWorklog(ticketKey: string, worklog: any): Promise<void> {
    await this.http.post(`${this.apiUrl}/${ticketKey}/worklogs`, worklog).toPromise();
  }

  async getUsers(): Promise<any[]> {
    const response = await this.http.get<any[]>(`${environment.apiUrl}/users`).toPromise();
    return response || [];
  }

  async createTicket(ticket: any): Promise<any> {
    const response = await this.http.post<any>(this.apiUrl, ticket).toPromise();
    return response!;
  }

  async uploadAttachment(ticketKey: string, formData: FormData): Promise<void> {
    await this.http.post(`${this.apiUrl}/${ticketKey}/attachments`, formData).toPromise();
  }

  async getProjects(): Promise<any[]> {
    const response = await this.http.get<any[]>(`${environment.apiUrl}/admin/projects`).toPromise();
    return response || [];
  }

  async getCategories(): Promise<any[]> {
    const response = await this.http.get<any[]>(`${environment.apiUrl}/data/categories`).toPromise();
    return response || [];
  }

  async getProducts(): Promise<any[]> {
    const response = await this.http.get<any[]>(`${environment.apiUrl}/data/products`).toPromise();
    return response || [];
  }
}