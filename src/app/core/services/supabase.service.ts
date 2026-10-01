import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private client: SupabaseClient | null = null;
  private isConnectedSubject = new BehaviorSubject<boolean>(false);
  private statusMessageSubject = new BehaviorSubject<string>('Initializing...');
  private isConfiguredSubject = new BehaviorSubject<boolean>(false);

  public isConnected$: Observable<boolean> = this.isConnectedSubject.asObservable();
  public statusMessage$: Observable<string> = this.statusMessageSubject.asObservable();
  public isConfigured$: Observable<boolean> = this.isConfiguredSubject.asObservable();

  private supabaseUrl = environment.supabaseUrl;
  private supabaseKey = environment.supabaseKey;

  constructor() {
    this.initClient();
  }

  private initClient(): void {
    // Check if an anon key was stored in localStorage by the user
    const savedKey = localStorage.getItem('suit_rental_supabase_key');
    const effectiveKey = savedKey || this.supabaseKey;

    if (this.supabaseUrl && effectiveKey && effectiveKey.trim() !== '') {
      try {
        this.client = createClient(this.supabaseUrl, effectiveKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true
          }
        });
        this.isConfiguredSubject.next(true);
        this.testConnection();
      } catch (err: any) {
        console.warn('Supabase initialization failed:', err);
        this.statusMessageSubject.next('Failed to initialize: ' + (err.message || 'Unknown error'));
        this.isConnectedSubject.next(false);
      }
    } else {
      this.isConfiguredSubject.next(false);
      this.isConnectedSubject.next(false);
      this.statusMessageSubject.next('Demo / Local Storage Mode (Awaiting Supabase Anon Key)');
    }
  }

  public getClient(): SupabaseClient | null {
    return this.client;
  }

  public getUrl(): string {
    return this.supabaseUrl;
  }

  public getKey(): string {
    return localStorage.getItem('suit_rental_supabase_key') || this.supabaseKey || '';
  }

  public updateCredentials(url: string, key: string): Promise<boolean> {
    this.supabaseUrl = url;
    localStorage.setItem('suit_rental_supabase_url', url);
    localStorage.setItem('suit_rental_supabase_key', key);
    this.initClient();
    return this.testConnection();
  }

  public async testConnection(): Promise<boolean> {
    if (!this.client) {
      this.isConnectedSubject.next(false);
      this.statusMessageSubject.next('No Supabase client initialized. Running in Mock Mode.');
      return false;
    }

    try {
      this.statusMessageSubject.next('Connecting to Supabase...');
      // Query suits table to check connection
      const { data, error } = await this.client.from('suits').select('id').limit(1);
      if (error) {
        // Even if table doesn't exist yet, reaching Supabase means key is valid
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          this.isConnectedSubject.next(true);
          this.statusMessageSubject.next('Connected! (Tables not yet created, run supabase/schema.sql)');
          return true;
        }
        this.isConnectedSubject.next(false);
        this.statusMessageSubject.next(`Supabase error: ${error.message}`);
        return false;
      }
      this.isConnectedSubject.next(true);
      this.statusMessageSubject.next('Connected to live Supabase backend');
      return true;
    } catch (err: any) {
      this.isConnectedSubject.next(false);
      this.statusMessageSubject.next(`Connection failed: ${err.message || 'Network error'}`);
      return false;
    }
  }
}
