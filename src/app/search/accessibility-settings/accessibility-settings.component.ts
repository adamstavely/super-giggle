import { Component, OnInit, OnDestroy } from '@angular/core';
import { AccessibilityService, AccessibilitySettings } from '../../core/services/accessibility.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-accessibility-settings',
  templateUrl: './accessibility-settings.component.html',
  styleUrls: ['./accessibility-settings.component.scss']
})
export class AccessibilitySettingsComponent implements OnInit, OnDestroy {
  settings: AccessibilitySettings;
  private destroy$ = new Subject<void>();

  constructor(public accessibilityService: AccessibilityService) {
    this.settings = this.accessibilityService.getSettings();
  }

  ngOnInit(): void {
    this.accessibilityService.settings$
      .pipe(takeUntil(this.destroy$))
      .subscribe(settings => {
        this.settings = settings;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleHighContrast(): void {
    this.accessibilityService.setHighContrast(!this.settings.highContrast);
  }

  setFontSize(size: 'small' | 'medium' | 'large' | 'xlarge'): void {
    this.accessibilityService.setFontSize(size);
  }

  toggleReducedMotion(): void {
    this.accessibilityService.setReducedMotion(!this.settings.reducedMotion);
  }

  toggleFocusVisible(): void {
    this.accessibilityService.setFocusVisible(!this.settings.focusVisible);
  }
}
