import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'sp-track-agent-token';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const token = localStorage.getItem(this.tokenKey);
    if (token) {
      this.setCurrentUser(this.decodeToken(token));
    }
  }

  async login(email: string, password: string): Promise<void> {
    const response = await this.http.post<{ token: string }>(`${this.apiUrl}/auth/login`, {
      email,
      password
    }).toPromise();

    if (response?.token) {
      localStorage.setItem(this.tokenKey, response.token);
      this.setCurrentUser(this.decodeToken(response.token));
    }
  }

  async requestInternalMagicLink(email: string): Promise<void> {
    const response = await this.http.post(`${this.apiUrl}/auth/internal-magic-link`, {
      email
    }).toPromise();
    return response as void;
  }

  async consumeMagicLink(token: string): Promise<void> {
    console.log('🔗 Consuming magic link token:', token.substring(0, 20) + '...');
    try {
      const response = await this.http.get<{ token: string }>(`${this.apiUrl}/auth/magic-link/consume?token=${token}`).toPromise();

      console.log('📬 Magic link response:', response);

      if (response?.token) {
        console.log('💾 Storing JWT token in localStorage');
        localStorage.setItem(this.tokenKey, response.token);
        const decoded = this.decodeToken(response.token);
        console.log('👤 Decoded user:', decoded);
        this.setCurrentUser(decoded);
        console.log('✅ Magic link consumed successfully');
      } else {
        console.error('❌ No token in response:', response);
        throw new Error('No token received from server');
      }
    } catch (error) {
      console.error('❌ Error consuming magic link:', error);
      throw error;
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
    // Handle both singular 'role' and array 'roles' from JWT
    if (user?.roles && Array.isArray(user.roles) && user.roles.length > 0) {
      return user.roles[0];
    }
    return user?.role || null;
  }

  getUserRoles(): string[] {
    const user = this.getCurrentUser();
    // Handle both singular 'role' and array 'roles' from JWT
    if (user?.roles && Array.isArray(user.roles)) {
      return user.roles;
    }
    return user?.role ? [user.role] : [];
  }

  isCustomer(): boolean {
    const roles = this.getUserRoles();
    return roles.includes('CustomerUser');
  }

  isAgent(): boolean {
    const roles = this.getUserRoles();
    return roles.includes('Agent');
  }

  isAdmin(): boolean {
    const roles = this.getUserRoles();
    return roles.includes('Admin') || roles.includes('TeamLead');
  }

  isInternal(): boolean {
    const user = this.getCurrentUser();
    return user?.isInternal === true || this.isAgent() || this.isAdmin();
  }

  private decodeToken(token: string): any {
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));

      // Normalize 'role' to 'roles' array for consistent handling
      if (decoded.role) {
        // If role is a string, convert to array
        if (typeof decoded.role === 'string') {
          decoded.roles = [decoded.role];
        }
        // If role is already an array, use it
        else if (Array.isArray(decoded.role)) {
          decoded.roles = decoded.role;
        }
      }

      return decoded;
    } catch {
      return null;
    }
  }
}