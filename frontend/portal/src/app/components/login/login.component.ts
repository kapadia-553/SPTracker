import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {{ getTitle() }}
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            {{ getSubtitle() }}
          </p>
        </div>
        
        <div *ngIf="message" class="rounded-md bg-green-50 p-4">
          <div class="text-sm text-green-700">{{ message }}</div>
        </div>
        
        <div *ngIf="error" class="rounded-md bg-red-50 p-4">
          <div class="text-sm text-red-700">{{ error }}</div>
        </div>

        <!-- User Type Selection -->
        <div *ngIf="!userType && !isConsumingToken" class="space-y-4">
          <button
            (click)="selectUserType('customer')"
            class="group relative w-full flex justify-center py-4 px-4 border-2 border-primary-300 text-sm font-medium rounded-lg text-primary-700 bg-white hover:bg-primary-50 hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
            <div class="text-center">
              <div class="text-lg font-semibold">Customer Portal</div>
              <div class="text-sm text-gray-500 mt-1">I need support for my services</div>
            </div>
          </button>
          
          <button
            (click)="selectUserType('internal')"
            class="group relative w-full flex justify-center py-4 px-4 border-2 border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors">
            <div class="text-center">
              <div class="text-lg font-semibold">Internal Access</div>
              <div class="text-sm text-gray-500 mt-1">I'm a team member or agent</div>
            </div>
          </button>
        </div>

        <!-- Login Form -->
        <form class="mt-8 space-y-6" [formGroup]="loginForm" (ngSubmit)="onSubmit()" *ngIf="userType && !isConsumingToken">
          <div>
            <label for="email" class="sr-only">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              formControlName="email"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
              placeholder="Email address">
          </div>
          <div *ngIf="userType === 'customer'">
            <label for="tenantSlug" class="sr-only">Organization</label>
            <input
              id="tenantSlug"
              name="tenantSlug"
              type="text"
              formControlName="tenantSlug"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
              placeholder="Your organization code">
          </div>

          <div class="flex space-x-3">
            <button
              type="button"
              (click)="goBack()"
              class="flex-1 flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              Back
            </button>
            <button
              type="submit"
              [disabled]="loading || loginForm.invalid"
              class="flex-1 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed">
              <span *ngIf="loading" class="absolute left-0 inset-y-0 flex items-center pl-3">
                <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              </span>
              {{ loading ? 'Sending...' : 'Send Magic Link' }}
            </button>
          </div>
        </form>

        <div *ngIf="isConsumingToken" class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p class="mt-4 text-sm text-gray-600">Signing you in...</p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  message = '';
  error = '';
  isConsumingToken = false;
  userType: 'customer' | 'internal' | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      tenantSlug: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Check if this is a magic link consumption
    const token = this.route.snapshot.queryParams['token'];
    if (token) {
      this.isConsumingToken = true;
      this.consumeMagicLink(token);
    }
  }

  async onSubmit() {
    if (this.loginForm.valid && !this.loading) {
      this.loading = true;
      this.error = '';
      this.message = '';

      try {
        if (this.userType === 'internal') {
          await this.authService.requestInternalMagicLink(
            this.loginForm.value.email
          );
        } else {
          await this.authService.requestMagicLink(
            this.loginForm.value.email,
            this.loginForm.value.tenantSlug
          );
        }
        this.message = 'Magic link sent! Check your email and click the link to sign in.';
      } catch (error: any) {
        this.error = error.message || 'An error occurred. Please try again.';
      } finally {
        this.loading = false;
      }
    }
  }

  private async consumeMagicLink(token: string) {
    try {
      await this.authService.consumeMagicLink(token);
      this.router.navigate(['/tickets']);
    } catch (error: any) {
      this.error = error.message || 'Invalid or expired magic link.';
      this.isConsumingToken = false;
    }
  }

  selectUserType(type: 'customer' | 'internal') {
    this.userType = type;
    this.error = '';
    this.message = '';
    
    if (type === 'internal') {
      this.loginForm.patchValue({ tenantSlug: '' });
      // Remove tenantSlug requirement for internal users
      this.loginForm.get('tenantSlug')?.clearValidators();
      this.loginForm.get('tenantSlug')?.updateValueAndValidity();
    } else {
      this.loginForm.patchValue({ tenantSlug: '' });
      // Add tenantSlug requirement for customer users
      this.loginForm.get('tenantSlug')?.setValidators([Validators.required]);
      this.loginForm.get('tenantSlug')?.updateValueAndValidity();
    }
  }

  goBack() {
    this.userType = null;
    this.error = '';
    this.message = '';
    this.loginForm.reset();
  }

  getTitle(): string {
    if (!this.userType) return 'Welcome to SP Track';
    return this.userType === 'customer' ? 'Customer Portal' : 'Internal Login';
  }

  getSubtitle(): string {
    if (!this.userType) return 'Choose your login type';
    return this.userType === 'customer' 
      ? 'Enter your email to access your support tickets'
      : 'Internal user access - enter your credentials';
  }
}