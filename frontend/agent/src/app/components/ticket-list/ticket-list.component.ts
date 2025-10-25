import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TicketService } from '../../services/ticket.service';
import { Ticket, TicketStatus, Priority, Severity } from '../../models/ticket.model';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-ticket-list',
  template: `
    <div class="space-y-6">
      <!-- Header with Actions -->
      <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
          <h1 class="text-2xl font-semibold text-gray-900">{{ pageTitle }}</h1>
          <p class="mt-2 text-sm text-gray-700">
            {{ currentFilterType === 'my' ? 'View and manage tickets assigned to you' :
               currentFilterType === 'unassigned' ? 'View tickets that need to be assigned' :
               currentFilterType === 'overdue' ? 'View tickets that have exceeded their SLA deadlines' :
               'Manage and track support tickets across all tenants' }}
          </p>
        </div>
        <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none space-x-3">
          <button (click)="router.navigate(['/tickets/new'])" class="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Create Ticket
          </button>
          <button (click)="refreshTickets()" class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Refresh
          </button>
          <button (click)="exportTickets()" class="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            Export
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white shadow rounded-lg p-6">
        <form [formGroup]="filterForm" class="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input type="text" formControlName="search" placeholder="Ticket key or title..."
                   class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select formControlName="status" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6">
              <option value="">All Statuses</option>
              <option *ngFor="let status of statuses" [value]="status">{{ status }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select formControlName="priority" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6">
              <option value="">All Priorities</option>
              <option *ngFor="let priority of priorities" [value]="priority">{{ priority }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Severity</label>
            <select formControlName="severity" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6">
              <option value="">All Severities</option>
              <option *ngFor="let severity of severities" [value]="severity">{{ severity }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
            <select formControlName="assigneeId" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6">
              <option value="">All Assignees</option>
              <option value="unassigned">Unassigned</option>
              <option *ngFor="let user of users" [value]="user.id">{{ user.name }}</option>
            </select>
          </div>
          <div class="flex items-end">
            <button type="button" (click)="clearFilters()" class="w-full rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
              Clear Filters
            </button>
          </div>
        </form>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="bg-white shadow rounded-lg p-6">
        <div class="flex justify-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>

      <!-- Ticket List -->
      <div *ngIf="!loading" class="bg-white shadow rounded-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-gray-900">
              Showing {{ tickets.length }} of {{ totalCount }} tickets
            </h3>
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-500">Page {{ currentPage }} of {{ totalPages }}</span>
              <button (click)="previousPage()" [disabled]="currentPage === 1" 
                      class="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                Previous
              </button>
              <button (click)="nextPage()" [disabled]="currentPage === totalPages" 
                      class="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                Next
              </button>
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reporter</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SLA</th>
                <th scope="col" class="relative px-6 py-3"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let ticket of tickets" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div class="text-sm font-medium text-gray-900">
                      <a [routerLink]="['/tickets', ticket.key]" class="text-primary-600 hover:text-primary-500 underline">
                        {{ ticket.key }}
                      </a>
                    </div>
                    <div class="text-sm text-gray-500 truncate max-w-xs" [title]="ticket.title">{{ ticket.title }}</div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [class]="getStatusClass(ticket.status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                    {{ ticket.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [class]="getPriorityClass(ticket.priority)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                    {{ ticket.priority }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div *ngIf="ticket.assigneeName; else unassigned">
                    {{ ticket.assigneeName }}
                  </div>
                  <ng-template #unassigned>
                    <span class="text-gray-400 italic">Unassigned</span>
                  </ng-template>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ ticket.reporterName }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ ticket.createdAt | date:'short' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div *ngIf="ticket.slaTarget" class="text-xs">
                    <div *ngIf="ticket.slaTarget.isFirstResponseBreached" class="text-red-600 font-medium">Response Breached</div>
                    <div *ngIf="ticket.slaTarget.isResolveBreached" class="text-red-600 font-medium">Resolve Breached</div>
                    <div *ngIf="!ticket.slaTarget.isFirstResponseBreached && !ticket.slaTarget.isResolveBreached" class="text-green-600">On Track</div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end space-x-2">
                    <button (click)="assignTicket(ticket)" class="text-blue-600 hover:text-blue-900">Assign</button>
                    <button (click)="updateStatus(ticket)" class="text-green-600 hover:text-green-900">Update</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div *ngIf="tickets.length === 0" class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No tickets found</h3>
          <p class="mt-1 text-sm text-gray-500">No tickets match your current filters.</p>
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
  loading = false;
  filterForm: FormGroup;
  currentFilterType: string = 'all';

  statuses = Object.values(TicketStatus);
  priorities = Object.values(Priority);
  severities = Object.values(Severity);
  users: any[] = [];

  constructor(
    private fb: FormBuilder,
    public router: Router,
    private route: ActivatedRoute,
    private ticketService: TicketService
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      status: [''],
      priority: [''],
      severity: [''],
      assigneeId: ['']
    });
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  get pageTitle(): string {
    switch (this.currentFilterType) {
      case 'my': return 'My Tickets';
      case 'unassigned': return 'Unassigned Tickets';
      case 'overdue': return 'Overdue Tickets';
      default: return 'All Tickets';
    }
  }

  ngOnInit(): void {
    // Subscribe to route data changes to handle navigation between filtered views
    this.route.data.subscribe(data => {
      this.currentFilterType = data['filterType'] || 'all';
      this.currentPage = 1; // Reset pagination when filter changes
      this.loadTickets();
    });

    this.loadUsers();

    // Subscribe to form changes with debouncing for search only
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadTickets();
      });
  }

  async loadTickets(): Promise<void> {
    this.loading = true;
    try {
      const filters = {
        ...this.filterForm.value,
        filterType: this.currentFilterType,
        page: this.currentPage,
        pageSize: this.pageSize
      };

      const response = await this.ticketService.getTickets(filters);
      this.tickets = response.data || [];
      this.totalCount = response.totalCount || 0;
    } catch (error) {
      console.error('Failed to load tickets:', error);
      this.tickets = [];
      this.totalCount = 0;
    } finally {
      this.loading = false;
    }
  }

  async loadUsers(): Promise<void> {
    try {
      this.users = await this.ticketService.getUsers();
    } catch (error) {
      console.error('Failed to load users:', error);
      this.users = [];
    }
  }

  refreshTickets(): void {
    this.loadTickets();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.currentPage = 1;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadTickets();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadTickets();
    }
  }

  getStatusClass(status: TicketStatus): string {
    const statusClasses = {
      [TicketStatus.New]: 'bg-blue-100 text-blue-800',
      [TicketStatus.Triaged]: 'bg-yellow-100 text-yellow-800',
      [TicketStatus.InProgress]: 'bg-orange-100 text-orange-800',
      [TicketStatus.WaitingCustomer]: 'bg-purple-100 text-purple-800',
      [TicketStatus.Resolved]: 'bg-green-100 text-green-800',
      [TicketStatus.Closed]: 'bg-gray-100 text-gray-800',
      [TicketStatus.Cancelled]: 'bg-red-100 text-red-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  getPriorityClass(priority: Priority): string {
    const priorityClasses = {
      [Priority.P1]: 'bg-red-100 text-red-800',
      [Priority.P2]: 'bg-orange-100 text-orange-800',
      [Priority.P3]: 'bg-yellow-100 text-yellow-800',
      [Priority.P4]: 'bg-green-100 text-green-800'
    };
    return priorityClasses[priority] || 'bg-gray-100 text-gray-800';
  }

  assignTicket(ticket: Ticket): void {
    this.router.navigate(['/tickets', ticket.key, 'assign']);
  }

  updateStatus(ticket: Ticket): void {
    this.router.navigate(['/tickets', ticket.key, 'update']);
  }

  exportTickets(): void {
    console.log('Export functionality to be implemented');
  }
}