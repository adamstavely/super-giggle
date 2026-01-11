import { Component, OnInit, OnDestroy } from '@angular/core';
import { ThemeService } from './theme.service';
import { AccessibilityService } from './core/services/accessibility.service';
import { KeyboardShortcutsService } from './core/services/keyboard-shortcuts.service';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Intranet Search';
  isDarkMode = false;
  private destroy$ = new Subject<void>();

  constructor(
    public themeService: ThemeService,
    private accessibilityService: AccessibilityService,
    private keyboardShortcuts: KeyboardShortcutsService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Subscribe to theme changes
    this.themeService.theme$.subscribe(theme => {
      this.isDarkMode = theme === 'dark' || theme === 'high-contrast';
    });

    // Initialize accessibility settings
    this.accessibilityService.settings$
      .pipe(takeUntil(this.destroy$))
      .subscribe();

    // Register global keyboard shortcuts
    this.registerKeyboardShortcuts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  private registerKeyboardShortcuts(): void {
    // Toggle theme: Ctrl/Cmd + Shift + T
    this.keyboardShortcuts.registerShortcut({
      key: 't',
      ctrl: true,
      shift: true,
      description: 'Toggle theme',
      context: 'global'
    }).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.toggleTheme();
    });

    // Focus search: Ctrl/Cmd + K
    this.keyboardShortcuts.registerShortcut({
      key: 'k',
      ctrl: true,
      description: 'Focus search bar',
      context: 'global'
    }).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.focusSearchBar();
    });

    // / key - Focus search bar (when not in input)
    this.keyboardShortcuts.registerShortcut({
      key: '/',
      description: 'Focus search bar',
      context: 'global'
    }).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.focusSearchBar();
    });

    // ? - Show shortcuts help (global)
    this.keyboardShortcuts.registerShortcut({
      key: '?',
      description: 'Show keyboard shortcuts help',
      context: 'global'
    }).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.showShortcutsHelp();
    });
  }

  private focusSearchBar(): void {
    const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  private showShortcutsHelp(): void {
    // Import dynamically to avoid circular dependencies
    import('./search/keyboard-shortcuts-help/keyboard-shortcuts-help.component').then(module => {
      this.dialog.open(module.KeyboardShortcutsHelpComponent, {
        width: '600px',
        maxWidth: '90vw',
        data: { context: 'global' },
        ariaLabel: 'Keyboard shortcuts help'
      });
    });
  }
}
