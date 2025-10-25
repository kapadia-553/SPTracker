import { Component, OnInit } from '@angular/core';
import { AdminService, Tenant, User, Project, Category, Product } from '../../services/admin.service';
import { PublicDataService } from '../../services/public-data.service';

@Component({
  selector: 'app-admin',
  template: `
    <div class="space-y-6">
      <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
          <h1 class="text-2xl font-semibold text-gray-900">Administration</h1>
          <p class="mt-2 text-sm text-gray-700">
            Manage tenants, users, projects, and system settings
          </p>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8">
          <button 
            *ngFor="let tab of tabs"
            (click)="activeTab = tab.key"
            [class]="activeTab === tab.key 
              ? 'border-primary-500 text-primary-600 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm'">
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- Overview Cards (shown when no specific tab is selected) -->
      <div *ngIf="activeTab === 'overview'" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-6">
            <h3 class="text-lg font-medium text-gray-900">Tenants</h3>
            <p class="mt-1 text-sm text-gray-500">{{ tenants.length }} organizations</p>
            <div class="mt-3">
              <button (click)="activeTab = 'tenants'" class="btn-primary">Manage Tenants</button>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-6">
            <h3 class="text-lg font-medium text-gray-900">Users</h3>
            <p class="mt-1 text-sm text-gray-500">{{ users.length }} total users</p>
            <div class="mt-3">
              <button (click)="activeTab = 'users'" class="btn-primary">Manage Users</button>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-6">
            <h3 class="text-lg font-medium text-gray-900">Projects</h3>
            <p class="mt-1 text-sm text-gray-500">{{ projects.length }} active projects</p>
            <div class="mt-3">
              <button (click)="activeTab = 'projects'" class="btn-primary">Manage Projects</button>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-6">
            <h3 class="text-lg font-medium text-gray-900">Categories</h3>
            <p class="mt-1 text-sm text-gray-500">{{ categories.length }} categories</p>
            <div class="mt-3">
              <button (click)="activeTab = 'categories'" class="btn-primary">Manage Categories</button>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-6">
            <h3 class="text-lg font-medium text-gray-900">Products</h3>
            <p class="mt-1 text-sm text-gray-500">{{ products.length }} products</p>
            <div class="mt-3">
              <button (click)="activeTab = 'products'" class="btn-primary">Manage Products</button>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-6">
            <h3 class="text-lg font-medium text-gray-900">System Settings</h3>
            <p class="mt-1 text-sm text-gray-500">Configure system-wide settings</p>
            <div class="mt-3">
              <button class="btn-secondary" disabled>Coming Soon</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tenant Management -->
      <div *ngIf="activeTab === 'tenants'" class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <div class="sm:flex sm:items-center">
            <div class="sm:flex-auto">
              <h3 class="text-lg leading-6 font-medium text-gray-900">Organizations</h3>
              <p class="mt-2 text-sm text-gray-700">Manage customer organizations and their settings.</p>
            </div>
            <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button (click)="showCreateTenantForm = true" class="btn-primary">Add Organization</button>
            </div>
          </div>
          
          <div class="mt-6 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table class="min-w-full divide-y divide-gray-300">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projects</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="relative px-6 py-3"><span class="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let tenant of tenants">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div>
                        <div class="text-sm font-medium text-gray-900">{{ tenant.name }}</div>
                        <div class="text-sm text-gray-500">{{ tenant.timezone }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ tenant.slug }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ tenant.userCount }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ tenant.projectCount }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ tenant.ticketCount }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span [class]="tenant.active 
                      ? 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800'
                      : 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800'">
                      {{ tenant.active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button (click)="editTenant(tenant)" class="text-primary-600 hover:text-primary-900 mr-3">Edit</button>
                    <button (click)="deleteTenant(tenant.id)" class="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Users Management -->
      <div *ngIf="activeTab === 'users'" class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <div class="sm:flex sm:items-center">
            <div class="sm:flex-auto">
              <h3 class="text-lg leading-6 font-medium text-gray-900">Users</h3>
              <p class="mt-2 text-sm text-gray-700">Manage system users and their roles.</p>
            </div>
            <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button (click)="showCreateUserForm = true" class="btn-primary">Add User</button>
            </div>
          </div>
          
          <div class="mt-6 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table class="min-w-full divide-y divide-gray-300">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="relative px-6 py-3"><span class="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let user of users">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div>
                        <div class="text-sm font-medium text-gray-900">{{ user.name }}</div>
                        <div class="text-sm text-gray-500">{{ user.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span [class]="user.isInternal
                      ? 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800'
                      : 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800'">
                      {{ user.isInternal ? 'Internal' : 'External' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div *ngFor="let role of user.roles" class="text-xs">
                      {{ role.role }} - {{ role.tenantName }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ user.ticketCount }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span [class]="user.active 
                      ? 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800'
                      : 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800'">
                      {{ user.active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button (click)="editUser(user)" class="text-primary-600 hover:text-primary-900 mr-3">Edit</button>
                    <button (click)="deleteUser(user.id)" class="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Projects Management -->
      <div *ngIf="activeTab === 'projects'" class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <div class="sm:flex sm:items-center">
            <div class="sm:flex-auto">
              <h3 class="text-lg leading-6 font-medium text-gray-900">Projects</h3>
              <p class="mt-2 text-sm text-gray-700">Manage projects across all organizations.</p>
            </div>
            <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button (click)="showCreateProjectForm = true" class="btn-primary">Add Project</button>
            </div>
          </div>
          
          <div class="mt-6 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table class="min-w-full divide-y divide-gray-300">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="relative px-6 py-3"><span class="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let project of projects">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div>
                        <div class="text-sm font-medium text-gray-900">{{ project.name }}</div>
                        <div class="text-sm text-gray-500">{{ project.description || 'No description' }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {{ project.key }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ project.ticketCount }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span [class]="project.active 
                      ? 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800'
                      : 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800'">
                      {{ project.active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button (click)="editProject(project)" class="text-primary-600 hover:text-primary-900 mr-3">Edit</button>
                    <button (click)="deleteProject(project.id)" class="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Categories Management -->
      <div *ngIf="activeTab === 'categories'" class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <div class="sm:flex sm:items-center">
            <div class="sm:flex-auto">
              <h3 class="text-lg leading-6 font-medium text-gray-900">Categories</h3>
              <p class="mt-2 text-sm text-gray-700">Manage ticket categories with hierarchical structure.</p>
            </div>
            <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button (click)="showCreateCategoryForm = true" class="btn-primary">Add Category</button>
            </div>
          </div>
          
          <div class="mt-6 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table class="min-w-full divide-y divide-gray-300">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Children</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets</th>
                  <th class="relative px-6 py-3"><span class="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let category of categories">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div>
                        <div class="text-sm font-medium text-gray-900">{{ category.name }}</div>
                        <div class="text-sm text-gray-500">{{ category.createdAt | date:'short' }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ category.tenantName }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ category.parentName || 'Root Category' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ category.childCount }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ category.ticketCount }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button (click)="editCategory(category)" class="text-primary-600 hover:text-primary-900 mr-3">Edit</button>
                    <button (click)="deleteCategory(category.id)" class="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Products Management -->
      <div *ngIf="activeTab === 'products'" class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <div class="sm:flex sm:items-center">
            <div class="sm:flex-auto">
              <h3 class="text-lg leading-6 font-medium text-gray-900">Products</h3>
              <p class="mt-2 text-sm text-gray-700">Manage products across all organizations.</p>
            </div>
            <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button (click)="showCreateProductForm = true" class="btn-primary">Add Product</button>
            </div>
          </div>
          
          <div class="mt-6 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table class="min-w-full divide-y divide-gray-300">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th class="relative px-6 py-3"><span class="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let product of products">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div>
                        <div class="text-sm font-medium text-gray-900">{{ product.name }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                      {{ product.code }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ product.tenantName }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ product.ticketCount }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ product.createdAt | date:'short' }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button (click)="editProduct(product)" class="text-primary-600 hover:text-primary-900 mr-3">Edit</button>
                    <button (click)="deleteProduct(product.id)" class="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Create Organization Modal -->
      <div *ngIf="showCreateTenantForm" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Add Organization</h3>
          <form (ngSubmit)="createTenant()" #tenantForm="ngForm">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700">Name</label>
              <input type="text" [(ngModel)]="newTenant.name" name="name" required
                     class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700">Slug</label>
              <input type="text" [(ngModel)]="newTenant.slug" name="slug" required pattern="^[a-z0-9-]+$"
                     class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
              <p class="mt-1 text-sm text-gray-500">Lowercase letters, numbers, and hyphens only</p>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700">Timezone</label>
              <select [(ngModel)]="newTenant.timezone" name="timezone"
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
                <option value="UTC">UTC</option>
                <option value="Asia/Dubai">Asia/Dubai</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
              </select>
            </div>
            <div class="flex justify-end space-x-2">
              <button type="button" (click)="cancelCreateTenant()" class="btn-secondary">Cancel</button>
              <button type="submit" [disabled]="!tenantForm.valid" class="btn-primary">Create</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Edit Organization Modal -->
      <div *ngIf="showEditTenantForm" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Edit Organization</h3>
          <form (ngSubmit)="updateTenant()" #editTenantForm="ngForm">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700">Name</label>
              <input type="text" [(ngModel)]="editingTenant.name" name="name" required
                     class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700">Slug</label>
              <input type="text" [(ngModel)]="editingTenant.slug" name="slug" required pattern="^[a-z0-9-]+$"
                     class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
              <p class="mt-1 text-sm text-gray-500">Lowercase letters, numbers, and hyphens only</p>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700">Timezone</label>
              <select [(ngModel)]="editingTenant.timezone" name="timezone"
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
                <option value="UTC">UTC</option>
                <option value="Asia/Dubai">Asia/Dubai</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
              </select>
            </div>
            <div class="mb-4">
              <label class="flex items-center">
                <input type="checkbox" [(ngModel)]="editingTenant.active" name="active"
                       class="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500">
                <span class="ml-2 text-sm text-gray-700">Active</span>
              </label>
            </div>
            <div class="flex justify-end space-x-2">
              <button type="button" (click)="cancelEditTenant()" class="btn-secondary">Cancel</button>
              <button type="submit" [disabled]="!editTenantForm.valid" class="btn-primary">Update</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Edit User Modal -->
      <div *ngIf="showEditUserForm" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Edit User</h3>
          <form (ngSubmit)="updateUser()" #editUserForm="ngForm">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700">Name</label>
              <input type="text" [(ngModel)]="editingUser.name" name="name" required
                     class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" [(ngModel)]="editingUser.email" name="email" required
                     class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
            </div>
            <div class="mb-4">
              <label class="flex items-center">
                <input type="checkbox" [(ngModel)]="editingUser.isInternal" name="isInternal"
                       class="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500">
                <span class="ml-2 text-sm text-gray-700">Internal User</span>
              </label>
            </div>
            <div class="mb-4">
              <label class="flex items-center">
                <input type="checkbox" [(ngModel)]="editingUser.active" name="active"
                       class="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500">
                <span class="ml-2 text-sm text-gray-700">Active</span>
              </label>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Roles</label>
              <div class="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                <div *ngFor="let role of availableRoles" class="flex flex-col">
                  <label class="flex items-start">
                    <input type="checkbox"
                           [value]="role.value"
                           [checked]="isRoleSelected(role.value)"
                           (change)="onEditRoleChange(role.value, $event)"
                           class="mt-1 rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500">
                    <div class="ml-2">
                      <span class="text-sm font-medium text-gray-900">{{ role.label }}</span>
                      <p class="text-xs text-gray-500">{{ role.description }}</p>
                    </div>
                  </label>
                </div>
              </div>
              <div class="mt-2" *ngIf="hasCustomerRole()">
                <label class="block text-sm font-medium text-gray-700">Organization (required for CustomerUser role)</label>
                <select [(ngModel)]="editingUser.selectedTenantId" name="selectedTenantId" required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
                  <option value="">Select Organization</option>
                  <option *ngFor="let tenant of tenants" [value]="tenant.id">{{ tenant.name }}</option>
                </select>
                <p class="mt-1 text-xs text-gray-500">CustomerUser role requires an organization assignment</p>
              </div>
            </div>
            <div class="flex justify-end space-x-2">
              <button type="button" (click)="cancelEditUser()" class="btn-secondary">Cancel</button>
              <button type="submit" [disabled]="!editUserForm.valid" class="btn-primary">Update</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Create User Modal -->
      <div *ngIf="showCreateUserForm" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Add User</h3>
          <form (ngSubmit)="createUser()" #userForm="ngForm">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700">Name</label>
              <input type="text" [(ngModel)]="newUser.name" name="name" required
                     class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" [(ngModel)]="newUser.email" name="email" required
                     class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" [(ngModel)]="newUser.password" name="password" required minlength="8"
                     class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
            </div>
            <div class="mb-4">
              <label class="flex items-center">
                <input type="checkbox" [(ngModel)]="newUser.isInternal" name="isInternal"
                       class="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500">
                <span class="ml-2 text-sm text-gray-700">Internal User</span>
              </label>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Roles</label>
              <div class="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                <div *ngFor="let role of availableRoles" class="flex flex-col">
                  <label class="flex items-start">
                    <input type="checkbox" 
                           [value]="role.value"
                           (change)="onRoleChange(role.value, $event)"
                           class="mt-1 rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500">
                    <div class="ml-2">
                      <span class="text-sm font-medium text-gray-900">{{ role.label }}</span>
                      <p class="text-xs text-gray-500">{{ role.description }}</p>
                    </div>
                  </label>
                </div>
              </div>
              <div class="mt-2" *ngIf="hasNewUserCustomerRole()">
                <label class="block text-sm font-medium text-gray-700">Organization (required for CustomerUser role)</label>
                <select [(ngModel)]="newUser.selectedTenantId" name="selectedTenantId" required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
                  <option value="">Select Organization</option>
                  <option *ngFor="let tenant of tenants" [value]="tenant.id">{{ tenant.name }}</option>
                </select>
                <p class="mt-1 text-xs text-gray-500">CustomerUser role requires an organization assignment</p>
              </div>
            </div>
            <div class="flex justify-end space-x-2">
              <button type="button" (click)="cancelCreateUser()" class="btn-secondary">Cancel</button>
              <button type="submit" [disabled]="!userForm.valid" class="btn-primary">Create</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Create Project Modal -->
      <div *ngIf="showCreateProjectForm" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Add Project</h3>
          <form (ngSubmit)="createProject()" #projectForm="ngForm">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700">Project Key</label>
              <input type="text" [(ngModel)]="newProject.key" name="key" required pattern="^[A-Z0-9]+$" maxlength="10"
                     class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
              <p class="mt-1 text-sm text-gray-500">Uppercase letters and numbers only (e.g., DEMO, PROJ1)</p>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700">Name</label>
              <input type="text" [(ngModel)]="newProject.name" name="name" required
                     class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700">Description</label>
              <textarea [(ngModel)]="newProject.description" name="description" rows="3"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"></textarea>
            </div>
            <div class="flex justify-end space-x-2">
              <button type="button" (click)="cancelCreateProject()" class="btn-secondary">Cancel</button>
              <button type="submit" [disabled]="!projectForm.valid" class="btn-primary">Create</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Create Category Modal -->
      <div *ngIf="showCreateCategoryForm" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Add Category</h3>
          <form (ngSubmit)="createCategory()" #categoryForm="ngForm">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700">Organization</label>
              <select [(ngModel)]="newCategory.tenantId" name="tenantId" required
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
                <option value="">Select Organization</option>
                <option *ngFor="let tenant of tenants" [value]="tenant.id">{{ tenant.name }}</option>
              </select>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700">Name</label>
              <input type="text" [(ngModel)]="newCategory.name" name="name" required
                     class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700">Parent Category</label>
              <select [(ngModel)]="newCategory.parentId" name="parentId"
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
                <option value="">No Parent (Root Category)</option>
                <option *ngFor="let category of getFilteredCategories()" [value]="category.id">
                  {{ category.name }}
                </option>
              </select>
            </div>
            <div class="flex justify-end space-x-2">
              <button type="button" (click)="cancelCreateCategory()" class="btn-secondary">Cancel</button>
              <button type="submit" [disabled]="!categoryForm.valid" class="btn-primary">Create</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Create Product Modal -->
      <div *ngIf="showCreateProductForm" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Add Product</h3>
          <form (ngSubmit)="createProduct()" #productForm="ngForm">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700">Organization</label>
              <select [(ngModel)]="newProduct.tenantId" name="tenantId" required
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
                <option value="">Select Organization</option>
                <option *ngFor="let tenant of tenants" [value]="tenant.id">{{ tenant.name }}</option>
              </select>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700">Product Code</label>
              <input type="text" [(ngModel)]="newProduct.code" name="code" required pattern="^[A-Z0-9-_]+$" maxlength="20"
                     class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
              <p class="mt-1 text-sm text-gray-500">Uppercase letters, numbers, hyphens, and underscores only</p>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700">Name</label>
              <input type="text" [(ngModel)]="newProduct.name" name="name" required
                     class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
            </div>
            <div class="flex justify-end space-x-2">
              <button type="button" (click)="cancelCreateProduct()" class="btn-secondary">Cancel</button>
              <button type="submit" [disabled]="!productForm.valid" class="btn-primary">Create</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Edit Project Modal -->
      <div *ngIf="showEditProjectForm" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Edit Project</h3>
          <form (ngSubmit)="updateProject()" #editProjectForm="ngForm">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700">Project Key</label>
              <input type="text" [(ngModel)]="editingProject.key" name="key" required pattern="^[A-Z0-9]+$" maxlength="10"
                     class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
              <p class="mt-1 text-sm text-gray-500">Uppercase letters and numbers only (e.g., DEMO, PROJ1)</p>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700">Name</label>
              <input type="text" [(ngModel)]="editingProject.name" name="name" required
                     class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700">Description</label>
              <textarea [(ngModel)]="editingProject.description" name="description" rows="3"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"></textarea>
            </div>
            <div class="mb-4">
              <label class="flex items-center">
                <input type="checkbox" [(ngModel)]="editingProject.active" name="active"
                       class="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500">
                <span class="ml-2 text-sm text-gray-700">Active</span>
              </label>
            </div>
            <div class="flex justify-end space-x-2">
              <button type="button" (click)="cancelEditProject()" class="btn-secondary">Cancel</button>
              <button type="submit" [disabled]="!editProjectForm.valid" class="btn-primary">Update</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Edit Category Modal -->
      <div *ngIf="showEditCategoryForm" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Edit Category</h3>
          <form (ngSubmit)="updateCategory()" #editCategoryForm="ngForm">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700">Name</label>
              <input type="text" [(ngModel)]="editingCategory.name" name="name" required
                     class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700">Parent Category</label>
              <select [(ngModel)]="editingCategory.parentId" name="parentId"
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
                <option value="">No Parent (Root Category)</option>
                <option *ngFor="let category of categories" [value]="category.id">
                  {{ category.name }}
                </option>
              </select>
            </div>
            <div class="flex justify-end space-x-2">
              <button type="button" (click)="cancelEditCategory()" class="btn-secondary">Cancel</button>
              <button type="submit" [disabled]="!editCategoryForm.valid" class="btn-primary">Update</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Edit Product Modal -->
      <div *ngIf="showEditProductForm" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Edit Product</h3>
          <form (ngSubmit)="updateProduct()" #editProductForm="ngForm">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700">Product Code</label>
              <input type="text" [(ngModel)]="editingProduct.code" name="code" required pattern="^[A-Z0-9-_]+$" maxlength="20"
                     class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
              <p class="mt-1 text-sm text-gray-500">Uppercase letters, numbers, hyphens, and underscores only</p>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700">Name</label>
              <input type="text" [(ngModel)]="editingProduct.name" name="name" required
                     class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
            </div>
            <div class="flex justify-end space-x-2">
              <button type="button" (click)="cancelEditProduct()" class="btn-secondary">Cancel</button>
              <button type="submit" [disabled]="!editProductForm.valid" class="btn-primary">Update</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class AdminComponent implements OnInit {
  activeTab = 'overview';
  
  tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'tenants', label: 'Organizations' },
    { key: 'users', label: 'Users' },
    { key: 'projects', label: 'Projects' },
    { key: 'categories', label: 'Categories' },
    { key: 'products', label: 'Products' }
  ];

  tenants: Tenant[] = [];
  users: User[] = [];
  projects: Project[] = [];
  categories: Category[] = [];
  products: Product[] = [];

  showCreateTenantForm = false;
  showCreateUserForm = false;
  showCreateProjectForm = false;
  showCreateCategoryForm = false;
  showCreateProductForm = false;
  showEditTenantForm = false;
  showEditUserForm = false;
  showEditProjectForm = false;
  showEditCategoryForm = false;
  showEditProductForm = false;

  // Form data objects
  newTenant: any = { name: '', slug: '', timezone: 'UTC' };
  editingTenant: any = { id: '', name: '', slug: '', timezone: 'UTC', active: true };
  newUser: any = { name: '', email: '', password: '', isInternal: false, roles: [] };
  newProject: any = { key: '', name: '', description: '' };
  newCategory: any = { tenantId: '', name: '', parentId: null };
  newProduct: any = { tenantId: '', code: '', name: '' };
  editingUser: any = { id: '', name: '', email: '', isInternal: false, active: true, roles: [] };
  editingProject: any = { id: '', key: '', name: '', description: '', active: true };
  editingCategory: any = { id: '', name: '', parentId: null };
  editingProduct: any = { id: '', code: '', name: '' };

  // Available roles in the system
  availableRoles = [
    { value: 'Admin', label: 'Admin', description: 'Full system administrator' },
    { value: 'TeamLead', label: 'Team Lead', description: 'Team leader with project creation privileges' },
    { value: 'Agent', label: 'Agent', description: 'Support agent within organization' },
    { value: 'CustomerUser', label: 'Customer User', description: 'Regular user within organization' }
  ];

  constructor(private adminService: AdminService, private publicDataService: PublicDataService) {}

  ngOnInit() {
    this.loadData();
  }

   loadData() {
    console.log('Loading data from admin API endpoints...');

    // Load tenants from public endpoint
    this.publicDataService.getTenants().subscribe({
      next: (tenants) => {
        this.tenants = tenants;
        console.log('Tenants loaded:', tenants.length);
      },
      error: (error) => {
        console.error('Error loading tenants:', error);
        this.tenants = [];
      }
    });

    // Load users from public endpoint
    this.publicDataService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        console.log('Users loaded:', users.length);
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.users = [];
      }
    });

    // Load projects from admin endpoint
    this.adminService.getProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
        console.log('Projects loaded:', projects.length);
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.projects = [];
      }
    });

    // Load categories from admin endpoint
    this.adminService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        console.log('Categories loaded:', categories.length);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.categories = [];
      }
    });

    // Load products from admin endpoint
    this.adminService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        console.log('Products loaded:', products.length);
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.products = [];
      }
    });
  }

  editTenant(tenant: Tenant) {
    this.editingTenant = {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      timezone: tenant.timezone,
      active: tenant.active
    };
    this.showEditTenantForm = true;
  }

  updateTenant() {
    this.adminService.updateTenant(this.editingTenant.id, this.editingTenant).subscribe({
      next: () => {
        this.showEditTenantForm = false;
        this.resetEditingTenant();
        this.loadData();
      },
      error: error => this.handleCreateError(error, 'organization')
    });
  }

  cancelEditTenant() {
    this.showEditTenantForm = false;
    this.resetEditingTenant();
  }

  resetEditingTenant() {
    this.editingTenant = { id: '', name: '', slug: '', timezone: 'UTC', active: true };
  }

  // ===== USER UPDATE METHODS =====
  
  updateUser() {
    // Convert roles to the format expected by the backend
    const userRequest = {
      name: this.editingUser.name,
      email: this.editingUser.email,
      isInternal: this.editingUser.isInternal,
      active: this.editingUser.active,
      roles: this.editingUser.roles
        .filter((role: any) => role && (role.role || role)) // Filter out empty roles
        .map((role: any) => {
          const roleValue = role.role || role;
          return {
            role: roleValue,
            tenantId: roleValue === 'CustomerUser' && this.editingUser.selectedTenantId
              ? this.editingUser.selectedTenantId
              : null
          };
        })
    };

    console.log('Updating user with request:', userRequest);
    console.log('User ID:', this.editingUser.id);

    this.adminService.updateUser(this.editingUser.id, userRequest).subscribe({
      next: (response) => {
        console.log('User update successful:', response);
        this.showEditUserForm = false;
        this.resetEditingUser();
        this.loadData();
      },
      error: error => {
        console.error('User update error:', error);
        this.handleCreateError(error, 'user');
      }
    });
  }

  cancelEditUser() {
    this.showEditUserForm = false;
    this.resetEditingUser();
  }

  resetEditingUser() {
    this.editingUser = { id: '', name: '', email: '', isInternal: false, active: true, roles: [], selectedTenantId: '' };
  }

  isRoleSelected(roleValue: string): boolean {
    return this.editingUser.roles && this.editingUser.roles.some((role: any) => role.role === roleValue);
  }

  onEditRoleChange(roleValue: string, event: any) {
    if (!this.editingUser.roles) {
      this.editingUser.roles = [];
    }

    if (event.target.checked) {
      // Add role if not already present
      if (!this.editingUser.roles.some((role: any) => role.role === roleValue)) {
        this.editingUser.roles.push({
          role: roleValue,
          tenantId: null // Will be set based on organization selection
        });
      }

      // Clear organization selection when selecting non-customer roles
      if (roleValue !== 'CustomerUser') {
        this.editingUser.selectedTenantId = '';
      }
    } else {
      // Remove role
      this.editingUser.roles = this.editingUser.roles.filter((role: any) => role.role !== roleValue);
      // Clear tenant selection if no customer role
      if (roleValue === 'CustomerUser') {
        this.editingUser.selectedTenantId = '';
      }
    }

    // If no CustomerUser role is selected, clear the organization
    if (!this.hasCustomerRole()) {
      this.editingUser.selectedTenantId = '';
    }
  }

  hasCustomerRole(): boolean {
    return this.editingUser.roles && this.editingUser.roles.some((role: any) => role.role === 'CustomerUser');
  }

  hasNewUserCustomerRole(): boolean {
    return this.newUser.roles && this.newUser.roles.includes('CustomerUser');
  }

  // ===== PROJECT UPDATE METHODS =====
  
  updateProject() {
    this.adminService.updateProject(this.editingProject.id, this.editingProject).subscribe({
      next: () => {
        this.showEditProjectForm = false;
        this.resetEditingProject();
        this.loadData();
      },
      error: error => this.handleCreateError(error, 'project')
    });
  }

  cancelEditProject() {
    this.showEditProjectForm = false;
    this.resetEditingProject();
  }

  resetEditingProject() {
    this.editingProject = { id: '', key: '', name: '', description: '', active: true };
  }

  // ===== CATEGORY UPDATE METHODS =====
  
  updateCategory() {
    this.adminService.updateCategory(this.editingCategory.id, this.editingCategory).subscribe({
      next: () => {
        this.showEditCategoryForm = false;
        this.resetEditingCategory();
        this.loadData();
      },
      error: error => this.handleCreateError(error, 'category')
    });
  }

  cancelEditCategory() {
    this.showEditCategoryForm = false;
    this.resetEditingCategory();
  }

  resetEditingCategory() {
    this.editingCategory = { id: '', name: '', parentId: null };
  }

  // ===== PRODUCT UPDATE METHODS =====
  
  updateProduct() {
    this.adminService.updateProduct(this.editingProduct.id, this.editingProduct).subscribe({
      next: () => {
        this.showEditProductForm = false;
        this.resetEditingProduct();
        this.loadData();
      },
      error: error => this.handleCreateError(error, 'product')
    });
  }

  cancelEditProduct() {
    this.showEditProductForm = false;
    this.resetEditingProduct();
  }

  resetEditingProduct() {
    this.editingProduct = { id: '', code: '', name: '' };
  }

  deleteTenant(id: string) {
    if (confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      this.adminService.deleteTenant(id).subscribe({
        next: () => {
          this.loadData();
          alert('Organization deleted successfully.');
        },
        error: error => {
          console.error('Error deleting organization:', error);
          let message = 'Error deleting organization. ';
          if (error.status === 400 && error.error?.message) {
            message += error.error.message;
          } else if (error.status === 404) {
            message += 'Organization not found.';
          } else {
            message += 'Please try again.';
          }
          alert(message);
        }
      });
    }
  }

  editUser(user: User) {
    this.editingUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      isInternal: user.isInternal,
      active: user.active,
      roles: user.roles || [],
      selectedTenantId: user.roles && user.roles.length > 0 ? user.roles[0].tenantId : ''
    };
    this.showEditUserForm = true;
  }

  deleteUser(id: string) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.adminService.deleteUser(id).subscribe({
        next: () => this.loadData(),
        error: error => console.error('Error deleting user:', error)
      });
    }
  }

  // ===== PROJECT MANAGEMENT METHODS =====
  
  editProject(project: Project) {
    this.editingProject = {
      id: project.id,
      key: project.key,
      name: project.name,
      description: project.description,
      active: project.active
    };
    this.showEditProjectForm = true;
  }

  deleteProject(id: string) {
    if (confirm('Are you sure you want to delete this project?')) {
      this.adminService.deleteProject(id).subscribe({
        next: () => this.loadData(),
        error: error => {
          console.error('Error deleting project:', error);
          alert('Cannot delete project. It may have existing tickets.');
        }
      });
    }
  }

  // ===== CATEGORY MANAGEMENT METHODS =====
  
  editCategory(category: Category) {
    this.editingCategory = {
      id: category.id,
      name: category.name,
      parentId: category.parentId
    };
    this.showEditCategoryForm = true;
  }

  deleteCategory(id: string) {
    if (confirm('Are you sure you want to delete this category?')) {
      this.adminService.deleteCategory(id).subscribe({
        next: () => this.loadData(),
        error: error => {
          console.error('Error deleting category:', error);
          alert('Cannot delete category. It may have existing tickets or child categories.');
        }
      });
    }
  }

  // ===== PRODUCT MANAGEMENT METHODS =====
  
  editProduct(product: Product) {
    this.editingProduct = {
      id: product.id,
      code: product.code,
      name: product.name
    };
    this.showEditProductForm = true;
  }

  deleteProduct(id: string) {
    if (confirm('Are you sure you want to delete this product?')) {
      this.adminService.deleteProduct(id).subscribe({
        next: () => this.loadData(),
        error: error => {
          console.error('Error deleting product:', error);
          alert('Cannot delete product. It may have existing tickets.');
        }
      });
    }
  }

  // ===== CREATE FORM METHODS =====

  // Tenant/Organization methods
  createTenant() {
    this.adminService.createTenant(this.newTenant).subscribe({
      next: () => {
        this.showCreateTenantForm = false;
        this.resetNewTenant();
        this.loadData();
      },
      error: error => this.handleCreateError(error, 'organization')
    });
  }

  cancelCreateTenant() {
    this.showCreateTenantForm = false;
    this.resetNewTenant();
  }

  resetNewTenant() {
    this.newTenant = { name: '', slug: '', timezone: 'UTC' };
  }

  // User methods
  createUser() {
    // Convert roles to the format expected by the backend
    const userRequest = {
      name: this.newUser.name,
      email: this.newUser.email,
      password: this.newUser.password,
      isInternal: this.newUser.isInternal,
      roles: this.newUser.roles
        .filter((role: string) => role) // Filter out empty roles
        .map((role: string) => ({
          role: role,
          tenantId: role === 'CustomerUser' && this.newUser.selectedTenantId
            ? this.newUser.selectedTenantId
            : null
        }))
    };

    this.adminService.createUser(userRequest).subscribe({
      next: () => {
        this.showCreateUserForm = false;
        this.resetNewUser();
        this.loadData();
      },
      error: error => this.handleCreateError(error, 'user')
    });
  }

  cancelCreateUser() {
    this.showCreateUserForm = false;
    this.resetNewUser();
  }

  resetNewUser() {
    this.newUser = { name: '', email: '', password: '', isInternal: false, roles: [], selectedTenantId: '' };
  }

  onRoleChange(roleValue: string, event: any) {
    if (event.target.checked) {
      if (!this.newUser.roles.includes(roleValue)) {
        this.newUser.roles.push(roleValue);
      }

      // Clear organization selection when selecting non-customer roles
      if (roleValue !== 'CustomerUser') {
        this.newUser.selectedTenantId = '';
      }
    } else {
      this.newUser.roles = this.newUser.roles.filter((role: string) => role !== roleValue);
      // Clear tenant selection if no customer role
      if (roleValue === 'CustomerUser') {
        this.newUser.selectedTenantId = '';
      }
    }

    // If no CustomerUser role is selected, clear the organization
    if (!this.hasNewUserCustomerRole()) {
      this.newUser.selectedTenantId = '';
    }
  }


  // Project methods
  createProject() {
    // The backend expects AdminCreateProjectRequest
    const projectRequest = {
      key: this.newProject.key,
      name: this.newProject.name,
      description: this.newProject.description
    };
    
    this.adminService.createProject(projectRequest).subscribe({
      next: () => {
        this.showCreateProjectForm = false;
        this.resetNewProject();
        this.loadData();
      },
      error: error => this.handleCreateError(error, 'project')
    });
  }

  cancelCreateProject() {
    this.showCreateProjectForm = false;
    this.resetNewProject();
  }

  resetNewProject() {
    this.newProject = { key: '', name: '', description: '' };
  }

  // Category methods
  createCategory() {
    // Convert empty string to null for parentId
    let parentId = this.newCategory.parentId === '' ? null : this.newCategory.parentId;
    
    const categoryRequest = {
      tenantId: this.newCategory.tenantId,
      name: this.newCategory.name,
      parentId: parentId
    };

    this.adminService.createCategory(categoryRequest).subscribe({
      next: () => {
        this.showCreateCategoryForm = false;
        this.resetNewCategory();
        this.loadData();
      },
      error: error => this.handleCreateError(error, 'category')
    });
  }

  cancelCreateCategory() {
    this.showCreateCategoryForm = false;
    this.resetNewCategory();
  }

  resetNewCategory() {
    this.newCategory = { tenantId: '', name: '', parentId: null };
  }

  // Product methods
  createProduct() {
    const productRequest = {
      tenantId: this.newProduct.tenantId,
      code: this.newProduct.code,
      name: this.newProduct.name
    };

    this.adminService.createProduct(productRequest).subscribe({
      next: () => {
        this.showCreateProductForm = false;
        this.resetNewProduct();
        this.loadData();
      },
      error: error => this.handleCreateError(error, 'product')
    });
  }

  cancelCreateProduct() {
    this.showCreateProductForm = false;
    this.resetNewProduct();
  }

  resetNewProduct() {
    this.newProduct = { tenantId: '', code: '', name: '' };
  }

  // Helper method for filtering categories in template
  getFilteredCategories(): Category[] {
    if (!this.newCategory.tenantId) return [];
    return this.categories.filter(c => c.tenantId === this.newCategory.tenantId);
  }

  // Helper method for standardized error handling
  private handleCreateError(error: any, entityType: string): void {
    console.error(`Error creating ${entityType}:`, error);
    let message = `Error creating ${entityType}. `;
    
    if (error.status === 401) {
      message += 'Authentication required. Please login as admin first.';
    } else if (error.status === 403) {
      message += 'Access denied. Admin privileges required.';
    } else if (error.status === 400) {
      // Handle validation errors
      if (error.error?.errors) {
        // .NET model validation errors
        const validationErrors = [];
        for (const [field, errors] of Object.entries(error.error.errors)) {
          if (Array.isArray(errors)) {
            validationErrors.push(...(errors as string[]));
          }
        }
        if (validationErrors.length > 0) {
          message += validationErrors.join('. ');
        } else {
          message += 'Validation failed.';
        }
      } else if (error.error?.message) {
        // Custom error messages
        message += error.error.message;
      } else if (typeof error.error === 'string') {
        message += error.error;
      } else {
        message += 'Invalid data provided.';
      }
    } else if (error.error && error.error.message) {
      message += error.error.message;
    } else if (error.message) {
      message += error.message;
    } else {
      message += 'Please check the form data and try again.';
    }
    
    alert(message);
  }
}