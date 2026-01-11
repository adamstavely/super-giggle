import { Component, Input, OnInit, OnDestroy, Output, EventEmitter, HostListener, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { SearchResult, DocumentMetadata } from '../search.models';
import { DocumentMetadataService } from '../../core/services/document-metadata.service';
import { DocumentPreviewService } from '../../core/services/document-preview.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-result-item',
  templateUrl: './result-item.component.html',
  styleUrls: ['./result-item.component.scss']
})
export class ResultItemComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() result!: SearchResult;
  @Input() searchQuery: string = '';
  @Output() openQuickView = new EventEmitter<SearchResult>();
  @Output() share = new EventEmitter<SearchResult>();
  @Output() bookmark = new EventEmitter<SearchResult>();

  helpfulClicked = false;
  notHelpfulClicked = false;
  showMetadata = false;
  showQuickActions = false;
  documentMetadata: DocumentMetadata | null = null;
  loadingMetadata = false;
  supportsPreview = false;
  imageLoaded = false;
  imageInView = false;
  
  @ViewChild('thumbnailImage', { static: false }) thumbnailImage!: ElementRef<HTMLImageElement>;
  
  private destroy$ = new Subject<void>();
  private intersectionObserver?: IntersectionObserver;
  
  onHelpfulClick(): void {
    this.helpfulClicked = true;
    // TODO: Send feedback to API
  }

  onNotHelpfulClick(): void {
    this.notHelpfulClicked = true;
    // TODO: Send feedback to API
  }

  // Cache for file type icons to avoid repeated lookups
  private static readonly FILE_TYPE_ICON_MAP: { [key: string]: string } = {
    'pdf': 'picture_as_pdf',
    'doc': 'description',
    'docx': 'description',
    'xls': 'table_chart',
    'xlsx': 'table_chart',
    'ppt': 'slideshow',
    'pptx': 'slideshow',
    'txt': 'text_snippet',
    'html': 'code',
    'jpg': 'image',
    'jpeg': 'image',
    'png': 'image',
    'gif': 'image',
    'mp4': 'video_library',
    'mov': 'video_library'
  };

  constructor(
    private metadataService: DocumentMetadataService,
    private previewService: DocumentPreviewService
  ) {}

  ngOnInit(): void {
    this.checkPreviewSupport();
    this.loadMetadata();
    // Initialize lazy loading observer
    this.setupLazyLoading();
  }

  ngAfterViewInit(): void {
    // Start observing image when view is initialized
    if (this.thumbnailImage && this.result.thumbnail) {
      this.observeImage();
    }
  }

  ngOnDestroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Setup Intersection Observer for lazy loading
   */
  private setupLazyLoading(): void {
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback for browsers without IntersectionObserver
      this.imageInView = true;
      return;
    }

    // Observer will be created in ngAfterViewInit when element is available
  }

  /**
   * Observe image element for lazy loading
   */
  private observeImage(): void {
    if (!this.thumbnailImage || !this.result.thumbnail) {
      return;
    }

    const options = {
      root: null,
      rootMargin: '100px', // Start loading 100px before image enters viewport
      threshold: 0.01
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.imageInView = true;
          if (this.intersectionObserver) {
            this.intersectionObserver.unobserve(entry.target);
          }
        }
      });
    }, options);

    this.intersectionObserver.observe(this.thumbnailImage.nativeElement);
  }

  /**
   * Handle image load event
   */
  onImageLoad(): void {
    this.imageLoaded = true;
  }

  /**
   * Handle image error
   */
  onImageError(): void {
    this.imageLoaded = false;
  }

  checkPreviewSupport(): void {
    this.supportsPreview = this.previewService.supportsInlinePreview(this.result.fileType, this.result.url);
  }

  loadMetadata(): void {
    this.loadingMetadata = true;
    this.metadataService.getMetadata(this.result.url, this.result.fileType)
      .pipe(takeUntil(this.destroy$))
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

  toggleMetadata(): void {
    this.showMetadata = !this.showMetadata;
  }

  toggleQuickActions(): void {
    this.showQuickActions = !this.showQuickActions;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.quick-actions-button') && !target.closest('.quick-actions-menu')) {
      this.showQuickActions = false;
    }
  }

  onOpenQuickView(): void {
    this.openQuickView.emit(this.result);
  }

  onShare(): void {
    this.share.emit(this.result);
    this.showQuickActions = false;
  }

  onBookmark(): void {
    this.bookmark.emit(this.result);
    this.showQuickActions = false;
  }

  onCopyLink(): void {
    navigator.clipboard.writeText(this.result.url).then(() => {
      // Could show a snackbar here
      this.showQuickActions = false;
    });
  }

  onDownload(): void {
    window.open(this.result.url, '_blank');
    this.showQuickActions = false;
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) {
      return '';
    }
    return this.metadataService.formatFileSize(bytes);
  }

  formatReadingTime(minutes?: number): string {
    if (!minutes) {
      return '';
    }
    return this.metadataService.formatReadingTime(minutes);
  }

  getFileTypeIcon(fileType: string): string {
    return ResultItemComponent.FILE_TYPE_ICON_MAP[fileType.toLowerCase()] || 'insert_drive_file';
  }

  getEnhancedSnippet(): string {
    if (!this.searchQuery || !this.result.snippet) {
      return this.result.snippet;
    }

    // Highlight search terms in snippet
    const terms = this.searchQuery.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    let snippet = this.result.snippet;

    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      snippet = snippet.replace(regex, '<mark>$1</mark>');
    });

    return snippet;
  }
}
