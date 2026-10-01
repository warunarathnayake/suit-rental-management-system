import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword = false;
  isLoading = false;
  isSupabaseLive = false;
  submitted = false;
  serverError = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    this.supabaseService.isConnected$.subscribe(c => this.isSupabaseLive = c);

    this.loginForm.valueChanges.subscribe(() => {
      if (this.serverError) {
        this.serverError = '';
      }
    });
  }

  get email() {
    return this.loginForm.get('email')!;
  }

  get password() {
    return this.loginForm.get('password')!;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  async onLogin(): Promise<void> {
    this.submitted = true;
    this.serverError = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    try {
      const emailVal = this.email.value?.trim() || '';
      const passVal = this.password.value || '';
      const res = await this.authService.login(emailVal, passVal);
      if (res.success) {
        this.router.navigate(['/dashboard']);
      } else {
        this.serverError = res.error || 'Invalid credentials. Please verify your email and password.';
      }
    } catch (err: any) {
      this.serverError = err.message || 'An unexpected error occurred during authentication.';
    } finally {
      this.isLoading = false;
    }
  }
}

