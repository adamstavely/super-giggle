import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ThemeMode = 'light' | 'dark' | 'high-contrast';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeSubject = new BehaviorSubject<ThemeMode>(this.getInitialTheme());
  public theme$: Observable<ThemeMode> = this.themeSubject.asObservable();

  constructor() {
    this.applyTheme(this.themeSubject.value);
    this.watchSystemPreference();
  }

  private getInitialTheme(): ThemeMode {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && ['light', 'dark', 'high-contrast'].includes(savedTheme)) {
      return savedTheme as ThemeMode;
    }
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  private watchSystemPreference(): void {
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      darkModeQuery.addEventListener('change', (e) => {
        // Only auto-switch if user hasn't manually set a preference
        const savedTheme = localStorage.getItem('theme');
        if (!savedTheme) {
          this.setTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  toggleTheme(): void {
    const current = this.themeSubject.value;
    let newTheme: ThemeMode;
    
    if (current === 'light') {
      newTheme = 'dark';
    } else if (current === 'dark') {
      newTheme = 'high-contrast';
    } else {
      newTheme = 'light';
    }
    
    this.setTheme(newTheme);
  }

  setTheme(theme: ThemeMode): void {
    this.themeSubject.next(theme);
    this.applyTheme(theme);
    localStorage.setItem('theme', theme);
  }

  isDarkMode(): boolean {
    return this.themeSubject.value === 'dark' || this.themeSubject.value === 'high-contrast';
  }

  isHighContrast(): boolean {
    return this.themeSubject.value === 'high-contrast';
  }

  getCurrentTheme(): ThemeMode {
    return this.themeSubject.value;
  }

  private applyTheme(theme: ThemeMode): void {
    const body = document.body;
    
    // Remove all theme classes
    body.classList.remove('light-theme', 'dark-theme', 'high-contrast-theme');
    
    // Add appropriate theme class
    if (theme === 'high-contrast') {
      body.classList.add('high-contrast-theme', 'dark-theme');
    } else {
      body.classList.add(`${theme}-theme`);
    }
  }
}
