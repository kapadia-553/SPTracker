import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  userCount: number;
  projectCount: number;
  ticketCount: number;
}

export interface CreateTenantRequest {
  name: string;
  slug: string;
  timezone?: string;
  businessHoursJson?: string;
  logoUrl?: string;
}

export interface UpdateTenantRequest extends CreateTenantRequest {
  active: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isInternal: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  roles: UserRole[];
  ticketCount: number;
}

export interface UserRole {
  role: string;
  tenantId: string | null;
  tenantName: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  isInternal: boolean;
  roles?: UserRoleRequest[];
}

export interface UpdateUserRequest {
  name: string;
  email: string;
  isInternal: boolean;
  active: boolean;
  roles?: UserRoleRequest[];
}

export interface UserRoleRequest {
  tenantId: string | null;
  role: string;
}

export interface Project {
  id: string;
  key: string;
  name: string;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  ticketCount: number;
}

export interface CreateProjectRequest {
  key: string;
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  key: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface Category {
  id: string;
  name: string;
  tenantId: string;
  tenantName: string;
  parentId: string | null;
  parentName: string | null;
  createdAt: string;
  childCount: number;
  ticketCount: number;
}

export interface CreateCategoryRequest {
  tenantId: string;
  name: string;
  parentId?: string;
}

export interface UpdateCategoryRequest {
  name: string;
  parentId?: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  tenantId: string;
  tenantName: string;
  createdAt: string;
  ticketCount: number;
}

export interface CreateProductRequest {
  tenantId: string;
  code: string;
  name: string;
}

export interface UpdateProductRequest {
  code: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  // ===== TENANT MANAGEMENT =====
  
  getTenants(): Observable<Tenant[]> {
    return this.http.get<Tenant[]>(`${this.apiUrl}/tenants`);
  }

  getTenant(id: string): Observable<Tenant> {
    return this.http.get<Tenant>(`${this.apiUrl}/tenants/${id}`);
  }

  createTenant(request: CreateTenantRequest): Observable<Tenant> {
    return this.http.post<Tenant>(`${this.apiUrl}/tenants`, request);
  }

  updateTenant(id: string, request: UpdateTenantRequest): Observable<Tenant> {
    return this.http.put<Tenant>(`${this.apiUrl}/tenants/${id}`, request);
  }

  deleteTenant(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tenants/${id}`);
  }

  // ===== USER MANAGEMENT =====
  
  getUsers(tenantId?: string): Observable<User[]> {
    const params: { [key: string]: string } = {};
    if (tenantId) {
      params['tenantId'] = tenantId;
    }
    return this.http.get<User[]>(`${this.apiUrl}/users`, { params });
  }

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  createUser(request: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users`, request);
  }

  updateUser(id: string, request: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, request);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`);
  }

  // ===== PROJECT MANAGEMENT =====
  
  getProjects(tenantId?: string): Observable<Project[]> {
    const params: { [key: string]: string } = {};
    if (tenantId) {
      params['tenantId'] = tenantId;
    }
    return this.http.get<Project[]>(`${this.apiUrl}/projects`, { params });
  }

  getProject(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/projects/${id}`);
  }

  createProject(request: CreateProjectRequest): Observable<Project> {
    return this.http.post<Project>(`${this.apiUrl}/projects`, request);
  }

  updateProject(id: string, request: UpdateProjectRequest): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}/projects/${id}`, request);
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/projects/${id}`);
  }

  // ===== CATEGORY MANAGEMENT =====
  
  getCategories(tenantId?: string): Observable<Category[]> {
    const params: { [key: string]: string } = {};
    if (tenantId) {
      params['tenantId'] = tenantId;
    }
    return this.http.get<Category[]>(`${this.apiUrl}/categories`, { params });
  }

  getCategory(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/categories/${id}`);
  }

  createCategory(request: CreateCategoryRequest): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/categories`, request);
  }

  updateCategory(id: string, request: UpdateCategoryRequest): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/categories/${id}`, request);
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/categories/${id}`);
  }

  // ===== PRODUCT MANAGEMENT =====
  
  getProducts(tenantId?: string): Observable<Product[]> {
    const params: { [key: string]: string } = {};
    if (tenantId) {
      params['tenantId'] = tenantId;
    }
    return this.http.get<Product[]>(`${this.apiUrl}/products`, { params });
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }

  createProduct(request: CreateProductRequest): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, request);
  }

  updateProduct(id: string, request: UpdateProductRequest): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/products/${id}`, request);
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/products/${id}`);
  }
}