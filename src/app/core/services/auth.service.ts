import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  designation: string;
}

const STORAGE_KEY = 'tailorflow_auth_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  public currentUser$: Observable<AuthUser | null> = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    this.restoreSession();
  }

  private restoreSession(): void {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const user = JSON.parse(saved);
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
        return;
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    // Default demo user if none set
    const defaultUser: AuthUser = {
      id: 'usr-admin-01',
      email: 'admin@tailorflow.com',
      name: 'Admin',
      role: 'ADMIN',
      designation: 'Store Manager'
    };
    this.currentUserSubject.next(defaultUser);
    this.isAuthenticatedSubject.next(true);
  }

  public async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    // 1. If Supabase client is configured and connected, attempt Supabase Auth
    const client = this.supabaseService.getClient();
    if (client) {
      try {
        const { data, error } = await client.auth.signInWithPassword({
          email,
          password
        });

        if (!error && data.user) {
          const user: AuthUser = {
            id: data.user.id,
            email: data.user.email || email,
            name: data.user.user_metadata?.['name'] || email.split('@')[0],
            role: data.user.user_metadata?.['role'] || 'ADMIN',
            designation: data.user.user_metadata?.['designation'] || 'Store Manager'
          };
          this.setSession(user);
          return { success: true };
        }
      } catch (err: any) {
        console.warn('Supabase auth attempt failed, checking local credentials:', err);
      }
    }

    // 2. Demo credentials check
    if (!email || !password) {
      return { success: false, error: 'Please enter both email and password.' };
    }

    // Predefined demo accounts
    let user: AuthUser;
    if (email.toLowerCase().includes('tailor') || email.toLowerCase().includes('specialist')) {
      user = {
        id: 'usr-tailor-02',
        email,
        name: 'Marcus Vance',
        role: 'TAILOR',
        designation: 'Master Tailor'
      };
    } else {
      user = {
        id: 'usr-admin-01',
        email,
        name: 'Admin',
        role: 'ADMIN',
        designation: 'Store Manager'
      };
    }

    this.setSession(user);
    return { success: true };
  }

  private setSession(user: AuthUser): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  public logout(): void {
    const client = this.supabaseService.getClient();
    if (client) {
      client.auth.signOut().catch(() => {});
    }
    localStorage.removeItem(STORAGE_KEY);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  public get currentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  public get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }
}
