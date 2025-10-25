import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  private skipAuthUrls = [
    '/api/admin/users',
    '/api/admin/tenants',
    '/api/admin/test'
  ];
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // For now, skip authentication for ALL admin requests
    if (req.url.includes('/admin/')) {
      console.log('Skipping auth for:', req.url);
      return next.handle(req);
    }
    
    const token = localStorage.getItem('sp-track-token') || localStorage.getItem('sp-track-agent-token');
    
    if (token) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next.handle(authReq);
    }
    
    return next.handle(req);
  }
}