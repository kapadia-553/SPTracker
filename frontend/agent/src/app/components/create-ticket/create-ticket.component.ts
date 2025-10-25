import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TicketService } from '../../services/ticket.service';
import { AdminService, Tenant } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { Priority, Severity } from '../../models/ticket.model';

@Component({
  selector: 'app-create-ticket',
  template: `
    <div class="max-w-3xl mx-auto">
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-6">Create New Support Ticket</h3>
          
          <form [formGroup]="ticketForm" (ngSubmit)="onSubmit()">
            <div class="space-y-6">
              <div>
                <label for="title" class="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  id="title"
                  formControlName="title"
                  class="mt-1 block w-full px-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Brief description of the issue">
                <div *ngIf="ticketForm.get('title')?.invalid && ticketForm.get('title')?.touched" 
                     class="mt-1 text-sm text-red-600">
                  Title is required
                </div>
              </div>

              <div>
                <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  id="description"
                  rows="4"
                  formControlName="description"
                  class="mt-1 block w-full px-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Detailed description of the issue, including steps to reproduce if applicable"></textarea>
                <div *ngIf="ticketForm.get('description')?.invalid && ticketForm.get('description')?.touched" 
                     class="mt-1 text-sm text-red-600">
                  Description is required
                </div>
              </div>

              <!-- Tenant Selection for System Users -->
              <div *ngIf="isSystemUser">
                <label for="tenant" class="block text-sm font-medium text-gray-700">Organization</label>
                <select
                  id="tenant"
                  formControlName="tenantId"
                  class="mt-1 block w-full px-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                  <option value="">Select organization...</option>
                  <option *ngFor="let tenant of tenants" [value]="tenant.id">{{ tenant.name }}</option>
                </select>
                <div *ngIf="ticketForm.get('tenantId')?.invalid && ticketForm.get('tenantId')?.touched"
                     class="mt-1 text-sm text-red-600">
                  Organization is required
                </div>
              </div>

              <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <label for="priority" class="block text-sm font-medium text-gray-700">Priority</label>
                  <select
                    id="priority"
                    formControlName="priority"
                    class="mt-1 block w-full px-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                    <option value="P4">P4 - Low</option>
                    <option value="P3" selected>P3 - Normal</option>
                    <option value="P2">P2 - High</option>
                    <option value="P1">P1 - Critical</option>
                  </select>
                </div>

                <div>
                  <label for="severity" class="block text-sm font-medium text-gray-700">Severity</label>
                  <select
                    id="severity"
                    formControlName="severity"
                    class="mt-1 block w-full px-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                    <option value="Low">Low</option>
                    <option value="Medium" selected>Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label for="project" class="block text-sm font-medium text-gray-700">Project</label>
                  <select
                    id="project"
                    formControlName="projectId"
                    class="mt-1 block w-full px-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                    <option value="">Select a project...</option>
                    <option *ngFor="let project of projects" [value]="project.id">{{ project.name }}</option>
                  </select>
                  <div *ngIf="ticketForm.get('projectId')?.invalid && ticketForm.get('projectId')?.touched" 
                       class="mt-1 text-sm text-red-600">
                    Project is required
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <label for="category" class="block text-sm font-medium text-gray-700">Category (Optional)</label>
                  <select
                    id="category"
                    formControlName="categoryId"
                    class="mt-1 block w-full px-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                    <option value="">Select a category...</option>
                    <option *ngFor="let category of categories" [value]="category.id">{{ category.name }}</option>
                  </select>
                </div>

                <div>
                  <label for="product" class="block text-sm font-medium text-gray-700">Product (Optional)</label>
                  <select
                    id="product"
                    formControlName="productId"
                    class="mt-1 block w-full px-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                    <option value="">Select a product...</option>
                    <option *ngFor="let product of products" [value]="product.id">{{ product.name }}</option>
                  </select>
                </div>

                <div>
                  <label for="assignee" class="block text-sm font-medium text-gray-700">Assigned To (Optional)</label>
                  <select
                    id="assignee"
                    formControlName="assigneeId"
                    class="mt-1 block w-full px-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                    <option value="">Select an assignee...</option>
                    <option *ngFor="let user of users" [value]="user.id">{{ user.name }} ({{ user.email }})</option>
                  </select>
                </div>
              </div>

              <!-- File Upload Section -->
              <div>
                <label class="block text-sm font-medium text-gray-700">Attachments (Optional)</label>
                <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div class="space-y-1 text-center">
                    <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <div class="flex text-sm text-gray-600">
                      <label for="file-upload" class="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                        <span>Upload files</span>
                        <input id="file-upload" name="file-upload" type="file" class="sr-only" multiple (change)="onFileSelected($event)">
                      </label>
                      <p class="pl-1">or drag and drop</p>
                    </div>
                    <p class="text-xs text-gray-500">PNG, JPG, PDF up to 10MB each</p>
                  </div>
                </div>
                
                <!-- Selected Files -->
                <div *ngIf="selectedFiles.length > 0" class="mt-4">
                  <h4 class="text-sm font-medium text-gray-700 mb-2">Selected Files:</h4>
                  <ul class="space-y-2">
                    <li *ngFor="let file of selectedFiles; let i = index" class="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                      <span class="text-sm text-gray-900">{{ file.name }} ({{ formatFileSize(file.size) }})</span>
                      <button type="button" (click)="removeFile(i)" class="text-red-600 hover:text-red-800">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="mt-6 flex items-center justify-end space-x-4">
              <button
                type="button"
                (click)="router.navigate(['/tickets'])"
                class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="loading || ticketForm.invalid"
                class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed">
                <span *ngIf="loading" class="mr-2">
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                </span>
                {{ loading ? 'Creating...' : 'Create Ticket' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class CreateTicketComponent implements OnInit {
  ticketForm: FormGroup;
  loading = false;
  selectedFiles: File[] = [];
  projects: any[] = [];
  categories: any[] = [];
  products: any[] = [];
  users: any[] = [];
  tenants: Tenant[] = [];
  isSystemUser = false;

  constructor(
    private fb: FormBuilder,
    private ticketService: TicketService,
    private adminService: AdminService,
    private authService: AuthService,
    public router: Router
  ) {
    this.ticketForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      priority: ['P3'],
      severity: ['Medium'],
      projectId: ['', Validators.required],
      categoryId: [''],
      productId: [''],
      assigneeId: [''],
      tenantId: ['']
    });
  }

  ngOnInit() {
    this.loadFormData();
  }

  async loadFormData() {
    try {
      // Check if user is a system user (Admin, Agent, TeamLead)
      const currentUser = this.authService.getCurrentUser();
      console.log('🔍 Current user:', currentUser);
      console.log('🔍 User roles:', currentUser?.roles);

      this.isSystemUser = currentUser?.roles?.some((role: string) =>
        ['Admin', 'Agent', 'TeamLead'].includes(role)
      ) || false;

      console.log('🔍 Is system user:', this.isSystemUser);

      // Load form data
      this.projects = await this.ticketService.getProjects();
      this.categories = await this.ticketService.getCategories();
      this.products = await this.ticketService.getProducts();
      this.users = await this.ticketService.getUsers();

      // Load tenants if system user
      if (this.isSystemUser) {
        console.log('📥 Loading tenants for system user...');
        try {
          this.tenants = await this.adminService.getTenants().toPromise() || [];
          console.log('✅ Loaded tenants:', this.tenants);
        } catch (tenantError) {
          console.error('❌ Failed to load tenants:', tenantError);
          alert('Failed to load organizations. Please check console for details.');
        }
        // Make tenant required for system users
        this.ticketForm.get('tenantId')?.setValidators([Validators.required]);
        this.ticketForm.get('tenantId')?.updateValueAndValidity();
      }
    } catch (error) {
      console.error('Failed to load form data:', error);
    }
  }

  onFileSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    
    // Validate file size (10MB max)
    const invalidFiles = files.filter(f => f.size > 10 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      alert('Some files are too large. Maximum file size is 10MB.');
      return;
    }

    this.selectedFiles = [...this.selectedFiles, ...files];
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async onSubmit() {
    if (this.ticketForm.valid && !this.loading) {
      this.loading = true;

      try {
        const formValue = this.ticketForm.value;
        const ticket = await this.ticketService.createTicket({
          title: formValue.title,
          description: formValue.description,
          priority: formValue.priority,
          severity: formValue.severity,
          projectId: formValue.projectId,
          categoryId: formValue.categoryId || undefined,
          productId: formValue.productId || undefined,
          assigneeId: formValue.assigneeId || undefined,
          tenantId: formValue.tenantId || undefined
        });

        // Upload attachments if any
        if (this.selectedFiles.length > 0) {
          await this.uploadAttachments(ticket.key);
        }

        this.router.navigate(['/tickets', ticket.key]);
      } catch (error: any) {
        console.error('Failed to create ticket:', error);
        alert('Failed to create ticket. Please try again.');
      } finally {
        this.loading = false;
      }
    }
  }

  private async uploadAttachments(ticketKey: string) {
    for (const file of this.selectedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        await this.ticketService.uploadAttachment(ticketKey, formData);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
      }
    }
  }
}