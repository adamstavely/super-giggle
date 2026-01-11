import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AccessibilitySettings {
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  reducedMotion: boolean;
  focusVisible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AccessibilityService {
  private settingsSubject = new BehaviorSubject<AccessibilitySettings>(this.getInitialSettings());
  public settings$: Observable<AccessibilitySettings> = this.settingsSubject.asObservable();

  constructor() {
    this.applySettings(this.settingsSubject.value);
    this.detectSystemPreferences();
  }

  private getInitialSettings(): AccessibilitySettings {
    const saved = localStorage.getItem('accessibility-settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback to defaults
      }
    }

    return {
      highContrast: false,
      fontSize: 'medium',
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      focusVisible: true
    };
  }

  private detectSystemPreferences(): void {
    // Listen for system preference changes
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionQuery.addEventListener('change', (e) => {
      const settings = this.settingsSubject.value;
      settings.reducedMotion = e.matches;
      this.setSettings(settings);
    });
  }

  getSettings(): AccessibilitySettings {
    return this.settingsSubject.value;
  }

  setSettings(settings: AccessibilitySettings): void {
    this.settingsSubject.next(settings);
    this.applySettings(settings);
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
  }

  setHighContrast(enabled: boolean): void {
    const settings = this.settingsSubject.value;
    settings.highContrast = enabled;
    this.setSettings(settings);
  }

  setFontSize(size: 'small' | 'medium' | 'large' | 'xlarge'): void {
    const settings = this.settingsSubject.value;
    settings.fontSize = size;
    this.setSettings(settings);
  }

  setReducedMotion(enabled: boolean): void {
    const settings = this.settingsSubject.value;
    settings.reducedMotion = enabled;
    this.setSettings(settings);
  }

  setFocusVisible(enabled: boolean): void {
    const settings = this.settingsSubject.value;
    settings.focusVisible = enabled;
    this.setSettings(settings);
  }

  private applySettings(settings: AccessibilitySettings): void {
    const body = document.body;
    const html = document.documentElement;

    // High contrast
    if (settings.highContrast) {
      body.classList.add('high-contrast');
    } else {
      body.classList.remove('high-contrast');
    }

    // Font size
    body.classList.remove('font-small', 'font-medium', 'font-large', 'font-xlarge');
    body.classList.add(`font-${settings.fontSize}`);

    // Reduced motion
    if (settings.reducedMotion) {
      body.classList.add('reduced-motion');
    } else {
      body.classList.remove('reduced-motion');
    }

    // Focus visible
    if (settings.focusVisible) {
      body.classList.add('focus-visible');
    } else {
      body.classList.remove('focus-visible');
    }

    // Set CSS custom properties for font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      xlarge: '20px'
    };
    html.style.setProperty('--base-font-size', fontSizeMap[settings.fontSize]);
  }

  isHighContrast(): boolean {
    return this.settingsSubject.value.highContrast;
  }

  getFontSize(): 'small' | 'medium' | 'large' | 'xlarge' {
    return this.settingsSubject.value.fontSize;
  }

  isReducedMotion(): boolean {
    return this.settingsSubject.value.reducedMotion;
  }

  isFocusVisible(): boolean {
    return this.settingsSubject.value.focusVisible;
  }
}
