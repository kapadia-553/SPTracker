import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-layout',
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Navigation -->
      <nav class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <h1 class="text-xl font-bold text-primary-600">SP Track</h1>
              </div>
              <div class="hidden sm:ml-8 sm:flex sm:space-x-8">
                <!-- Customer Navigation -->
                <ng-container *ngIf="authService.isCustomer()">
                  <a routerLink="/tickets" routerLinkActive="border-primary-500 text-gray-900"
                     class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    My Tickets
                  </a>
                  <a routerLink="/tickets/new" routerLinkActive="border-primary-500 text-gray-900"
                     class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Create Ticket
                  </a>
                </ng-container>

                <!-- Internal User Navigation -->
                <ng-container *ngIf="authService.isInternal()">
                  <a routerLink="/tickets" routerLinkActive="border-primary-500 text-gray-900"
                     class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Tickets
                  </a>
                  <a routerLink="/tickets/new" routerLinkActive="border-primary-500 text-gray-900"
                     class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Create Ticket
                  </a>
                  <a *ngIf="authService.isAdmin()" routerLink="/users" routerLinkActive="border-primary-500 text-gray-900"
                     class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Users
                  </a>
                  <a *ngIf="authService.isAdmin()" routerLink="/reports" routerLinkActive="border-primary-500 text-gray-900"
                     class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Reports
                  </a>
                </ng-container>
              </div>
            </div>
            
            <div class="flex items-center space-x-4">
              <div class="text-sm text-gray-500" *ngIf="currentUser$ | async as user">
                <div class="text-right">
                  <div class="font-medium text-gray-900">{{ user.name }}</div>
                  <div class="text-xs">
                    {{ user.email }} • 
                    <span [ngClass]="getRoleBadgeClass()">{{ getRoleDisplayName() }}</span>
                  </div>
                </div>
              </div>
              <button
                (click)="logout()"
                class="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md hover:bg-gray-100">
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <!-- Main content -->
      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class LayoutComponent {
  currentUser$ = this.authService.currentUser$;

  constructor(public authService: AuthService) {}

  logout() {
    this.authService.logout();
  }

  getRoleDisplayName(): string {
    if (this.authService.isAdmin()) {
      return 'Admin';
    } else if (this.authService.isAgent()) {
      return 'Agent';
    } else if (this.authService.isCustomer()) {
      return 'Customer';
    }
    return 'User';
  }

  getRoleBadgeClass(): string {
    if (this.authService.isAdmin()) {
      return 'text-purple-600 font-medium';
    } else if (this.authService.isAgent()) {
      return 'text-blue-600 font-medium';
    } else if (this.authService.isCustomer()) {
      return 'text-green-600 font-medium';
    }
    return 'text-gray-600';
  }
}