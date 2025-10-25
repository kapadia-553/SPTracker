import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TicketService } from '../../services/ticket.service';
import { ProjectService } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';
import { Ticket, TicketStatus, Priority, Severity } from '../../models/ticket.model';

// Updated with inline editing - v2.0

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
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
              {{ ticket.status }}
            </span>
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
              {{ ticket.priority }}
            </span>
          </div>
        </div>

        <!-- Ticket Details Section -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <!-- Status -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div *ngIf="!editingStatus">
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {{ ticket.status }}
              </span>
              <button *ngIf="canEditField('status')" (click)="startEditingStatus()" class="ml-2 text-sm text-primary-600 hover:text-primary-500">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.828-2.828z"></path>
                </svg>
              </button>
            </div>
            <div *ngIf="editingStatus" class="flex items-center space-x-2">
              <select [(ngModel)]="selectedStatus" class="text-sm px-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500">
                <option value="New">New</option>
                <option value="Triaged">Triaged</option>
                <option value="InProgress">In Progress</option>
                <option value="WaitingCustomer">Waiting Customer</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <button (click)="saveStatus()" [disabled]="updateLoading" class="text-green-600 hover:text-green-500">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
              </button>
              <button (click)="cancelEditingStatus()" class="text-red-600 hover:text-red-500">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- Assigned To -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
            <div class="flex items-center justify-between">
              <div>
                <span class="text-sm text-gray-900" *ngIf="ticket.assigneeName; else unassigned">
                  {{ ticket.assigneeName }}<br>
                  <span class="text-xs text-gray-500">{{ ticket.assigneeEmail }}</span>
                </span>
                <ng-template #unassigned>
                  <span class="text-sm text-gray-500">Unassigned</span>
                </ng-template>
              </div>
              <button
                *ngIf="authService.canAssignTickets()"
                (click)="openAssignModal()"
                class="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                Assign
              </button>
            </div>
          </div>

          <!-- Priority -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <div *ngIf="!editingPriority">
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" 
                    [ngClass]="{
                      'bg-red-100 text-red-800': ticket.priority === 'P1',
                      'bg-orange-100 text-orange-800': ticket.priority === 'P2',
                      'bg-yellow-100 text-yellow-800': ticket.priority === 'P3',
                      'bg-green-100 text-green-800': ticket.priority === 'P4'
                    }">
                {{ ticket.priority }}
              </span>
              <button *ngIf="canEditField('priority')" (click)="startEditingPriority()" class="ml-2 text-sm text-primary-600 hover:text-primary-500">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.828-2.828z"></path>
                </svg>
              </button>
            </div>
            <div *ngIf="editingPriority" class="flex items-center space-x-2">
              <select [(ngModel)]="selectedPriority" class="text-sm px-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500">
                <option value="P4">P4 - Low</option>
                <option value="P3">P3 - Normal</option>
                <option value="P2">P2 - High</option>
                <option value="P1">P1 - Critical</option>
              </select>
              <button (click)="savePriority()" [disabled]="updateLoading" class="text-green-600 hover:text-green-500">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
              </button>
              <button (click)="cancelEditingPriority()" class="text-red-600 hover:text-red-500">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- Severity -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Severity</label>
            <div *ngIf="!editingSeverity">
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    [ngClass]="{
                      'bg-red-100 text-red-800': ticket.severity === 'Critical',
                      'bg-orange-100 text-orange-800': ticket.severity === 'High',
                      'bg-yellow-100 text-yellow-800': ticket.severity === 'Medium',
                      'bg-green-100 text-green-800': ticket.severity === 'Low'
                    }">
                {{ ticket.severity }}
              </span>
              <button *ngIf="canEditField('severity')" (click)="startEditingSeverity()" class="ml-2 text-sm text-primary-600 hover:text-primary-500">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.828-2.828z"></path>
                </svg>
              </button>
            </div>
            <div *ngIf="editingSeverity" class="flex items-center space-x-2">
              <select [(ngModel)]="selectedSeverity" class="text-sm px-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
              <button (click)="saveSeverity()" [disabled]="updateLoading" class="text-green-600 hover:text-green-500">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
              </button>
              <button (click)="cancelEditingSeverity()" class="text-red-600 hover:text-red-500">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="prose max-w-none">
          <h3>Description</h3>
          <p>{{ ticket.description }}</p>
        </div>

        <div class="mt-8 border-t pt-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Comments</h3>
          
          <!-- Existing Comments -->
          <div class="space-y-4 mb-6" *ngIf="ticket.comments && ticket.comments.length > 0">
            <!-- Only show internal comments to internal users -->
            <div *ngFor="let comment of ticket.comments">
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
          </div>
          
          <!-- No Comments Message -->
          <div *ngIf="!ticket.comments || ticket.comments.length === 0" class="text-gray-500 text-center py-8">
            No comments yet. Be the first to add a comment!
          </div>
          
          <!-- Add Comment Form -->
          <div class="mt-6 border-t pt-6">
            <h4 class="text-md font-medium text-gray-900 mb-4">Add Comment</h4>
            <form [formGroup]="commentForm" (ngSubmit)="onSubmitComment()">
              <div class="mb-4">
                <label for="comment" class="block text-sm font-medium text-gray-700 mb-2">Your Comment</label>
                <textarea
                  id="comment"
                  rows="4"
                  formControlName="body"
                  class="mt-1 block w-full px-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Write your comment here..."></textarea>
                <div *ngIf="commentForm.get('body')?.invalid && commentForm.get('body')?.touched"
                     class="mt-1 text-sm text-red-600">
                  Comment is required
                </div>
              </div>

              <!-- Internal comment checkbox - only for internal users -->
              <div *ngIf="authService.isInternal()" class="mb-4">
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    formControlName="isInternal"
                    class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded">
                  <span class="ml-2 text-sm text-gray-700">Internal comment (only visible to agents and admins)</span>
                </label>
              </div>
              <div class="flex justify-end">
                <button
                  type="submit"
                  [disabled]="commentLoading || commentForm.invalid"
                  class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed">
                  <span *ngIf="commentLoading" class="mr-2">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  </span>
                  {{ commentLoading ? 'Adding...' : 'Add Comment' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div class="mt-6 flex justify-start">
          <button
            (click)="router.navigate(['/tickets'])"
            class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">
            Back to Tickets
          </button>
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
                <select formControlName="assigneeId" class="block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
                  <option value="">Unassigned</option>
                  <option *ngFor="let user of users" [value]="user.id">{{ user.name }} ({{ user.email }})</option>
                </select>
              </div>
              <div class="flex justify-end space-x-3">
                <button type="button" (click)="closeAssignModal()" class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" [disabled]="assignLoading" class="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500">
                  {{ assignLoading ? 'Assigning...' : 'Assign' }}
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
  commentLoading = false;
  updateLoading = false;
  assignLoading = false;
  users: any[] = [];

  // Modal states
  showAssignModal = false;

  // Editing states
  editingStatus = false;
  editingPriority = false;
  editingSeverity = false;

  // Selected values for editing
  selectedStatus = '';
  selectedPriority = '';
  selectedSeverity = '';

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private ticketService: TicketService,
    private projectService: ProjectService,
    private fb: FormBuilder,
    public authService: AuthService
  ) {
    this.commentForm = this.fb.group({
      body: ['', Validators.required],
      isInternal: [false]
    });

    this.assignForm = this.fb.group({
      assigneeId: ['']
    });
  }

  ngOnInit() {
    console.log('TicketDetailComponent.ngOnInit called');
    this.loadUsers();
    this.route.params.subscribe(params => {
      console.log('Route params:', params);
      if (params['key']) {
        console.log('Loading ticket with key:', params['key']);
        this.loadTicket(params['key']);
      } else {
        console.error('No ticket key found in route params');
      }
    });
  }

  async loadTicket(key: string) {
    console.log('TicketDetailComponent.loadTicket called with key:', key);
    try {
      this.ticket = await this.ticketService.getTicket(key);
      console.log('Ticket loaded successfully:', this.ticket);
    } catch (error) {
      console.error('Failed to load ticket:', error);
      this.router.navigate(['/tickets']);
    }
  }

  async loadUsers() {
    try {
      this.users = await this.projectService.getUsers();
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }

  // Status editing methods
  startEditingStatus() {
    this.selectedStatus = this.ticket!.status;
    this.editingStatus = true;
  }

  cancelEditingStatus() {
    this.editingStatus = false;
    this.selectedStatus = '';
  }

  async saveStatus() {
    if (!this.ticket || this.updateLoading) return;
    
    this.updateLoading = true;
    try {
      await this.ticketService.updateTicket(this.ticket.key, { status: this.selectedStatus });
      await this.loadTicket(this.ticket.key);
      this.editingStatus = false;
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      this.updateLoading = false;
    }
  }

  // Assignment modal methods
  openAssignModal() {
    this.loadUsers();
    this.assignForm.patchValue({
      assigneeId: this.getAssigneeIdFromTicket()
    });
    this.showAssignModal = true;
  }

  closeAssignModal() {
    this.showAssignModal = false;
    this.assignForm.reset();
  }

  async assignTicket() {
    if (!this.ticket || this.assignLoading) return;

    this.assignLoading = true;
    try {
      await this.ticketService.updateTicket(this.ticket.key, {
        assigneeId: this.assignForm.value.assigneeId || null,
        updateAssigneeId: true
      });
      this.showAssignModal = false;
      await this.loadTicket(this.ticket.key);
    } catch (error) {
      console.error('Failed to assign ticket:', error);
      alert('Failed to assign ticket. Please try again.');
    } finally {
      this.assignLoading = false;
    }
  }

  // Priority editing methods
  startEditingPriority() {
    this.selectedPriority = this.ticket!.priority;
    this.editingPriority = true;
  }

  cancelEditingPriority() {
    this.editingPriority = false;
    this.selectedPriority = '';
  }

  async savePriority() {
    if (!this.ticket || this.updateLoading) return;
    
    this.updateLoading = true;
    try {
      await this.ticketService.updateTicket(this.ticket.key, { priority: this.selectedPriority });
      await this.loadTicket(this.ticket.key);
      this.editingPriority = false;
    } catch (error) {
      console.error('Failed to update priority:', error);
      alert('Failed to update priority. Please try again.');
    } finally {
      this.updateLoading = false;
    }
  }

  // Severity editing methods
  startEditingSeverity() {
    this.selectedSeverity = this.ticket!.severity;
    this.editingSeverity = true;
  }

  cancelEditingSeverity() {
    this.editingSeverity = false;
    this.selectedSeverity = '';
  }

  async saveSeverity() {
    if (!this.ticket || this.updateLoading) return;
    
    this.updateLoading = true;
    try {
      await this.ticketService.updateTicket(this.ticket.key, { severity: this.selectedSeverity });
      await this.loadTicket(this.ticket.key);
      this.editingSeverity = false;
    } catch (error) {
      console.error('Failed to update severity:', error);
      alert('Failed to update severity. Please try again.');
    } finally {
      this.updateLoading = false;
    }
  }

  private getAssigneeIdFromTicket(): string {
    if (!this.ticket?.assigneeEmail) return '';
    const user = this.users.find(u => u.email === this.ticket!.assigneeEmail);
    return user ? user.id : '';
  }

  async onSubmitComment() {
    if (this.commentForm.valid && this.ticket && !this.commentLoading) {
      this.commentLoading = true;

      try {
        const formValue = this.commentForm.value;
        await this.ticketService.addComment(this.ticket.key, formValue.body, formValue.isInternal);
        
        // Reset form
        this.commentForm.reset();
        
        // Reload ticket to show new comment
        await this.loadTicket(this.ticket.key);
        
        // Show success message (optional)
        console.log('Comment added successfully');
      } catch (error: any) {
        console.error('Failed to add comment:', error);
        alert('Failed to add comment. Please try again.');
      } finally {
        this.commentLoading = false;
      }
    }
  }

  canEditField(field: 'status' | 'priority' | 'severity'): boolean {
    // Internal users can edit all fields
    if (this.authService.isInternal()) {
      return true;
    }
    
    // Customers can only edit status, priority, and severity - not assignment
    if (this.authService.isCustomer()) {
      return ['status', 'priority', 'severity'].includes(field);
    }
    
    return false;
  }
}