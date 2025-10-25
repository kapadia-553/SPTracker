import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TicketService } from '../../services/ticket.service';
import { AuthService } from '../../services/auth.service';
import { Ticket, TicketStatus, Priority, Severity } from '../../models/ticket.model';

@Component({
  selector: 'app-ticket-detail',
  template: `
    <div class="max-w-4xl mx-auto" *ngIf="ticket">
      <div class="bg-white shadow rounded-lg p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">{{ ticket.key }}</h1>
            <h2 class="text-lg text-gray-600">{{ ticket.title }}</h2>
          </div>
          <div class="flex space-x-2">
            <span [class]="getStatusClass(ticket.status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
              {{ ticket.status }}
            </span>
            <span [class]="getPriorityClass(ticket.priority)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
              {{ ticket.priority }}
            </span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex space-x-3 mb-6">
          <button
            (click)="openAssignModal()"
            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            Assign Ticket
          </button>
          <button
            (click)="openUpdateModal()"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
            Update Ticket
          </button>
          <button
            (click)="openWorklogModal()"
            class="inline-flex items-center px-4 py-2 border border-orange-300 rounded-md shadow-sm text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Log Work
          </button>
        </div>

        <!-- Ticket Details -->
        <div class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <dt class="text-sm font-medium text-gray-500">Reporter</dt>
            <dd class="mt-1 text-sm text-gray-900">
              {{ ticket.reporterName }}<br>
              <span class="text-gray-500">{{ ticket.reporterEmail }}</span>
            </dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500">Assignee</dt>
            <dd class="mt-1 text-sm text-gray-900">
              <span *ngIf="ticket.assigneeName; else unassigned">
                {{ ticket.assigneeName }}<br>
                <span class="text-gray-500">{{ ticket.assigneeEmail }}</span>
              </span>
              <ng-template #unassigned>
                <span class="text-gray-400 italic">Unassigned</span>
              </ng-template>
            </dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500">Created</dt>
            <dd class="mt-1 text-sm text-gray-900">{{ ticket.createdAt | date:'medium' }}</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500">Last Updated</dt>
            <dd class="mt-1 text-sm text-gray-900">{{ ticket.updatedAt | date:'medium' }}</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500">SLA Status</dt>
            <dd class="mt-1 text-sm">
              <div *ngIf="ticket.slaTarget; else noSla">
                <div class="text-xs font-medium text-gray-600 mb-1">{{ ticket.slaTarget.policyName }}</div>
                <div *ngIf="ticket.slaTarget.isFirstResponseBreached" class="text-red-600 font-medium">Response Breached</div>
                <div *ngIf="ticket.slaTarget.isResolveBreached" class="text-red-600 font-medium">Resolve Breached</div>
                <div *ngIf="!ticket.slaTarget.isFirstResponseBreached && !ticket.slaTarget.isResolveBreached" class="text-green-600 font-medium">On Track</div>
                <div *ngIf="ticket.slaTarget.isPaused" class="text-yellow-600 text-xs">Paused</div>
              </div>
              <ng-template #noSla>
                <span class="text-gray-400 italic">No SLA</span>
              </ng-template>
            </dd>
          </div>
        </div>
      </div>

      <!-- Description -->
      <div class="bg-white shadow rounded-lg p-6 mt-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Description</h3>
        <div class="prose max-w-none">
          <p>{{ ticket.description }}</p>
        </div>
      </div>

      <!-- Comments -->
      <div class="bg-white shadow rounded-lg p-6 mt-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Comments</h3>

        <div class="space-y-4" *ngFor="let comment of ticket.comments">
          <!-- Only show internal comments to internal users -->
          <div *ngIf="!comment.isInternal || authService.isInternal()"
               [class]="comment.isInternal ? 'bg-amber-50 border-l-4 border-amber-400 rounded-lg p-4' : 'bg-gray-50 rounded-lg p-4'">
            <div class="flex justify-between items-start mb-2">
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-900">{{ comment.authorName }}</span>
                <!-- Internal comment badge -->
                <span *ngIf="comment.isInternal"
                      class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd"></path>
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"></path>
                  </svg>
                  Internal
                </span>
              </div>
              <span class="text-sm text-gray-500">{{ comment.createdAt | date:'short' }}</span>
            </div>
            <p [class]="comment.isInternal ? 'text-amber-900' : 'text-gray-700'">{{ comment.body }}</p>
          </div>
        </div>

        <!-- Add Comment Form -->
        <div class="mt-6 border-t pt-6" *ngIf="commentForm">
          <form [formGroup]="commentForm" (ngSubmit)="addComment()">
            <div>
              <label for="comment" class="block text-sm font-medium text-gray-700">Add Comment</label>
              <textarea
                id="comment"
                rows="3"
                formControlName="body"
                class="mt-1 block w-full px-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Add a comment..."></textarea>
            </div>

            <div class="mt-3">
              <label class="flex items-center">
                <input
                  type="checkbox"
                  formControlName="isInternal"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                <span class="ml-2 text-sm text-gray-700">Internal comment</span>
              </label>
            </div>

            <div class="mt-3 flex justify-end">
              <button
                type="submit"
                [disabled]="commentForm.invalid || commentLoading"
                class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                {{ commentLoading ? 'Adding...' : 'Add Comment' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Worklogs -->
      <div class="bg-white shadow rounded-lg p-6 mt-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Work Logs</h3>

        <div class="space-y-4" *ngFor="let worklog of ticket.worklogs">
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="flex justify-between items-start mb-2">
              <div>
                <span class="font-medium text-gray-900">{{ worklog.userName }}</span>
                <span class="ml-2 text-sm text-gray-500">{{ worklog.activityType }}</span>
                <span *ngIf="worklog.billable" class="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Billable</span>
              </div>
              <div class="text-right">
                <div class="text-sm font-medium text-gray-900">{{ formatMinutes(worklog.minutes) }}</div>
                <div class="text-sm text-gray-500">{{ worklog.createdAt | date:'short' }}</div>
              </div>
            </div>
            <p class="text-gray-700 text-sm">{{ worklog.notes }}</p>
          </div>
        </div>

        <div *ngIf="!ticket.worklogs || ticket.worklogs.length === 0" class="text-center py-8">
          <div class="text-gray-400">No work logs recorded</div>
        </div>
      </div>

      <!-- Assignment Modal -->
      <div *ngIf="showAssignModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Assign Ticket</h3>
            <form [formGroup]="assignForm" (ngSubmit)="assignTicket()">
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Assignee</label>
                <select formControlName="assigneeId" class="block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option value="">Unassigned</option>
                  <option *ngFor="let user of users" [value]="user.id">{{ user.name }} ({{ user.email }})</option>
                </select>
              </div>
              <div class="flex justify-end space-x-3">
                <button type="button" (click)="showAssignModal = false" class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" [disabled]="assignLoading" class="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
                  {{ assignLoading ? 'Assigning...' : 'Assign' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Update Status Modal -->
      <div *ngIf="showUpdateModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Update Ticket</h3>
            <form [formGroup]="updateForm" (ngSubmit)="updateTicketStatus()">
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select formControlName="status" class="block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option *ngFor="let status of statuses" [value]="status">{{ status }}</option>
                </select>
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select formControlName="priority" class="block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option *ngFor="let priority of priorities" [value]="priority">{{ priority }}</option>
                </select>
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                <select formControlName="severity" class="block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option *ngFor="let severity of severities" [value]="severity">{{ severity }}</option>
                </select>
              </div>
              <div class="flex justify-end space-x-3">
                <button type="button" (click)="showUpdateModal = false" class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" [disabled]="updateLoading" class="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500">
                  {{ updateLoading ? 'Updating...' : 'Update' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Worklog Modal -->
      <div *ngIf="showWorklogModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Log Work</h3>
            <form [formGroup]="worklogForm" (ngSubmit)="addWorklog()">
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Time Spent (hours)</label>
                <input type="number" step="0.25" min="0" formControlName="hours" class="block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Activity Type</label>
                <select formControlName="activityType" class="block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option value="Investigation">Investigation</option>
                  <option value="Development">Development</option>
                  <option value="Testing">Testing</option>
                  <option value="Documentation">Documentation</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div class="mb-4">
                <label class="flex items-center">
                  <input type="checkbox" formControlName="billable" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                  <span class="ml-2 text-sm text-gray-700">Billable</span>
                </label>
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea rows="3" formControlName="notes" class="block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Describe the work performed..."></textarea>
              </div>
              <div class="flex justify-end space-x-3">
                <button type="button" (click)="showWorklogModal = false" class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" [disabled]="worklogLoading || worklogForm.invalid" class="rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500">
                  {{ worklogLoading ? 'Logging...' : 'Log Work' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TicketDetailComponent implements OnInit {
  ticket: Ticket | null = null;
  commentForm: FormGroup;
  assignForm: FormGroup;
  updateForm: FormGroup;
  worklogForm: FormGroup;

  commentLoading = false;
  assignLoading = false;
  updateLoading = false;
  worklogLoading = false;

  showAssignModal = false;
  showUpdateModal = false;
  showWorklogModal = false;

  statuses = Object.values(TicketStatus);
  priorities = Object.values(Priority);
  severities = Object.values(Severity);
  users: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private ticketService: TicketService,
    public authService: AuthService
  ) {
    this.commentForm = this.fb.group({
      body: ['', Validators.required],
      isInternal: [false]
    });

    this.assignForm = this.fb.group({
      assigneeId: ['']
    });

    this.updateForm = this.fb.group({
      status: ['', Validators.required],
      priority: ['', Validators.required],
      severity: ['', Validators.required]
    });

    this.worklogForm = this.fb.group({
      hours: [0, [Validators.required, Validators.min(0.25)]],
      activityType: ['Investigation', Validators.required],
      billable: [false],
      notes: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['key']) {
        this.loadTicket(params['key']);
      }
    });
    this.loadUsers();
  }

  async loadTicket(key: string) {
    try {
      this.ticket = await this.ticketService.getTicket(key);
      if (this.ticket) {
        this.updateForm.patchValue({
          status: this.ticket.status,
          priority: this.ticket.priority,
          severity: this.ticket.severity
        });
        this.assignForm.patchValue({
          assigneeId: (this.ticket as any).assigneeId || ''
        });
      }
    } catch (error) {
      console.error('Failed to load ticket:', error);
      this.router.navigate(['/tickets']);
    }
  }

  async loadUsers() {
    try {
      this.users = await this.ticketService.getUsers();
      console.log('Users loaded:', this.users);
    } catch (error) {
      console.error('Failed to load users:', error);
      this.users = [];
    }
  }

  openAssignModal() {
    this.loadUsers();
    this.showAssignModal = true;
  }

  openUpdateModal() {
    this.showUpdateModal = true;
  }

  openWorklogModal() {
    this.showWorklogModal = true;
  }

  async addComment() {
    if (this.commentForm.valid && this.ticket && !this.commentLoading) {
      this.commentLoading = true;
      try {
        await this.ticketService.addComment(
          this.ticket.key,
          this.commentForm.value.body,
          this.commentForm.value.isInternal
        );
        this.commentForm.reset({ isInternal: false });
        await this.loadTicket(this.ticket.key);
      } catch (error) {
        console.error('Failed to add comment:', error);
      } finally {
        this.commentLoading = false;
      }
    }
  }

  async assignTicket() {
    console.log('Assign ticket called');
    console.log('Form valid:', this.assignForm.valid);
    console.log('Form value:', this.assignForm.value);
    console.log('Ticket:', this.ticket?.key);
    console.log('Loading:', this.assignLoading);

    if (this.ticket && !this.assignLoading) {
      this.assignLoading = true;
      try {
        const updateData = {
          assigneeId: this.assignForm.value.assigneeId || null,
          updateAssigneeId: true
        };
        console.log('Update data:', updateData);

        await this.ticketService.updateTicket(this.ticket.key, updateData);
        console.log('Assignment successful');
        this.showAssignModal = false;
        await this.loadTicket(this.ticket.key);
      } catch (error) {
        console.error('Failed to assign ticket:', error);
        alert('Failed to assign ticket. Please try again.');
      } finally {
        this.assignLoading = false;
      }
    }
  }

  async updateTicketStatus() {
    console.log('Update ticket called');
    console.log('Form valid:', this.updateForm.valid);
    console.log('Form value:', this.updateForm.value);

    if (this.updateForm.valid && this.ticket && !this.updateLoading) {
      this.updateLoading = true;
      try {
        await this.ticketService.updateTicket(this.ticket.key, this.updateForm.value);
        console.log('Update successful');
        this.showUpdateModal = false;
        await this.loadTicket(this.ticket.key);
      } catch (error) {
        console.error('Failed to update ticket:', error);
        alert('Failed to update ticket. Please try again.');
      } finally {
        this.updateLoading = false;
      }
    }
  }

  async addWorklog() {
    console.log('Add worklog called');
    console.log('Form valid:', this.worklogForm.valid);
    console.log('Form value:', this.worklogForm.value);

    if (this.worklogForm.valid && this.ticket && !this.worklogLoading) {
      this.worklogLoading = true;
      try {
        const worklogData = {
          minutes: Math.round(this.worklogForm.value.hours * 60),
          activityType: this.worklogForm.value.activityType,
          billable: this.worklogForm.value.billable,
          notes: this.worklogForm.value.notes
        };
        console.log('Worklog data:', worklogData);

        await this.ticketService.addWorklog(this.ticket.key, worklogData);
        console.log('Worklog successful');
        this.showWorklogModal = false;
        this.worklogForm.reset({
          hours: 0,
          activityType: 'Investigation',
          billable: false,
          notes: ''
        });
        await this.loadTicket(this.ticket.key);
      } catch (error) {
        console.error('Failed to add worklog:', error);
        alert('Failed to add worklog. Please try again.');
      } finally {
        this.worklogLoading = false;
      }
    }
  }

  formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'New': 'bg-blue-100 text-blue-800',
      'Triaged': 'bg-yellow-100 text-yellow-800',
      'InProgress': 'bg-orange-100 text-orange-800',
      'WaitingCustomer': 'bg-purple-100 text-purple-800',
      'Resolved': 'bg-green-100 text-green-800',
      'Closed': 'bg-gray-100 text-gray-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  getPriorityClass(priority: string): string {
    const priorityClasses: { [key: string]: string } = {
      'Low': 'bg-green-100 text-green-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'High': 'bg-orange-100 text-orange-800',
      'Critical': 'bg-red-100 text-red-800'
    };
    return priorityClasses[priority] || 'bg-gray-100 text-gray-800';
  }
}