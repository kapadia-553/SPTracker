import { Component, OnInit } from '@angular/core';
import { ReportService } from '../../services/report.service';

interface ReportFilters {
  status?: string;
  assignedTo?: string;
  dateFrom?: string;
  dateTo?: string;
  priority?: string;
  tenant?: string;
  project?: string;
  category?: string;
}

@Component({
  selector: 'app-reports',
  template: `
    <div class="space-y-6">
      <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
          <h1 class="text-2xl font-semibold text-gray-900">Reports</h1>
          <p class="mt-2 text-sm text-gray-700">
            Generate and export comprehensive issue reports
          </p>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Issue Report Filters</h3>
          
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label for="status" class="block text-sm font-medium text-gray-700">Status</label>
              <select
                id="status"
                [(ngModel)]="filters.status"
                class="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm">
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
                class="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm">
                <option value="">All Priorities</option>
                <option value="P1">P1 - Critical</option>
                <option value="P2">P2 - High</option>
                <option value="P3">P3 - Normal</option>
                <option value="P4">P4 - Low</option>
              </select>
            </div>

            <div>
              <label for="dateFrom" class="block text-sm font-medium text-gray-700">From Date</label>
              <input
                type="date"
                id="dateFrom"
                [(ngModel)]="filters.dateFrom"
                class="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm">
            </div>

            <div>
              <label for="dateTo" class="block text-sm font-medium text-gray-700">To Date</label>
              <input
                type="date"
                id="dateTo"
                [(ngModel)]="filters.dateTo"
                class="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm">
            </div>

            <div>
              <label for="assignedTo" class="block text-sm font-medium text-gray-700">Assigned To</label>
              <input
                type="text"
                id="assignedTo"
                [(ngModel)]="filters.assignedTo"
                placeholder="Agent email or name"
                class="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm">
            </div>

            <div>
              <label for="tenant" class="block text-sm font-medium text-gray-700">Tenant</label>
              <input
                type="text"
                id="tenant"
                [(ngModel)]="filters.tenant"
                placeholder="Tenant name"
               class="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm">
           </div>

           <div>
             <label for="project" class="block text-sm font-medium text-gray-700">Project</label>
             <input
               type="text"
               id="project"
               [(ngModel)]="filters.project"
               placeholder="Project name"
               class="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm">
           </div>

           <div>
             <label for="category" class="block text-sm font-medium text-gray-700">Category</label>
             <input
               type="text"
               id="category"
               [(ngModel)]="filters.category"
               placeholder="Category name"
               class="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm">
           </div>
         </div>

         <div class="mt-6 flex space-x-3">
           <button
             type="button"
             (click)="generateReport()"
             [disabled]="loading"
             class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50">
             <svg *ngIf="loading" class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
               <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
               <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
             {{ loading ? 'Generating...' : 'Generate Report' }}
           </button>
           
           <button
             type="button"
             (click)="exportReport('csv')"
             [disabled]="!reportData.length || loading"
             class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50">
             Export CSV
           </button>
           
           <button
             type="button"
             (click)="exportReport('json')"
             [disabled]="!reportData.length || loading"
             class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50">
             Export JSON
           </button>
         </div>
       </div>
     </div>

     <!-- Results -->
     <div *ngIf="reportData.length > 0" class="bg-white shadow rounded-lg">
       <div class="px-4 py-5 sm:p-6">
         <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
           Report Results ({{ reportData.length }} tickets)
         </h3>
         
         <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
           <table class="min-w-full divide-y divide-gray-300">
             <thead class="bg-gray-50">
               <tr>
                 <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key</th>
                 <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                 <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                 <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                 <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignee</th>
                 <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                 <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resolved</th>
               </tr>
             </thead>
             <tbody class="bg-white divide-y divide-gray-200">
               <tr *ngFor="let ticket of reportData">
                 <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                   <a [routerLink]="['/tickets', ticket.key]" class="text-primary-600 hover:text-primary-900">
                     {{ ticket.key }}
                   </a>
                 </td>
                 <td class="px-6 py-4 text-sm text-gray-900">{{ ticket.title }}</td>
                 <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ ticket.status }}</td>
                 <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ ticket.priority }}</td>
                 <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ ticket.assigneeName || 'Unassigned' }}</td>
                 <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ ticket.createdAt | date:'short' }}</td>
                 <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ ticket.closedAt | date:'short' }}</td>
               </tr>
             </tbody>
           </table>
         </div>
       </div>
     </div>
   </div>
 `
})
export class ReportsComponent implements OnInit {
 filters: ReportFilters = {};
 reportData: any[] = [];
 loading = false;

 constructor(private reportService: ReportService) {}

 ngOnInit() {
   // Set default date range to last 30 days
   const today = new Date();
   const thirtyDaysAgo = new Date(today);
   thirtyDaysAgo.setDate(today.getDate() - 30);
   
   this.filters.dateFrom = thirtyDaysAgo.toISOString().split('T')[0];
   this.filters.dateTo = today.toISOString().split('T')[0];
 }

 async generateReport() {
   this.loading = true;
   try {
     this.reportData = await this.reportService.getIssuesReport(this.filters);
   } catch (error) {
     console.error('Failed to generate report:', error);
   } finally {
     this.loading = false;
   }
 }

 async exportReport(format: 'csv' | 'json') {
   try {
     const blob = await this.reportService.exportIssuesReport(this.filters, format);
     const url = window.URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `issues-report-${new Date().toISOString().split('T')[0]}.${format}`;
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
     window.URL.revokeObjectURL(url);
   } catch (error) {
     console.error('Failed to export report:', error);
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