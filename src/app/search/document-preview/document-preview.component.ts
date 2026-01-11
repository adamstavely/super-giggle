import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DocumentPreviewService, PreviewInfo } from '../../core/services/document-preview.service';
import { SearchResult } from '../search.models';

@Component({
  selector: 'app-document-preview',
  templateUrl: './document-preview.component.html',
  styleUrls: ['./document-preview.component.scss']
})
export class DocumentPreviewComponent implements OnInit, OnDestroy {
  @Input() result!: SearchResult;
  @Input() showFullScreen = false;
  @Input() autoLoad = false;

  previewInfo: PreviewInfo | null = null;
  loading = false;
  error: string | null = null;
  isFullScreen = false;
  
  private destroy$ = new Subject<void>();

  constructor(private previewService: DocumentPreviewService) {}

  ngOnInit(): void {
    if (this.autoLoad && this.result) {
      this.loadPreview();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPreview(): void {
    if (!this.result) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.previewService.getPreviewInfo(this.result.url, this.result.fileType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (info) => {
          this.previewInfo = info;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load preview';
          this.loading = false;
          console.error('Preview error:', err);
        }
      });
  }

  toggleFullScreen(): void {
    this.isFullScreen = !this.isFullScreen;
  }

  closeFullScreen(): void {
    this.isFullScreen = false;
  }

  getPreviewUrl(): string {
    if (!this.previewInfo) {
      return '';
    }

    switch (this.previewInfo.type) {
      case 'pdf':
        return this.previewService.getPdfPreviewUrl(this.result.url);
      case 'image':
        return this.result.url;
      case 'video':
        return this.result.url;
      case 'iframe':
        return this.result.url;
      default:
        return '';
    }
  }

  supportsPreview(): boolean {
    return this.previewInfo?.supportsInline ?? false;
  }

  isPdf(): boolean {
    return this.previewInfo?.type === 'pdf';
  }

  isImage(): boolean {
    return this.previewInfo?.type === 'image';
  }

  isVideo(): boolean {
    return this.previewInfo?.type === 'video';
  }

  isIframe(): boolean {
    return this.previewInfo?.type === 'iframe';
  }
}
