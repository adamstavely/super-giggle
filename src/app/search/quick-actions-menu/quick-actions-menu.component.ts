import { Component, Input, Output, EventEmitter } from '@angular/core';
import { SearchResult } from '../search.models';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-quick-actions-menu',
  templateUrl: './quick-actions-menu.component.html',
  styleUrls: ['./quick-actions-menu.component.scss']
})
export class QuickActionsMenuComponent {
  @Input() result!: SearchResult;
  @Output() bookmark = new EventEmitter<SearchResult>();
  @Output() share = new EventEmitter<SearchResult>();

  constructor(private snackBar: MatSnackBar) {}

  onDownload(): void {
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = this.result.url;
    link.download = this.result.title;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.snackBar.open('Download started', '', {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  onShare(): void {
    if (navigator.share) {
      navigator.share({
        title: this.result.title,
        text: this.result.snippet,
        url: this.result.url
      }).catch(() => {
        this.onCopyLink();
      });
    } else {
      this.onCopyLink();
    }
    this.share.emit(this.result);
  }

  onBookmark(): void {
    // TODO: Implement bookmark functionality with service
    this.bookmark.emit(this.result);
    this.snackBar.open('Bookmarked', '', {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  onCopyLink(): void {
    const url = window.location.origin + window.location.pathname + '?q=' + encodeURIComponent(this.result.title) + '&id=' + this.result.id;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        this.snackBar.open('Link copied to clipboard', '', {
          duration: 2000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }).catch(() => {
        this.fallbackCopyLink(url);
      });
    } else {
      this.fallbackCopyLink(url);
    }
  }

  private fallbackCopyLink(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      this.snackBar.open('Link copied to clipboard', '', {
        duration: 2000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    } catch (err) {
      this.snackBar.open('Failed to copy link', '', {
        duration: 2000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    }
    
    document.body.removeChild(textArea);
  }
}
