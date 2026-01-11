import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { KeyboardShortcutsService, KeyboardShortcut } from '../../core/services/keyboard-shortcuts.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-keyboard-shortcuts-help',
  templateUrl: './keyboard-shortcuts-help.component.html',
  styleUrls: ['./keyboard-shortcuts-help.component.scss']
})
export class KeyboardShortcutsHelpComponent implements OnInit, OnDestroy {
  shortcuts: KeyboardShortcut[] = [];
  contextShortcuts: Map<string, KeyboardShortcut[]> = new Map();
  private destroy$ = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<KeyboardShortcutsHelpComponent>,
    private keyboardShortcuts: KeyboardShortcutsService,
    @Inject(MAT_DIALOG_DATA) public data: { context?: string }
  ) {}

  ngOnInit(): void {
    if (this.data?.context) {
      this.shortcuts = this.keyboardShortcuts.getContextShortcuts(this.data.context);
    } else {
      this.shortcuts = this.keyboardShortcuts.getAllShortcuts();
    }

    // Group shortcuts by context
    const allShortcuts = this.keyboardShortcuts.getAllShortcuts();
    allShortcuts.forEach(shortcut => {
      if (shortcut.context) {
        if (!this.contextShortcuts.has(shortcut.context)) {
          this.contextShortcuts.set(shortcut.context, []);
        }
        this.contextShortcuts.get(shortcut.context)!.push(shortcut);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  formatShortcut(shortcut: KeyboardShortcut): string {
    return this.keyboardShortcuts.formatShortcut(shortcut);
  }

  close(): void {
    this.dialogRef.close();
  }
}
