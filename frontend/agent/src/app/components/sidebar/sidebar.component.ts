import { Component } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, RouterLinkActive],
  template: `
    <nav class="fixed left-0 top-0 h-screen w-64 bg-white shadow-lg border-r border-gray-200 z-30 
                sm:relative sm:h-auto sm:min-h-screen lg:sticky lg:top-0 lg:h-screen
                transform transition-transform duration-300 ease-in-out
                -translate-x-full sm:translate-x-0"
         [class.translate-x-0]="isOpen">
      <div class="flex flex-col h-full">
        <!-- Logo/Brand with mobile menu toggle -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div class="flex items-center">
            <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-sm">SP</span>
            </div>
            <span class="ml-2 text-lg font-semibold text-gray-900">SP Track</span>
          </div>
          
          <!-- Mobile menu close button -->
          <button type="button" 
                  (click)="toggleSidebar()"
                  class="sm:hidden p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Navigation Menu with scroll -->
        <div class="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <div class="px-3 py-4 space-y-1">
            <div *ngFor="let item of items" class="group">
              <!-- Single link -->
              <a *ngIf="!item.children"
                 [routerLink]="item.link"
                 routerLinkActive="active"
                 [routerLinkActiveOptions]="{ exact: item.exact || false }"
                 (click)="onLinkClick()"
                 class="sidebar-nav-item group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 hover:bg-gray-50 hover:text-gray-900">
                <span class="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 flex-shrink-0" [innerHTML]="item.icon"></span>
                <span class="truncate">{{ item.label }}</span>
              </a>

              <!-- Parent with children -->
              <div *ngIf="item.children" class="space-y-1">
                <button type="button" 
                        (click)="item.open = !item.open"
                        class="sidebar-nav-item group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 hover:bg-gray-50 hover:text-gray-900">
                  <span class="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 flex-shrink-0" [innerHTML]="item.icon"></span>
                  <span class="flex-1 text-left truncate">{{ item.label }}</span>
                  <svg class="ml-2 h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0" 
                       [class.rotate-90]="item.open" 
                       fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                <div *ngIf="item.open" class="ml-8 space-y-1 animate-fadeIn">
                  <a *ngFor="let child of item.children" 
                     [routerLink]="child.link" 
                     routerLinkActive="active"
                     (click)="onLinkClick()"
                     class="block px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200 truncate">
                    {{ child.label }}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer/Version info -->
        <div class="px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <div class="text-xs text-gray-500">
            <div>SP Track Agent</div>
            <div>v1.0.0</div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Mobile overlay -->
    <div *ngIf="isOpen" 
         class="fixed inset-0 bg-gray-600 bg-opacity-50 z-20 sm:hidden"
         (click)="closeSidebar()">
    </div>

    <!-- Mobile menu toggle button -->
    <button type="button"
            (click)="toggleSidebar()"
            class="fixed top-4 left-4 z-40 p-2 rounded-md bg-white shadow-lg border border-gray-200 sm:hidden
                   text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  `
})
export class SidebarComponent {
  isOpen = false;

  items = [
    { 
      label: 'Dashboard', 
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5v4"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v4"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 5v4"></path></svg>', 
      link: '/dashboard', 
      exact: true 
    },
    {
      label: 'Tickets', 
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>', 
      open: false, 
      children: [
        { label: 'All Tickets', link: '/tickets' },
        { label: 'My Tickets', link: '/tickets/my' },
        { label: 'Unassigned', link: '/tickets/unassigned' },
        { label: 'Overdue', link: '/tickets/overdue' }
      ]
    },
    {
      label: 'Administration', 
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>', 
      open: false, 
      children: [
        { label: 'Overview', link: '/admin' },
        { label: 'Organizations', link: '/admin/tenants' },
        { label: 'Users', link: '/admin/users' },
        { label: 'Projects', link: '/admin/projects' },
        { label: 'Categories', link: '/admin/categories' },
        { label: 'Products', link: '/admin/products' }
      ]
    },
    {
      label: 'Reports & Analytics', 
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>', 
      open: false, 
      children: [
        { label: 'Overview', link: '/reports' },
        { label: 'Ticket Analytics', link: '/reports/tickets' },
        { label: 'Agent Performance', link: '/reports/agents' },
        { label: 'SLA Reports', link: '/reports/sla' },
        { label: 'Customer Satisfaction', link: '/reports/csat' }
      ]
    },
    { 
      label: 'Knowledge Base', 
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>', 
      link: '/knowledge-base' 
    },
    { 
      label: 'Settings', 
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path></svg>', 
      link: '/settings' 
    }
  ];

  toggleSidebar() {
    this.isOpen = !this.isOpen;
  }

  closeSidebar() {
    this.isOpen = false;
  }

  onLinkClick() {
    // Close sidebar on mobile when link is clicked
    if (window.innerWidth < 640) {
      this.isOpen = false;
    }
  }
}
