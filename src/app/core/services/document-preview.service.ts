import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { CacheService } from './cache.service';

export interface PreviewInfo {
  url: string;
  type: 'pdf' | 'image' | 'video' | 'iframe' | 'unsupported';
  thumbnailUrl?: string;
  supportsInline: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentPreviewService {
  private readonly previewCacheKey = 'document_preview_';
  private readonly previewTTL = 30 * 60 * 1000; // 30 minutes

  // Supported file types for preview
  private readonly imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'];
  private readonly videoTypes = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
  private readonly pdfTypes = ['pdf'];

  constructor(private cacheService: CacheService) {}

  /**
   * Get preview information for a document
   */
  getPreviewInfo(documentUrl: string, fileType?: string): Observable<PreviewInfo> {
    const cacheKey = `${this.previewCacheKey}${documentUrl}`;
    
    // Check cache first
    const cached = this.cacheService.has(cacheKey);
    if (cached) {
      return this.cacheService.get<PreviewInfo>(cacheKey).pipe(
        map(cachedInfo => cachedInfo || this.determinePreviewType(documentUrl, fileType))
      );
    }

    const previewInfo = this.determinePreviewType(documentUrl, fileType);
    
    // Cache the preview info
    this.cacheService.set(cacheKey, previewInfo, this.previewTTL);

    return of(previewInfo);
  }

  /**
   * Generate preview URL for PDF (using iframe or PDF.js)
   */
  getPdfPreviewUrl(documentUrl: string): string {
    // For PDFs, we can use the direct URL in an iframe
    // Or use a PDF.js viewer if available
    return documentUrl;
  }

  /**
   * Generate thumbnail URL for image
   */
  getImageThumbnailUrl(imageUrl: string, width: number = 200, height: number = 200): string {
    // In a real implementation, this might use an image resizing service
    // For now, return the original URL
    return imageUrl;
  }

  /**
   * Generate video thumbnail URL
   */
  getVideoThumbnailUrl(videoUrl: string): string {
    // In a real implementation, this might extract a frame or use a thumbnail service
    // For now, return empty
    return '';
  }

  /**
   * Check if document supports inline preview
   */
  supportsInlinePreview(fileType?: string, url?: string): boolean {
    if (!fileType && !url) {
      return false;
    }

    const type = (fileType || '').toLowerCase();
    const urlLower = (url || '').toLowerCase();

    return (
      this.pdfTypes.some(t => type.includes(t) || urlLower.includes(`.${t}`)) ||
      this.imageTypes.some(t => type.includes(t) || urlLower.includes(`.${t}`)) ||
      this.videoTypes.some(t => type.includes(t) || urlLower.includes(`.${t}`))
    );
  }

  /**
   * Determine preview type from URL and file type
   */
  private determinePreviewType(url: string, fileType?: string): PreviewInfo {
    const urlLower = url.toLowerCase();
    const type = (fileType || '').toLowerCase();

    // Check for PDF
    if (this.pdfTypes.some(t => type.includes(t) || urlLower.includes(`.${t}`))) {
      return {
        url: this.getPdfPreviewUrl(url),
        type: 'pdf',
        supportsInline: true
      };
    }

    // Check for images
    if (this.imageTypes.some(t => type.includes(t) || urlLower.includes(`.${t}`))) {
      return {
        url: url,
        type: 'image',
        thumbnailUrl: this.getImageThumbnailUrl(url),
        supportsInline: true
      };
    }

    // Check for videos
    if (this.videoTypes.some(t => type.includes(t) || urlLower.includes(`.${t}`))) {
      return {
        url: url,
        type: 'video',
        thumbnailUrl: this.getVideoThumbnailUrl(url),
        supportsInline: true
      };
    }

    // Check if URL is a web page (HTML)
    if (type.includes('html') || urlLower.includes('.html') || urlLower.startsWith('http')) {
      return {
        url: url,
        type: 'iframe',
        supportsInline: true
      };
    }

    return {
      url: url,
      type: 'unsupported',
      supportsInline: false
    };
  }

  /**
   * Clear preview cache for a specific document
   */
  clearPreviewCache(documentUrl: string): void {
    const cacheKey = `${this.previewCacheKey}${documentUrl}`;
    this.cacheService.delete(cacheKey);
  }

  /**
   * Clear all preview caches
   */
  clearAllPreviewCaches(): void {
    // This would need to iterate through cache entries with the prefix
    // For now, clear entire cache (in production, use a more targeted approach)
    this.cacheService.clear();
  }
}
