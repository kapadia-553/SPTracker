import { Component, OnInit } from '@angular/core';
import { TicketService } from '../../services/ticket.service';

interface DashboardStats {
  totalTickets: number;
  myOpenTickets: number;
  unassignedTickets: number;
  breachingSoon: number;
  resolvedToday: number;
}

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="space-y-6">
      <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
          <h1 class="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p class="mt-2 text-sm text-gray-700">
            Overview of your tickets and team performance
          </p>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Total Tickets</dt>
                  <dd class="text-lg font-medium text-gray-900">{{ stats.totalTickets }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">My Open Tickets</dt>
                  <dd class="text-lg font-medium text-gray-900">{{ stats.myOpenTickets }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Unassigned</dt>
                  <dd class="text-lg font-medium text-gray-900">{{ stats.unassignedTickets }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.884-.833-2.598 0L5.732 12.5C4.962 14.833 5.924 16.5 7.464 16.5z" />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Breaching Soon</dt>
                  <dd class="text-lg font-medium text-gray-900">{{ stats.breachingSoon }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Resolved Today</dt>
                  <dd class="text-lg font-medium text-gray-900">{{ stats.resolvedToday }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Tickets -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Tickets</h3>
          
          <div class="flow-root">
            <ul class="-mb-8">
              <li *ngFor="let ticket of recentTickets; let i = index">
                <div class="relative pb-8" [class.pb-0]="i === recentTickets.length - 1">
                  <div class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" 
                       [class.hidden]="i === recentTickets.length - 1" 
                       aria-hidden="true"></div>
                  <div class="relative flex space-x-3">
                    <div>
                      <span [ngClass]="getTicketStatusColor(ticket.status)" 
                            class="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white">
                        <svg class="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                      </span>
                    </div>
                    <div class="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p class="text-sm text-gray-500">
                          <a [routerLink]="['/tickets', ticket.key]" class="font-medium text-gray-900 hover:text-primary-600">
                            {{ ticket.key }}
                          </a>
                          - {{ ticket.title }}
                        </p>
                        <p class="text-xs text-gray-400">Priority: {{ ticket.priority }} | Status: {{ ticket.status }}</p>
                      </div>
                      <div class="text-right text-sm whitespace-nowrap text-gray-500">
                        {{ ticket.updatedAt | date:'short' }}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats = {
    totalTickets: 0,
    myOpenTickets: 0,
    unassignedTickets: 0,
    breachingSoon: 0,
    resolvedToday: 0
  };

  recentTickets: any[] = [];

  constructor(private ticketService: TicketService) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  async loadDashboardData() {
    try {
      // Load dashboard stats
      const response = await this.ticketService.getTickets({ page: 1, pageSize: 10 });
      this.recentTickets = response.data;
      
      // Mock stats for demo
      this.stats = {
        totalTickets: response.totalCount,
        myOpenTickets: 15,
        unassignedTickets: 7,
        breachingSoon: 3,
        resolvedToday: 12
      };
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  }

  getTicketStatusColor(status: string): string {
    switch (status) {
      case 'New':
        return 'bg-blue-500';
      case 'InProgress':
        return 'bg-yellow-500';
      case 'Resolved':
        return 'bg-green-500';
      case 'Closed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  }
}