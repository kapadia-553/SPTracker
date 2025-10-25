import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  async getIssuesReport(filters: any): Promise<any[]> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params = params.set(key, filters[key]);
      }
    });

    const response = await this.http.get<any[]>(`${this.apiUrl}/issues`, { params }).toPromise();
    return response || [];
  }

  async exportIssuesReport(filters: any, format: 'csv' | 'json'): Promise<Blob> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params = params.set(key, filters[key]);
      }
    });
    
    params = params.set('format', format);

    const response = await this.http.get(`${this.apiUrl}/issues/export`, {
      params,
      responseType: 'blob'
    }).toPromise();
    
    return response!;
  }
}