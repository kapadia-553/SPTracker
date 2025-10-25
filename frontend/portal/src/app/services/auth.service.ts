import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'sp-track-token';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const token = localStorage.getItem(this.tokenKey);
    if (token) {
      this.setCurrentUser(this.decodeToken(token));
    }
  }

  async requestMagicLink(email: string, tenantSlug: string): Promise<void> {
    const response = await this.http.post(`${this.apiUrl}/auth/magic-link`, {
      email,
      tenantSlug
    }).toPromise();
    return response as void;
  }

  async requestInternalMagicLink(email: string): Promise<void> {
    const response = await this.http.post(`${this.apiUrl}/auth/internal-magic-link`, {
      email
    }).toPromise();
    return response as void;
  }

  async consumeMagicLink(token: string): Promise<void> {
    const response = await this.http.get<{ token: string }>(`${this.apiUrl}/auth/magic-link/consume?token=${token}`).toPromise();
    
    if (response?.token) {
      localStorage.setItem(this.tokenKey, response.token);
      this.setCurrentUser(this.decodeToken(response.token));
    }
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.tokenKey);
    if (!token) return false;

    try {
      const decoded = this.decodeToken(token);
      return decoded.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private setCurrentUser(user: any): void {
    this.currentUserSubject.next(user);
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  getUserRole(): string | null {
    const user = this.getCurrentUser();
    return user?.role || null;
  }

  isCustomer(): boolean {
    return this.getUserRole() === 'CustomerUser';
  }

  isAgent(): boolean {
    return this.getUserRole() === 'Agent';
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'Admin' || this.getUserRole() === 'TeamLead';
  }

  isInternal(): boolean {
    const user = this.getCurrentUser();
    // Check multiple possible claim formats and fallback to role-based detection
    return user?.isInternal === true ||
           user?.is_internal === true ||
           user?.is_internal === "true" ||
           this.isAgent() ||
           this.isAdmin();
  }

  canAssignTickets(): boolean {
    return this.isAdmin() || this.isAgent();
  }

  canViewAllTickets(): boolean {
    return this.isAdmin();
  }

  private decodeToken(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }
}