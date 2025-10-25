import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  constructor(private authService: AuthService) {}
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Check localStorage directly for debugging
    const tokenFromStorage = localStorage.getItem('sp-track-agent-token');
    console.log('🔍 Direct localStorage check:', {
      key: 'sp-track-agent-token',
      hasValue: !!tokenFromStorage,
      value: tokenFromStorage ? tokenFromStorage.substring(0, 30) + '...' : 'null'
    });

    // Get the auth token from the service
    const authToken = this.authService.getToken();

    console.log('🔐 Auth Interceptor:', {
      url: req.url,
      hasToken: !!authToken,
      tokenFromService: authToken ? authToken.substring(0, 30) + '...' : 'none',
      tokenFromStorage: tokenFromStorage ? tokenFromStorage.substring(0, 30) + '...' : 'none',
      match: authToken === tokenFromStorage
    });

    // If we have a token, add it to the Authorization header
    if (authToken) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${authToken}`)
      });
      console.log('✅ Added Authorization header to request');
      return next.handle(authReq);
    }

    // If no token, proceed with the original request
    console.log('❌ No token found, proceeding without auth');
    return next.handle(req);
  }
}