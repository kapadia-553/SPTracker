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
            {{ loginMethod === 'password' ? 'Agent/Admin Login' : 'Sign in with Magic Link' }}
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            {{ loginMethod === 'password' ? 'Sign in to SP Track Dashboard' : 'Enter your email to receive a magic link' }}
          </p>
        </div>

        <div *ngIf="message" class="rounded-md bg-green-50 p-4">
          <div class="text-sm text-green-700">{{ message }}</div>
        </div>

        <div *ngIf="error" class="rounded-md bg-red-50 p-4">
          <div class="text-sm text-red-700">{{ error }}</div>
        </div>

        <div *ngIf="!isConsumingToken">
          <!-- Login Method Toggle -->
          <div class="flex space-x-2 mb-6">
            <button
              (click)="setLoginMethod('password')"
              [class.bg-primary-600]="loginMethod === 'password'"
              [class.text-white]="loginMethod === 'password'"
              [class.bg-white]="loginMethod !== 'password'"
              [class.text-gray-700]="loginMethod !== 'password'"
              class="flex-1 py-2 px-4 border border-gray-300 text-sm font-medium rounded-md hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              Password
            </button>
            <button
              (click)="setLoginMethod('magic-link')"
              [class.bg-primary-600]="loginMethod === 'magic-link'"
              [class.text-white]="loginMethod === 'magic-link'"
              [class.bg-white]="loginMethod !== 'magic-link'"
              [class.text-gray-700]="loginMethod !== 'magic-link'"
              class="flex-1 py-2 px-4 border border-gray-300 text-sm font-medium rounded-md hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              Magic Link
            </button>
          </div>

          <!-- Password Login Form -->
          <form *ngIf="loginMethod === 'password'" class="mt-8 space-y-6" [formGroup]="loginForm" (ngSubmit)="onPasswordSubmit()">
            <div class="rounded-md shadow-sm -space-y-px">
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
              <div>
                <label for="password" class="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  formControlName="password"
                  required
                  class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Password">
              </div>
            </div>

            <div>
              <button
                type="submit"
                [disabled]="loading || loginForm.invalid"
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed">
                <span *ngIf="loading" class="absolute left-0 inset-y-0 flex items-center pl-3">
                  <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                </span>
                {{ loading ? 'Signing in...' : 'Sign in' }}
              </button>
            </div>
          </form>

          <!-- Magic Link Form -->
          <form *ngIf="loginMethod === 'magic-link'" class="mt-8 space-y-6" [formGroup]="magicLinkForm" (ngSubmit)="onMagicLinkSubmit()">
            <div>
              <label for="magic-email" class="sr-only">Email address</label>
              <input
                id="magic-email"
                name="email"
                type="email"
                formControlName="email"
                required
                class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Email address">
            </div>

            <div>
              <button
                type="submit"
                [disabled]="loading || magicLinkForm.invalid"
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed">
                <span *ngIf="loading" class="absolute left-0 inset-y-0 flex items-center pl-3">
                  <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                </span>
                {{ loading ? 'Sending...' : 'Send Magic Link' }}
              </button>
            </div>
          </form>
        </div>

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
  magicLinkForm: FormGroup;
  loading = false;
  message = '';
  error = '';
  isConsumingToken = false;
  loginMethod: 'password' | 'magic-link' = 'password';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    this.magicLinkForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
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

  setLoginMethod(method: 'password' | 'magic-link') {
    this.loginMethod = method;
    this.error = '';
    this.message = '';
  }

  async onPasswordSubmit() {
    if (this.loginForm.valid && !this.loading) {
      this.loading = true;
      this.error = '';

      try {
        await this.authService.login(
          this.loginForm.value.email,
          this.loginForm.value.password
        );
        this.router.navigate(['/dashboard']);
      } catch (error: any) {
        this.error = error.message || 'Invalid credentials. Please try again.';
      } finally {
        this.loading = false;
      }
    }
  }

  async onMagicLinkSubmit() {
    if (this.magicLinkForm.valid && !this.loading) {
      this.loading = true;
      this.error = '';
      this.message = '';

      try {
        await this.authService.requestInternalMagicLink(
          this.magicLinkForm.value.email
        );
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
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.error = error.message || 'Invalid or expired magic link.';
      this.isConsumingToken = false;
    }
  }
}