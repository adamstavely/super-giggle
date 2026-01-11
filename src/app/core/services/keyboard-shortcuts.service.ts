import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean; // Cmd on Mac
  description: string;
  context?: string; // Optional context where shortcut is active
}

@Injectable({
  providedIn: 'root'
})
export class KeyboardShortcutsService {
  private shortcuts = new Map<string, Subject<void>>();
  private shortcutDescriptions = new Map<string, KeyboardShortcut>();
  private globalShortcuts: KeyboardShortcut[] = [];
  private contextShortcuts = new Map<string, KeyboardShortcut[]>();

  constructor() {
    this.initializeGlobalShortcuts();
    this.setupGlobalListeners();
  }

  /**
   * Register a keyboard shortcut
   */
  registerShortcut(shortcut: KeyboardShortcut): Observable<void> {
    const key = this.getShortcutKey(shortcut);
    let subject = this.shortcuts.get(key);

    if (!subject) {
      subject = new Subject<void>();
      this.shortcuts.set(key, subject);
      this.shortcutDescriptions.set(key, shortcut);
    }

    // Add to context if specified
    if (shortcut.context) {
      if (!this.contextShortcuts.has(shortcut.context)) {
        this.contextShortcuts.set(shortcut.context, []);
      }
      this.contextShortcuts.get(shortcut.context)!.push(shortcut);
    } else {
      this.globalShortcuts.push(shortcut);
    }

    return subject.asObservable();
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregisterShortcut(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.delete(key);
    this.shortcutDescriptions.delete(key);

    if (shortcut.context) {
      const contextShortcuts = this.contextShortcuts.get(shortcut.context);
      if (contextShortcuts) {
        const index = contextShortcuts.findIndex(s => this.getShortcutKey(s) === key);
        if (index >= 0) {
          contextShortcuts.splice(index, 1);
        }
      }
    } else {
      const index = this.globalShortcuts.findIndex(s => this.getShortcutKey(s) === key);
      if (index >= 0) {
        this.globalShortcuts.splice(index, 1);
      }
    }
  }

  /**
   * Trigger a shortcut programmatically
   */
  triggerShortcut(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKey(shortcut);
    const subject = this.shortcuts.get(key);
    if (subject) {
      subject.next();
    }
  }

  /**
   * Get shortcuts for a specific context
   */
  getContextShortcuts(context: string): KeyboardShortcut[] {
    return this.contextShortcuts.get(context) || [];
  }

  /**
   * Get all registered shortcuts (optionally filtered by context)
   */
  getAllShortcuts(context?: string): KeyboardShortcut[] {
    if (context) {
      return this.contextShortcuts.get(context) || [];
    }
    // Return all shortcuts from descriptions map
    return Array.from(this.shortcutDescriptions.values());
  }

  /**
   * Setup global keyboard listeners
   */
  private setupGlobalListeners(): void {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in input fields
      const target = event.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.isContentEditable;
      
      // Special handling for / key - only trigger if not in input
      if (event.key === '/' && isInputField) {
        return;
      }

      // Special handling for ? key - only trigger if not in input
      if (event.key === '?' && isInputField) {
        return;
      }

      if (isInputField) {
        // Allow shortcuts with Ctrl/Cmd even in input fields
        if (!event.ctrlKey && !event.metaKey) {
          return;
        }
      }

      const shortcut: KeyboardShortcut = {
        key: event.key,
        ctrl: event.ctrlKey,
        shift: event.shiftKey,
        alt: event.altKey,
        meta: event.metaKey,
        description: ''
      };

      const key = this.getShortcutKey(shortcut);
      const subject = this.shortcuts.get(key);

      if (subject) {
        event.preventDefault();
        event.stopPropagation();
        subject.next();
      }
    });
  }

  /**
   * Initialize default global shortcuts
   */
  private initializeGlobalShortcuts(): void {
    // These will be registered by components that need them
    // This is just a placeholder for default shortcuts
  }

  /**
   * Generate shortcut key string
   */
  private getShortcutKey(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];

    if (shortcut.ctrl) parts.push('ctrl');
    if (shortcut.shift) parts.push('shift');
    if (shortcut.alt) parts.push('alt');
    if (shortcut.meta) parts.push('meta');

    // Preserve case for special keys like ArrowDown, Escape, etc.
    const key = shortcut.key.length === 1 ? shortcut.key.toLowerCase() : shortcut.key;
    parts.push(key);

    return parts.join('+');
  }

  /**
   * Format shortcut for display
   */
  formatShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];

    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.meta) parts.push('Cmd');

    // Capitalize key
    const key = shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key;
    parts.push(key);

    return parts.join(' + ');
  }
}
