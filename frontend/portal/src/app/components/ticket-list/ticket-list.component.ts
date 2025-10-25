import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TicketService } from '../../services/ticket.service';
import { AuthService } from '../../services/auth.service';
import { Ticket, TicketStatus, Priority } from '../../models/ticket.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-ticket-list',
  template: `
    <div class="px-4 sm:px-6 lg:px-8">
      <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
          <h1 class="text-xl font-semibold text-gray-900">{{ getPageTitle() }}</h1>
          <p class="mt-2 text-sm text-gray-700">
            {{ getPageDescription() }}
          </p>
        </div>
        <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            (click)="router.navigate(['/tickets/new'])"
            class="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto">
            Create Ticket
          </button>
        </div>
      </div>

      <!-- Tabs for Internal Users -->
      <div *ngIf="authService.isInternal()" class="mt-6">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex space-x-8">
            <!-- Only show All Tickets tab for admins who can view all tickets -->
            <button *ngIf="authService.canViewAllTickets()"
              (click)="switchTab('all')"
              [class]="currentTab === 'all' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
              class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
              All Tickets
            </button>
            <button *ngIf="authService.isAgent() || authService.isAdmin()"
              (click)="switchTab('my')"
              [class]="currentTab === 'my' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
              class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
              My Tickets
            </button>
            <button *ngIf="authService.isAdmin()"
              (click)="switchTab('unassigned')"
              [class]="currentTab === 'unassigned' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
              class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
              Unassigned
            </button>
          </nav>
        </div>
      </div>

      <!-- Filters -->
      <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label for="status" class="block text-sm font-medium text-gray-700">Status</label>
          <select
            id="status"
            [(ngModel)]="filters.status"
            (change)="applyFilters()"
            class="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm">
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Triaged">Triaged</option>
            <option value="InProgress">In Progress</option>
            <option value="WaitingCustomer">Waiting on Customer</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
        <div>
          <label for="priority" class="block text-sm font-medium text-gray-700">Priority</label>
          <select
            id="priority"
            [(ngModel)]="filters.priority"
            (change)="applyFilters()"
            class="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm">
            <option value="">All Priorities</option>
            <option value="P1">P1 - Critical</option>
            <option value="P2">P2 - High</option>
            <option value="P3">P3 - Normal</option>
            <option value="P4">P4 - Low</option>
          </select>
        </div>
        <div>
          <label for="search" class="block text-sm font-medium text-gray-700">Search</label>
          <input
            type="text"
            id="search"
            [(ngModel)]="filters.search"
            (keyup.enter)="applyFilters()"
            placeholder="Search tickets..."
            class="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm">
        </div>
      </div>

      <!-- Tickets Table -->
      <div class="mt-8 flex flex-col">
        <div class="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table class="min-w-full divide-y divide-gray-300">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Ticket
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Priority
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th *ngIf="authService.isInternal()" scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Assigned To
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Created
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Last Update
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr *ngIf="tickets.length === 0">
                    <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                      No tickets found. Total tickets loaded: {{ tickets.length }}
                    </td>
                  </tr>
                  <tr *ngFor="let ticket of tickets" class="hover:bg-gray-50 cursor-pointer"
                      (click)="viewTicket(ticket.key)"
                      title="Click to view ticket: {{ ticket.key || 'NO KEY' }}"
                  >
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div class="text-sm font-medium text-gray-900">
                          <button type="button" (click)="$event.stopPropagation(); viewTicket(ticket.key)"
                                  class="text-primary-600 hover:text-primary-500 underline bg-transparent border-0 p-0 cursor-pointer">
                            {{ ticket.key }}
                          </button>
                        </div>
                        <div class="text-sm text-gray-500">{{ ticket.title }}</div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span [ngClass]="getPriorityClass(ticket.priority)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                        {{ ticket.priority }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span [ngClass]="getStatusClass(ticket.status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                        {{ getStatusLabel(ticket.status) }}
                      </span>
                    </td>
                    <td *ngIf="authService.isInternal()" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ ticket.assigneeId ? getUserName(ticket.assigneeId) : 'Unassigned' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ ticket.createdAt | date:'short' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ ticket.updatedAt | date:'short' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="mt-6 flex items-center justify-between" *ngIf="totalPages > 1">
        <div class="flex-1 flex justify-between sm:hidden">
          <button
            (click)="previousPage()"
            [disabled]="currentPage === 1"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            Previous
          </button>
          <button
            (click)="nextPage()"
            [disabled]="currentPage === totalPages"
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            Next
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              Showing
              <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span>
              to
              <span class="font-medium">{{ Math.min(currentPage * pageSize, totalCount) }}</span>
              of
              <span class="font-medium">{{ totalCount }}</span>
              results
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                (click)="previousPage()"
                [disabled]="currentPage === 1"
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                Previous
              </button>
              <button
                (click)="nextPage()"
                [disabled]="currentPage === totalPages"
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TicketListComponent implements OnInit {
  tickets: Ticket[] = [];
  totalCount = 0;
  currentPage = 1;
  pageSize = 20;
  totalPages = 0;
  Math = Math;
  currentTab = 'my'; // Default to 'my' - will be adjusted in ngOnInit
  users: any[] = [];

  filters = {
    status: '',
    priority: '',
    search: ''
  };

  constructor(
    private ticketService: TicketService,
    public router: Router,
    private http: HttpClient,
    public authService: AuthService
  ) {}

  ngOnInit() {
    // Set appropriate default tab based on user role
    if (this.authService.canViewAllTickets()) {
      this.currentTab = 'all'; // Admins can see all tickets by default
    } else if (this.authService.isInternal()) {
      this.currentTab = 'my'; // Agents see their tickets by default
    } else {
      this.currentTab = 'my'; // Customers see their tickets by default
    }

    if (this.authService.isInternal()) {
      this.loadUsers();
    }
    this.loadTickets();
  }

  async loadTickets() {
    try {
      let filters: any = {
        status: this.filters.status,
        priority: this.filters.priority,
        q: this.filters.search,
        page: this.currentPage,
        pageSize: this.pageSize
      };

      // Add filterType for backend filtering
      if (this.authService.isInternal()) {
        if (this.currentTab === 'all' && this.authService.canViewAllTickets()) {
          filters.filterType = 'all';
        } else if (this.currentTab === 'my') {
          filters.filterType = 'my';
        } else if (this.currentTab === 'unassigned') {
          filters.filterType = 'unassigned';
        } else {
          // Default to 'my' for internal users who don't have access to 'all'
          filters.filterType = 'my';
        }
      } else {
        // Customers should always see their own tickets
        filters.filterType = 'my';
      }

      const response = await this.ticketService.getTickets(filters);

      this.tickets = response.data;
      this.totalCount = response.totalCount;
      this.totalPages = response.totalPages;

      console.log('Loaded tickets:', this.tickets);
      console.log('First ticket key:', this.tickets[0]?.key);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    }
  }

  applyFilters() {
    this.currentPage = 1;
    this.loadTickets();
  }

  viewTicket(key: string) {
    console.log('viewTicket called with key:', key);
    console.log('Router available:', !!this.router);
    if (!key) {
      console.error('Ticket key is undefined or null');
      return;
    }

    try {
      console.log('Attempting navigation to:', ['/tickets', key]);
      this.router.navigate(['/tickets', key]).then(success => {
        console.log('Navigation result:', success);
      }).catch(error => {
        console.error('Navigation error:', error);
        // Fallback to window.location
        window.location.href = `/tickets/${key}`;
      });
    } catch (error) {
      console.error('Router navigate error:', error);
      // Fallback to window.location
      window.location.href = `/tickets/${key}`;
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadTickets();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadTickets();
    }
  }

  getPriorityClass(priority: Priority): string {
    switch (priority) {
      case Priority.P1:
        return 'bg-red-100 text-red-800';
      case Priority.P2:
        return 'bg-orange-100 text-orange-800';
      case Priority.P3:
        return 'bg-yellow-100 text-yellow-800';
      case Priority.P4:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusClass(status: TicketStatus): string {
    switch (status) {
      case TicketStatus.New:
        return 'bg-blue-100 text-blue-800';
      case TicketStatus.Triaged:
        return 'bg-indigo-100 text-indigo-800';
      case TicketStatus.InProgress:
        return 'bg-yellow-100 text-yellow-800';
      case TicketStatus.WaitingCustomer:
        return 'bg-orange-100 text-orange-800';
      case TicketStatus.Resolved:
        return 'bg-green-100 text-green-800';
      case TicketStatus.Closed:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: TicketStatus): string {
    switch (status) {
      case TicketStatus.New:
        return 'New';
      case TicketStatus.Triaged:
        return 'Triaged';
      case TicketStatus.InProgress:
        return 'In Progress';
      case TicketStatus.WaitingCustomer:
        return 'Waiting on Customer';
      case TicketStatus.Resolved:
        return 'Resolved';
      case TicketStatus.Closed:
        return 'Closed';
      default:
        return 'Unknown';
    }
  }

  switchTab(tab: string) {
    this.currentTab = tab;
    this.currentPage = 1;
    this.loadTickets();
  }

  async loadUsers() {
    try {
      const response = await this.http.get<any[]>(`${environment.apiUrl}/users`).toPromise();
      this.users = response || [];
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }

  getUserName(userId: string): string {
    const user = this.users.find(u => u.id === userId);
    return user?.name || 'Unknown';
  }

  getPageTitle(): string {
    if (this.authService.isCustomer()) {
      return 'My Support Tickets';
    }
    switch (this.currentTab) {
      case 'my':
        return 'My Assigned Tickets';
      case 'unassigned':
        return 'Unassigned Tickets';
      default:
        return 'All Support Tickets';
    }
  }

  getPageDescription(): string {
    if (this.authService.isCustomer()) {
      return 'View and manage your support requests';
    }
    switch (this.currentTab) {
      case 'my':
        return 'Tickets assigned to you';
      case 'unassigned':
        return 'Tickets waiting for assignment';
      default:
        return 'View and manage all support tickets';
    }
  }
}