import { Component, Input, OnInit, OnDestroy, Output, EventEmitter, HostListener, OnChanges } from '@angular/core';
import { SearchResult } from '../search.models';
import { DocumentPreviewService } from '../../core/services/document-preview.service';
import { DocumentMetadataService } from '../../core/services/document-metadata.service';
import { DocumentMetadata } from '../search.models';

@Component({
  selector: 'app-quick-view-panel',
  templateUrl: './quick-view-panel.component.html',
  styleUrls: ['./quick-view-panel.component.scss']
})
export class QuickViewPanelComponent implements OnInit, OnDestroy, OnChanges {
  @Input() result: SearchResult | null = null;
  @Input() allResults: SearchResult[] = [];
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() navigateResult = new EventEmitter<number>(); // Emit index to navigate

  currentIndex = -1;
  documentMetadata: DocumentMetadata | null = null;
  loadingMetadata = false;

  constructor(
    private previewService: DocumentPreviewService,
    private metadataService: DocumentMetadataService
  ) {}

  ngOnInit(): void {
    if (this.result) {
      this.findCurrentIndex();
      this.loadMetadata();
    }
  }

  ngOnChanges(): void {
    if (this.result) {
      this.findCurrentIndex();
      this.loadMetadata();
    }
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (!this.isOpen) {
      return;
    }

    switch (event.key) {
      case 'Escape':
        this.closePanel();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.navigatePrevious();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.navigateNext();
        break;
    }
  }

  findCurrentIndex(): void {
    if (!this.result || !this.allResults) {
      this.currentIndex = -1;
      return;
    }

    this.currentIndex = this.allResults.findIndex(r => r.id === this.result!.id);
  }

  loadMetadata(): void {
    if (!this.result) {
      return;
    }

    this.loadingMetadata = true;
    this.metadataService.getMetadata(this.result.url, this.result.fileType)
      .subscribe({
        next: (metadata) => {
          this.documentMetadata = metadata;
          this.loadingMetadata = false;
        },
        error: () => {
          this.loadingMetadata = false;
        }
      });
  }

  closePanel(): void {
    this.isOpen = false;
    this.close.emit();
  }

  navigatePrevious(): void {
    if (this.currentIndex > 0) {
      const newIndex = this.currentIndex - 1;
      this.navigateResult.emit(newIndex);
    }
  }

  navigateNext(): void {
    if (this.currentIndex >= 0 && this.currentIndex < this.allResults.length - 1) {
      const newIndex = this.currentIndex + 1;
      this.navigateResult.emit(newIndex);
    }
  }

  canNavigatePrevious(): boolean {
    return this.currentIndex > 0;
  }

  canNavigateNext(): boolean {
    return this.currentIndex >= 0 && this.currentIndex < this.allResults.length - 1;
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) {
      return 'Unknown';
    }
    return this.metadataService.formatFileSize(bytes);
  }

  formatReadingTime(minutes?: number): string {
    if (!minutes) {
      return '';
    }
    return this.metadataService.formatReadingTime(minutes);
  }
}
