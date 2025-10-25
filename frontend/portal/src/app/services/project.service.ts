import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  async getProjects(): Promise<any[]> {
    const response = await this.http.get<any[]>(`${this.apiUrl}/admin/projects`).toPromise();
    return response || [];
  }

  async getCategories(): Promise<any[]> {
    const response = await this.http.get<any[]>(`${this.apiUrl}/data/categories`).toPromise();
    return response || [];
  }

  async getProducts(): Promise<any[]> {
    const response = await this.http.get<any[]>(`${this.apiUrl}/data/products`).toPromise();
    return response || [];
  }

  async getUsers(): Promise<any[]> {
    const response = await this.http.get<any[]>(`${this.apiUrl}/data/users`).toPromise();
    return response || [];
  }
}