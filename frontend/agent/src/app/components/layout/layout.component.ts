import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-layout',
  template: `
    <div class="min-h-screen bg-gray-50">
      <div class="flex">
        <!-- Sidebar -->
        <app-sidebar class="w-64 sm:block"></app-sidebar>
        
        <!-- Main content -->
        <div class="flex-1 min-w-0">
          <!-- Top bar -->
          <header class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
            <div class="px-4 sm:px-6 py-4 flex items-center justify-between">
              <div class="flex items-center">
                <!-- Mobile spacing for hamburger button -->
                <div class="w-10 sm:w-0"></div>
                <h1 class="text-lg sm:text-xl font-semibold text-gray-900 truncate">SP Track Agent</h1>
              </div>
              
              <div class="flex items-center space-x-2 sm:space-x-4">
                <span class="hidden sm:block text-sm text-gray-500" *ngIf="currentUser$ | async as user">
                  {{ user.name }} ({{ user.email }})
                </span>
                <span class="sm:hidden text-xs text-gray-500" *ngIf="currentUser$ | async as user">
                  {{ user.name }}
                </span>
                <button
                  (click)="logout()"
                  class="text-xs sm:text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100">
                  Sign out
                </button>
              </div>
            </div>
          </header>
          
          <!-- Page content -->
          <main class="flex-1 p-4 sm:p-6">
            <router-outlet></router-outlet>
          </main>
        </div>
      </div>
    </div>
  `
})
export class LayoutComponent {
  currentUser$ = this.authService.currentUser$;

  constructor(private authService: AuthService) {}

  logout() {
    this.authService.logout();
  }
}